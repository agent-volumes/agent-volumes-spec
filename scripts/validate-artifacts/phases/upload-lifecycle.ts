import { assertProblemDetails } from "../assertions/problem-details.ts";
import { assertReleaseMetadata } from "../assertions/release-metadata.ts";
import { assert, assertDeepEqual, assertSpecVersion } from "../core/assert.ts";
import { digestPattern } from "../core/patterns.ts";
import { problemStatusBySlug } from "../core/problem-registry.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

const HTTP_STATUS_CONFLICT = 409;

interface LifecycleProblemDetailsAssertion {
  ctx: ValidationContext;
  failuresByEndpoint: Map<JsonValue, Set<JsonValue>>;
  fixture: JsonValue;
  label: string;
}

interface ReleaseUploadCoverageAssertion {
  expectedFailuresByEndpoint: Map<string, string[]>;
  failuresByEndpoint: Map<JsonValue, Set<JsonValue>>;
  releaseUploadLifecycle: JsonValue;
  vocabulary: UploadSchemaVocabulary;
}

interface ReleaseUploadFixtureAssertion {
  ctx: ValidationContext;
  failuresByEndpoint: Map<JsonValue, Set<JsonValue>>;
  fixture: JsonValue;
  vocabulary: UploadSchemaVocabulary;
}

interface TrustUploadCoverageAssertion {
  coverage: JsonValue;
  expectedFailuresByEndpoint: Map<string, string[]>;
  vocabulary: UploadSchemaVocabulary;
}

interface UploadSchemaVocabulary {
  releaseMediaType: JsonValue;
  releaseStates: JsonValue[];
  trustCategories: JsonValue[];
  trustStates: JsonValue[];
}

function uploadSchemaVocabulary(ctx: ValidationContext): UploadSchemaVocabulary {
  const releaseStates = ctx.schemas.releaseUploadIntent.properties.state.enum;
  const trustStates = ctx.schemas.trustUploadIntent.properties.state.enum;
  const trustCategories =
    ctx.schemas.trustUploadIntent.$defs.attachmentMetadata.properties.category.enum;
  const releaseMediaType = ctx.schemas.releaseUploadIntent.properties.mediaType.const;
  assert(Array.isArray(releaseStates), "release upload state schema vocabulary must be an enum");
  assert(Array.isArray(trustStates), "trust upload state schema vocabulary must be an enum");
  assert(Array.isArray(trustCategories), "trust upload category schema vocabulary must be an enum");
  assert(
    typeof releaseMediaType === "string",
    "release upload media type schema vocabulary must be a const string",
  );
  return { releaseMediaType, releaseStates, trustCategories, trustStates };
}

function endpointKey(operation: JsonValue): string {
  return `${operation.method.toUpperCase()} ${operation.pathName}`;
}

function assertExpectedProblemsAreRegistered(endpointFamily: JsonValue): void {
  for (const expectedProblem of endpointFamily.expectedProblems) {
    assert(
      problemStatusBySlug.has(expectedProblem),
      `OpenAPI operation matrix ${endpointFamily.name} references unknown problem ${expectedProblem}`,
    );
  }
}

function expectedProblemsByEndpoint(
  ctx: ValidationContext,
  familyNames: string[],
): Map<string, string[]> {
  const openapiOperationMatrix = ctx.readJson("conformance/fixtures/openapi-operation-matrix.json");
  const expectedFailuresByEndpoint = new Map<string, string[]>();
  for (const endpointFamily of openapiOperationMatrix.endpointFamilies) {
    if (familyNames.includes(endpointFamily.name)) {
      assertExpectedProblemsAreRegistered(endpointFamily);
      for (const operation of endpointFamily.operations) {
        expectedFailuresByEndpoint.set(endpointKey(operation), endpointFamily.expectedProblems);
      }
    }
  }
  return expectedFailuresByEndpoint;
}

function recordEndpointFailure(
  failuresByEndpoint: Map<JsonValue, Set<JsonValue>>,
  endpoint: JsonValue,
  failureCategory: JsonValue,
): void {
  assert(typeof endpoint === "string", `upload failure ${failureCategory} must declare endpoint`);
  if (!failuresByEndpoint.has(endpoint)) {
    failuresByEndpoint.set(endpoint, new Set());
  }
  failuresByEndpoint.get(endpoint)?.add(failureCategory);
}

function assertEndpointFailures(
  failuresByEndpoint: Map<JsonValue, Set<JsonValue>>,
  expectedFailuresByEndpoint: Map<string, string[]>,
  label: string,
): void {
  for (const [endpoint, expectedFailures] of expectedFailuresByEndpoint) {
    const actualFailures = failuresByEndpoint.get(endpoint) ?? new Set();
    for (const expectedFailure of expectedFailures) {
      assert(
        actualFailures.has(expectedFailure),
        `${label} missing ${expectedFailure} for ${endpoint}`,
      );
    }
  }
}

function assertIdempotencyConflictFixture(fixture: JsonValue, label: string): void {
  if (fixture.expected.failureCategory === "idempotency-conflict") {
    assert(
      typeof fixture.request?.headerIdempotencyKey === "string" &&
        typeof fixture.request?.bodyIdempotencyKey === "string",
      `${label} ${fixture.name} idempotency conflicts must model both header and body keys`,
    );
    assert(
      fixture.request.headerIdempotencyKey !== fixture.request.bodyIdempotencyKey,
      `${label} ${fixture.name} idempotency conflict keys must differ`,
    );
    assert(
      fixture.payload.status === HTTP_STATUS_CONFLICT,
      `${label} ${fixture.name} idempotency conflicts must use HTTP 409`,
    );
    assert(
      fixture.payload.detail.includes("previously used with different"),
      `${label} ${fixture.name} idempotency conflict must describe header/body mismatch semantics`,
    );
  }
}

function assertMatchingIdempotencyKeys(fixture: JsonValue, label: string): void {
  if (!fixture.request?.headerIdempotencyKey || !fixture.request?.bodyIdempotencyKey) {
    return;
  }
  assert(
    fixture.request.headerIdempotencyKey === fixture.request.bodyIdempotencyKey,
    `${label} ${fixture.name} matching idempotency fixture must use equal header and body keys`,
  );
  assert(
    fixture.payload.idempotencyKey === fixture.request.bodyIdempotencyKey,
    `${label} ${fixture.name} response idempotencyKey must echo the body key`,
  );
}

function assertIdempotencyConflictCoverage(fixtures: JsonValue, label: string): void {
  for (const endpointFragment of ["/{name}", "/@{scope}/{name}"]) {
    assert(
      fixtures.some(
        (fixture: JsonValue) =>
          fixture.expected.failureCategory === "idempotency-conflict" &&
          fixture.endpoint.includes(endpointFragment) &&
          fixture.payload.detail.includes("previously used with different"),
      ),
      `${label} must include ${endpointFragment} idempotency header/body mismatch coverage`,
    );
  }
  assert(
    fixtures.some(
      (fixture: JsonValue) =>
        fixture.request?.headerIdempotencyKey === fixture.request?.bodyIdempotencyKey &&
        fixture.payload?.idempotencyKey === fixture.request?.bodyIdempotencyKey,
    ),
    `${label} must include matching header/body idempotency key coverage`,
  );
}

function assertReleaseUploadCoverage({
  expectedFailuresByEndpoint,
  failuresByEndpoint,
  releaseUploadLifecycle,
  vocabulary,
}: ReleaseUploadCoverageAssertion): void {
  const releaseUploadFailures = new Set(
    releaseUploadLifecycle.fixtures
      .filter((fixture: JsonValue) => fixture.schema === "problem-details")
      .map((fixture: JsonValue) => fixture.expected.failureCategory),
  );
  const releaseUploadStates = new Set(
    releaseUploadLifecycle.fixtures
      .filter((fixture: JsonValue) => fixture.schema === "release-upload-intent")
      .map((fixture: JsonValue) => fixture.payload.state),
  );
  for (const requiredState of vocabulary.releaseStates) {
    assert(
      releaseUploadStates.has(requiredState),
      `release upload lifecycle missing ${requiredState} state`,
    );
  }
  for (const failureCategory of [
    "version-conflict",
    "invalid-archive",
    "invalid-manifest",
    "authorization-failed",
    "payload-too-large",
    "unsupported-media-type",
    "identity-mismatch",
    "digest-mismatch",
    "missing-uploaded-bytes",
    "invalid-upload-state",
    "idempotency-conflict",
    "upload-expired",
  ]) {
    assert(
      releaseUploadFailures.has(failureCategory),
      `release upload lifecycle missing ${failureCategory}`,
    );
  }
  assertEndpointFailures(
    failuresByEndpoint,
    expectedFailuresByEndpoint,
    "release upload lifecycle",
  );
}

function assertHttpPutUpload(fixture: JsonValue, label: string): void {
  assert(
    fixture.payload.upload.instructionType === "http-put",
    `${label} ${fixture.name} must use http-put upload instructions`,
  );
  assert(
    typeof fixture.payload.upload.method === "undefined" || fixture.payload.upload.method === "PUT",
    `${label} ${fixture.name} http-put method must be omitted or PUT`,
  );
  assert(fixture.payload.upload.url, `${label} ${fixture.name} http-put upload needs a URL`);
}

function assertExpectedUploadState(fixture: JsonValue, label: string): void {
  if (fixture.expected.state) {
    assert(
      fixture.payload.state === fixture.expected.state,
      `${label} ${fixture.name} expected state must match payload state`,
    );
    assert(
      fixture.expected.finalizable === (fixture.payload.state === "uploaded"),
      `${label} ${fixture.name} finalizable flag must match uploaded-only finalization rule`,
    );
  }
}

function assertReleaseUploadIntent(
  ctx: ValidationContext,
  fixture: JsonValue,
  vocabulary: UploadSchemaVocabulary,
): void {
  ctx.validate("releaseUploadIntent", fixture.payload, `release upload lifecycle ${fixture.name}`);
  assert(
    fixture.payload.mediaType === vocabulary.releaseMediaType,
    `release upload lifecycle ${fixture.name} must use ${vocabulary.releaseMediaType}`,
  );
  assertHttpPutUpload(fixture, "release upload lifecycle");
  assertExpectedUploadState(fixture, "release upload lifecycle");
  assertMatchingIdempotencyKeys(fixture, "release upload lifecycle");
}

function assertReleaseUploadFinalize(ctx: ValidationContext, fixture: JsonValue): void {
  ctx.validate(
    "releaseUploadFinalize",
    fixture.payload,
    `release upload lifecycle ${fixture.name}`,
  );
  assertReleaseMetadata(
    ctx,
    fixture.payload.release,
    `release upload lifecycle ${fixture.name} release metadata`,
  );
}

function assertLifecycleProblemDetails({
  ctx,
  failuresByEndpoint,
  fixture,
  label,
}: LifecycleProblemDetailsAssertion): void {
  assertProblemDetails(ctx, fixture.payload, `${label} ${fixture.name}`);
  assert(
    fixture.payload.type.endsWith(`/${fixture.expected.failureCategory}`),
    `${label} ${fixture.name} failureCategory must match problem type slug`,
  );
  assertIdempotencyConflictFixture(fixture, label);
  recordEndpointFailure(failuresByEndpoint, fixture.endpoint, fixture.expected.failureCategory);
}

function assertReleaseUploadFixture({
  ctx,
  failuresByEndpoint,
  fixture,
  vocabulary,
}: ReleaseUploadFixtureAssertion): void {
  if (fixture.schema === "release-upload-intent") {
    assertReleaseUploadIntent(ctx, fixture, vocabulary);
  }
  if (fixture.schema === "release-upload-finalize") {
    assertReleaseUploadFinalize(ctx, fixture);
  }
  if (fixture.schema === "problem-details") {
    assertLifecycleProblemDetails({
      ctx,
      failuresByEndpoint,
      fixture,
      label: "release upload lifecycle",
    });
  }
}

function assertReleaseUploadLifecycle(ctx: ValidationContext): void {
  const releaseUploadLifecycle = ctx.readJson("conformance/fixtures/release-upload-lifecycle.json");
  assertSpecVersion(ctx, releaseUploadLifecycle, "release upload lifecycle fixture");
  const vocabulary = uploadSchemaVocabulary(ctx);
  const failuresByEndpoint = new Map<JsonValue, Set<JsonValue>>();
  for (const fixture of releaseUploadLifecycle.fixtures) {
    assertReleaseUploadFixture({ ctx, failuresByEndpoint, fixture, vocabulary });
  }
  assertReleaseUploadCoverage({
    expectedFailuresByEndpoint: expectedProblemsByEndpoint(ctx, [
      "Release upload intent",
      "Release upload finalize",
    ]),
    failuresByEndpoint,
    releaseUploadLifecycle,
    vocabulary,
  });
  assertIdempotencyConflictCoverage(releaseUploadLifecycle.fixtures, "release upload lifecycle");
}

function assertTrustUploadIntent(
  ctx: ValidationContext,
  fixture: JsonValue,
  coverage: JsonValue,
): void {
  ctx.validate("trustUploadIntent", fixture.payload, `trust upload lifecycle ${fixture.name}`);
  coverage.categories.add(fixture.payload.attachment.category);
  coverage.states.add(fixture.payload.state);
  assertHttpPutUpload(fixture, "trust upload lifecycle");
  assertExpectedUploadState(fixture, "trust upload lifecycle");
}

function assertTrustUploadFinalize(ctx: ValidationContext, fixture: JsonValue): void {
  ctx.validate("trustUploadFinalize", fixture.payload, `trust upload lifecycle ${fixture.name}`);
  assert(
    digestPattern.test(fixture.payload.artifactDigest),
    `trust upload lifecycle ${fixture.name} must preserve finalized artifact digest`,
  );
}

function assertTrustUploadFixture(
  ctx: ValidationContext,
  fixture: JsonValue,
  coverage: JsonValue,
): void {
  if (fixture.schema === "trust-upload-intent") {
    assertTrustUploadIntent(ctx, fixture, coverage);
  }
  if (fixture.schema === "trust-upload-finalize") {
    assertTrustUploadFinalize(ctx, fixture);
  }
  if (fixture.schema === "problem-details") {
    assertLifecycleProblemDetails({
      ctx,
      failuresByEndpoint: coverage.failuresByEndpoint,
      fixture,
      label: "trust upload lifecycle",
    });
    coverage.failures.add(fixture.expected.failureCategory);
  }
}

function collectTrustUploadCoverage(
  ctx: ValidationContext,
  trustUploadLifecycle: JsonValue,
): JsonValue {
  const coverage = {
    categories: new Set(),
    failures: new Set(),
    failuresByEndpoint: new Map(),
    fixtures: trustUploadLifecycle.fixtures,
    states: new Set(),
  };
  for (const fixture of trustUploadLifecycle.fixtures) {
    assertTrustUploadFixture(ctx, fixture, coverage);
  }
  return coverage;
}

function assertTrustUploadCoverage({
  coverage,
  expectedFailuresByEndpoint,
  vocabulary,
}: TrustUploadCoverageAssertion): void {
  assertDeepEqual(vocabulary.trustStates, vocabulary.releaseStates, "upload lifecycle states");
  for (const requiredState of vocabulary.trustStates) {
    assert(
      coverage.states.has(requiredState),
      `trust upload lifecycle missing ${requiredState} state`,
    );
  }
  for (const requiredTrustUploadCategory of vocabulary.trustCategories.filter(
    (category: JsonValue) => category !== "other",
  )) {
    assert(
      coverage.categories.has(requiredTrustUploadCategory),
      `trust upload lifecycle must include ${requiredTrustUploadCategory} intent`,
    );
  }
  for (const failureCategory of [
    "digest-mismatch",
    "upload-expired",
    "subject-binding-mismatch",
    "missing-uploaded-bytes",
    "idempotency-conflict",
    "invalid-upload-state",
    "payload-too-large",
    "unsupported-media-type",
    "authorization-failed",
  ]) {
    assert(
      coverage.failures.has(failureCategory),
      `trust upload lifecycle missing ${failureCategory}`,
    );
  }
  assertEndpointFailures(
    coverage.failuresByEndpoint,
    expectedFailuresByEndpoint,
    "trust upload lifecycle",
  );
  assertIdempotencyConflictCoverage(coverage.fixtures, "trust upload lifecycle");
}

function assertTrustUploadLifecycle(ctx: ValidationContext): void {
  const trustUploadLifecycle = ctx.readJson("conformance/fixtures/trust-upload-lifecycle.json");
  assertSpecVersion(ctx, trustUploadLifecycle, "trust upload lifecycle fixture");
  const vocabulary = uploadSchemaVocabulary(ctx);
  const coverage = collectTrustUploadCoverage(ctx, trustUploadLifecycle);
  assertTrustUploadCoverage({
    coverage,
    expectedFailuresByEndpoint: expectedProblemsByEndpoint(ctx, [
      "Trust upload intent",
      "Trust upload finalize",
    ]),
    vocabulary,
  });
}

function run(ctx: ValidationContext): void {
  assertReleaseUploadLifecycle(ctx);
  assertTrustUploadLifecycle(ctx);
}

export { run };
