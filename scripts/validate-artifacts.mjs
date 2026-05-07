import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import YAML from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

const readText = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const schemas = {
  volume: readJson('schemas/volume.schema.json'),
  advisory: readJson('schemas/advisory.schema.json'),
  trustSummary: readJson('schemas/trust-summary.schema.json'),
  trustDetail: readJson('schemas/trust-detail.schema.json'),
  capabilityMetadata: readJson('schemas/capability-metadata.schema.json'),
  bridgeMetadata: readJson('schemas/bridge-metadata.schema.json'),
};

const validators = Object.fromEntries(Object.entries(schemas).map(([name, schema]) => [name, ajv.compile(schema)]));

const validate = (name, value, label) => {
  const ok = validators[name](value);
  assert(ok, `${label} failed ${name} schema validation: ${ajv.errorsText(validators[name].errors)}`);
};

validate('advisory', readJson('conformance/fixtures/advisory.json'), 'advisory fixture');
validate('trustSummary', readJson('conformance/fixtures/trust-summary.json'), 'trust summary fixture');
validate('trustSummary', readJson('conformance/fixtures/trust-summary-empty.json'), 'empty trust summary fixture');
validate('trustDetail', readJson('conformance/fixtures/trust-detail.json'), 'trust detail fixture');
validate('trustDetail', readJson('conformance/fixtures/trust-detail-empty.json'), 'empty trust detail fixture');
validate(
  'capabilityMetadata',
  readJson('conformance/fixtures/capability-metadata.json'),
  'capability metadata fixture'
);
const capabilityUnknownToleranceFixture = readJson('conformance/fixtures/capability-metadata-unknown-tolerance.json');
validate(
  'capabilityMetadata',
  capabilityUnknownToleranceFixture.canonicalParsedData,
  'capability metadata unknown tolerance fixture'
);
assert(
  capabilityUnknownToleranceFixture.expected.valid === true,
  'capability metadata unknown tolerance fixture must be expected valid'
);
assert(
  capabilityUnknownToleranceFixture.expected.warnings.some(
    (warning) => warning.category === 'unknown-capability-field'
  ),
  'capability metadata unknown tolerance fixture must expect an unknown capability field warning'
);
assert(
  capabilityUnknownToleranceFixture.expected.warnings.some(
    (warning) => warning.category === 'unknown-capability-value'
  ),
  'capability metadata unknown tolerance fixture must expect an unknown capability value warning'
);
validate('bridgeMetadata', readJson('conformance/fixtures/bridge-metadata.json'), 'bridge metadata fixture');

const unknownFieldFixture = readJson('conformance/fixtures/manifest-unknown-field-warning.json');
validate('volume', unknownFieldFixture.canonicalParsedData, 'unknown-field manifest fixture');
assert(
  unknownFieldFixture.expected.warnings.some((warning) => warning.category === 'unknown-field'),
  'unknown-field manifest fixture must expect an unknown-field warning'
);

const permissionFixture = readJson('conformance/fixtures/permission-escalation.json');
validate('volume', permissionFixture.canonicalParsedData, 'permission escalation manifest fixture');

const permissionRank = { deny: 0, read: 1, write: 1, 'read-write': 2, allow: 1 };
const parentFilesystem = permissionFixture.canonicalParsedData.permissions.filesystem;
const childFilesystem = permissionFixture.canonicalParsedData.components[0].permissions.filesystem;
assert(
  permissionRank[childFilesystem] > permissionRank[parentFilesystem],
  'permission escalation fixture must actually broaden component permissions'
);
assert(permissionFixture.expected.valid === false, 'permission escalation fixture must be an expected failure');

const digestVectors = readJson('conformance/fixtures/digest-vectors.json');
for (const fixture of digestVectors.fixtures) {
  const actual = `sha256:${crypto.createHash('sha256').update(fixture.canonicalInput, 'utf8').digest('hex')}`;
  assert(
    actual === fixture.expectedIntegrity,
    `digest vector ${fixture.name} expected ${fixture.expectedIntegrity} but computed ${actual}`
  );
}

const mappingMatrix = readJson('conformance/fixtures/mapping-matrix.json');
for (const field of [
  'volume.name',
  'volume.version',
  'release.logicalIdentity',
  'release.immutableContentIdentity',
  'permissions / components[].permissions',
]) {
  assert(
    mappingMatrix.entries.some((entry) => entry.agentVolumesField === field),
    `mapping matrix missing ${field}`
  );
}

const openapi = YAML.parse(readText('openapi/bibliotheca.openapi.yaml'));
assert(openapi.openapi === '3.1.1', 'OpenAPI document must declare version 3.1.1');
assert(openapi.paths['/api/v1/search'], 'OpenAPI document must define search path');
assert(openapi.paths['/api/v1/capabilities'], 'OpenAPI document must define capability metadata path');
assert(openapi.components?.schemas?.ProblemDetails, 'OpenAPI document must define ProblemDetails schema');

console.log('Artifact validation passed.');
