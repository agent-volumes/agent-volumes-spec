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
  versionIndexRow: readJson('schemas/version-index-row.schema.json'),
  trustUploadIntent: readJson('schemas/trust-upload-intent.schema.json'),
  trustUploadFinalize: readJson('schemas/trust-upload-finalize.schema.json'),
  bridgeMetadata: readJson('schemas/bridge-metadata.schema.json'),
  releaseUploadIntent: readJson('schemas/release-upload-intent.schema.json'),
  releaseUploadFinalize: readJson('schemas/release-upload-finalize.schema.json'),
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

const volumeNamePattern =
  /^(@(?!.*--)[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\/)?(?!.*--)[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/;
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const digestPattern = /^sha256:[a-f0-9]{64}$/;
const problemTypePattern = /^https:\/\/agentvolumes\.org\/problems\/[a-z0-9-]+$/;
const problemStatusBySlug = new Map([
  ['authentication-required', 401],
  ['authorization-failed', 403],
  ['not-found', 404],
  ['validation-failed', 400],
  ['invalid-manifest', 400],
  ['invalid-archive', 400],
  ['identity-mismatch', 409],
  ['version-conflict', 409],
  ['digest-mismatch', 400],
  ['subject-binding-mismatch', 400],
  ['inconsistent-registry-state', 409],
  ['upload-expired', 410],
  ['missing-uploaded-bytes', 400],
  ['invalid-upload-state', 409],
  ['idempotency-conflict', 409],
  ['payload-too-large', 413],
  ['unsupported-media-type', 415],
  ['permission-escalation', 400],
  ['rate-limited', 429],
]);

const assertReleaseMetadata = (metadata, label) => {
  assert(volumeNamePattern.test(metadata.name), `${label} needs canonical full volume name`);
  assert(semverPattern.test(metadata.version), `${label} needs SemVer version`);
  assert(digestPattern.test(metadata.integrity), `${label} needs valid integrity`);
  assert(metadata.dist && typeof metadata.dist === 'object', `${label} needs dist metadata`);
  assert(['cdn', 'git'].includes(metadata.dist.source), `${label} needs cdn or git dist source`);
};

const assertProblemDetails = (payload, label) => {
  assert(problemTypePattern.test(payload.type), `${label} must use Agent Volumes problem type URI`);
  const slug = payload.type.replace('https://agentvolumes.org/problems/', '');
  assert(problemStatusBySlug.has(slug), `${label} uses unknown problem type: ${slug}`);
  assert(typeof payload.title === 'string', `${label} needs problem title`);
  assert(typeof payload.status === 'number', `${label} needs numeric problem status`);
  assert(payload.status === problemStatusBySlug.get(slug), `${label} status must match problem type ${slug}`);
};

const routeIdentityFromPath = (route) => {
  const match = route.match(/^\/api\/v1\/volumes\/(?:@([^/]+)\/)?([^/]+)\/([^/]+)$/);
  if (!match) {
    return null;
  }
  const [, scope, name, version] = match;
  return {
    name: scope ? `@${scope}/${name}` : name,
    version,
  };
};

const assertRouteMetadataIdentity = (route, metadata, label) => {
  const identity = routeIdentityFromPath(route);
  assert(identity, `${label} needs a parseable release route`);
  assert(metadata.name === identity.name, `${label} metadata name must match route identity`);
  assert(metadata.version === identity.version, `${label} metadata version must match route identity`);
};

validate('advisory', readJson('conformance/fixtures/advisory.json'), 'advisory fixture');
validate('advisory', readJson('conformance/fixtures/advisory-withdrawn.json'), 'withdrawn advisory fixture');
assert(
  readJson('conformance/fixtures/advisory-withdrawn.json').withdrawn?.at,
  'withdrawn advisory fixture must include withdrawn.at'
);
assert(
  readJson('conformance/fixtures/advisory.json').affected.ranges.some((range) =>
    range.events.some((event) => 'limit' in event)
  ),
  'advisory fixture must exercise limit event semantics'
);
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
const trustDetailFixture = readJson('conformance/fixtures/trust-detail.json');
const trustFormatFamilies = new Set(trustDetailFixture.attachments.map((attachment) => attachment.format.family));
for (const requiredFamily of ['cyclonedx', 'slsa-provenance', 'sigstore-bundle']) {
  assert(trustFormatFamilies.has(requiredFamily), `trust detail fixture must include ${requiredFamily} format family`);
}
assert(
  trustDetailFixture.attachments.some((attachment) => attachment.format.profile),
  'trust detail fixture must exercise format.profile'
);
validate(
  'capabilityMetadata',
  readJson('conformance/fixtures/capability-metadata.json'),
  'capability metadata fixture'
);
const capabilityMetadata = readJson('conformance/fixtures/capability-metadata.json');
assert(
  capabilityMetadata.specVersion === '0.1.0-draft.5',
  'capability metadata fixture must declare specVersion 0.1.0-draft.5'
);
for (const apiField of ['trustMetadata', 'versionIndex', 'releaseUploads', 'trustUploads', 'advisories']) {
  assert(
    typeof capabilityMetadata.apis[apiField] === 'boolean',
    `capability metadata fixture must declare boolean apis.${apiField}`
  );
}
for (const deliveryMode of ['cdn', 'git']) {
  assert(capabilityMetadata.deliveryModes.includes(deliveryMode), `capability metadata must include ${deliveryMode}`);
}
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

const problemDetailsCases = readJson('conformance/fixtures/problem-details-cases.json');
assertSpecVersion(problemDetailsCases, 'problem details cases');
assert(
  problemDetailsCases.cases.length === problemStatusBySlug.size,
  'problem details cases must cover every baseline problem type'
);
for (const problemCase of problemDetailsCases.cases) {
  assertProblemDetails(problemCase, `problem details case ${problemCase.type}`);
}
for (const slug of problemStatusBySlug.keys()) {
  assert(
    problemDetailsCases.cases.some((problemCase) => problemCase.type.endsWith(`/${slug}`)),
    `problem details cases missing ${slug}`
  );
}

const releaseUploadLifecycle = readJson('conformance/fixtures/release-upload-lifecycle.json');
assertSpecVersion(releaseUploadLifecycle, 'release upload lifecycle fixture');
const releaseUploadFailures = new Set(
  releaseUploadLifecycle.fixtures
    .filter((fixture) => fixture.schema === 'problem-details')
    .map((fixture) => fixture.expected.failureCategory)
);
for (const failureCategory of [
  'version-conflict',
  'invalid-archive',
  'identity-mismatch',
  'digest-mismatch',
  'missing-uploaded-bytes',
  'invalid-upload-state',
  'idempotency-conflict',
  'upload-expired',
]) {
  assert(releaseUploadFailures.has(failureCategory), `release upload lifecycle missing ${failureCategory}`);
}
for (const fixture of releaseUploadLifecycle.fixtures) {
  if (fixture.schema === 'release-upload-intent') {
    validate('releaseUploadIntent', fixture.payload, `release upload lifecycle ${fixture.name}`);
    assert(
      fixture.payload.mediaType === 'application/gzip',
      `release upload lifecycle ${fixture.name} must use application/gzip`
    );
  }
  if (fixture.schema === 'release-upload-finalize') {
    validate('releaseUploadFinalize', fixture.payload, `release upload lifecycle ${fixture.name}`);
    assertReleaseMetadata(fixture.payload.release, `release upload lifecycle ${fixture.name} release metadata`);
  }
  if (fixture.schema === 'problem-details') {
    assertProblemDetails(fixture.payload, `release upload lifecycle ${fixture.name}`);
    assert(
      fixture.payload.type.endsWith(`/${fixture.expected.failureCategory}`),
      `release upload lifecycle ${fixture.name} failureCategory must match problem type slug`
    );
  }
}

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

const versionIndexRowCases = readJson('conformance/fixtures/version-index-row-cases.json');
assertSpecVersion(versionIndexRowCases, 'version index row cases');
for (const fixture of versionIndexRowCases.fixtures) {
  if (fixture.expected.valid) {
    validate('versionIndexRow', fixture.payload, `version index row ${fixture.name}`);
  } else {
    validateExpectedFailure('versionIndexRow', fixture.payload, `version index row ${fixture.name}`);
  }
}

const semverRangeCases = readJson('conformance/fixtures/semver-range-cases.json');
assertSpecVersion(semverRangeCases, 'semver range cases');
const semverRangeSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $ref: `${schemas.volume.$id}#/$defs/semverRange`,
};
const validateSemverRange = ajv.compile(semverRangeSchema);
for (const range of semverRangeCases.accepted) {
  assert(validateSemverRange(range), `semver range case should be accepted: ${range}`);
}
for (const range of semverRangeCases.rejected) {
  assert(!validateSemverRange(range), `semver range case should be rejected: ${range}`);
}

const resolverCases = readJson('conformance/fixtures/resolver-cases.json');
assertSpecVersion(resolverCases, 'resolver cases');
assert(
  resolverCases.cases.some(
    (resolverCase) =>
      resolverCase.resolutionMode === 'exact-pinned' &&
      resolverCase.expected.outcome === 'success' &&
      resolverCase.expected.warnings?.some((warning) => warning.category === 'yanked-version')
  ),
  'resolver cases must include exact-pinned yanked warning success'
);
for (const requiredFailure of ['blocked', 'tombstoned', 'availability-or-registry-state']) {
  assert(
    resolverCases.cases.some(
      (resolverCase) =>
        resolverCase.resolutionMode === 'exact-pinned' && resolverCase.expected.failureCategory === requiredFailure
    ),
    `resolver cases must include exact-pinned ${requiredFailure} failure`
  );
}
for (const resolverCase of resolverCases.cases) {
  assert(
    !('dependencies' in resolverCase),
    `resolver case ${resolverCase.name} must use requirements, not dependencies`
  );
  if (resolverCase.requirements) {
    assert(
      Array.isArray(resolverCase.requirements),
      `resolver case ${resolverCase.name} requirements must be an array`
    );
    for (const requirement of resolverCase.requirements) {
      assert(
        typeof requirement.requester === 'string',
        `resolver case ${resolverCase.name} requirement needs requester`
      );
      assert(typeof requirement.volume === 'string', `resolver case ${resolverCase.name} requirement needs volume`);
      assert(
        validateSemverRange(requirement.constraint),
        `resolver case ${resolverCase.name} has invalid constraint: ${requirement.constraint}`
      );
    }
  }
  if (resolverCase.versionIndexRows) {
    for (const [volume, rows] of Object.entries(resolverCase.versionIndexRows)) {
      assert(Array.isArray(rows), `resolver case ${resolverCase.name} versionIndexRows.${volume} must be an array`);
      for (const row of rows) {
        validate('versionIndexRow', row, `resolver case ${resolverCase.name} version index row for ${volume}`);
      }
    }
  }
  if (resolverCase.exactReleaseMetadata) {
    for (const [key, metadata] of Object.entries(resolverCase.exactReleaseMetadata)) {
      assertReleaseMetadata(metadata, `resolver case ${resolverCase.name} exact metadata ${key}`);
      if (resolverCase.requestRoute && resolverCase.expected.failureCategory !== 'identity-mismatch') {
        assertRouteMetadataIdentity(
          resolverCase.requestRoute,
          metadata,
          `resolver case ${resolverCase.name} exact metadata ${key}`
        );
      }
      if (resolverCase.expected.failureCategory === 'identity-mismatch') {
        const identity = routeIdentityFromPath(resolverCase.requestRoute);
        assert(identity, `resolver case ${resolverCase.name} needs a parseable route for identity mismatch`);
        assert(
          metadata.name !== identity.name || metadata.version !== identity.version,
          `resolver case ${resolverCase.name} must exercise route/metadata identity mismatch`
        );
      }
    }
  }
}

const trustUploadLifecycle = readJson('conformance/fixtures/trust-upload-lifecycle.json');
assertSpecVersion(trustUploadLifecycle, 'trust upload lifecycle fixture');
for (const fixture of trustUploadLifecycle.fixtures) {
  if (fixture.schema === 'trust-upload-intent') {
    validate('trustUploadIntent', fixture.payload, `trust upload lifecycle ${fixture.name}`);
  }
  if (fixture.schema === 'trust-upload-finalize') {
    validate('trustUploadFinalize', fixture.payload, `trust upload lifecycle ${fixture.name}`);
  }
  if (fixture.schema === 'problem-details') {
    assertProblemDetails(fixture.payload, `trust upload lifecycle ${fixture.name}`);
    assert(
      fixture.payload.type.endsWith(`/${fixture.expected.failureCategory}`),
      `trust upload lifecycle ${fixture.name} failureCategory must match problem type slug`
    );
  }
}

const digestVectors = readJson('conformance/fixtures/digest-vectors.json');
assertSpecVersion(digestVectors, 'digest vectors');
for (const fixture of digestVectors.fixtures) {
  const canonicalInputBytes = fixture.canonicalInputBase64
    ? Buffer.from(fixture.canonicalInputBase64, 'base64')
    : Buffer.from(fixture.canonicalInput, 'utf8');
  assert(
    fixture.normalizedFiles.every((file) => {
      const contentBytes = file.contentBase64
        ? Buffer.from(file.contentBase64, 'base64')
        : Buffer.from(file.content, 'utf8');
      const recordHeader = Buffer.from(
        `file ${file.path} ${file.executable ? 1 : 0} ${contentBytes.byteLength}\n`,
        'utf8'
      );
      return canonicalInputBytes.includes(recordHeader);
    }),
    `digest vector ${fixture.name} canonical input must use byte lengths from normalized files`
  );
  const actual = `sha256:${crypto.createHash('sha256').update(canonicalInputBytes).digest('hex')}`;
  assert(
    actual === fixture.expectedIntegrity,
    `digest vector ${fixture.name} expected ${fixture.expectedIntegrity} but computed ${actual}`
  );
}
const isInvalidNormalizedPath = (pathValue) =>
  pathValue.startsWith('/') || pathValue.split('/').some((segment) => segment === '.' || segment === '..');
const normalizeArchivePath = (pathValue) => path.posix.normalize(pathValue);
const isInvalidArchivePath = (pathValue) => {
  const normalized = normalizeArchivePath(pathValue);
  return (
    pathValue.startsWith('/') ||
    normalized === '.' ||
    pathValue.split('/').some((segment) => segment === '.' || segment === '..')
  );
};
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
  if (digestCase.expected.failureCategory === 'non-regular-file') {
    assert(
      digestCase.normalizedFiles.some((file) => file.entryType && file.entryType !== 'file'),
      `digest invalid case ${digestCase.name} must contain a non-regular entry`
    );
  }
  assert(digestCase.expected.valid === false, `digest invalid case ${digestCase.name} must be expected invalid`);
}

const tarArchiveProfileCases = readJson('conformance/fixtures/tar-archive-profile-cases.json');
assertSpecVersion(tarArchiveProfileCases, 'tar archive profile cases');
for (const archiveCase of tarArchiveProfileCases.cases) {
  assert(Array.isArray(archiveCase.archiveEntries), `tar archive case ${archiveCase.name} needs archive entries`);
  if (archiveCase.expected.valid === false) {
    assert(
      typeof archiveCase.expected.failureCategory === 'string',
      `tar archive case ${archiveCase.name} needs failure category`
    );
  }
  if (archiveCase.expected.failureCategory === 'invalid-archive-path') {
    assert(
      archiveCase.archiveEntries.some((entry) => isInvalidArchivePath(entry.path)),
      `tar archive case ${archiveCase.name} must contain an invalid archive path`
    );
  }
  if (archiveCase.expected.failureCategory === 'duplicate-archive-path') {
    const normalizedPaths = archiveCase.archiveEntries.map((entry) => normalizeArchivePath(entry.path));
    assert(
      new Set(normalizedPaths).size !== normalizedPaths.length,
      `tar archive case ${archiveCase.name} must contain duplicate normalized archive paths`
    );
  }
  if (archiveCase.expected.failureCategory === 'non-regular-archive-entry') {
    assert(
      archiveCase.archiveEntries.some((entry) => entry.entryType !== 'file'),
      `tar archive case ${archiveCase.name} must contain a non-regular archive entry`
    );
  }
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
assert(openapi.paths['/api/v1/index/volumes/{name}'], 'OpenAPI document must define unscoped version index path');
assert(
  openapi.paths['/api/v1/index/volumes/@{scope}/{name}'],
  'OpenAPI document must define scoped version index path'
);
assert(openapi.paths['/api/v1/volumes/{name}'], 'OpenAPI document must define unscoped release upload intent path');
assert(
  openapi.paths['/api/v1/volumes/{name}'].post.parameters.some(
    (parameter) => parameter.in === 'header' && parameter.name === 'Idempotency-Key'
  ),
  'OpenAPI unscoped release upload intent path must accept Idempotency-Key header'
);
assert(
  openapi.paths['/api/v1/volumes/{name}/uploads/{uploadId}/finalize'],
  'OpenAPI document must define unscoped release upload finalize path'
);
assert(
  openapi.paths['/api/v1/volumes/@{scope}/{name}'],
  'OpenAPI document must define scoped release upload intent path'
);
assert(
  openapi.paths['/api/v1/volumes/@{scope}/{name}'].post.parameters.some(
    (parameter) => parameter.in === 'header' && parameter.name === 'Idempotency-Key'
  ),
  'OpenAPI scoped release upload intent path must accept Idempotency-Key header'
);
assert(
  openapi.paths['/api/v1/volumes/@{scope}/{name}/uploads/{uploadId}/finalize'],
  'OpenAPI document must define scoped release upload finalize path'
);
assert(
  openapi.paths['/api/v1/volumes/{name}/{version}/trust/uploads'],
  'OpenAPI document must define unscoped trust upload intent path'
);
assert(
  openapi.paths['/api/v1/volumes/@{scope}/{name}/{version}/trust/uploads'],
  'OpenAPI document must define scoped trust upload intent path'
);
assert(openapi.components?.schemas?.ProblemDetails, 'OpenAPI document must define ProblemDetails schema');
assert(
  openapi.components.schemas.ProblemDetails.properties.type.pattern ===
    '^https://agentvolumes\\.org/problems/[a-z0-9-]+$',
  'OpenAPI ProblemDetails.type must use Agent Volumes problem URI pattern'
);
for (const [pathName, pathItem] of Object.entries(openapi.paths)) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
      continue;
    }
    for (const parameter of operation.parameters ?? []) {
      if (parameter.in !== 'path') {
        continue;
      }
      const expectedRefByName = {
        name: '#/components/schemas/NameSegment',
        scope: '#/components/schemas/ScopeName',
        version: '#/components/schemas/SemVer',
      };
      const expectedRef = expectedRefByName[parameter.name];
      if (expectedRef) {
        assert(
          parameter.schema?.$ref === expectedRef,
          `OpenAPI ${method.toUpperCase()} ${pathName} path parameter ${parameter.name} must use ${expectedRef}`
        );
      }
    }
  }
}

console.log('Artifact validation passed.');
