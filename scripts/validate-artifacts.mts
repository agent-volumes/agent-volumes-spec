import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import type { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import YAML from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

type JsonValue = any;
type JsonObject = Record<string, JsonValue>;

const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));

const normalizeRelativePath = (relativePath: string): string => relativePath.split(path.sep).join('/');

const readJsonPaths = new Set<string>();

const readJsonFile = (relativePath: string): JsonValue =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));

const readJson = (relativePath: string): JsonValue => {
  readJsonPaths.add(normalizeRelativePath(relativePath));
  return readJsonFile(relativePath);
};

const readText = (relativePath: string): string => fs.readFileSync(path.join(root, relativePath), 'utf8');

const pathExists = (relativePath: string): boolean => fs.existsSync(path.join(root, relativePath));

const isDirectory = (relativePath: string): boolean => fs.statSync(path.join(root, relativePath)).isDirectory();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const ajv = new Ajv2020({ allErrors: true, strict: true, validateSchema: true });
addFormats(ajv);

const schemas = {
  advisory: readJson('schemas/advisory.schema.json'),
  advisoryList: readJson('schemas/advisory-list.schema.json'),
  advisoryValidationCase: readJson('schemas/advisory-validation-case.schema.json'),
  bridgeMetadata: readJson('schemas/bridge-metadata.schema.json'),
  capabilityMetadata: readJson('schemas/capability-metadata.schema.json'),
  componentDependencyValidationCase: readJson('schemas/component-dependency-validation-case.schema.json'),
  conformanceCoverage: readJson('schemas/conformance-coverage.schema.json'),
  conformanceReport: readJson('schemas/conformance-report.schema.json'),
  exactReleaseMetadataCase: readJson('schemas/exact-release-metadata-case.schema.json'),
  externalDependencyDeclarationsPredicate: readJson('schemas/external-dependency-declarations-predicate.schema.json'),
  externalDependencyPotentialExposureWarningContext: readJson(
    'schemas/external-dependency-potential-exposure-warning-context.schema.json'
  ),
  externalDependencyValidationCase: readJson('schemas/external-dependency-validation-case.schema.json'),
  manifestParseCase: readJson('schemas/manifest-parse-case.schema.json'),
  mappingMatrix: readJson('schemas/mapping-matrix.schema.json'),
  mappingSample: readJson('schemas/mapping-sample.schema.json'),
  problemDetails: readJson('schemas/problem-details.schema.json'),
  problemRegistry: readJson('schemas/problem-registry.schema.json'),
  purlVersCompatibilityExceptions: readJson('schemas/purl-vers-compatibility-exceptions.schema.json'),
  releaseMetadata: readJson('schemas/release-metadata.schema.json'),
  releaseUploadFinalize: readJson('schemas/release-upload-finalize.schema.json'),
  releaseUploadIntent: readJson('schemas/release-upload-intent.schema.json'),
  searchResults: readJson('schemas/search-results.schema.json'),
  semanticValidationCase: readJson('schemas/semantic-validation-case.schema.json'),
  trustArtifactVerificationCase: readJson('schemas/trust-artifact-verification-case.schema.json'),
  trustDetail: readJson('schemas/trust-detail.schema.json'),
  trustSummary: readJson('schemas/trust-summary.schema.json'),
  trustUploadFinalize: readJson('schemas/trust-upload-finalize.schema.json'),
  trustUploadIntent: readJson('schemas/trust-upload-intent.schema.json'),
  upstreamBaseline: readJson('schemas/upstream-baseline.schema.json'),
  versionIndex: readJson('schemas/version-index.schema.json'),
  versionIndexRow: readJson('schemas/version-index-row.schema.json'),
  volume: readJson('schemas/volume.schema.json'),
  warning: readJson('schemas/warning.schema.json'),
};

const reservedExtensionNamespaces = readJson('schemas/reserved-extension-namespaces.json');

for (const schema of Object.values(schemas)) {
  ajv.addSchema(schema);
}

const validators: Record<string, ValidateFunction> = Object.fromEntries(
  Object.entries(schemas).map(([name, schema]) => [name, ajv.getSchema(schema.$id) ?? ajv.compile(schema)])
);

const validate = (name: string, value: JsonValue, label: string) => {
  const validator = validators[name];
  assert(validator, `Missing ${name} schema validator`);
  const ok = validator(value);
  assert(ok, `${label} failed ${name} schema validation: ${ajv.errorsText(validator.errors)}`);
};

const validateExpectedFailure = (name: string, value: JsonValue, label: string) => {
  const validator = validators[name];
  assert(validator, `Missing ${name} schema validator`);
  const ok = validator(value);
  assert(!ok, `${label} unexpectedly passed ${name} schema validation`);
};

const assertSpecVersion = (fixture: JsonValue, label: JsonValue) => {
  assert(fixture.specVersion === '0.1.0-rc.1', `${label} must declare specVersion 0.1.0-rc.1`);
};

const volumeNamePattern =
  /^(@(?!.*--)[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\/)?(?!.*--)[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/;
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const digestPattern = /^sha256:[a-f0-9]{64}$/;
const externalDependencyDeclarationKeyPattern = /^av-extdep-v1:sha256:[a-f0-9]{64}$/;
const gitCommitPattern = /^[a-f0-9]{40}$/;
const componentNamePattern = /^(?!.*--)[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/;
const shallowPurlPattern = /^pkg:([A-Za-z][A-Za-z0-9.+-]*)\/(.+)$/;
const shallowVersPattern = /^vers:([A-Za-z][A-Za-z0-9.-]*)\/(\S+)$/;
const coreExternalDependencyPurposes = new Set([
  'runtime',
  'build',
  'development',
  'test',
  'optional',
  'peer',
  'source',
  'documentation',
  'other',
]);
const externalDependencyPurposeExtensionPattern = /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+:[a-z][a-z0-9-]*$/;
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

const assertReleaseMetadata = (metadata: JsonValue, label: JsonValue) => {
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
  for (const externalDependency of metadata.externalDependencies ?? []) {
    assert(
      externalDependencyDeclarationKeyPattern.test(externalDependency.declarationKey),
      `${label} external dependency needs stable declaration key`
    );
    assert(
      !Object.hasOwn(externalDependency, 'resolvedVersion') && !Object.hasOwn(externalDependency, 'digest'),
      `${label} external dependency must remain declaration-only`
    );
  }
};

const assertProblemDetails = (payload: JsonValue, label: JsonValue) => {
  validate('problemDetails', payload, label);
  assert(problemTypePattern.test(payload.type), `${label} must use Agent Volumes problem type URI`);
  const slug = payload.type.replace('https://agentvolumes.org/problems/', '');
  assert(problemStatusBySlug.has(slug), `${label} uses unknown problem type: ${slug}`);
  assert(typeof payload.title === 'string', `${label} needs problem title`);
  assert(typeof payload.status === 'number', `${label} needs numeric problem status`);
  assert(payload.status === problemStatusBySlug.get(slug), `${label} status must match problem type ${slug}`);
};

const assertEndpointProblemFixtures = (
  relativePath: JsonValue,
  label: JsonValue,
  expectedFailuresByEndpoint: JsonValue
) => {
  const fixtureSet = readJson(relativePath);
  assertSpecVersion(fixtureSet, label);
  assert(Array.isArray(fixtureSet.fixtures), `${label} must contain fixtures`);
  const actualFailuresByEndpoint = new Map();
  for (const fixture of fixtureSet.fixtures) {
    assert(fixture.schema === 'problem-details', `${label} ${fixture.name} must use problem-details schema`);
    assert(fixture.endpoint, `${label} ${fixture.name} must declare endpoint`);
    assert(
      expectedFailuresByEndpoint.has(fixture.endpoint),
      `${label} ${fixture.name} uses unexpected endpoint ${fixture.endpoint}`
    );
    assert(
      expectedFailuresByEndpoint.get(fixture.endpoint).includes(fixture.expected.failureCategory),
      `${label} ${fixture.name} uses unexpected failureCategory ${fixture.expected.failureCategory} for ${fixture.endpoint}`
    );
    assertProblemDetails(fixture.payload, `${label} ${fixture.name}`);
    assert(
      fixture.payload.type.endsWith(`/${fixture.expected.failureCategory}`),
      `${label} ${fixture.name} failureCategory must match problem type slug`
    );
    if (!actualFailuresByEndpoint.has(fixture.endpoint)) {
      actualFailuresByEndpoint.set(fixture.endpoint, new Set());
    }
    actualFailuresByEndpoint.get(fixture.endpoint).add(fixture.expected.failureCategory);
  }
  for (const [endpoint, expectedFailures] of expectedFailuresByEndpoint) {
    const actualFailures = actualFailuresByEndpoint.get(endpoint) ?? new Set();
    for (const expectedFailure of expectedFailures) {
      assert(actualFailures.has(expectedFailure), `${label} missing ${expectedFailure} for ${endpoint}`);
    }
  }
};

const assertLifecycleMutationFixtures = (
  relativePath: JsonValue,
  label: JsonValue,
  expectedFailuresByEndpoint: JsonValue
) => {
  const fixtureSet = readJson(relativePath);
  assertSpecVersion(fixtureSet, label);
  assert(Array.isArray(fixtureSet.fixtures), `${label} must contain fixtures`);
  const actualFailuresByEndpoint = new Map();
  const actualSuccessesByEndpoint = new Map();

  for (const fixture of fixtureSet.fixtures) {
    assert(fixture.endpoint, `${label} ${fixture.name} must declare endpoint`);
    assert(
      expectedFailuresByEndpoint.has(fixture.endpoint),
      `${label} ${fixture.name} uses unexpected endpoint ${fixture.endpoint}`
    );

    if (fixture.schema === 'problem-details') {
      assert(
        expectedFailuresByEndpoint.get(fixture.endpoint).includes(fixture.expected.failureCategory),
        `${label} ${fixture.name} uses unexpected failureCategory ${fixture.expected.failureCategory} for ${fixture.endpoint}`
      );
      assertProblemDetails(fixture.payload, `${label} ${fixture.name}`);
      assert(
        fixture.payload.type.endsWith(`/${fixture.expected.failureCategory}`),
        `${label} ${fixture.name} failureCategory must match problem type slug`
      );
      if (!actualFailuresByEndpoint.has(fixture.endpoint)) {
        actualFailuresByEndpoint.set(fixture.endpoint, new Set());
      }
      actualFailuresByEndpoint.get(fixture.endpoint).add(fixture.expected.failureCategory);
      continue;
    }

    assert(fixture.expected.valid === true, `${label} ${fixture.name} success case must be expected valid`);
    assert(fixture.expected.status === 202, `${label} ${fixture.name} success case must expect HTTP 202`);
    if (!actualSuccessesByEndpoint.has(fixture.endpoint)) {
      actualSuccessesByEndpoint.set(fixture.endpoint, new Set());
    }

    if (fixture.schema === 'empty-response') {
      assert(fixture.payload === null, `${label} ${fixture.name} empty response payload must be null`);
      assert(
        ['accepted', 'tombstoned'].includes(fixture.expected.lifecycleState),
        `${label} ${fixture.name} empty response must model accepted or tombstoned lifecycle state`
      );
      actualSuccessesByEndpoint.get(fixture.endpoint).add(fixture.expected.lifecycleState);
      continue;
    }

    assert(false, `${label} ${fixture.name} uses unsupported schema ${fixture.schema}`);
  }

  for (const [endpoint, expectedFailures] of expectedFailuresByEndpoint) {
    const actualFailures = actualFailuresByEndpoint.get(endpoint) ?? new Set();
    for (const expectedFailure of expectedFailures) {
      assert(actualFailures.has(expectedFailure), `${label} missing ${expectedFailure} for ${endpoint}`);
    }

    const actualSuccesses = actualSuccessesByEndpoint.get(endpoint) ?? new Set();
    for (const expectedSuccess of ['accepted', 'tombstoned']) {
      assert(actualSuccesses.has(expectedSuccess), `${label} missing ${expectedSuccess} success for ${endpoint}`);
    }
  }
};

const assertWarning = (warning: JsonValue, label: JsonValue) => {
  validate('warning', warning, label);
  if (warning.category === 'external-dependency-potential-exposure') {
    assert(warning.context && typeof warning.context === 'object', `${label} needs potential-exposure context`);
    validate(
      'externalDependencyPotentialExposureWarningContext',
      warning.context,
      `${label} potential-exposure context`
    );
  }
};

const isRecognizedSpdxExpressionShape = (expression: JsonValue) => {
  const tokenPattern = /\(|\)|\+|\bAND\b|\bOR\b|\bWITH\b|LicenseRef-[A-Za-z0-9.-]+|[A-Za-z0-9][A-Za-z0-9.-]*/g;
  const tokens = expression.match(tokenPattern) ?? [];
  if (tokens.join('') !== expression.replace(/\s+/g, '')) {
    return false;
  }
  let expectOperand = true;
  let depth = 0;
  for (const token of tokens) {
    if (token === '(') {
      if (!expectOperand) {
        return false;
      }
      depth += 1;
      continue;
    }
    if (token === ')') {
      if (expectOperand || depth === 0) {
        return false;
      }
      depth -= 1;
      continue;
    }
    if (token === 'AND' || token === 'OR') {
      if (expectOperand) {
        return false;
      }
      expectOperand = true;
      continue;
    }
    if (token === 'WITH') {
      if (expectOperand) {
        return false;
      }
      expectOperand = true;
      continue;
    }
    if (token === '+') {
      if (expectOperand) {
        return false;
      }
      continue;
    }
    if (!expectOperand) {
      return false;
    }
    expectOperand = false;
  }
  return tokens.length > 0 && depth === 0 && !expectOperand;
};

const canonicalReleasePurl = (volume: JsonValue, version: JsonValue) => {
  assert(volumeNamePattern.test(volume), `cannot canonicalize invalid volume name: ${volume}`);
  if (volume.startsWith('@')) {
    const [scope, name] = volume.slice(1).split('/');
    return `pkg:volume/%40${scope}/${name}@${version}`;
  }
  return `pkg:volume/${volume}@${version}`;
};

const canonicalComponentPurl = (volume: JsonValue, version: JsonValue, component: JsonValue) => {
  assert(componentNamePattern.test(component.name), `cannot canonicalize invalid component name: ${component.name}`);
  return `${canonicalReleasePurl(volume, version)}#${component.type}/${component.name}`;
};

const parseExternalDependencyPurl = (purl: JsonValue) => {
  const match = purl.match(shallowPurlPattern);
  if (!match) {
    return undefined;
  }
  const [, type, remainder] = match;
  return {
    hasSubpath: purl.includes('#'),
    hasVersion: /(?:^|[^?])@[^/?#]+/.test(remainder.split('?')[0]),
    type: type.toLowerCase(),
  };
};

const parseVersScheme = (constraint: JsonValue) => constraint.match(shallowVersPattern)?.[1].toLowerCase();

const normalizeVersConstraintForComparison = (constraint: JsonValue) => {
  const match = constraint.match(shallowVersPattern);
  if (!match) {
    return constraint;
  }
  const [, rawScheme, expression] = match;
  return `vers:${rawScheme.toLowerCase()}/${expression
    .split('|')
    .map((term: JsonValue) => term.trim())
    .toSorted()
    .join('|')}`;
};

const isExternalDependencyPurpose = (purpose: JsonValue) =>
  coreExternalDependencyPurposes.has(purpose) || externalDependencyPurposeExtensionPattern.test(purpose);

const compareStrings = (left: string, right: string): number => left.localeCompare(right);

const externalDependencyScope = (dependency: JsonValue) => [...(dependency.components ?? [])].toSorted(compareStrings);

const externalDependencySemanticKey = (dependency: JsonValue) =>
  stableJsonStringify({
    purl: dependency.purl,
    purpose: dependency.purpose,
    scope: externalDependencyScope(dependency),
  });

const declarationKeyInput = (semanticKey: JsonValue) => ({
  purl: semanticKey.purl,
  purpose: semanticKey.purpose,
  scope: semanticKey.scope.length === 0 ? { kind: 'volume' } : { components: semanticKey.scope },
});

const declarationKeyForSemanticKey = (semanticKey: JsonValue) => {
  const input = stableJsonStringify(declarationKeyInput(semanticKey));
  return `av-extdep-v1:sha256:${crypto.createHash('sha256').update(input, 'utf8').digest('hex')}`;
};

const stableJsonStringify = (value: JsonValue): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item: JsonValue) => stableJsonStringify(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .toSorted()
      .map((key: JsonValue) => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

const assertDeepEqual = (actual: JsonValue, expected: JsonValue, label: JsonValue) => {
  assert(stableJsonStringify(actual) === stableJsonStringify(expected), `${label} must round-trip`);
};

const assertUniqueStrings = (values: JsonValue, label: JsonValue) => {
  assert(new Set(values).size === values.length, `${label} must be unique`);
};

const caseNamesFromFixture = (fixture: JsonValue) => {
  const names = [];
  for (const collectionName of ['cases', 'fixtures']) {
    const collection = fixture[collectionName];
    if (!Array.isArray(collection)) {
      continue;
    }
    for (const item of collection) {
      if (typeof item.name === 'string') {
        names.push(item.name);
      }
    }
  }
  return names;
};

const resolveCoverageReference = (fixtureName: JsonValue) => {
  const candidates = [`conformance/fixtures/${fixtureName}`, `conformance/${fixtureName}`, `openapi/${fixtureName}`];
  if (fixtureName.startsWith('schemas/')) {
    candidates.push(fixtureName);
  }
  return candidates.find((candidate: JsonValue) => pathExists(candidate));
};

const assertConformanceCoverageReferences = (conformanceCoverage: JsonValue) => {
  const requirementIds = conformanceCoverage.requirements.map((requirement: JsonValue) => requirement.id);
  assertUniqueStrings(requirementIds, 'conformance coverage requirement IDs');
  const seenCoverageTuples = new Set();

  for (const requirement of conformanceCoverage.requirements) {
    for (const coverage of requirement.coverage) {
      const tuple = `${requirement.id}:${coverage.fixture}:${coverage.case ?? ''}:${coverage.area}:${
        coverage.coverageType ?? ''
      }`;
      assert(!seenCoverageTuples.has(tuple), `conformance coverage duplicate tuple ${tuple}`);
      seenCoverageTuples.add(tuple);

      const resolvedPath = resolveCoverageReference(coverage.fixture);
      assert(resolvedPath, `conformance coverage ${requirement.id} references missing fixture ${coverage.fixture}`);
      if (isDirectory(resolvedPath)) {
        assert(
          !coverage.case,
          `conformance coverage ${requirement.id} cannot name a case for directory ${coverage.fixture}`
        );
        continue;
      }
      if (!coverage.case) {
        continue;
      }

      assert(
        resolvedPath.startsWith('conformance/fixtures/') && resolvedPath.endsWith('.json'),
        `conformance coverage ${requirement.id} case ${coverage.case} must reference a JSON fixture file`
      );
      const fixture = readJsonFile(resolvedPath);
      const caseNames = caseNamesFromFixture(fixture);
      assert(
        caseNames.length > 0,
        `conformance coverage ${requirement.id} references case ${coverage.case} in non-case fixture ${coverage.fixture}`
      );
      assertUniqueStrings(caseNames, `${coverage.fixture} case names`);
      assert(
        caseNames.includes(coverage.case),
        `conformance coverage ${requirement.id} references missing case ${coverage.case} in ${coverage.fixture}`
      );
    }
  }
};

const assertNoUnvalidatedConformanceFixtures = () => {
  const fixtureDirectory = path.join(root, 'conformance/fixtures');
  const fixturePaths = fs
    .readdirSync(fixtureDirectory)
    .filter((entry: JsonValue) => entry.endsWith('.json'))
    .map((entry: JsonValue) => `conformance/fixtures/${entry}`)
    .toSorted();
  for (const fixturePath of fixturePaths) {
    assert(readJsonPaths.has(fixturePath), `${fixturePath} is not connected to scripts/validate-artifacts.mts`);
  }
};

const assertReservedExtensionNamespaceDrift = () => {
  assert(
    reservedExtensionNamespaces.$id ===
      'https://agentvolumes.org/spec/0.1.0-rc.1/schemas/reserved-extension-namespaces.json',
    'reserved extension namespace artifact must use the rc.1 schema ID'
  );
  assertSpecVersion(reservedExtensionNamespaces, 'reserved extension namespace artifact');
  assert(
    Array.isArray(reservedExtensionNamespaces.reserved) && reservedExtensionNamespaces.reserved.length > 0,
    'reserved extension namespace artifact must list reserved namespaces'
  );
  assertUniqueStrings(reservedExtensionNamespaces.reserved, 'reserved extension namespaces');

  const extensionPropertyNames = schemas.capabilityMetadata.properties.extensions.propertyNames;
  const namespacePattern = extensionPropertyNames.allOf.find(
    (subschema: JsonValue) => typeof subschema.pattern === 'string'
  )?.pattern;
  assert(namespacePattern, 'capability metadata schema must define an extension namespace pattern');
  const validateNamespaceShape = new RegExp(namespacePattern);
  for (const namespace of reservedExtensionNamespaces.reserved) {
    assert(
      validateNamespaceShape.test(namespace),
      `reserved extension namespace ${namespace} must match schema pattern`
    );
  }

  const reservedEnum = extensionPropertyNames.allOf.find((subschema: JsonValue) => Array.isArray(subschema.not?.enum))
    ?.not.enum;
  assert(reservedEnum, 'capability metadata schema must deny reserved extension namespaces');
  assert(
    stableJsonStringify([...reservedEnum].toSorted(compareStrings)) ===
      stableJsonStringify([...reservedExtensionNamespaces.reserved].toSorted(compareStrings)),
    'capability metadata schema reserved namespace enum must match reserved-extension-namespaces.json'
  );

  const reservedFixture = readJsonFile('conformance/fixtures/capability-metadata-reserved-extension-rejection.json');
  const reservedFixtureNamespaces = Object.keys(reservedFixture.canonicalParsedData.extensions ?? {});
  assert(
    reservedFixtureNamespaces.some((namespace: JsonValue) => reservedExtensionNamespaces.reserved.includes(namespace)),
    'capability metadata reserved extension fixture must exercise a reserved namespace from reserved-extension-namespaces.json'
  );
  for (const namespace of reservedExtensionNamespaces.reserved) {
    const candidate = {
      ...reservedFixture.canonicalParsedData,
      extensions: { [namespace]: { enabled: true } },
    };
    validateExpectedFailure('capabilityMetadata', candidate, `capability metadata reserved namespace ${namespace}`);
  }
};

const assertSiteSchemaPublicationDrift = () => {
  const schemaDirectory = path.join(root, 'schemas');
  const siteSchemaDirectory = path.join(root, 'site/spec/0.1.0-rc.1/schemas');
  const schemaFiles = fs
    .readdirSync(schemaDirectory)
    .filter((entry: JsonValue) => entry.endsWith('.json'))
    .toSorted();

  for (const schemaFile of schemaFiles) {
    const canonicalPath = path.join(schemaDirectory, schemaFile);
    const sitePath = path.join(siteSchemaDirectory, schemaFile);

    assert(fs.existsSync(sitePath), `site schema publication missing ${schemaFile}`);
    assert(
      fs.readFileSync(sitePath, 'utf8') === fs.readFileSync(canonicalPath, 'utf8'),
      `site schema publication ${schemaFile} must match schemas/${schemaFile}`
    );
  }

  const siteSchemaFiles = fs
    .readdirSync(siteSchemaDirectory)
    .filter((entry: JsonValue) => entry.endsWith('.json'))
    .toSorted();

  assert(
    stableJsonStringify(siteSchemaFiles) === stableJsonStringify(schemaFiles),
    'site schema publication file set must match schemas/*.json'
  );
};

const assertSpdxExternalDependencyContextDrift = () => {
  const namespace = 'https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#';
  const canonicalContextPath = 'site/contexts/spdx-external-dependency-declarations-v0.1.jsonld';
  const archivedContextPath = 'site/spec/0.1.0-rc.1/contexts/spdx-external-dependency-declarations-v0.1.jsonld';
  const contextArtifact = readJsonFile(canonicalContextPath);

  assert(
    fs.readFileSync(path.join(root, canonicalContextPath), 'utf8') ===
      fs.readFileSync(path.join(root, archivedContextPath), 'utf8'),
    'SPDX external dependency canonical JSON-LD context must match release archive copy'
  );
  const context = contextArtifact['@context'];

  assert(context && typeof context === 'object', 'SPDX external dependency JSON-LD context must define @context');
  assert(context['@version'] === 1.1, 'SPDX external dependency JSON-LD context must use JSON-LD 1.1');
  assert(context['@protected'] === true, 'SPDX external dependency JSON-LD context terms must be protected');
  assert(context.av === namespace, 'SPDX external dependency JSON-LD context av prefix must match profile namespace');
  assert(
    context.xsd === 'http://www.w3.org/2001/XMLSchema#',
    'SPDX external dependency JSON-LD context must define xsd'
  );

  const mappingSampleFixture = readJsonFile('conformance/fixtures/mapping-sample.json');
  const spdxExternalDependencyExport = mappingSampleFixture.exports?.spdxExternalDependencies;
  assert(
    spdxExternalDependencyExport?.profile === namespace,
    'mapping sample SPDX external dependency profile must match JSON-LD context namespace'
  );
  assert(
    Array.isArray(spdxExternalDependencyExport.elements) && spdxExternalDependencyExport.elements.length > 0,
    'mapping sample SPDX external dependency export must include elements'
  );

  const termsUsedByFixture = new Set<string>();
  for (const element of spdxExternalDependencyExport.elements) {
    assert(element['@context']?.av === namespace, 'mapping sample SPDX element av prefix must match JSON-LD context');

    const typeValue = element['@type'];
    if (typeof typeValue === 'string' && typeValue.startsWith('av:')) {
      termsUsedByFixture.add(typeValue.slice(3));
    }

    for (const key of Object.keys(element)) {
      if (key.startsWith('av:')) {
        termsUsedByFixture.add(key.slice(3));
      }
    }
  }

  const expectedTerms = [
    'ExternalDependencyDeclaration',
    'constraint',
    'declarationKey',
    'declarationOnly',
    'purl',
    'purpose',
    'resolvedEvidence',
    'scope',
  ];
  assertDeepEqual(
    [...termsUsedByFixture].toSorted(compareStrings),
    expectedTerms.toSorted(compareStrings),
    'SPDX external dependency JSON-LD context fixture terms'
  );

  for (const term of ['ExternalDependencyDeclaration', 'constraint', 'declarationKey', 'purl', 'purpose']) {
    assert(
      context[term] === `av:${term}`,
      `SPDX external dependency JSON-LD context ${term} term must match namespace`
    );
  }
  assertDeepEqual(
    context.scope,
    { '@container': '@set', '@id': 'av:scope' },
    'SPDX external dependency JSON-LD context scope term'
  );
  assertDeepEqual(
    context.declarationOnly,
    { '@id': 'av:declarationOnly', '@type': 'xsd:boolean' },
    'SPDX external dependency JSON-LD context declarationOnly term'
  );
  assertDeepEqual(
    context.resolvedEvidence,
    { '@id': 'av:resolvedEvidence', '@type': 'xsd:boolean' },
    'SPDX external dependency JSON-LD context resolvedEvidence term'
  );
};

const stripTomlComment = (line: JsonValue) => {
  let inString = false;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (character === '"') {
      inString = !inString;
      continue;
    }
    if (character === '#' && !inString) {
      return line.slice(0, index);
    }
  }
  return line;
};

const splitTomlArray = (content: JsonValue) => {
  const items = [];
  let token = '';
  let inString = false;
  let escaped = false;
  for (let index = 0; index < content.length; index += 1) {
    const character = content[index];
    if (escaped) {
      token += character;
      escaped = false;
      continue;
    }
    if (character === '\\' && inString) {
      token += character;
      escaped = true;
      continue;
    }
    if (character === '"') {
      token += character;
      inString = !inString;
      continue;
    }
    if (character === ',' && !inString) {
      if (token.trim()) {
        items.push(token.trim());
      }
      token = '';
      continue;
    }
    token += character;
  }
  if (token.trim()) {
    items.push(token.trim());
  }
  return items;
};

const parseTomlKey = (key: string): string => {
  const trimmed = key.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed);
  }
  assert(/^[A-Za-z0-9_-]+$/.test(trimmed), `unsupported TOML key in fixture: ${trimmed}`);
  return trimmed;
};

const parseTomlScalar = (value: string): JsonValue => {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed);
  }
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (/^-?(?:0|[1-9]\d*)$/.test(trimmed)) {
    return Number(trimmed);
  }
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const content = trimmed.slice(1, -1).trim();
    return content ? splitTomlArray(content).map((item: string) => parseTomlScalar(item)) : [];
  }
  throw new Error(`unsupported TOML scalar in fixture: ${trimmed}`);
};

const resolveTomlPath = (rootObject: JsonObject, header: string, arrayTable: boolean): JsonObject => {
  const pathParts = header.split('.').map((part: string) => parseTomlKey(part));
  let parent = rootObject;
  for (const part of pathParts.slice(0, -1)) {
    parent[part] ??= {};
    assert(!Array.isArray(parent[part]), `unsupported nested TOML path below array table: ${header}`);
    parent = parent[part];
  }
  const finalPart = pathParts[pathParts.length - 1];
  assert(finalPart, `unsupported empty TOML path in fixture: ${header}`);
  if (arrayTable) {
    parent[finalPart] ??= [];
    assert(Array.isArray(parent[finalPart]), `TOML array table conflicts with singleton table: ${header}`);
    const item: JsonObject = {};
    parent[finalPart].push(item);
    return item;
  }
  parent[finalPart] ??= {};
  assert(!Array.isArray(parent[finalPart]), `TOML singleton table conflicts with array table: ${header}`);
  return parent[finalPart];
};

// Fixture-scoped TOML subset parser for deterministic authored-source vectors.
// It intentionally covers only the TOML shapes used by manifest-parse-cases.json;
// Conforming clients still need a real TOML v1.1.0 parser.
const parseFixtureTomlSubset = (source: string, label: string): JsonObject => {
  const parsed: JsonObject = {};
  let current = parsed;
  const lines = source.split(/\r?\n/);
  for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
    const line = stripTomlComment(lines[lineNumber]).trim();
    if (!line) {
      continue;
    }
    const arrayTableMatch = line.match(/^\[\[([^\]]+)\]\]$/);
    if (arrayTableMatch) {
      current = resolveTomlPath(parsed, arrayTableMatch[1], true);
      continue;
    }
    const tableMatch = line.match(/^\[([^\]]+)\]$/);
    if (tableMatch) {
      current = resolveTomlPath(parsed, tableMatch[1], false);
      continue;
    }
    const assignmentIndex = line.indexOf('=');
    assert(assignmentIndex > 0, `${label} has unsupported TOML line ${lineNumber + 1}: ${line}`);
    const key = parseTomlKey(line.slice(0, assignmentIndex));
    current[key] = parseTomlScalar(line.slice(assignmentIndex + 1));
  }
  return parsed;
};

const findProperty = (properties: JsonValue, name: JsonValue, label: JsonValue) => {
  const property = properties?.find((candidate: JsonValue) => candidate.name === name);
  assert(property, `${label} needs ${name} property`);
  return property;
};

const parseStablePropertyJson = (properties: JsonValue, name: JsonValue, label: JsonValue) => {
  const property = findProperty(properties, name, label);
  let parsed;
  try {
    parsed = JSON.parse(property.value);
  } catch (error) {
    throw new Error(`${label} ${name} property must contain JSON: ${errorMessage(error)}`, { cause: error });
  }
  assert(
    property.value === stableJsonStringify(parsed),
    `${label} ${name} property must use stable JSON serialization`
  );
  return parsed;
};

const findExternalReference = (references: JsonValue, type: JsonValue, url: JsonValue, label: JsonValue) => {
  assert(
    references?.some((reference: JsonValue) => reference.type === type && reference.url === url),
    `${label} needs ${type} external reference ${url}`
  );
};

const findSpdxExternalRef = (
  externalRefs: JsonValue,
  referenceCategory: JsonValue,
  referenceType: JsonValue,
  referenceLocator: JsonValue,
  label: JsonValue
) => {
  assert(
    externalRefs?.some(
      (reference: JsonValue) =>
        reference.referenceCategory === referenceCategory &&
        reference.referenceType === referenceType &&
        reference.referenceLocator === referenceLocator
    ),
    `${label} needs SPDX externalRef ${referenceCategory}/${referenceType}/${referenceLocator}`
  );
};

const decodeFixtureArtifact = (artifact: JsonValue, label: JsonValue) => {
  assert(artifact?.bytesBase64, `${label} needs artifact.bytesBase64`);
  const bytes = Buffer.from(artifact.bytesBase64, 'base64');
  assert(bytes.length > 0, `${label} artifact bytes must not be empty`);
  const digest = `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
  assert(digest === artifact.artifactDigest, `${label} artifactDigest must match bytes`);
  try {
    return JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    throw new Error(`${label} artifact bytes must parse as JSON: ${errorMessage(error)}`, { cause: error });
  }
};

const assertCycloneDxArtifact = (artifactJson: JsonValue, trustCase: JsonValue) => {
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
      (hash: JsonValue) => hash.alg === 'SHA-256' && `sha256:${hash.content}` === trustCase.subject.integrity
    ),
    `trust artifact case ${trustCase.name} BOM hashes must bind immutable identity`
  );
};

const assertSlsaArtifact = (artifactJson: JsonValue, trustCase: JsonValue) => {
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
      (subject: JsonValue) =>
        subject.name === trustCase.subject.purl && subject.digest?.sha256 === trustCase.subject.integrity.slice(7)
    ),
    `trust artifact case ${trustCase.name} SLSA subject must bind release subject`
  );
  assert(statement.predicate?.buildDefinition?.buildType, `trust artifact case ${trustCase.name} needs SLSA buildType`);
  assert(statement.predicate?.runDetails?.builder?.id, `trust artifact case ${trustCase.name} needs SLSA builder id`);
};

const assertSigstoreArtifact = (artifactJson: JsonValue, trustCase: JsonValue) => {
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

const routeIdentityFromPath = (route: JsonValue) => {
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

const assertRouteMetadataIdentity = (route: JsonValue, metadata: JsonValue, label: JsonValue) => {
  const identity = routeIdentityFromPath(route);
  assert(identity, `${label} needs a parseable release route`);
  assert(metadata.name === identity.name, `${label} metadata name must match route identity`);
  assert(metadata.version === identity.version, `${label} metadata version must match route identity`);
};

validate('advisory', readJson('conformance/fixtures/advisory.json'), 'advisory fixture');
validate('advisory', readJson('conformance/fixtures/advisory-withdrawn.json'), 'withdrawn advisory fixture');
validate('advisoryList', readJson('conformance/fixtures/advisory-list.json'), 'advisory list fixture');
validate('searchResults', readJson('conformance/fixtures/search-results.json'), 'search results fixture');
assert(
  readJson('conformance/fixtures/advisory-withdrawn.json').withdrawn?.at,
  'withdrawn advisory fixture must include withdrawn.at'
);
assert(
  readJson('conformance/fixtures/advisory.json').affected.ranges.some((range: JsonValue) =>
    range.events.some((event: JsonValue) => 'limit' in event)
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
  advisoryValidationCases.cases.flatMap((advisoryCase: JsonValue) =>
    (advisoryCase.payload.relationships ?? []).map((relationship: JsonValue) => relationship.type)
  )
);
for (const relationshipType of ['supersedes', 'superseded-by', 'related', 'duplicate-of']) {
  assert(advisoryRelationshipTypes.has(relationshipType), `advisory validation cases missing ${relationshipType}`);
}
assert(
  advisoryValidationCases.cases.some(
    (advisoryCase: JsonValue) => advisoryCase.expected.failureCategory === 'invalid-advisory-relationship'
  ),
  'advisory validation cases must include invalid relationship failure'
);
assert(
  advisoryValidationCases.cases.some((advisoryCase: JsonValue) => advisoryCase.payload.affected?.componentImpact),
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
const trustStates = new Set(
  trustDetailStatusVariants.attachments.map((attachment: JsonValue) => attachment.status.state)
);
for (const requiredState of ['revoked', 'superseded', 'invalid']) {
  assert(trustStates.has(requiredState), `trust detail status variants fixture must include ${requiredState}`);
}
const trustDetailFixture = readJson('conformance/fixtures/trust-detail.json');
const trustFormatFamilies = new Set(
  trustDetailFixture.attachments.map((attachment: JsonValue) => attachment.format.family)
);
for (const requiredFamily of ['cyclonedx', 'slsa-provenance', 'sigstore-bundle']) {
  assert(trustFormatFamilies.has(requiredFamily), `trust detail fixture must include ${requiredFamily} format family`);
}
assert(
  trustDetailFixture.attachments.some((attachment: JsonValue) => attachment.format.profile),
  'trust detail fixture must exercise format.profile'
);
validate(
  'capabilityMetadata',
  readJson('conformance/fixtures/capability-metadata.json'),
  'capability metadata fixture'
);
const capabilityMetadata = readJson('conformance/fixtures/capability-metadata.json');
assert(
  capabilityMetadata.specVersion === '0.1.0-rc.1',
  'capability metadata fixture must declare specVersion 0.1.0-rc.1'
);
assert(capabilityMetadata.schemaVersion === '1', 'capability metadata fixture must declare schemaVersion 1');
assert(capabilityMetadata.apiVersion === 'v1', 'capability metadata fixture must declare apiVersion v1');
assert(
  Array.isArray(capabilityMetadata.compatibleSpecVersions) &&
    capabilityMetadata.compatibleSpecVersions.includes('0.1.0-rc.1') &&
    new Set(capabilityMetadata.compatibleSpecVersions).size === capabilityMetadata.compatibleSpecVersions.length,
  'capability metadata fixture must declare unique exact compatibleSpecVersions including 0.1.0-rc.1'
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
for (const [surface, enabled] of Object.entries({
  releaseUploads: capabilityMetadata.apis.releaseUploads,
  trustUploads: capabilityMetadata.apis.trustUploads,
})) {
  if (enabled) {
    assert(
      capabilityMetadata.uploadProfiles?.[surface]?.includes('http-put'),
      `capability metadata must advertise http-put for ${surface}`
    );
  }
}
const capabilityUnknownToleranceFixture = readJson('conformance/fixtures/capability-metadata-unknown-tolerance.json');
assert(
  capabilityUnknownToleranceFixture.canonicalParsedData.specVersion === '0.1.0-rc.1',
  'capability metadata unknown tolerance fixture must declare specVersion 0.1.0-rc.1'
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
    (warning: JsonValue) => warning.category === 'unknown-capability-field'
  ),
  'capability metadata unknown tolerance fixture must expect an unknown capability field warning'
);
assert(
  capabilityUnknownToleranceFixture.expected.warnings.some(
    (warning: JsonValue) => warning.category === 'unknown-capability-value' && warning.path === 'deliveryModes[2]'
  ),
  'capability metadata unknown tolerance fixture must expect an unknown delivery mode value warning'
);
assert(
  capabilityUnknownToleranceFixture.expected.warnings.some(
    (warning: JsonValue) =>
      warning.category === 'unknown-capability-value' && warning.path.startsWith('uploadProfiles.')
  ),
  'capability metadata unknown tolerance fixture must expect an unknown upload profile value warning'
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
const capabilityInvalidCompatibilityFixture = readJson(
  'conformance/fixtures/capability-invalid-compatibility-cases.json'
);
for (const fixture of capabilityInvalidCompatibilityFixture.fixtures) {
  validateExpectedFailure(
    'capabilityMetadata',
    fixture.canonicalParsedData,
    `capability metadata invalid compatibility fixture ${fixture.name}`
  );
  assert(
    fixture.expected.valid === false,
    `capability metadata invalid compatibility fixture ${fixture.name} must be an expected failure`
  );
}
validate('bridgeMetadata', readJson('conformance/fixtures/bridge-metadata.json'), 'bridge metadata fixture');
const bridgeStatusVariants = readJson('conformance/fixtures/bridge-metadata-status-variants.json');
for (const fixture of bridgeStatusVariants.fixtures) {
  validate('bridgeMetadata', fixture.payload, `bridge metadata ${fixture.name} fixture`);
  assert(fixture.expected.valid === true, `bridge metadata ${fixture.name} fixture must be expected valid`);
}
assert(
  new Set(bridgeStatusVariants.fixtures.map((fixture: JsonValue) => fixture.payload.status)).size === 2,
  'bridge status variants fixture must cover distinct non-active statuses'
);
assertReservedExtensionNamespaceDrift();
assertSiteSchemaPublicationDrift();
assertSpdxExternalDependencyContextDrift();

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
    problemDetailsCases.cases.some((problemCase: JsonValue) => problemCase.type.endsWith(`/${slug}`)),
    `problem details cases missing ${slug}`
  );
}
const problemRegistry = readJson('conformance/fixtures/problem-registry.json');
validate('problemRegistry', problemRegistry, 'problem registry fixture');
assertSpecVersion(problemRegistry, 'problem registry fixture');
assert(
  problemRegistry.problems.length === problemStatusBySlug.size,
  'problem registry must cover every baseline problem type'
);
for (const problem of problemRegistry.problems) {
  assert(problem.type.endsWith(`/${problem.slug}`), `problem registry ${problem.slug} type must end with slug`);
  assert(
    problem.status === problemStatusBySlug.get(problem.slug),
    `problem registry ${problem.slug} status must match`
  );
}

assertEndpointProblemFixtures(
  'conformance/fixtures/catalog-search-failure-cases.json',
  'catalog search failure cases',
  new Map([['GET /api/v1/search', ['validation-failed', 'rate-limited']]])
);
assertEndpointProblemFixtures(
  'conformance/fixtures/advisory-search-failure-cases.json',
  'advisory search failure cases',
  new Map([['GET /api/v1/advisories', ['validation-failed', 'rate-limited']]])
);
assertLifecycleMutationFixtures(
  'conformance/fixtures/lifecycle-mutation-cases.json',
  'lifecycle mutation cases',
  new Map([
    [
      'DELETE /api/v1/volumes/{name}/{version}',
      ['authentication-required', 'authorization-failed', 'not-found', 'inconsistent-registry-state', 'rate-limited'],
    ],
    [
      'DELETE /api/v1/volumes/@{scope}/{name}/{version}',
      ['authentication-required', 'authorization-failed', 'not-found', 'inconsistent-registry-state', 'rate-limited'],
    ],
  ])
);
assertEndpointProblemFixtures(
  'conformance/fixtures/trust-summary-failure-cases.json',
  'trust summary failure cases',
  new Map([
    [
      'GET /api/v1/volumes/{name}/{version}/trust/summary',
      ['not-found', 'inconsistent-registry-state', 'rate-limited'],
    ],
    [
      'GET /api/v1/volumes/@{scope}/{name}/{version}/trust/summary',
      ['not-found', 'inconsistent-registry-state', 'rate-limited'],
    ],
  ])
);
assertEndpointProblemFixtures(
  'conformance/fixtures/trust-detail-failure-cases.json',
  'trust detail failure cases',
  new Map([
    ['GET /api/v1/volumes/{name}/{version}/trust/detail', ['not-found', 'inconsistent-registry-state', 'rate-limited']],
    [
      'GET /api/v1/volumes/@{scope}/{name}/{version}/trust/detail',
      ['not-found', 'inconsistent-registry-state', 'rate-limited'],
    ],
  ])
);

const releaseUploadLifecycle = readJson('conformance/fixtures/release-upload-lifecycle.json');
assertSpecVersion(releaseUploadLifecycle, 'release upload lifecycle fixture');
const releaseUploadFailures = new Set(
  releaseUploadLifecycle.fixtures
    .filter((fixture: JsonValue) => fixture.schema === 'problem-details')
    .map((fixture: JsonValue) => fixture.expected.failureCategory)
);
const releaseUploadStates = new Set(
  releaseUploadLifecycle.fixtures
    .filter((fixture: JsonValue) => fixture.schema === 'release-upload-intent')
    .map((fixture: JsonValue) => fixture.payload.state)
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
    assert(
      fixture.payload.upload.instructionType === 'http-put',
      `release upload lifecycle ${fixture.name} must use http-put upload instructions`
    );
    assert(
      fixture.payload.upload.method === undefined || fixture.payload.upload.method === 'PUT',
      `release upload lifecycle ${fixture.name} http-put method must be omitted or PUT`
    );
    assert(fixture.payload.upload.url, `release upload lifecycle ${fixture.name} http-put upload needs a URL`);
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

const manifestComponentFixture = readJson('conformance/fixtures/manifest-valid-component.json');
assertSpecVersion(manifestComponentFixture, 'component package manifest fixture');
validate('volume', manifestComponentFixture.canonicalParsedData, 'component package manifest fixture');
assert(manifestComponentFixture.expected.valid === true, 'component package manifest fixture must be expected valid');
assert(
  manifestComponentFixture.canonicalParsedData.volume.role === 'component' &&
    manifestComponentFixture.canonicalParsedData.components.length === 1,
  'component package manifest fixture must declare exactly one component'
);

const invalidComponentRoleFixture = readJson(
  'conformance/fixtures/manifest-invalid-component-role-multiple-components.json'
);
assertSpecVersion(invalidComponentRoleFixture, 'invalid component role manifest fixture');
validate('volume', invalidComponentRoleFixture.canonicalParsedData, 'invalid component role manifest fixture');
assert(
  invalidComponentRoleFixture.canonicalParsedData.volume.role === 'component' &&
    invalidComponentRoleFixture.canonicalParsedData.components.length > 1,
  'invalid component role fixture must exercise multiple component declarations'
);
assert(
  invalidComponentRoleFixture.expected.failureCategory === 'invalid-component-role-cardinality',
  'invalid component role fixture must classify component role cardinality failure'
);

const manifestProviderFixture = readJson('conformance/fixtures/manifest-valid-provider.json');
assertSpecVersion(manifestProviderFixture, 'provider package manifest fixture');
validate('volume', manifestProviderFixture.canonicalParsedData, 'provider package manifest fixture');
assert(manifestProviderFixture.expected.valid === true, 'provider package manifest fixture must be expected valid');
assert(
  manifestProviderFixture.canonicalParsedData.volume.role === 'provider' &&
    manifestProviderFixture.canonicalParsedData.volume.providers?.length > 0,
  'provider package manifest fixture must declare provider metadata'
);

const manifestMetaFixture = readJson('conformance/fixtures/manifest-valid-meta.json');
assertSpecVersion(manifestMetaFixture, 'meta package manifest fixture');
validate('volume', manifestMetaFixture.canonicalParsedData, 'meta package manifest fixture');
assert(manifestMetaFixture.expected.valid === true, 'meta package manifest fixture must be expected valid');

const unknownFieldFixture = readJson('conformance/fixtures/manifest-unknown-field-warning.json');
assertSpecVersion(unknownFieldFixture, 'unknown-field manifest fixture');
validate('volume', unknownFieldFixture.canonicalParsedData, 'unknown-field manifest fixture');
assert(
  unknownFieldFixture.expected.warnings.some((warning: JsonValue) => warning.category === 'unknown-field'),
  'unknown-field manifest fixture must expect an unknown-field warning'
);
for (const warning of unknownFieldFixture.expected.warnings) {
  assertWarning(warning, 'unknown-field manifest warning');
}

const manifestParseCases = readJson('conformance/fixtures/manifest-parse-cases.json');
validate('manifestParseCase', manifestParseCases, 'manifest parse cases fixture');
assertSpecVersion(manifestParseCases, 'manifest parse cases');
for (const manifestParseCase of manifestParseCases.cases) {
  const parsed = parseFixtureTomlSubset(
    manifestParseCase.authoredToml,
    `manifest parse case ${manifestParseCase.name}`
  );
  assertDeepEqual(
    parsed,
    manifestParseCase.expected.canonicalParsedData,
    `manifest parse case ${manifestParseCase.name}`
  );
  for (const warning of manifestParseCase.expected.warnings ?? []) {
    assertWarning(warning, `manifest parse case ${manifestParseCase.name} warning`);
  }
  if (manifestParseCase.expected.valid) {
    validate('volume', parsed, `manifest parse case ${manifestParseCase.name}`);
  } else {
    validateExpectedFailure('volume', parsed, `manifest parse case ${manifestParseCase.name}`);
  }
  if (manifestParseCase.name === 'no-default-materialization') {
    assert(
      !Object.hasOwn(parsed, 'permissions') && !Object.hasOwn(parsed.components[0], 'permissions'),
      'manifest parse case no-default-materialization must not inject permission defaults'
    );
  }
  if (manifestParseCase.expected.failureCategory === 'invalid-manifest-shape') {
    assert(
      manifestParseCase.expected.path === 'components' && !Array.isArray(parsed.components),
      `manifest parse case ${manifestParseCase.name} must fail because components is not an array table`
    );
  }
}
assert(
  manifestParseCases.cases.some(
    (manifestParseCase: JsonValue) => manifestParseCase.name === 'invalid-singleton-component-shape'
  ),
  'manifest parse cases must include singleton component shape rejection'
);

for (const [fixturePath, label] of [
  ['conformance/fixtures/manifest-invalid-name.json', 'invalid-name manifest fixture'],
  ['conformance/fixtures/manifest-invalid-version.json', 'invalid-version manifest fixture'],
  [
    'conformance/fixtures/manifest-invalid-external-dependency-unknown-field.json',
    'invalid external dependency unknown field manifest fixture',
  ],
  [
    'conformance/fixtures/manifest-invalid-external-dependency-empty-components.json',
    'invalid external dependency empty components manifest fixture',
  ],
  [
    'conformance/fixtures/manifest-invalid-external-dependency-duplicate-components.json',
    'invalid external dependency duplicate components manifest fixture',
  ],
] as const) {
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
const componentNames = duplicateComponentFixture.canonicalParsedData.components.map(
  (component: JsonValue) => component.name
);
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
    'read-write': new Set(['deny', 'read', 'write', 'read-write']),
    write: new Set(['deny', 'write']),
  },
  shell: {
    allow: new Set(['deny', 'allow']),
    deny: new Set(['deny']),
  },
};
type PermissionSurface = keyof typeof permissionOrder;
const isPermissionEscalation = (surface: PermissionSurface, parent: JsonValue, child: JsonValue): boolean => {
  if (surface === 'filesystem') {
    if (typeof parent !== 'string' || !Object.hasOwn(permissionOrder.filesystem, parent)) {
      return false;
    }
    return !permissionOrder.filesystem[parent as keyof typeof permissionOrder.filesystem].has(child);
  }
  if (typeof parent !== 'string' || !Object.hasOwn(permissionOrder.shell, parent)) {
    return false;
  }
  return !permissionOrder.shell[parent as keyof typeof permissionOrder.shell].has(child);
};
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
const versionIndexFixture = readJson('conformance/fixtures/version-index.json');
validate('versionIndex', versionIndexFixture, 'version index collection fixture');
assert(versionIndexFixture.items.length >= 2, 'version index collection fixture must include multiple rows');

const semverRangeCases = readJson('conformance/fixtures/semver-range-cases.json');
assertSpecVersion(semverRangeCases, 'semver range cases');
const semverRangeSchema = {
  $ref: `${schemas.volume.$id}#/$defs/semverRange`,
  $schema: 'https://json-schema.org/draft/2020-12/schema',
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
    (resolverCase: JsonValue) =>
      resolverCase.resolutionMode === 'exact-pinned' &&
      resolverCase.expected.outcome === 'success' &&
      resolverCase.expected.warnings?.some((warning: JsonValue) => warning.category === 'yanked-version')
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
      (resolverCase: JsonValue) =>
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
    for (const [key, metadata] of Object.entries(resolverCase.exactReleaseMetadata) as [string, JsonObject][]) {
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
        exactCase.expected.warnings?.some((warning: JsonValue) => warning.category === 'yanked-version'),
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
    if (exactCase.expected.failureCategory === 'non-installable-dist') {
      assert(
        ['blocked', 'tombstoned', 'unavailable'].includes(exactCase.invalidMetadata.status?.state),
        `exact release metadata case ${exactCase.name} invalid metadata must use non-installable lifecycle state`
      );
      assert(
        exactCase.invalidMetadata.dist,
        `exact release metadata case ${exactCase.name} invalid metadata must exercise forbidden dist`
      );
    }
    if (exactCase.expected.failureCategory === 'resolved-external-dependency-evidence') {
      assert(
        exactCase.invalidMetadata.externalDependencies?.some((dependency: JsonValue) =>
          Object.hasOwn(dependency, 'resolvedVersion')
        ),
        `exact release metadata case ${exactCase.name} must exercise forbidden resolved external dependency evidence`
      );
    }
  }
}
for (const requiredDistSource of ['cdn', 'git']) {
  assert(
    exactReleaseMetadataCases.cases.some(
      (exactCase: JsonValue) => exactCase.expected.distSource === requiredDistSource
    ),
    `exact release metadata cases missing ${requiredDistSource} success`
  );
}
for (const requiredFailure of ['blocked', 'tombstoned', 'availability-or-registry-state']) {
  assert(
    exactReleaseMetadataCases.cases.some(
      (exactCase: JsonValue) => exactCase.expected.failureCategory === requiredFailure
    ),
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
    assert(
      fixture.payload.upload.instructionType === 'http-put',
      `trust upload lifecycle ${fixture.name} must use http-put upload instructions`
    );
    assert(
      fixture.payload.upload.method === undefined || fixture.payload.upload.method === 'PUT',
      `trust upload lifecycle ${fixture.name} http-put method must be omitted or PUT`
    );
    assert(fixture.payload.upload.url, `trust upload lifecycle ${fixture.name} http-put upload needs a URL`);
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
      (trustCase: JsonValue) => trustCase.category === trustCategory && trustCase.expected.valid === true
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
  if (trustCase.expected.failureCategory === 'stale-trust-evidence-only') {
    assert(
      trustCase.lifecycleStatus?.state === 'superseded' && trustCase.expected.valid === false,
      `trust artifact case ${trustCase.name} must model superseded attachments as stale current evidence`
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
    let artifactError: unknown;
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
    } catch (error) {
      artifactError = error;
    }
    if (trustCase.expected.valid) {
      assert(
        !artifactError,
        artifactError ? errorMessage(artifactError) : `trust artifact case ${trustCase.name} must validate`
      );
    } else if (trustCase.expected.failureCategory === 'invalid-trust-artifact') {
      assert(artifactError, `trust artifact case ${trustCase.name} must fail artifact validation`);
    } else {
      assert(
        !artifactError,
        artifactError ? errorMessage(artifactError) : `trust artifact case ${trustCase.name} artifact validation failed`
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
    fixture.normalizedFiles.every((file: JsonValue) => {
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
const isInvalidNormalizedPath = (pathValue: JsonValue) =>
  pathValue.startsWith('/') || pathValue.split('/').some((segment: JsonValue) => segment === '.' || segment === '..');
const normalizeArchivePath = (pathValue: JsonValue) => path.posix.normalize(pathValue);
const isInvalidArchivePath = (pathValue: JsonValue) => {
  const normalized = normalizeArchivePath(pathValue);
  return (
    pathValue.startsWith('/') ||
    normalized === '.' ||
    pathValue.split('/').some((segment: JsonValue) => segment === '.' || segment === '..')
  );
};
const digestInvalidCases = readJson('conformance/fixtures/digest-invalid-cases.json');
assertSpecVersion(digestInvalidCases, 'digest invalid cases');
for (const digestCase of digestInvalidCases.cases) {
  if (digestCase.expected.failureCategory === 'invalid-path') {
    assert(
      digestCase.normalizedFiles.some((file: JsonValue) => isInvalidNormalizedPath(file.path)),
      `digest invalid case ${digestCase.name} must contain an invalid path`
    );
  }
  if (digestCase.expected.failureCategory === 'duplicate-path') {
    const paths = digestCase.normalizedFiles.map((file: JsonValue) => file.path);
    assert(
      new Set(paths).size !== paths.length,
      `digest invalid case ${digestCase.name} must contain duplicate normalized paths`
    );
  }
  if (digestCase.expected.failureCategory === 'non-regular-file') {
    assert(
      digestCase.normalizedFiles.some((file: JsonValue) => file.entryType && file.entryType !== 'file'),
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
      archiveCase.archiveEntries.some((entry: JsonValue) => isInvalidArchivePath(entry.path)),
      `tar archive case ${archiveCase.name} must contain an invalid archive path`
    );
  }
  if (archiveCase.expected.failureCategory === 'duplicate-archive-path') {
    const normalizedPaths = archiveCase.archiveEntries.map((entry: JsonValue) => normalizeArchivePath(entry.path));
    assert(
      new Set(normalizedPaths).size !== normalizedPaths.length,
      `tar archive case ${archiveCase.name} must contain duplicate normalized archive paths`
    );
  }
  if (archiveCase.expected.failureCategory === 'non-regular-archive-entry') {
    assert(
      archiveCase.archiveEntries.some((entry: JsonValue) => entry.entryType !== 'file'),
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

const upstreamBaselines = readJson('conformance/upstream-baselines.json');
validate('upstreamBaseline', upstreamBaselines, 'upstream PURL/VERS baselines');
assertSpecVersion(upstreamBaselines, 'upstream PURL/VERS baselines');
const invalidUpstreamBaselines = readJson('conformance/fixtures/upstream-baselines-invalid.json');
assertSpecVersion(invalidUpstreamBaselines, 'invalid upstream PURL/VERS baseline cases');
for (const invalidBaselineCase of invalidUpstreamBaselines.cases) {
  validateExpectedFailure(
    'upstreamBaseline',
    invalidBaselineCase.payload,
    `invalid upstream PURL/VERS baseline case ${invalidBaselineCase.name}`
  );
  assert(
    invalidBaselineCase.expected.valid === false,
    `invalid upstream baseline case ${invalidBaselineCase.name} must fail`
  );
}
assert(
  upstreamBaselines.baselines.some((baseline: JsonValue) => baseline.name === 'package-url-spec'),
  'upstream baselines must include Package URL spec'
);
assert(
  upstreamBaselines.baselines.some((baseline: JsonValue) => baseline.name === 'vers-spec'),
  'upstream baselines must include VERS spec'
);
for (const baseline of upstreamBaselines.baselines) {
  assert(gitCommitPattern.test(baseline.revision), `upstream baseline ${baseline.name} revision must be immutable`);
}

const purlVersCompatibilityExceptions = readJson('conformance/purl-vers-compatibility-exceptions.json');
validate('purlVersCompatibilityExceptions', purlVersCompatibilityExceptions, 'PURL/VERS compatibility exceptions');
assertSpecVersion(purlVersCompatibilityExceptions, 'PURL/VERS compatibility exceptions');
const invalidPurlVersCompatibilityExceptions = readJson(
  'conformance/fixtures/purl-vers-compatibility-exceptions-invalid.json'
);
assertSpecVersion(invalidPurlVersCompatibilityExceptions, 'invalid PURL/VERS compatibility exception cases');
for (const invalidExceptionCase of invalidPurlVersCompatibilityExceptions.cases) {
  validateExpectedFailure(
    'purlVersCompatibilityExceptions',
    invalidExceptionCase.payload,
    `invalid PURL/VERS compatibility exception case ${invalidExceptionCase.name}`
  );
  assert(
    invalidExceptionCase.expected.valid === false,
    `invalid PURL/VERS compatibility exception case ${invalidExceptionCase.name} must fail`
  );
}
assert(
  purlVersCompatibilityExceptions.exceptions.some(
    (exception: JsonValue) =>
      exception.id === 'pub-dart' && exception.purlType === 'pub' && exception.versScheme === 'dart'
  ),
  'PURL/VERS compatibility exceptions must include pub/dart'
);

const componentPurlPattern =
  /^pkg:volume\/(?:%40((?![a-z0-9-]*--)[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?)\/)?((?![a-z0-9-]*--)[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?)(?:@(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?)?#(agent|skill|command|tool|hook|mcp-server|lsp-server)\/(?![a-z0-9-]*--)[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/;

function parseComponentDependencyPurl(componentPurl: JsonValue) {
  const match = componentPurl.match(componentPurlPattern);
  if (!match) {
    return undefined;
  }
  const [, scope, name] = match;
  return {
    hasVersion: match[3] !== undefined,
    parentName: scope === undefined ? name : `@${scope}/${name}`,
  };
}

const componentDependencyCases = readJson('conformance/fixtures/component-dependency-validation-cases.json');
validate(
  'componentDependencyValidationCase',
  componentDependencyCases,
  'component dependency validation cases fixture'
);
for (const dependencyCase of componentDependencyCases.cases) {
  const declaredComponents = new Set(dependencyCase.declaredComponents);
  const parentDependencies = new Set(Object.keys(dependencyCase['volume-dependencies']));
  const resolvedComponents = new Set(dependencyCase.resolvedComponents);
  const requestedDependencies = Object.values(dependencyCase['component-dependencies']).flat() as string[];
  const invalidComponentPurls = requestedDependencies.filter(
    (dependency: JsonValue) => !componentPurlPattern.test(dependency)
  );
  const validRequestedDependencies = requestedDependencies.filter((dependency: JsonValue) =>
    componentPurlPattern.test(dependency)
  );
  const missingDependencies = validRequestedDependencies.filter(
    (dependency: JsonValue) => !resolvedComponents.has(dependency)
  );
  const unknownLocalComponents = Object.keys(dependencyCase['component-dependencies']).filter(
    (componentName: JsonValue) => !declaredComponents.has(componentName)
  );
  const missingParentDependencies = validRequestedDependencies.filter((dependency: JsonValue) => {
    const parsedDependency = parseComponentDependencyPurl(dependency);
    if (parsedDependency === undefined || parsedDependency.hasVersion) {
      return false;
    }
    return !parentDependencies.has(parsedDependency.parentName);
  });
  if (dependencyCase.expected.failureCategory !== undefined) {
    assert(
      dependencyCase.expected.valid === false,
      `component dependency case ${dependencyCase.name} with a failureCategory must be invalid`
    );
  }
  if (dependencyCase.expected.valid === false) {
    assert(
      typeof dependencyCase.expected.failureCategory === 'string',
      `component dependency case ${dependencyCase.name} must declare a failureCategory when invalid`
    );
  }
  if (dependencyCase.expected.failureCategory === 'missing-component-dependency') {
    assert(
      missingDependencies.length > 0,
      `component dependency case ${dependencyCase.name} must contain a missing dependency`
    );
  }
  if (dependencyCase.expected.failureCategory === 'unknown-local-component') {
    assert(
      unknownLocalComponents.length > 0,
      `component dependency case ${dependencyCase.name} must contain a component-dependencies key absent from declaredComponents`
    );
  }
  if (dependencyCase.expected.failureCategory === 'invalid-component-purl') {
    assert(
      invalidComponentPurls.length > 0,
      `component dependency case ${dependencyCase.name} must contain an invalid component purl candidate`
    );
  }
  if (dependencyCase.expected.failureCategory === 'missing-parent-volume-dependency') {
    assert(
      missingParentDependencies.length > 0,
      `component dependency case ${dependencyCase.name} must contain a versionless component dependency without a parent volume dependency`
    );
  }
  if (dependencyCase.expected.valid === true) {
    assert(
      missingDependencies.length === 0,
      `component dependency case ${dependencyCase.name} must be semantically valid`
    );
    assert(
      unknownLocalComponents.length === 0,
      `component dependency case ${dependencyCase.name} must only use declared component-dependencies keys`
    );
    assert(
      invalidComponentPurls.length === 0,
      `component dependency case ${dependencyCase.name} must only use valid component purls`
    );
    assert(
      missingParentDependencies.length === 0,
      `component dependency case ${dependencyCase.name} must only use versionless references backed by parent volume dependencies`
    );
  }
}
assert(
  componentDependencyCases.cases.some((dependencyCase: JsonValue) =>
    (Object.values(dependencyCase['component-dependencies']).flat() as string[]).some(
      (dependency: JsonValue) =>
        /^pkg:volume\/[^@#]+#/.test(dependency) || /^pkg:volume\/%40[^/]+\/[^@#]+#/.test(dependency)
    )
  ),
  'component dependency cases must include versionless authoring references'
);

const externalDependencyCases = readJson('conformance/fixtures/external-dependency-validation-cases.json');
validate('externalDependencyValidationCase', externalDependencyCases, 'external dependency validation cases fixture');
assertSpecVersion(externalDependencyCases, 'external dependency validation cases');
const purlVersExceptionPairs = new Set(
  purlVersCompatibilityExceptions.exceptions.map(
    (exception: JsonValue) => `${exception.purlType}:${exception.versScheme}`
  )
);
for (const externalDependencyCase of externalDependencyCases.cases) {
  const declaredComponents = new Set(externalDependencyCase.declaredComponents);
  const seenSemanticKeys = new Map();
  for (const dependency of externalDependencyCase['external-dependencies']) {
    assert(
      isExternalDependencyPurpose(dependency.purpose) ||
        externalDependencyCase.expected.failureCategory === 'invalid-external-dependency-purpose',
      `external dependency case ${externalDependencyCase.name} invalid purpose must be expected`
    );
    const parsedPurl = parseExternalDependencyPurl(dependency.purl);
    const versScheme = parseVersScheme(dependency.constraint);
    if (parsedPurl) {
      assert(
        !parsedPurl.hasVersion ||
          externalDependencyCase.expected.failureCategory === 'invalid-external-dependency-purl',
        `external dependency case ${externalDependencyCase.name} versioned PURL must be an expected PURL failure`
      );
      assert(
        !parsedPurl.hasSubpath ||
          externalDependencyCase.expected.failureCategory === 'invalid-external-dependency-purl',
        `external dependency case ${externalDependencyCase.name} subpath PURL must be an expected PURL failure`
      );
      assert(
        parsedPurl.type !== 'volume' ||
          externalDependencyCase.expected.failureCategory === 'external-dependency-volume-purl',
        `external dependency case ${externalDependencyCase.name} pkg:volume must be an expected volume-purl failure`
      );
    }
    if (parsedPurl && versScheme && parsedPurl.type !== 'volume') {
      const compatible =
        parsedPurl.type === versScheme || purlVersExceptionPairs.has(`${parsedPurl.type}:${versScheme}`);
      assert(
        compatible ||
          externalDependencyCase.expected.failureCategory === 'external-dependency-constraint-type-mismatch',
        `external dependency case ${externalDependencyCase.name} PURL/VERS mismatch must be expected`
      );
    }
    for (const component of dependency.components ?? []) {
      assert(
        declaredComponents.has(component) ||
          externalDependencyCase.expected.failureCategory === 'unknown-external-dependency-component',
        `external dependency case ${externalDependencyCase.name} unknown component must be expected`
      );
    }
    const key = externalDependencySemanticKey(dependency);
    if (seenSemanticKeys.has(key)) {
      const previousConstraint = seenSemanticKeys.get(key);
      const normalizedPreviousConstraint = normalizeVersConstraintForComparison(previousConstraint);
      const normalizedCurrentConstraint = normalizeVersConstraintForComparison(dependency.constraint);
      const expectedCategory =
        normalizedPreviousConstraint === normalizedCurrentConstraint
          ? 'duplicate-external-dependency'
          : 'conflicting-external-dependency';
      assert(
        externalDependencyCase.expected.failureCategory === expectedCategory,
        `external dependency case ${externalDependencyCase.name} duplicate semantic key must classify as ${expectedCategory}`
      );
    }
    seenSemanticKeys.set(key, dependency.constraint);
  }
  if (externalDependencyCase.expected.valid === false) {
    assert(
      typeof externalDependencyCase.expected.failureCategory === 'string',
      `external dependency case ${externalDependencyCase.name} invalid cases need a failureCategory`
    );
  }
  if (externalDependencyCase.expected.valid === true) {
    assert(
      Array.isArray(externalDependencyCase.expected.semanticKeys) &&
        externalDependencyCase.expected.semanticKeys.length === externalDependencyCase['external-dependencies'].length,
      `external dependency case ${externalDependencyCase.name} successful cases need semanticKeys`
    );
    for (const [index, semanticKey] of externalDependencyCase.expected.semanticKeys.entries()) {
      const dependency = externalDependencyCase['external-dependencies'][index];
      assert(
        semanticKey.purl === dependency.purl,
        `external dependency case ${externalDependencyCase.name} semantic key purl must match dependency`
      );
      assert(
        semanticKey.purpose === dependency.purpose,
        `external dependency case ${externalDependencyCase.name} semantic key purpose must match dependency`
      );
      assertDeepEqual(
        semanticKey.scope,
        externalDependencyScope(dependency),
        `external dependency case ${externalDependencyCase.name} semantic key scope must match dependency scope`
      );
      assert(
        !Object.hasOwn(semanticKey, 'constraint'),
        `external dependency case ${externalDependencyCase.name} semantic key excludes constraint`
      );
      const sortedScope = [...semanticKey.scope].toSorted(compareStrings);
      assertDeepEqual(
        semanticKey.scope,
        sortedScope,
        `external dependency case ${externalDependencyCase.name} semantic key scope`
      );
      if (semanticKey.declarationKey) {
        assert(
          semanticKey.declarationKey === declarationKeyForSemanticKey(semanticKey),
          `external dependency case ${externalDependencyCase.name} declaration key must match JCS input`
        );
      }
    }
  }
}
assert(
  externalDependencyCases.cases.some(
    (externalDependencyCase: JsonValue) =>
      externalDependencyCase.name === 'normalized-equivalent-vers-constraints-are-duplicate'
  ),
  'external dependency validation cases must include normalized-equivalent VERS duplicate coverage'
);
assert(
  externalDependencyCases.cases.some(
    (externalDependencyCase: JsonValue) =>
      externalDependencyCase.name === 'normalized-distinct-vers-constraints-are-conflict'
  ),
  'external dependency validation cases must include normalized VERS conflict coverage'
);
for (const requiredFailure of [
  'invalid-external-dependency-purl',
  'external-dependency-volume-purl',
  'invalid-external-dependency-constraint',
  'external-dependency-constraint-type-mismatch',
  'invalid-external-dependency-purpose',
  'unknown-external-dependency-component',
  'duplicate-external-dependency',
  'conflicting-external-dependency',
]) {
  assert(
    externalDependencyCases.cases.some(
      (externalDependencyCase: JsonValue) => externalDependencyCase.expected.failureCategory === requiredFailure
    ),
    `external dependency validation cases must include ${requiredFailure}`
  );
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
  command: new Set(['.md']),
  hook: new Set(['.md', '.yaml', '.js', '.mjs', '.sh', '.py']),
  'lsp-server': new Set(['.json']),
  'mcp-server': new Set(['.json']),
  skill: new Set(['.md']),
  tool: new Set(['.json', '.yaml', '.js', '.mjs', '.sh', '.py']),
};
type ComponentType = keyof typeof supportedEntrypointExtensionsByType;
const supportedEntrypointExtensionMap: Record<ComponentType, Set<string>> = supportedEntrypointExtensionsByType;

const isComponentType = (value: JsonValue): value is ComponentType =>
  typeof value === 'string' && Object.hasOwn(supportedEntrypointExtensionsByType, value);

for (const semanticCase of semanticValidationCases.cases) {
  for (const warning of semanticCase.expected.warnings ?? []) {
    assertWarning(warning, `semantic validation case ${semanticCase.name} warning`);
  }
  const { component } = semanticCase.payload;
  if (component) {
    const extension = path.posix.extname(component.entrypoint);
    const componentType = component.type;
    const supportedExtensions = isComponentType(componentType)
      ? supportedEntrypointExtensionMap[componentType]
      : undefined;
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
      (semanticCase: JsonValue) =>
        semanticCase.area === 'manifest' && semanticCase.expected.failureCategory === requiredComponentFailure
    ),
    `semantic validation cases must include component entrypoint failure ${requiredComponentFailure}`
  );
}
for (const componentType of ['agent', 'skill', 'command', 'tool', 'hook', 'mcp-server', 'lsp-server']) {
  assert(
    semanticValidationCases.cases.some(
      (semanticCase: JsonValue) =>
        semanticCase.area === 'manifest' &&
        semanticCase.expected.valid === true &&
        semanticCase.payload.component?.type === componentType
    ) ||
      semanticValidationCases.cases.some(
        (semanticCase: JsonValue) =>
          semanticCase.area === 'warning' &&
          semanticCase.expected.valid === true &&
          semanticCase.payload.component?.type === componentType
      ),
    `semantic validation cases must include positive ${componentType} component case`
  );
}
assert(
  semanticValidationCases.cases.some(
    (semanticCase: JsonValue) =>
      semanticCase.area === 'warning' &&
      semanticCase.expected.warnings?.some((warning: JsonValue) => warning.category === 'noncanonical-entrypoint')
  ),
  'semantic validation cases must include noncanonical-entrypoint warning'
);
assert(
  semanticValidationCases.cases.some(
    (semanticCase: JsonValue) =>
      semanticCase.area === 'warning' &&
      semanticCase.expected.warnings?.some((warning: JsonValue) => warning.category === 'deprecated')
  ),
  'semantic validation cases must include deprecated warning category'
);
assert(
  semanticValidationCases.cases.some(
    (semanticCase: JsonValue) =>
      semanticCase.area === 'load' && semanticCase.expected.failureCategory === 'load-policy-blocked'
  ),
  'semantic validation cases must include load-time policy blocking boundary'
);
for (const compatibilityCaseName of [
  'compatibility-preserves-semver-looking-runtime-expression',
  'compatibility-preserves-date-like-protocol-expression',
  'compatibility-preserves-short-numeric-protocol-expression',
  'unknown-compatibility-scheme-is-advisory-not-rejection',
]) {
  assert(
    semanticValidationCases.cases.some(
      (semanticCase: JsonValue) => semanticCase.name === compatibilityCaseName && semanticCase.expected.valid === true
    ),
    `semantic validation cases must include positive compatibility expression case ${compatibilityCaseName}`
  );
}
assert(
  semanticValidationCases.cases.some(
    (semanticCase: JsonValue) => semanticCase.expected.failureCategory === 'non-regular-archive-entry'
  ),
  'semantic validation cases must include release file-selection non-regular entry failure'
);
assert(
  semanticValidationCases.cases.some(
    (semanticCase: JsonValue) => semanticCase.expected.failureCategory === 'digest-mismatch'
  ),
  'semantic validation cases must include trust attachment byte identity mismatch'
);

const externalDependencyPotentialExposureCases = readJson(
  'conformance/fixtures/external-dependency-potential-exposure-cases.json'
);
assertSpecVersion(externalDependencyPotentialExposureCases, 'external dependency potential exposure cases');
const invalidPotentialExposureWarningContexts = readJson(
  'conformance/fixtures/external-dependency-potential-exposure-warning-context-invalid.json'
);
assertSpecVersion(invalidPotentialExposureWarningContexts, 'invalid external dependency warning context cases');
for (const invalidWarningContextCase of invalidPotentialExposureWarningContexts.cases) {
  validateExpectedFailure(
    'externalDependencyPotentialExposureWarningContext',
    invalidWarningContextCase.context,
    `invalid external dependency warning context case ${invalidWarningContextCase.name}`
  );
  assert(
    invalidWarningContextCase.expected.valid === false,
    `invalid external dependency warning context case ${invalidWarningContextCase.name} must fail`
  );
}
for (const exposureCase of externalDependencyPotentialExposureCases.cases) {
  const advisoryMatches = exposureCase.advisoryMatches ?? [exposureCase.advisoryMatch];
  assert(
    externalDependencyDeclarationKeyPattern.test(exposureCase.declaration.declarationKey),
    `potential exposure case ${exposureCase.name} needs a declaration key`
  );
  assert(
    advisoryMatches.every((advisoryMatch: JsonValue) => advisoryMatch !== undefined),
    `potential exposure case ${exposureCase.name} needs advisory match input`
  );
  assert(
    ['intersects', 'does-not-intersect', 'indeterminate'].includes(exposureCase.expected.intersection),
    `potential exposure case ${exposureCase.name} needs an intersection state`
  );
  for (const warning of exposureCase.expected.warnings ?? []) {
    assertWarning(warning, `potential exposure case ${exposureCase.name} warning`);
    assert(
      warning.context.dependency.declarationKey === exposureCase.declaration.declarationKey,
      `potential exposure case ${exposureCase.name} warning declaration key must match declaration`
    );
    assert(
      advisoryMatches.some(
        (advisoryMatch: JsonValue) =>
          warning.context.advisoryMatch.canonicalId === advisoryMatch.canonicalId &&
          warning.context.advisoryMatch.affectedPurl === advisoryMatch.affectedPurl &&
          warning.context.advisoryMatch.affectedRange === advisoryMatch.affectedRange
      ),
      `potential exposure case ${exposureCase.name} warning advisory match identity must match input`
    );
  }
  if (exposureCase.expected.intersection === 'intersects') {
    assert(
      (exposureCase.expected.warnings ?? []).some(
        (warning: JsonValue) => warning.category === 'external-dependency-potential-exposure'
      ),
      `potential exposure case ${exposureCase.name} intersecting cases must emit a potential exposure warning`
    );
  }
  if (exposureCase.expected.intersection !== 'intersects') {
    assert(
      (exposureCase.expected.warnings ?? []).length === 0,
      `potential exposure case ${exposureCase.name} non-intersecting/indeterminate cases must not emit potential exposure warnings`
    );
  }
  if (exposureCase.expected.dedupIdentity) {
    assert(
      exposureCase.expected.dedupIdentity.join('\u0000') ===
        [
          exposureCase.declaration.declarationKey,
          exposureCase.advisoryMatch.canonicalId,
          exposureCase.advisoryMatch.affectedPurl,
          exposureCase.advisoryMatch.affectedRange,
        ].join('\u0000'),
      `potential exposure case ${exposureCase.name} dedup identity must use declaration/advisory/range tuple`
    );
    assert(
      exposureCase.expected.warningCount === (exposureCase.expected.warnings ?? []).length,
      `potential exposure case ${exposureCase.name} warningCount must match emitted warnings`
    );
  }
  if (exposureCase.expected.dedupIdentities) {
    const expectedIdentities = (exposureCase.expected.warnings ?? []).map((warning: JsonValue) => [
      exposureCase.declaration.declarationKey,
      warning.context.advisoryMatch.canonicalId,
      warning.context.advisoryMatch.affectedPurl,
      warning.context.advisoryMatch.affectedRange,
    ]);
    assert(
      exposureCase.expected.dedupIdentities.length === expectedIdentities.length,
      `potential exposure case ${exposureCase.name} dedupIdentities must match emitted warning identities`
    );
    assert(
      new Set(exposureCase.expected.dedupIdentities.map((identity: JsonValue) => identity.join('\u0000'))).size ===
        exposureCase.expected.dedupIdentities.length,
      `potential exposure case ${exposureCase.name} dedupIdentities must be distinct`
    );
    for (const expectedIdentity of expectedIdentities) {
      assert(
        exposureCase.expected.dedupIdentities.some(
          (dedupIdentity: JsonValue) => dedupIdentity.join('\u0000') === expectedIdentity.join('\u0000')
        ),
        `potential exposure case ${exposureCase.name} dedupIdentities must use declaration/advisory/range tuples`
      );
    }
    assert(
      exposureCase.expected.warningCount === (exposureCase.expected.warnings ?? []).length,
      `potential exposure case ${exposureCase.name} warningCount must match emitted warnings`
    );
  }
}
assert(
  externalDependencyPotentialExposureCases.cases.some(
    (exposureCase: JsonValue) => exposureCase.name === 'same-advisory-distinct-affected-ranges-emit-distinct-warnings'
  ),
  'potential exposure cases must include same-advisory distinct affected range warning coverage'
);
for (const requiredIntersection of ['intersects', 'does-not-intersect', 'indeterminate']) {
  assert(
    externalDependencyPotentialExposureCases.cases.some(
      (exposureCase: JsonValue) => exposureCase.expected.intersection === requiredIntersection
    ),
    `potential exposure cases must include ${requiredIntersection}`
  );
}

const conformanceCoverage = readJson('conformance/fixtures/conformance-coverage.json');
validate('conformanceCoverage', conformanceCoverage, 'conformance coverage fixture');
assertSpecVersion(conformanceCoverage, 'conformance coverage fixture');
assertConformanceCoverageReferences(conformanceCoverage);
const coverageRequirementIds = new Set(
  conformanceCoverage.requirements.map((requirement: JsonValue) => requirement.id)
);
for (const id of [
  ...Array.from({ length: 18 }, (_: JsonValue, index: JsonValue) => `AV-BIB-${String(index + 1).padStart(3, '0')}`),
  ...Array.from({ length: 18 }, (_: JsonValue, index: JsonValue) => `AV-CLI-${String(index + 1).padStart(3, '0')}`),
]) {
  assert(coverageRequirementIds.has(id), `conformance coverage fixture missing ${id}`);
}
assert(
  conformanceCoverage.requirements.some((requirement: JsonValue) =>
    requirement.coverage.some((coverage: JsonValue) => coverage.fixture === 'search-results.json')
  ),
  'conformance coverage fixture must map search API coverage'
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
  'external-dependencies[]',
  'permissions / components[].permissions',
  'component-dependencies',
]) {
  assert(
    mappingMatrix.entries.some((entry: JsonValue) => entry.agentVolumesField === field),
    `mapping matrix missing ${field}`
  );
}
for (const entry of mappingMatrix.entries) {
  assert(
    entry.cyclonedx || entry.spdx || entry.slsa,
    `mapping matrix entry ${entry.agentVolumesField} must map to at least one target`
  );
}
const mappingFields = mappingMatrix.entries.map((entry: JsonValue) => entry.agentVolumesField);
assert(new Set(mappingFields).size === mappingFields.length, 'mapping matrix agentVolumesField entries must be unique');
assert(
  mappingFields.join('\n') === [...mappingFields].toSorted(compareStrings).join('\n'),
  'mapping matrix entries must be ordered by agentVolumesField for stable serialization'
);
for (const entry of mappingMatrix.entries) {
  for (const family of ['cyclonedx', 'spdx', 'slsa']) {
    const mapping = entry[family];
    if (!mapping) {
      continue;
    }
    if (mapping.kind === 'extension') {
      assert(
        mapping.extensionNamespace?.startsWith('agent-volumes') ||
          mapping.extensionNamespace?.startsWith('https://agentvolumes.org/'),
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
const sampleSpdxExternalDependencies = mappingSample.exports.spdxExternalDependencies;
const sampleExternalDependencyPredicate = mappingSample.exports.externalDependencyDeclarationsPredicate;
const sampleSlsa = mappingSample.exports.slsa;
const sampleComponentPurls = new Map(
  sampleManifest.components.map((component: JsonValue) => [
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
  format: { version: '1.7' },
  name: 'mapping-sample-cyclonedx-export',
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
  cyclonedxRoot.licenses?.some((licenseChoice: JsonValue) => licenseChoice.license?.id === sampleVolume.license),
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
  const cyclonedxComponent = sampleCycloneDx.components.find(
    (candidate: JsonValue) => candidate.purl === componentPurl
  );
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
    (dependency: JsonValue) =>
      dependency.ref === sampleRelease.purl && dependency.dependsOn.includes('pkg:volume/github-provider@2.1.0')
  ),
  'mapping sample CycloneDX dependencies graph must map volume dependencies'
);
assert(
  sampleCycloneDx.dependencies.some(
    (dependency: JsonValue) =>
      dependency.ref === sampleComponentPurls.get('summarize-paper') &&
      dependency.dependsOn.includes('pkg:volume/github-provider@2.1.0#tool/read-pr')
  ),
  'mapping sample CycloneDX dependencies graph must map component dependencies'
);
for (const externalDependency of sampleManifest['external-dependencies']) {
  const scope = externalDependency.components ?? [];
  const declarationKey = declarationKeyForSemanticKey({
    purl: externalDependency.purl,
    purpose: externalDependency.purpose,
    scope,
  });
  const cyclonedxExternalComponent = sampleCycloneDx.components.find(
    (component: JsonValue) => component['bom-ref'] === `agent-volumes:external-dependency:${declarationKey}`
  );
  assert(cyclonedxExternalComponent, `mapping sample CycloneDX needs external declaration ${declarationKey}`);
  assert(cyclonedxExternalComponent.isExternal === true, `mapping sample CycloneDX ${declarationKey} must be external`);
  assert(
    cyclonedxExternalComponent.purl === externalDependency.purl,
    `mapping sample CycloneDX ${declarationKey} purl must match`
  );
  assert(
    cyclonedxExternalComponent.versionRange === externalDependency.constraint,
    `mapping sample CycloneDX ${declarationKey} versionRange must carry VERS constraint`
  );
  for (const [propertyName, expectedValue] of [
    ['agent-volumes:external-dependency', 'true'],
    ['agent-volumes:declaration-key', declarationKey],
    ['agent-volumes:declaration-only', 'true'],
    ['agent-volumes:constraint', externalDependency.constraint],
    ['agent-volumes:purpose', externalDependency.purpose],
    ['agent-volumes:scope', stableJsonStringify(scope)],
    ['agent-volumes:resolved-evidence', 'false'],
  ]) {
    assert(
      findProperty(cyclonedxExternalComponent.properties, propertyName, `mapping sample CycloneDX ${declarationKey}`)
        .value === expectedValue,
      `mapping sample CycloneDX ${declarationKey} property ${propertyName} must match`
    );
  }
  assert(
    !cyclonedxExternalComponent.hashes && !cyclonedxExternalComponent.version,
    `mapping sample CycloneDX ${declarationKey} must not claim resolved hashes or exact resolved version`
  );
}

assert(sampleSpdx.spdxVersion === 'SPDX-2.3', 'mapping sample SPDX export must declare SPDX-2.3');
const spdxPackage = sampleSpdx.packages.find(
  (spdxPackageCandidate: JsonValue) => spdxPackageCandidate.name === sampleVolume.name
);
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
  spdxPackage.checksums?.some(
    (checksum: JsonValue) => checksum.algorithm === 'SHA256' && checksum.checksumValue === sampleDigest
  ),
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
    (relationship: JsonValue) =>
      relationship.spdxElementId === 'SPDXRef-Package-research-agent-pack' &&
      relationship.relationshipType === 'DEPENDS_ON' &&
      relationship.relatedSpdxElement === 'SPDXRef-Package-github-provider'
  ),
  'mapping sample SPDX relationships must map volume dependencies'
);
assert(
  sampleSpdxExternalDependencies?.spdxVersion === 'SPDX-3.0.1',
  'mapping sample external dependency SPDX profile must declare SPDX-3.0.1'
);
assert(
  sampleSpdxExternalDependencies.profile === 'https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#',
  'mapping sample external dependency SPDX profile must use Agent Volumes namespace'
);
for (const externalDependency of sampleManifest['external-dependencies']) {
  const scope = externalDependency.components ?? [];
  const declarationKey = declarationKeyForSemanticKey({
    purl: externalDependency.purl,
    purpose: externalDependency.purpose,
    scope,
  });
  const spdxExtension = sampleSpdxExternalDependencies.elements?.find(
    (extension: JsonValue) => extension['av:declarationKey'] === declarationKey
  );
  assert(spdxExtension, `mapping sample SPDX needs external declaration extension ${declarationKey}`);
  assert(spdxExtension['av:purl'] === externalDependency.purl, `mapping sample SPDX ${declarationKey} purl must match`);
  assert(
    spdxExtension['av:constraint'] === externalDependency.constraint,
    `mapping sample SPDX ${declarationKey} constraint must match`
  );
  assert(
    spdxExtension['av:purpose'] === externalDependency.purpose,
    `mapping sample SPDX ${declarationKey} purpose must match`
  );
  assertDeepEqual(spdxExtension['av:scope'], scope, `mapping sample SPDX ${declarationKey} scope must match`);
  assert(
    spdxExtension['av:declarationOnly'] === true,
    `mapping sample SPDX ${declarationKey} must be declaration-only`
  );
  assert(
    spdxExtension['av:resolvedEvidence'] === false,
    `mapping sample SPDX ${declarationKey} must deny resolved evidence`
  );
  assert(
    !sampleSpdx.packages.some((spdxPackageCandidate: JsonValue) =>
      spdxPackageCandidate.externalRefs?.some(
        (externalRef: JsonValue) => externalRef.referenceLocator === externalDependency.purl
      )
    ),
    `mapping sample SPDX ${declarationKey} must not project declaration-only dependency as Package inventory`
  );
}

validate(
  'externalDependencyDeclarationsPredicate',
  sampleExternalDependencyPredicate,
  'mapping sample external dependency declarations predicate export'
);
assert(
  sampleExternalDependencyPredicate.predicateType ===
    'https://agentvolumes.org/predicates/external-dependency-declarations/v0.1',
  'mapping sample external dependency predicate must use Agent Volumes predicate type'
);
assert(
  sampleExternalDependencyPredicate.subject.some(
    (subject: JsonValue) => subject.name === sampleRelease.purl && subject.digest?.sha256 === sampleDigest
  ),
  'mapping sample external dependency predicate subject must bind release subject'
);
assert(
  sampleExternalDependencyPredicate.predicate.semantics === 'declaration-only',
  'mapping sample external dependency predicate semantics must be declaration-only'
);
for (const externalDependency of sampleManifest['external-dependencies']) {
  const scope = externalDependency.components ?? [];
  const declarationKey = declarationKeyForSemanticKey({
    purl: externalDependency.purl,
    purpose: externalDependency.purpose,
    scope,
  });
  const predicateDeclaration = sampleExternalDependencyPredicate.predicate.declarations.find(
    (declaration: JsonValue) => declaration.declarationKey === declarationKey
  );
  assert(predicateDeclaration, `mapping sample external dependency predicate needs declaration ${declarationKey}`);
  assert(
    predicateDeclaration.purl === externalDependency.purl,
    `mapping sample external dependency predicate ${declarationKey} purl must match`
  );
  assert(
    predicateDeclaration.constraint === externalDependency.constraint,
    `mapping sample external dependency predicate ${declarationKey} constraint must match`
  );
  assert(
    predicateDeclaration.purpose === externalDependency.purpose,
    `mapping sample external dependency predicate ${declarationKey} purpose must match`
  );
  assertDeepEqual(
    predicateDeclaration.scope,
    scope,
    `mapping sample external dependency predicate ${declarationKey} scope must match`
  );
  assert(
    predicateDeclaration.declarationOnly === true,
    `mapping sample external dependency predicate ${declarationKey} must be declaration-only`
  );
  assert(
    predicateDeclaration.resolvedEvidence === false,
    `mapping sample external dependency predicate ${declarationKey} must deny resolved evidence`
  );
}

assert(
  sampleSlsa._type === 'https://in-toto.io/Statement/v1',
  'mapping sample SLSA export must be in-toto Statement v1'
);
assert(
  sampleSlsa.predicateType === 'https://slsa.dev/provenance/v1',
  'mapping sample SLSA export must use SLSA v1 predicate'
);
assert(
  sampleSlsa.subject.some(
    (subject: JsonValue) => subject.name === sampleRelease.purl && subject.digest?.sha256 === sampleDigest
  ),
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
  sampleSlsa.predicate.materials.some(
    (material: JsonValue) => material.uri === sampleManifest.provenance['source-repo']
  ),
  'mapping sample SLSA materials must include provenance.source-repo'
);
for (const externalDependency of sampleManifest['external-dependencies']) {
  assert(
    !sampleSlsa.subject.some((subject: JsonValue) => subject.name === externalDependency.purl),
    `mapping sample SLSA subject must omit external dependency ${externalDependency.purl}`
  );
  assert(
    !sampleSlsa.predicate.materials.some((material: JsonValue) => material.uri === externalDependency.purl),
    `mapping sample SLSA materials must omit external dependency ${externalDependency.purl}`
  );
}

let openapi: JsonObject;
try {
  openapi = YAML.parse(readText('openapi/bibliotheca.openapi.yaml'));
} catch (error) {
  throw new Error(
    `OpenAPI YAML semantic validation failed: ${error instanceof Error ? error.message : String(error)}`,
    { cause: error }
  );
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
    (parameter: JsonValue) => parameter.in === 'header' && parameter.name === 'Idempotency-Key'
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
    (parameter: JsonValue) => parameter.in === 'header' && parameter.name === 'Idempotency-Key'
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
for (const pathName of [
  '/api/v1/index/volumes/{name}',
  '/api/v1/index/volumes/@{scope}/{name}',
  '/api/v1/volumes/{name}/{version}',
  '/api/v1/volumes/@{scope}/{name}/{version}',
  '/api/v1/volumes/{name}/{version}/trust/summary',
  '/api/v1/volumes/@{scope}/{name}/{version}/trust/summary',
  '/api/v1/volumes/{name}/{version}/trust/detail',
  '/api/v1/volumes/@{scope}/{name}/{version}/trust/detail',
]) {
  assert(
    openapi.paths[pathName]?.get?.responses?.['409']?.$ref === '#/components/responses/Conflict',
    `OpenAPI GET ${pathName} must expose 409 Conflict for inconsistent registry state`
  );
}
assert(openapi.components?.schemas?.ProblemDetails, 'OpenAPI document must define ProblemDetails schema');
for (const [openapiName, schemaDefName] of [
  ['NameSegment', 'nameSegment'],
  ['ScopeName', 'scopeName'],
  ['VolumeName', 'volumeName'],
  ['SemVer', 'semver'],
] as [string, string][]) {
  const openapiSchema = openapi.components?.schemas?.[openapiName];
  const jsonSchema = schemas.volume.$defs[schemaDefName];
  assert(openapiSchema, `OpenAPI document must define ${openapiName} schema`);
  assert(openapiSchema.type === jsonSchema.type, `OpenAPI ${openapiName}.type must match volume schema`);
  assert(openapiSchema.pattern === jsonSchema.pattern, `OpenAPI ${openapiName}.pattern must match volume schema`);
  if (jsonSchema.maxLength !== undefined) {
    assert(
      openapiSchema.maxLength === jsonSchema.maxLength,
      `OpenAPI ${openapiName}.maxLength must match volume schema`
    );
  }
}
assert(
  Array.isArray(openapi.components.schemas.ProblemDetails?.oneOf) &&
    openapi.components.schemas.ProblemDetails.oneOf.length === problemStatusBySlug.size,
  'OpenAPI ProblemDetails must expose one variant for each standalone problem-details type'
);
for (const [slug, status] of problemStatusBySlug) {
  const componentName = `${slug
    .split('-')
    .map((part: JsonValue) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join('')}Problem`;
  const problemSchema = openapi.components.schemas[componentName];
  assert(problemSchema, `OpenAPI ProblemDetails must define ${componentName}`);
  const constraint = problemSchema.allOf?.[1]?.properties;
  assert(
    constraint?.type?.const === `https://agentvolumes.org/problems/${slug}` && constraint?.status?.const === status,
    `OpenAPI ${componentName} must mirror standalone problem type/status mapping`
  );
}
assert(
  openapi.components.schemas.ProblemDetailsBase?.required?.join(',') === schemas.problemDetails.required.join(','),
  'OpenAPI ProblemDetailsBase.required must match standalone schema'
);
assert(
  openapi.components.schemas.SearchResults.$ref === '../schemas/search-results.schema.json',
  'OpenAPI SearchResults must reference standalone search-results schema'
);
assert(
  openapi.components.schemas.VersionIndex?.properties?.items?.items?.$ref ===
    '../schemas/version-index-row.schema.json',
  'OpenAPI VersionIndex must expose version-index-row items while standalone version-index schema validates fixtures'
);
assert(
  openapi.components.schemas.AdvisoryList?.properties?.items?.items?.$ref === '../schemas/advisory.schema.json',
  'OpenAPI AdvisoryList must expose advisory items while standalone advisory-list schema validates fixtures'
);
assert(
  openapi.paths['/api/v1/index/volumes/{name}'].get.responses['200'].content['application/json'].schema.$ref ===
    '#/components/schemas/VersionIndex' &&
    openapi.paths['/api/v1/index/volumes/@{scope}/{name}'].get.responses['200'].content['application/json'].schema
      .$ref === '#/components/schemas/VersionIndex',
  'OpenAPI version index endpoints must use the VersionIndex component'
);
assert(
  openapi.paths['/api/v1/advisories'].get.responses['200'].content['application/json'].schema.$ref ===
    '#/components/schemas/AdvisoryList',
  'OpenAPI advisory list endpoint must use the AdvisoryList component'
);
for (const [responseName, response] of Object.entries(openapi.components.responses) as [string, JsonObject][]) {
  const problemContent = response.content?.['application/problem+json'];
  if (!problemContent) {
    continue;
  }
  assert(problemContent.examples, `OpenAPI ${responseName} problem response must include representative examples`);
  for (const [exampleName, example] of Object.entries(problemContent.examples) as [string, JsonObject][]) {
    assertProblemDetails(example.value, `OpenAPI ${responseName} problem example ${exampleName}`);
  }
}
for (const [pathName, pathItem] of Object.entries(openapi.paths as JsonObject)) {
  for (const [method, operation] of Object.entries(pathItem as JsonObject)) {
    if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) {
      continue;
    }
    assert(operation && typeof operation === 'object', `OpenAPI ${pathName} ${method} must define an operation object`);
    const operationObject = operation as JsonObject;
    for (const parameter of operationObject.parameters ?? []) {
      if (parameter.in !== 'path') {
        continue;
      }
      const expectedRefByName: Record<string, string> = {
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

assertNoUnvalidatedConformanceFixtures();

console.log('Artifact validation passed.');
