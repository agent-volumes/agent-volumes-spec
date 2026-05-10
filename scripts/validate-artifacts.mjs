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
  advisoryValidationCase: readJson('schemas/advisory-validation-case.schema.json'),
  trustSummary: readJson('schemas/trust-summary.schema.json'),
  trustDetail: readJson('schemas/trust-detail.schema.json'),
  capabilityMetadata: readJson('schemas/capability-metadata.schema.json'),
  versionIndexRow: readJson('schemas/version-index-row.schema.json'),
  trustUploadIntent: readJson('schemas/trust-upload-intent.schema.json'),
  trustUploadFinalize: readJson('schemas/trust-upload-finalize.schema.json'),
  bridgeMetadata: readJson('schemas/bridge-metadata.schema.json'),
  releaseUploadIntent: readJson('schemas/release-upload-intent.schema.json'),
  releaseUploadFinalize: readJson('schemas/release-upload-finalize.schema.json'),
  releaseMetadata: readJson('schemas/release-metadata.schema.json'),
  conformanceReport: readJson('schemas/conformance-report.schema.json'),
  exactReleaseMetadataCase: readJson('schemas/exact-release-metadata-case.schema.json'),
  problemDetails: readJson('schemas/problem-details.schema.json'),
  warning: readJson('schemas/warning.schema.json'),
  componentDependencyValidationCase: readJson('schemas/component-dependency-validation-case.schema.json'),
  semanticValidationCase: readJson('schemas/semantic-validation-case.schema.json'),
  trustArtifactVerificationCase: readJson('schemas/trust-artifact-verification-case.schema.json'),
  mappingMatrix: readJson('schemas/mapping-matrix.schema.json'),
  mappingSample: readJson('schemas/mapping-sample.schema.json'),
};

for (const schema of Object.values(schemas)) {
  ajv.addSchema(schema);
}

const validators = Object.fromEntries(
  Object.entries(schemas).map(([name, schema]) => [name, ajv.getSchema(schema.$id) ?? ajv.compile(schema)])
);

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
const componentNamePattern = /^(?!.*--)[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/;
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
  validate('releaseMetadata', metadata, label);
  assert(volumeNamePattern.test(metadata.name), `${label} needs canonical full volume name`);
  assert(semverPattern.test(metadata.version), `${label} needs SemVer version`);
  assert(digestPattern.test(metadata.integrity), `${label} needs valid integrity`);
  assert(
    metadata.purl === canonicalReleasePurl(metadata.name, metadata.version),
    `${label} purl must match canonical release identity`
  );
  assert(metadata.status && typeof metadata.status === 'object', `${label} needs lifecycle status metadata`);
  assert(
    ['available', 'yanked', 'tombstoned', 'blocked', 'unavailable'].includes(metadata.status.state),
    `${label} needs a recognized lifecycle status`
  );
  if (['available', 'yanked'].includes(metadata.status.state)) {
    assert(metadata.dist && typeof metadata.dist === 'object', `${label} needs dist metadata`);
    assert(['cdn', 'git'].includes(metadata.dist.source), `${label} needs cdn or git dist source`);
  }
  if (['blocked', 'tombstoned', 'unavailable'].includes(metadata.status.state)) {
    assert(!metadata.dist, `${label} must not expose installable dist metadata for ${metadata.status.state}`);
  }
};

const assertProblemDetails = (payload, label) => {
  validate('problemDetails', payload, label);
  assert(problemTypePattern.test(payload.type), `${label} must use Agent Volumes problem type URI`);
  const slug = payload.type.replace('https://agentvolumes.org/problems/', '');
  assert(problemStatusBySlug.has(slug), `${label} uses unknown problem type: ${slug}`);
  assert(typeof payload.title === 'string', `${label} needs problem title`);
  assert(typeof payload.status === 'number', `${label} needs numeric problem status`);
  assert(payload.status === problemStatusBySlug.get(slug), `${label} status must match problem type ${slug}`);
};

const assertWarning = (warning, label) => {
  validate('warning', warning, label);
};

const isRecognizedSpdxExpressionShape = (expression) => {
  const tokenPattern = /\(|\)|\+|\bAND\b|\bOR\b|\bWITH\b|LicenseRef-[A-Za-z0-9.-]+|[A-Za-z0-9][A-Za-z0-9.-]*/g;
  const tokens = expression.match(tokenPattern) ?? [];
  if (tokens.join('') !== expression.replace(/\s+/g, '')) {
    return false;
  }
  let expectOperand = true;
  let depth = 0;
  for (const token of tokens) {
    if (token === '(') {
      if (!expectOperand) return false;
      depth += 1;
      continue;
    }
    if (token === ')') {
      if (expectOperand || depth === 0) return false;
      depth -= 1;
      continue;
    }
    if (token === 'AND' || token === 'OR') {
      if (expectOperand) return false;
      expectOperand = true;
      continue;
    }
    if (token === 'WITH') {
      if (expectOperand) return false;
      expectOperand = true;
      continue;
    }
    if (token === '+') {
      if (expectOperand) return false;
      continue;
    }
    if (!expectOperand) return false;
    expectOperand = false;
  }
  return tokens.length > 0 && depth === 0 && !expectOperand;
};

const canonicalReleasePurl = (volume, version) => {
  assert(volumeNamePattern.test(volume), `cannot canonicalize invalid volume name: ${volume}`);
  if (volume.startsWith('@')) {
    const [scope, name] = volume.slice(1).split('/');
    return `pkg:volume/%40${scope}/${name}@${version}`;
  }
  return `pkg:volume/${volume}@${version}`;
};

const canonicalComponentPurl = (volume, version, component) => {
  assert(componentNamePattern.test(component.name), `cannot canonicalize invalid component name: ${component.name}`);
  return `${canonicalReleasePurl(volume, version)}#${component.type}/${component.name}`;
};

const stableJsonStringify = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJsonStringify(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

const assertDeepEqual = (actual, expected, label) => {
  assert(stableJsonStringify(actual) === stableJsonStringify(expected), `${label} must round-trip`);
};

const findProperty = (properties, name, label) => {
  const property = properties?.find((candidate) => candidate.name === name);
  assert(property, `${label} needs ${name} property`);
  return property;
};

const parseStablePropertyJson = (properties, name, label) => {
  const property = findProperty(properties, name, label);
  let parsed;
  try {
    parsed = JSON.parse(property.value);
  } catch (err) {
    throw new Error(`${label} ${name} property must contain JSON: ${err.message}`);
  }
  assert(
    property.value === stableJsonStringify(parsed),
    `${label} ${name} property must use stable JSON serialization`
  );
  return parsed;
};

const findExternalReference = (references, type, url, label) => {
  assert(
    references?.some((reference) => reference.type === type && reference.url === url),
    `${label} needs ${type} external reference ${url}`
  );
};

const findSpdxExternalRef = (externalRefs, referenceCategory, referenceType, referenceLocator, label) => {
  assert(
    externalRefs?.some(
      (reference) =>
        reference.referenceCategory === referenceCategory &&
        reference.referenceType === referenceType &&
        reference.referenceLocator === referenceLocator
    ),
    `${label} needs SPDX externalRef ${referenceCategory}/${referenceType}/${referenceLocator}`
  );
};

const decodeFixtureArtifact = (artifact, label) => {
  assert(artifact?.bytesBase64, `${label} needs artifact.bytesBase64`);
  const bytes = Buffer.from(artifact.bytesBase64, 'base64');
  assert(bytes.length > 0, `${label} artifact bytes must not be empty`);
  const digest = `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
  assert(digest === artifact.artifactDigest, `${label} artifactDigest must match bytes`);
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch (err) {
    throw new Error(`${label} artifact bytes must parse as JSON: ${err.message}`);
  }
};

const assertCycloneDxArtifact = (artifactJson, trustCase) => {
  const component = artifactJson.metadata?.component;
  assert(artifactJson.bomFormat === 'CycloneDX', `trust artifact case ${trustCase.name} BOM must declare CycloneDX`);
  assert(
    artifactJson.specVersion === trustCase.format.version,
    `trust artifact case ${trustCase.name} BOM specVersion must match format.version`
  );
  assert(
    artifactJson.serialNumber?.startsWith('urn:uuid:'),
    `trust artifact case ${trustCase.name} BOM must declare a deterministic CycloneDX serialNumber`
  );
  assert(artifactJson.version === 1, `trust artifact case ${trustCase.name} BOM must declare document version 1`);
  assert(component?.type, `trust artifact case ${trustCase.name} BOM metadata component needs a type`);
  assert(
    component?.purl === trustCase.subject.purl,
    `trust artifact case ${trustCase.name} BOM purl must bind subject`
  );
  assert(
    component?.hashes?.some(
      (hash) => hash.alg === 'SHA-256' && `sha256:${hash.content}` === trustCase.subject.integrity
    ),
    `trust artifact case ${trustCase.name} BOM hashes must bind immutable identity`
  );
};

const assertSlsaArtifact = (artifactJson, trustCase) => {
  assert(
    artifactJson.payloadType === 'application/vnd.in-toto+json',
    `trust artifact case ${trustCase.name} SLSA envelope must declare in-toto payloadType`
  );
  assert(
    Array.isArray(artifactJson.signatures) && artifactJson.signatures.length > 0,
    `trust artifact case ${trustCase.name} SLSA envelope needs deterministic signature material`
  );
  for (const signature of artifactJson.signatures) {
    assert(signature.sig, `trust artifact case ${trustCase.name} SLSA envelope signature bytes are required`);
  }
  const statement = JSON.parse(Buffer.from(artifactJson.payload, 'base64').toString('utf8'));
  assert(
    statement._type === 'https://in-toto.io/Statement/v1',
    `trust artifact case ${trustCase.name} needs in-toto Statement v1`
  );
  assert(
    statement.predicateType === 'https://slsa.dev/provenance/v1',
    `trust artifact case ${trustCase.name} needs SLSA v1 predicateType`
  );
  assert(
    Array.isArray(statement.subject) && statement.subject.length > 0,
    `trust artifact case ${trustCase.name} SLSA statement needs at least one subject`
  );
  assert(
    statement.subject?.some(
      (subject) =>
        subject.name === trustCase.subject.purl && subject.digest?.sha256 === trustCase.subject.integrity.slice(7)
    ),
    `trust artifact case ${trustCase.name} SLSA subject must bind release subject`
  );
  assert(statement.predicate?.buildDefinition?.buildType, `trust artifact case ${trustCase.name} needs SLSA buildType`);
  assert(statement.predicate?.runDetails?.builder?.id, `trust artifact case ${trustCase.name} needs SLSA builder id`);
};

const assertSigstoreArtifact = (artifactJson, trustCase) => {
  assert(
    artifactJson.media_type === 'application/vnd.dev.sigstore.bundle.v0.3+json',
    `trust artifact case ${trustCase.name} Sigstore bundle must declare v0.3 media_type`
  );
  assert(
    artifactJson.verification_material,
    `trust artifact case ${trustCase.name} Sigstore bundle needs verification material`
  );
  assert(
    artifactJson.verification_material.public_key || artifactJson.verification_material.x509_certificate_chain,
    `trust artifact case ${trustCase.name} Sigstore bundle needs public key or certificate material`
  );
  assert(
    Array.isArray(artifactJson.verification_material.tlog_entries) &&
      artifactJson.verification_material.tlog_entries.length > 0,
    `trust artifact case ${trustCase.name} Sigstore bundle needs bundled transparency evidence`
  );
  const hasMessageSignature = Boolean(artifactJson.message_signature);
  const hasDsseEnvelope = Boolean(artifactJson.dsse_envelope);
  assert(
    hasMessageSignature !== hasDsseEnvelope,
    `trust artifact case ${trustCase.name} Sigstore bundle must use exactly one content form`
  );
  if (hasMessageSignature) {
    assert(
      artifactJson.message_signature.message_digest?.digest === trustCase.subject.integrity.slice(7),
      `trust artifact case ${trustCase.name} Sigstore message digest must bind release subject`
    );
    assert(
      artifactJson.message_signature.signature,
      `trust artifact case ${trustCase.name} Sigstore signature is required`
    );
  }
  if (hasDsseEnvelope) {
    assert(
      artifactJson.dsse_envelope.signatures?.length > 0,
      `trust artifact case ${trustCase.name} DSSE signatures are required`
    );
  }
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
const advisoryValidationCases = readJson('conformance/fixtures/advisory-validation-cases.json');
validate('advisoryValidationCase', advisoryValidationCases, 'advisory validation cases fixture');
assertSpecVersion(advisoryValidationCases, 'advisory validation cases fixture');
for (const advisoryCase of advisoryValidationCases.cases) {
  if (advisoryCase.expected.valid) {
    validate('advisory', advisoryCase.payload, `advisory validation case ${advisoryCase.name}`);
  } else {
    validateExpectedFailure('advisory', advisoryCase.payload, `advisory validation case ${advisoryCase.name}`);
  }
}
const advisoryRelationshipTypes = new Set(
  advisoryValidationCases.cases.flatMap((advisoryCase) =>
    (advisoryCase.payload.relationships ?? []).map((relationship) => relationship.type)
  )
);
for (const relationshipType of ['supersedes', 'superseded-by', 'related', 'duplicate-of']) {
  assert(advisoryRelationshipTypes.has(relationshipType), `advisory validation cases missing ${relationshipType}`);
}
assert(
  advisoryValidationCases.cases.some(
    (advisoryCase) => advisoryCase.expected.failureCategory === 'invalid-advisory-relationship'
  ),
  'advisory validation cases must include invalid relationship failure'
);
assert(
  advisoryValidationCases.cases.some((advisoryCase) => advisoryCase.payload.affected?.componentImpact),
  'advisory validation cases must exercise informational componentImpact metadata'
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
for (const warning of capabilityUnknownToleranceFixture.expected.warnings) {
  assertWarning(warning, 'capability metadata unknown tolerance warning');
}
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
const releaseUploadStates = new Set(
  releaseUploadLifecycle.fixtures
    .filter((fixture) => fixture.schema === 'release-upload-intent')
    .map((fixture) => fixture.payload.state)
);
for (const requiredState of ['pending-upload', 'uploading', 'uploaded', 'expired', 'failed']) {
  assert(releaseUploadStates.has(requiredState), `release upload lifecycle missing ${requiredState} state`);
}
for (const failureCategory of [
  'version-conflict',
  'invalid-archive',
  'invalid-manifest',
  'authorization-failed',
  'payload-too-large',
  'unsupported-media-type',
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
    if (fixture.expected.state) {
      assert(
        fixture.payload.state === fixture.expected.state,
        `release upload lifecycle ${fixture.name} expected state must match payload state`
      );
      assert(
        fixture.expected.finalizable === (fixture.payload.state === 'uploaded'),
        `release upload lifecycle ${fixture.name} finalizable flag must match uploaded-only finalization rule`
      );
    }
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
for (const warning of unknownFieldFixture.expected.warnings) {
  assertWarning(warning, 'unknown-field manifest warning');
}

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
for (const resolverCase of resolverCases.cases) {
  for (const warning of resolverCase.expected.warnings ?? []) {
    assertWarning(warning, `resolver case ${resolverCase.name} warning`);
  }
}
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

const exactReleaseMetadataCases = readJson('conformance/fixtures/exact-release-metadata-cases.json');
validate('exactReleaseMetadataCase', exactReleaseMetadataCases, 'exact release metadata cases fixture');
assertSpecVersion(exactReleaseMetadataCases, 'exact release metadata cases');
for (const exactCase of exactReleaseMetadataCases.cases) {
  for (const warning of exactCase.expected.warnings ?? []) {
    assertWarning(warning, `exact release metadata case ${exactCase.name} warning`);
  }
  if (exactCase.metadata) {
    assertReleaseMetadata(exactCase.metadata, `exact release metadata case ${exactCase.name}`);
    assertRouteMetadataIdentity(
      exactCase.requestRoute,
      exactCase.metadata,
      `exact release metadata case ${exactCase.name}`
    );
    assert(
      exactCase.expected.outcome === 'success',
      `exact release metadata case ${exactCase.name} with metadata must be successful`
    );
    assert(
      exactCase.expected.installable === true,
      `exact release metadata case ${exactCase.name} with metadata must be installable`
    );
    assert(
      exactCase.metadata.dist?.source === exactCase.expected.distSource,
      `exact release metadata case ${exactCase.name} distSource must match metadata`
    );
    if (exactCase.metadata.status.state === 'yanked') {
      assert(
        exactCase.expected.warnings?.some((warning) => warning.category === 'yanked-version'),
        `exact release metadata case ${exactCase.name} must warn for yanked exact install`
      );
    }
  }
  if (exactCase.problem) {
    assertProblemDetails(exactCase.problem, `exact release metadata case ${exactCase.name}`);
    assert(
      exactCase.expected.outcome === 'failure' && exactCase.expected.installable === false,
      `exact release metadata case ${exactCase.name} problem must be a non-installable failure`
    );
    assert(
      ['blocked', 'tombstoned', 'availability-or-registry-state'].includes(exactCase.expected.failureCategory),
      `exact release metadata case ${exactCase.name} must use portable lifecycle failure category`
    );
  }
  if (exactCase.invalidMetadata) {
    validateExpectedFailure(
      'releaseMetadata',
      exactCase.invalidMetadata,
      `exact release metadata case ${exactCase.name}`
    );
    assert(
      ['blocked', 'tombstoned', 'unavailable'].includes(exactCase.invalidMetadata.status?.state),
      `exact release metadata case ${exactCase.name} invalid metadata must use non-installable lifecycle state`
    );
    assert(
      exactCase.invalidMetadata.dist,
      `exact release metadata case ${exactCase.name} invalid metadata must exercise forbidden dist`
    );
    assert(
      exactCase.expected.failureCategory === 'non-installable-dist',
      `exact release metadata case ${exactCase.name} must classify forbidden dist metadata`
    );
  }
}
for (const requiredDistSource of ['cdn', 'git']) {
  assert(
    exactReleaseMetadataCases.cases.some((exactCase) => exactCase.expected.distSource === requiredDistSource),
    `exact release metadata cases missing ${requiredDistSource} success`
  );
}
for (const requiredFailure of ['blocked', 'tombstoned', 'availability-or-registry-state']) {
  assert(
    exactReleaseMetadataCases.cases.some((exactCase) => exactCase.expected.failureCategory === requiredFailure),
    `exact release metadata cases missing ${requiredFailure} failure`
  );
}

const trustUploadLifecycle = readJson('conformance/fixtures/trust-upload-lifecycle.json');
assertSpecVersion(trustUploadLifecycle, 'trust upload lifecycle fixture');
const trustUploadIntentCategories = new Set();
const trustUploadStates = new Set();
const trustUploadFailures = new Set();
for (const fixture of trustUploadLifecycle.fixtures) {
  if (fixture.schema === 'trust-upload-intent') {
    validate('trustUploadIntent', fixture.payload, `trust upload lifecycle ${fixture.name}`);
    trustUploadIntentCategories.add(fixture.payload.attachment.category);
    trustUploadStates.add(fixture.payload.state);
    if (fixture.expected.state) {
      assert(
        fixture.payload.state === fixture.expected.state,
        `trust upload lifecycle ${fixture.name} expected state must match payload state`
      );
      assert(
        fixture.expected.finalizable === (fixture.payload.state === 'uploaded'),
        `trust upload lifecycle ${fixture.name} finalizable flag must match uploaded-only finalization rule`
      );
    }
  }
  if (fixture.schema === 'trust-upload-finalize') {
    validate('trustUploadFinalize', fixture.payload, `trust upload lifecycle ${fixture.name}`);
    assert(
      digestPattern.test(fixture.payload.artifactDigest),
      `trust upload lifecycle ${fixture.name} must preserve finalized artifact digest`
    );
  }
  if (fixture.schema === 'problem-details') {
    assertProblemDetails(fixture.payload, `trust upload lifecycle ${fixture.name}`);
    trustUploadFailures.add(fixture.expected.failureCategory);
    assert(
      fixture.payload.type.endsWith(`/${fixture.expected.failureCategory}`),
      `trust upload lifecycle ${fixture.name} failureCategory must match problem type slug`
    );
  }
}
for (const requiredState of ['pending-upload', 'uploading', 'uploaded', 'expired', 'failed']) {
  assert(trustUploadStates.has(requiredState), `trust upload lifecycle missing ${requiredState} state`);
}
for (const requiredTrustUploadCategory of ['bom', 'provenance', 'signature']) {
  assert(
    trustUploadIntentCategories.has(requiredTrustUploadCategory),
    `trust upload lifecycle must include ${requiredTrustUploadCategory} intent`
  );
}
for (const failureCategory of [
  'digest-mismatch',
  'upload-expired',
  'subject-binding-mismatch',
  'missing-uploaded-bytes',
  'idempotency-conflict',
  'invalid-upload-state',
  'payload-too-large',
  'unsupported-media-type',
  'authorization-failed',
]) {
  assert(trustUploadFailures.has(failureCategory), `trust upload lifecycle missing ${failureCategory}`);
}

const trustArtifactVerificationCases = readJson('conformance/fixtures/trust-artifact-verification-cases.json');
validate('trustArtifactVerificationCase', trustArtifactVerificationCases, 'trust artifact verification cases fixture');
assertSpecVersion(trustArtifactVerificationCases, 'trust artifact verification cases');
for (const trustCategory of ['bom', 'provenance', 'signature']) {
  assert(
    trustArtifactVerificationCases.cases.some(
      (trustCase) => trustCase.category === trustCategory && trustCase.expected.valid === true
    ),
    `trust artifact verification cases must include valid ${trustCategory} binding`
  );
}
for (const trustCase of trustArtifactVerificationCases.cases) {
  if (trustCase.category === 'bom') {
    assert(
      trustCase.format.family === 'cyclonedx' || trustCase.expected.failureCategory === 'unsupported-artifact-format',
      `trust artifact case ${trustCase.name} BOM must use cyclonedx family`
    );
  }
  if (trustCase.category === 'provenance') {
    assert(
      trustCase.format.family === 'slsa-provenance',
      `trust artifact case ${trustCase.name} provenance must use slsa-provenance family`
    );
    if (trustCase.expected.valid) {
      assert(
        trustCase.artifactSubject?.predicateType === 'https://slsa.dev/provenance/v1',
        `trust artifact case ${trustCase.name} valid provenance must use SLSA v1 predicate`
      );
    } else if (trustCase.expected.failureCategory === 'unsupported-provenance-predicate') {
      assert(
        trustCase.artifactSubject?.predicateType !== 'https://slsa.dev/provenance/v1',
        `trust artifact case ${trustCase.name} must exercise wrong SLSA predicate`
      );
    }
  }
  if (trustCase.category === 'signature') {
    assert(
      trustCase.format.family === 'sigstore-bundle',
      `trust artifact case ${trustCase.name} signature must use sigstore-bundle family`
    );
    if (trustCase.expected.valid) {
      assert(
        trustCase.artifactSubject?.signatureFormat === 'sigstore-bundle',
        `trust artifact case ${trustCase.name} valid signature must use sigstore-bundle format`
      );
    } else if (trustCase.expected.failureCategory === 'unsupported-signature-format') {
      assert(
        trustCase.artifactSubject?.signatureFormat !== 'sigstore-bundle',
        `trust artifact case ${trustCase.name} must exercise signature format mismatch`
      );
    }
  }
  if (trustCase.expected.failureCategory === 'subject-binding-mismatch') {
    assert(
      trustCase.artifactSubject?.integrity !== trustCase.subject.integrity ||
        trustCase.artifactSubject?.purl !== trustCase.subject.purl,
      `trust artifact case ${trustCase.name} must exercise subject mismatch`
    );
  }
  if (trustCase.expected.failureCategory === 'missing-artifact-subject') {
    assert(
      !trustCase.artifactSubject?.purl || !trustCase.artifactSubject?.integrity,
      `trust artifact case ${trustCase.name} must omit at least one artifact subject fact`
    );
  }
  if (trustCase.expected.failureCategory === 'revoked-trust-artifact') {
    assert(
      trustCase.lifecycleStatus?.state === 'revoked' && trustCase.expected.valid === false,
      `trust artifact case ${trustCase.name} must model revoked attachments as default failures`
    );
  }
  if (trustCase.expected.failureCategory === 'invalid-trust-artifact') {
    assert(
      (trustCase.lifecycleStatus?.state === 'invalid' || trustCase.artifact) && trustCase.expected.valid === false,
      `trust artifact case ${trustCase.name} must model invalid lifecycle or malformed artifact failures`
    );
  }
  if (trustCase.expected.valid) {
    assert(
      trustCase.artifactSubject?.integrity === trustCase.subject.integrity,
      `trust artifact case ${trustCase.name} valid artifact must bind immutable identity`
    );
    assert(
      trustCase.artifactSubject?.purl === trustCase.subject.purl,
      `trust artifact case ${trustCase.name} valid artifact must bind logical identity`
    );
  }
  if (trustCase.artifact) {
    assert(
      trustCase.artifact.mediaType === trustCase.format.mediaType,
      `trust artifact case ${trustCase.name} artifact mediaType must match declared format`
    );
    let artifactError = null;
    try {
      const artifactJson = decodeFixtureArtifact(trustCase.artifact, `trust artifact case ${trustCase.name}`);
      if (trustCase.category === 'bom') {
        assertCycloneDxArtifact(artifactJson, trustCase);
      }
      if (trustCase.category === 'provenance') {
        assertSlsaArtifact(artifactJson, trustCase);
      }
      if (trustCase.category === 'signature') {
        assertSigstoreArtifact(artifactJson, trustCase);
      }
    } catch (err) {
      artifactError = err;
    }
    if (trustCase.expected.valid) {
      assert(!artifactError, artifactError?.message ?? `trust artifact case ${trustCase.name} must validate`);
    } else if (trustCase.expected.failureCategory === 'invalid-trust-artifact') {
      assert(artifactError, `trust artifact case ${trustCase.name} must fail artifact validation`);
    } else {
      assert(
        !artifactError,
        artifactError?.message ?? `trust artifact case ${trustCase.name} artifact validation failed`
      );
    }
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

const purlCanonicalizationCases = readJson('conformance/fixtures/purl-canonicalization-cases.json');
assertSpecVersion(purlCanonicalizationCases, 'purl canonicalization cases');
for (const purlCase of purlCanonicalizationCases.cases) {
  const expected = purlCase.component
    ? canonicalComponentPurl(purlCase.volume, purlCase.version, purlCase.component)
    : canonicalReleasePurl(purlCase.volume, purlCase.version);
  assert(expected === purlCase.expectedPurl, `purl case ${purlCase.name} expectedPurl must be canonical`);
  if (purlCase.expected.valid === false) {
    assert(
      purlCase.candidatePurl !== purlCase.expectedPurl,
      `purl case ${purlCase.name} must exercise a non-canonical candidate`
    );
    assert(
      purlCase.expected.failureCategory === 'non-canonical-purl',
      `purl case ${purlCase.name} must classify non-canonical purl failure`
    );
  }
}

const componentDependencyCases = readJson('conformance/fixtures/component-dependency-validation-cases.json');
validate(
  'componentDependencyValidationCase',
  componentDependencyCases,
  'component dependency validation cases fixture'
);
for (const dependencyCase of componentDependencyCases.cases) {
  const resolvedComponents = new Set(dependencyCase.resolvedComponents);
  const requestedDependencies = Object.values(dependencyCase['component-dependencies']).flat();
  const missingDependencies = requestedDependencies.filter((dependency) => !resolvedComponents.has(dependency));
  if (dependencyCase.expected.failureCategory === 'missing-component-dependency') {
    assert(
      missingDependencies.length > 0,
      `component dependency case ${dependencyCase.name} must contain a missing dependency`
    );
  }
  if (dependencyCase.expected.valid === true) {
    assert(
      missingDependencies.length === 0,
      `component dependency case ${dependencyCase.name} must be semantically valid`
    );
  }
}

const semanticValidationCases = readJson('conformance/fixtures/semantic-validation-cases.json');
validate('semanticValidationCase', semanticValidationCases, 'semantic validation cases fixture');
const canonicalHookEvents = new Set([
  'SessionStart',
  'SessionEnd',
  'Setup',
  'UserPromptSubmit',
  'Stop',
  'StopFailure',
  'PreToolUse',
  'PostToolUse',
  'PostToolUseFailure',
  'PostToolBatch',
  'SubagentStart',
  'SubagentStop',
  'TaskCreated',
  'TaskCompleted',
  'InstructionsLoaded',
  'ConfigChange',
  'CwdChanged',
  'FileChanged',
  'PreCompact',
  'PostCompact',
]);
const supportedEntrypointExtensionsByType = {
  agent: new Set(['.md', '.yaml']),
  skill: new Set(['.md']),
  command: new Set(['.md']),
  tool: new Set(['.json', '.yaml', '.js', '.mjs', '.sh', '.py']),
  hook: new Set(['.md', '.yaml', '.js', '.mjs', '.sh', '.py']),
  'mcp-server': new Set(['.json']),
  'lsp-server': new Set(['.json']),
};
for (const semanticCase of semanticValidationCases.cases) {
  for (const warning of semanticCase.expected.warnings ?? []) {
    assertWarning(warning, `semantic validation case ${semanticCase.name} warning`);
  }
  const component = semanticCase.payload.component;
  if (component) {
    const extension = path.posix.extname(component.entrypoint);
    const supportedExtensions = supportedEntrypointExtensionsByType[component.type];
    if (semanticCase.expected.valid === true && supportedExtensions) {
      assert(
        supportedExtensions.has(extension),
        `semantic validation case ${semanticCase.name} valid ${component.type} must use supported entrypoint extension`
      );
    }
    if (component.type === 'hook' && semanticCase.expected.valid === true) {
      assert(
        canonicalHookEvents.has(semanticCase.payload.hook?.event),
        `semantic validation case ${semanticCase.name} valid hook must use canonical event vocabulary`
      );
      assert(
        ['command', 'script', 'module'].includes(semanticCase.payload.hook?.type),
        `semantic validation case ${semanticCase.name} valid hook must use baseline hook type`
      );
    }
    if (component.type === 'tool' && semanticCase.expected.failureCategory === 'unsupported-entrypoint-format') {
      assert(
        !supportedEntrypointExtensionsByType.tool.has(extension),
        `semantic validation case ${semanticCase.name} unsupported tool format must not reject JSON/YAML/script baseline formats`
      );
    }
  }
  if (semanticCase.expected.failureCategory === 'invalid-spdx-expression') {
    assert(
      !isRecognizedSpdxExpressionShape(semanticCase.payload.license),
      `semantic validation case ${semanticCase.name} must exercise invalid SPDX expression shape`
    );
  }
}
for (const requiredComponentFailure of [
  'missing-entrypoint',
  'missing-command-trigger',
  'invalid-command-trigger',
  'missing-skill-description',
  'unsupported-hook-event',
  'unsupported-entrypoint-format',
  'invalid-lsp-descriptor',
  'invalid-spdx-expression',
]) {
  assert(
    semanticValidationCases.cases.some(
      (semanticCase) =>
        semanticCase.area === 'manifest' && semanticCase.expected.failureCategory === requiredComponentFailure
    ),
    `semantic validation cases must include component entrypoint failure ${requiredComponentFailure}`
  );
}
for (const componentType of ['agent', 'skill', 'command', 'tool', 'hook', 'mcp-server', 'lsp-server']) {
  assert(
    semanticValidationCases.cases.some(
      (semanticCase) =>
        semanticCase.area === 'manifest' &&
        semanticCase.expected.valid === true &&
        semanticCase.payload.component?.type === componentType
    ) ||
      semanticValidationCases.cases.some(
        (semanticCase) =>
          semanticCase.area === 'warning' &&
          semanticCase.expected.valid === true &&
          semanticCase.payload.component?.type === componentType
      ),
    `semantic validation cases must include positive ${componentType} component case`
  );
}
assert(
  semanticValidationCases.cases.some(
    (semanticCase) =>
      semanticCase.area === 'warning' &&
      semanticCase.expected.warnings?.some((warning) => warning.category === 'noncanonical-entrypoint')
  ),
  'semantic validation cases must include noncanonical-entrypoint warning'
);
assert(
  semanticValidationCases.cases.some(
    (semanticCase) =>
      semanticCase.area === 'warning' &&
      semanticCase.expected.warnings?.some((warning) => warning.category === 'deprecated')
  ),
  'semantic validation cases must include deprecated warning category'
);
assert(
  semanticValidationCases.cases.some(
    (semanticCase) => semanticCase.area === 'load' && semanticCase.expected.failureCategory === 'load-policy-blocked'
  ),
  'semantic validation cases must include load-time policy blocking boundary'
);
assert(
  semanticValidationCases.cases.some(
    (semanticCase) => semanticCase.expected.failureCategory === 'non-regular-archive-entry'
  ),
  'semantic validation cases must include release file-selection non-regular entry failure'
);
assert(
  semanticValidationCases.cases.some((semanticCase) => semanticCase.expected.failureCategory === 'digest-mismatch'),
  'semantic validation cases must include trust attachment byte identity mismatch'
);

const mappingMatrix = readJson('conformance/fixtures/mapping-matrix.json');
validate('mappingMatrix', mappingMatrix, 'mapping matrix fixture');
assertSpecVersion(mappingMatrix, 'mapping matrix fixture');
for (const field of [
  'volume.name',
  'volume.version',
  'volume.description',
  'volume.documentation',
  'volume.license',
  'volume.homepage',
  'volume.repository',
  'publisher.id',
  'components[].type',
  'components[].name',
  'components[].entrypoint',
  'dependencies',
  'release.logicalIdentity',
  'release.immutableContentIdentity',
  'provenance.source-repo',
  'provenance.build.system',
  'provenance.build.workflow',
  'provenance.build.signed',
  'volume.role',
  'volume.secondary-roles',
  'volume.keywords',
  'volume.providers / components[].providers',
  'runtimes[]',
  'protocols[]',
  'environment',
  'permissions / components[].permissions',
  'component-dependencies',
]) {
  assert(
    mappingMatrix.entries.some((entry) => entry.agentVolumesField === field),
    `mapping matrix missing ${field}`
  );
}
for (const entry of mappingMatrix.entries) {
  assert(
    entry.cyclonedx || entry.spdx || entry.slsa,
    `mapping matrix entry ${entry.agentVolumesField} must map to at least one target`
  );
}
const mappingFields = mappingMatrix.entries.map((entry) => entry.agentVolumesField);
assert(new Set(mappingFields).size === mappingFields.length, 'mapping matrix agentVolumesField entries must be unique');
assert(
  mappingFields.join('\n') === [...mappingFields].sort().join('\n'),
  'mapping matrix entries must be ordered by agentVolumesField for stable serialization'
);
for (const entry of mappingMatrix.entries) {
  for (const family of ['cyclonedx', 'spdx', 'slsa']) {
    const mapping = entry[family];
    if (!mapping) continue;
    if (mapping.kind === 'extension') {
      assert(
        mapping.extensionNamespace?.startsWith('agent-volumes'),
        `mapping matrix ${entry.agentVolumesField}.${family} extension mapping needs Agent Volumes namespace`
      );
      assert(
        typeof mapping.serialization === 'string' && mapping.serialization.length > 0,
        `mapping matrix ${entry.agentVolumesField}.${family} extension mapping needs serialization guidance`
      );
    }
    if (mapping.kind === 'lossy') {
      assert(
        typeof mapping.lossiness === 'string' && mapping.lossiness.length > 0,
        `mapping matrix ${entry.agentVolumesField}.${family} lossy mapping needs lossiness explanation`
      );
    }
  }
}

const mappingSample = readJson('conformance/fixtures/mapping-sample.json');
validate('mappingSample', mappingSample, 'mapping sample fixture');
assertSpecVersion(mappingSample, 'mapping sample fixture');
validate('volume', mappingSample.sourceManifest, 'mapping sample source manifest');

const sampleManifest = mappingSample.sourceManifest;
const sampleVolume = sampleManifest.volume;
const sampleRelease = mappingSample.releaseSubject;
const sampleDigest = sampleRelease.integrity.slice(7);
const sampleCycloneDx = mappingSample.exports.cyclonedx;
const sampleSpdx = mappingSample.exports.spdx;
const sampleSlsa = mappingSample.exports.slsa;
const sampleComponentPurls = new Map(
  sampleManifest.components.map((component) => [
    component.name,
    canonicalComponentPurl(sampleVolume.name, sampleVolume.version, component),
  ])
);

assert(
  sampleRelease.purl === canonicalReleasePurl(sampleVolume.name, sampleVolume.version),
  'mapping sample release purl must be canonical'
);
assert(sampleCycloneDx.bomFormat === 'CycloneDX', 'mapping sample CycloneDX export must declare bomFormat');
assert(sampleCycloneDx.specVersion === '1.7', 'mapping sample CycloneDX export must declare specVersion 1.7');
assertCycloneDxArtifact(sampleCycloneDx, {
  name: 'mapping-sample-cyclonedx-export',
  format: { version: '1.7' },
  subject: sampleRelease,
});

const cyclonedxRoot = sampleCycloneDx.metadata.component;
assert(cyclonedxRoot.name === sampleVolume.name, 'mapping sample CycloneDX root component name must map volume.name');
assert(
  cyclonedxRoot.version === sampleVolume.version,
  'mapping sample CycloneDX root component version must map volume.version'
);
assert(
  cyclonedxRoot.description === sampleVolume.description,
  'mapping sample CycloneDX description must map volume.description'
);
assert(
  cyclonedxRoot.publisher === sampleManifest.publisher.id,
  'mapping sample CycloneDX publisher must map publisher.id'
);
assert(
  cyclonedxRoot.licenses?.some((licenseChoice) => licenseChoice.license?.id === sampleVolume.license),
  'mapping sample CycloneDX license id must map volume.license'
);
findExternalReference(
  cyclonedxRoot.externalReferences,
  'website',
  sampleVolume.homepage,
  'mapping sample CycloneDX root'
);
findExternalReference(
  cyclonedxRoot.externalReferences,
  'vcs',
  sampleVolume.repository,
  'mapping sample CycloneDX root'
);
findExternalReference(
  cyclonedxRoot.externalReferences,
  'documentation',
  sampleVolume.documentation,
  'mapping sample CycloneDX root'
);
assertDeepEqual(
  parseStablePropertyJson(
    cyclonedxRoot.properties,
    'agent-volumes:component-dependencies',
    'mapping sample CycloneDX root'
  ),
  sampleManifest['component-dependencies'],
  'mapping sample CycloneDX component-dependencies property'
);
assertDeepEqual(
  parseStablePropertyJson(cyclonedxRoot.properties, 'agent-volumes:environment', 'mapping sample CycloneDX root'),
  sampleManifest.environment,
  'mapping sample CycloneDX environment property'
);
assertDeepEqual(
  parseStablePropertyJson(cyclonedxRoot.properties, 'agent-volumes:keywords', 'mapping sample CycloneDX root'),
  sampleVolume.keywords,
  'mapping sample CycloneDX keywords property'
);
assertDeepEqual(
  parseStablePropertyJson(cyclonedxRoot.properties, 'agent-volumes:permissions', 'mapping sample CycloneDX root'),
  sampleManifest.permissions,
  'mapping sample CycloneDX permissions property'
);
assertDeepEqual(
  parseStablePropertyJson(cyclonedxRoot.properties, 'agent-volumes:protocols', 'mapping sample CycloneDX root'),
  sampleManifest.protocols,
  'mapping sample CycloneDX protocols property'
);
assertDeepEqual(
  parseStablePropertyJson(cyclonedxRoot.properties, 'agent-volumes:providers', 'mapping sample CycloneDX root'),
  sampleVolume.providers,
  'mapping sample CycloneDX providers property'
);
assert(
  findProperty(cyclonedxRoot.properties, 'agent-volumes:role', 'mapping sample CycloneDX root').value ===
    sampleVolume.role,
  'mapping sample CycloneDX role property must map volume.role'
);
assertDeepEqual(
  parseStablePropertyJson(cyclonedxRoot.properties, 'agent-volumes:runtimes', 'mapping sample CycloneDX root'),
  sampleManifest.runtimes,
  'mapping sample CycloneDX runtimes property'
);
assertDeepEqual(
  parseStablePropertyJson(cyclonedxRoot.properties, 'agent-volumes:secondary-roles', 'mapping sample CycloneDX root'),
  sampleVolume['secondary-roles'],
  'mapping sample CycloneDX secondary-roles property'
);
assert(
  findProperty(sampleCycloneDx.metadata.properties, 'agent-volumes:build-system', 'mapping sample CycloneDX metadata')
    .value === sampleManifest.provenance.build.system,
  'mapping sample CycloneDX build-system property must map provenance.build.system'
);
assert(
  findProperty(sampleCycloneDx.metadata.properties, 'agent-volumes:build-workflow', 'mapping sample CycloneDX metadata')
    .value === sampleManifest.provenance.build.workflow,
  'mapping sample CycloneDX build-workflow property must map provenance.build.workflow'
);

for (const component of sampleManifest.components) {
  const componentPurl = sampleComponentPurls.get(component.name);
  const cyclonedxComponent = sampleCycloneDx.components.find((candidate) => candidate.purl === componentPurl);
  assert(cyclonedxComponent, `mapping sample CycloneDX export needs component ${component.name}`);
  assert(
    cyclonedxComponent.name === component.name,
    `mapping sample CycloneDX component ${component.name} must map name`
  );
  assert(
    findProperty(
      cyclonedxComponent.properties,
      'agent-volumes:type',
      `mapping sample CycloneDX component ${component.name}`
    ).value === component.type,
    `mapping sample CycloneDX component ${component.name} must map type`
  );
  assert(
    findProperty(
      cyclonedxComponent.properties,
      'agent-volumes:entrypoint',
      `mapping sample CycloneDX component ${component.name}`
    ).value === component.entrypoint,
    `mapping sample CycloneDX component ${component.name} must map entrypoint`
  );
  assertDeepEqual(
    parseStablePropertyJson(
      cyclonedxComponent.properties,
      'agent-volumes:permissions',
      `mapping sample CycloneDX component ${component.name}`
    ),
    component.permissions,
    `mapping sample CycloneDX component ${component.name} permissions property`
  );
  assertDeepEqual(
    parseStablePropertyJson(
      cyclonedxComponent.properties,
      'agent-volumes:providers',
      `mapping sample CycloneDX component ${component.name}`
    ),
    component.providers,
    `mapping sample CycloneDX component ${component.name} providers property`
  );
}
assert(
  sampleCycloneDx.dependencies.some(
    (dependency) =>
      dependency.ref === sampleRelease.purl && dependency.dependsOn.includes('pkg:volume/github-provider@2.1.0')
  ),
  'mapping sample CycloneDX dependencies graph must map volume dependencies'
);
assert(
  sampleCycloneDx.dependencies.some(
    (dependency) =>
      dependency.ref === sampleComponentPurls.get('summarize-paper') &&
      dependency.dependsOn.includes('pkg:volume/github-provider@2.1.0#tool/read-pr')
  ),
  'mapping sample CycloneDX dependencies graph must map component dependencies'
);

assert(sampleSpdx.spdxVersion === 'SPDX-2.3', 'mapping sample SPDX export must declare SPDX-2.3');
const spdxPackage = sampleSpdx.packages.find((spdxPackageCandidate) => spdxPackageCandidate.name === sampleVolume.name);
assert(spdxPackage, 'mapping sample SPDX export needs root package');
assert(spdxPackage.versionInfo === sampleVolume.version, 'mapping sample SPDX versionInfo must map volume.version');
assert(spdxPackage.summary === sampleVolume.description, 'mapping sample SPDX summary must map volume.description');
assert(
  spdxPackage.packageHomePage === sampleVolume.homepage,
  'mapping sample SPDX packageHomePage must map volume.homepage'
);
assert(
  spdxPackage.licenseConcluded === sampleVolume.license,
  'mapping sample SPDX licenseConcluded must map volume.license'
);
assert(
  spdxPackage.checksums?.some((checksum) => checksum.algorithm === 'SHA256' && checksum.checksumValue === sampleDigest),
  'mapping sample SPDX checksum must bind immutable release identity'
);
findSpdxExternalRef(
  spdxPackage.externalRefs,
  'PACKAGE-MANAGER',
  'purl',
  sampleRelease.purl,
  'mapping sample SPDX root package'
);
findSpdxExternalRef(
  spdxPackage.externalRefs,
  'OTHER',
  'agent-volumes:documentation',
  sampleVolume.documentation,
  'mapping sample SPDX root package'
);
findSpdxExternalRef(
  spdxPackage.externalRefs,
  'OTHER',
  'agent-volumes:vcs',
  sampleVolume.repository,
  'mapping sample SPDX root package'
);
assertDeepEqual(
  JSON.parse(spdxPackage.comment),
  {
    'agent-volumes:keywords': sampleVolume.keywords,
    'agent-volumes:providers': sampleVolume.providers,
    'agent-volumes:role': sampleVolume.role,
  },
  'mapping sample SPDX lossy comment payload'
);
assert(
  sampleSpdx.relationships.some(
    (relationship) =>
      relationship.spdxElementId === 'SPDXRef-Package-research-agent-pack' &&
      relationship.relationshipType === 'DEPENDS_ON' &&
      relationship.relatedSpdxElement === 'SPDXRef-Package-github-provider'
  ),
  'mapping sample SPDX relationships must map volume dependencies'
);

assert(
  sampleSlsa._type === 'https://in-toto.io/Statement/v1',
  'mapping sample SLSA export must be in-toto Statement v1'
);
assert(
  sampleSlsa.predicateType === 'https://slsa.dev/provenance/v1',
  'mapping sample SLSA export must use SLSA v1 predicate'
);
assert(
  sampleSlsa.subject.some((subject) => subject.name === sampleRelease.purl && subject.digest?.sha256 === sampleDigest),
  'mapping sample SLSA subject must bind release subject'
);
assert(sampleSlsa.predicate.buildDefinition.buildType, 'mapping sample SLSA export must declare buildType');
assert(
  sampleSlsa.predicate.runDetails.builder.id === sampleManifest.provenance.build.system,
  'mapping sample SLSA builder id must map provenance.build.system'
);
assert(
  sampleSlsa.predicate.buildDefinition.externalParameters.workflow === sampleManifest.provenance.build.workflow,
  'mapping sample SLSA workflow parameter must map provenance.build.workflow'
);
assert(
  sampleSlsa.predicate.buildDefinition.externalParameters.sourceRepo === sampleManifest.provenance['source-repo'],
  'mapping sample SLSA sourceRepo parameter must map provenance.source-repo'
);
assert(
  sampleSlsa.predicate.materials.some((material) => material.uri === sampleManifest.provenance['source-repo']),
  'mapping sample SLSA materials must include provenance.source-repo'
);

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
