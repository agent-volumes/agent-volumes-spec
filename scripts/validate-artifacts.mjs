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

const ajv = new Ajv2020({ allErrors: true, strict: true, validateSchema: true });
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

const validateExpectedFailure = (name, value, label) => {
  const ok = validators[name](value);
  assert(!ok, `${label} unexpectedly passed ${name} schema validation`);
};

const assertSpecVersion = (fixture, label) => {
  assert(fixture.specVersion === '0.1.0-draft.5', `${label} must declare specVersion 0.1.0-draft.5`);
};

validate('advisory', readJson('conformance/fixtures/advisory.json'), 'advisory fixture');
validate('advisory', readJson('conformance/fixtures/advisory-withdrawn.json'), 'withdrawn advisory fixture');
validate('trustSummary', readJson('conformance/fixtures/trust-summary.json'), 'trust summary fixture');
validate('trustSummary', readJson('conformance/fixtures/trust-summary-empty.json'), 'empty trust summary fixture');
validate('trustDetail', readJson('conformance/fixtures/trust-detail.json'), 'trust detail fixture');
validate('trustDetail', readJson('conformance/fixtures/trust-detail-empty.json'), 'empty trust detail fixture');
validate(
  'trustDetail',
  readJson('conformance/fixtures/trust-detail-status-variants.json'),
  'trust detail status variants fixture'
);
const trustDetailStatusVariants = readJson('conformance/fixtures/trust-detail-status-variants.json');
const trustStates = new Set(trustDetailStatusVariants.attachments.map((attachment) => attachment.status.state));
for (const requiredState of ['revoked', 'superseded', 'invalid']) {
  assert(trustStates.has(requiredState), `trust detail status variants fixture must include ${requiredState}`);
}
validate(
  'capabilityMetadata',
  readJson('conformance/fixtures/capability-metadata.json'),
  'capability metadata fixture'
);
assert(
  readJson('conformance/fixtures/capability-metadata.json').specVersion === '0.1.0-draft.5',
  'capability metadata fixture must declare specVersion 0.1.0-draft.5'
);
const capabilityUnknownToleranceFixture = readJson('conformance/fixtures/capability-metadata-unknown-tolerance.json');
assert(
  capabilityUnknownToleranceFixture.canonicalParsedData.specVersion === '0.1.0-draft.5',
  'capability metadata unknown tolerance fixture must declare specVersion 0.1.0-draft.5'
);
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
const capabilityReservedExtensionFixture = readJson(
  'conformance/fixtures/capability-metadata-reserved-extension-rejection.json'
);
validateExpectedFailure(
  'capabilityMetadata',
  capabilityReservedExtensionFixture.canonicalParsedData,
  'capability metadata reserved extension fixture'
);
assert(
  capabilityReservedExtensionFixture.expected.valid === false,
  'capability metadata reserved extension fixture must be an expected failure'
);
validate('bridgeMetadata', readJson('conformance/fixtures/bridge-metadata.json'), 'bridge metadata fixture');
const bridgeStatusVariants = readJson('conformance/fixtures/bridge-metadata-status-variants.json');
for (const fixture of bridgeStatusVariants.fixtures) {
  validate('bridgeMetadata', fixture.payload, `bridge metadata ${fixture.name} fixture`);
  assert(fixture.expected.valid === true, `bridge metadata ${fixture.name} fixture must be expected valid`);
}
assert(
  new Set(bridgeStatusVariants.fixtures.map((fixture) => fixture.payload.status)).size === 2,
  'bridge status variants fixture must cover distinct non-active statuses'
);

const manifestValidFixture = readJson('conformance/fixtures/manifest-valid-minimal.json');
assertSpecVersion(manifestValidFixture, 'minimal valid manifest fixture');
validate('volume', manifestValidFixture.canonicalParsedData, 'minimal valid manifest fixture');
assert(manifestValidFixture.expected.valid === true, 'minimal valid manifest fixture must be expected valid');

const manifestMetaFixture = readJson('conformance/fixtures/manifest-valid-meta.json');
assertSpecVersion(manifestMetaFixture, 'meta package manifest fixture');
validate('volume', manifestMetaFixture.canonicalParsedData, 'meta package manifest fixture');
assert(manifestMetaFixture.expected.valid === true, 'meta package manifest fixture must be expected valid');

const unknownFieldFixture = readJson('conformance/fixtures/manifest-unknown-field-warning.json');
assertSpecVersion(unknownFieldFixture, 'unknown-field manifest fixture');
validate('volume', unknownFieldFixture.canonicalParsedData, 'unknown-field manifest fixture');
assert(
  unknownFieldFixture.expected.warnings.some((warning) => warning.category === 'unknown-field'),
  'unknown-field manifest fixture must expect an unknown-field warning'
);

for (const [fixturePath, label] of [
  ['conformance/fixtures/manifest-invalid-name.json', 'invalid-name manifest fixture'],
  ['conformance/fixtures/manifest-invalid-version.json', 'invalid-version manifest fixture'],
]) {
  const fixture = readJson(fixturePath);
  assertSpecVersion(fixture, label);
  validateExpectedFailure('volume', fixture.canonicalParsedData, label);
  assert(fixture.expected.valid === false, `${label} must be expected invalid`);
}

const duplicateComponentFixture = readJson('conformance/fixtures/manifest-invalid-duplicate-component.json');
assertSpecVersion(duplicateComponentFixture, 'duplicate component manifest fixture');
validate(
  'volume',
  duplicateComponentFixture.canonicalParsedData,
  'duplicate component manifest fixture structural schema'
);
assert(
  duplicateComponentFixture.expected.valid === false,
  'duplicate component manifest fixture must be an expected failure'
);
const componentNames = duplicateComponentFixture.canonicalParsedData.components.map((component) => component.name);
assert(
  new Set(componentNames).size !== componentNames.length,
  'duplicate component manifest fixture must contain duplicate component names'
);

const permissionFixture = readJson('conformance/fixtures/permission-escalation.json');
assertSpecVersion(permissionFixture, 'permission escalation manifest fixture');
validate('volume', permissionFixture.canonicalParsedData, 'permission escalation manifest fixture');

const permissionOrder = {
  filesystem: {
    deny: new Set(['deny']),
    read: new Set(['deny', 'read']),
    write: new Set(['deny', 'write']),
    'read-write': new Set(['deny', 'read', 'write', 'read-write']),
  },
  shell: {
    deny: new Set(['deny']),
    allow: new Set(['deny', 'allow']),
  },
};
const isPermissionEscalation = (surface, parent, child) => !permissionOrder[surface][parent].has(child);
const parentFilesystem = permissionFixture.canonicalParsedData.permissions.filesystem;
const childFilesystem = permissionFixture.canonicalParsedData.components[0].permissions.filesystem;
assert(
  isPermissionEscalation('filesystem', parentFilesystem, childFilesystem),
  'permission escalation fixture must actually broaden component permissions'
);
assert(permissionFixture.expected.valid === false, 'permission escalation fixture must be an expected failure');

const siblingPermissionFixture = readJson('conformance/fixtures/permission-sibling-escalation.json');
assertSpecVersion(siblingPermissionFixture, 'permission sibling escalation manifest fixture');
validate('volume', siblingPermissionFixture.canonicalParsedData, 'permission sibling escalation manifest fixture');
assert(
  isPermissionEscalation(
    'filesystem',
    siblingPermissionFixture.canonicalParsedData.permissions.filesystem,
    siblingPermissionFixture.canonicalParsedData.components[0].permissions.filesystem
  ),
  'permission sibling escalation fixture must treat read and write as sibling permissions'
);
assert(
  siblingPermissionFixture.expected.valid === false,
  'permission sibling escalation fixture must be an expected failure'
);

const digestVectors = readJson('conformance/fixtures/digest-vectors.json');
assertSpecVersion(digestVectors, 'digest vectors');
for (const fixture of digestVectors.fixtures) {
  assert(
    fixture.normalizedFiles.every((file) =>
      fixture.canonicalInput.includes(
        `file ${file.path} ${file.executable ? 1 : 0} ${Buffer.byteLength(file.content, 'utf8')}\n`
      )
    ),
    `digest vector ${fixture.name} canonical input must use UTF-8 byte lengths from normalized files`
  );
  const actual = `sha256:${crypto.createHash('sha256').update(fixture.canonicalInput, 'utf8').digest('hex')}`;
  assert(
    actual === fixture.expectedIntegrity,
    `digest vector ${fixture.name} expected ${fixture.expectedIntegrity} but computed ${actual}`
  );
}
const isInvalidNormalizedPath = (pathValue) =>
  pathValue.startsWith('/') || pathValue.split('/').some((segment) => segment === '.' || segment === '..');
const digestInvalidCases = readJson('conformance/fixtures/digest-invalid-cases.json');
assertSpecVersion(digestInvalidCases, 'digest invalid cases');
for (const digestCase of digestInvalidCases.cases) {
  if (digestCase.expected.failureCategory === 'invalid-path') {
    assert(
      digestCase.normalizedFiles.some((file) => isInvalidNormalizedPath(file.path)),
      `digest invalid case ${digestCase.name} must contain an invalid path`
    );
  }
  if (digestCase.expected.failureCategory === 'duplicate-path') {
    const paths = digestCase.normalizedFiles.map((file) => file.path);
    assert(
      new Set(paths).size !== paths.length,
      `digest invalid case ${digestCase.name} must contain duplicate normalized paths`
    );
  }
  assert(digestCase.expected.valid === false, `digest invalid case ${digestCase.name} must be expected invalid`);
}

const mappingMatrix = readJson('conformance/fixtures/mapping-matrix.json');
assertSpecVersion(mappingMatrix, 'mapping matrix fixture');
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

let openapi;
try {
  openapi = YAML.parse(readText('openapi/bibliotheca.openapi.yaml'));
} catch (err) {
  throw new Error(`OpenAPI YAML semantic validation failed: ${err.message}`);
}
assert(openapi.openapi === '3.1.1', 'OpenAPI document must declare version 3.1.1');
assert(openapi.paths['/api/v1/search'], 'OpenAPI document must define search path');
assert(openapi.paths['/api/v1/capabilities'], 'OpenAPI document must define capability metadata path');
assert(openapi.components?.schemas?.ProblemDetails, 'OpenAPI document must define ProblemDetails schema');

console.log('Artifact validation passed.');
