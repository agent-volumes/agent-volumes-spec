import { assertProblemDetails } from "../assertions/problem-details.ts";
import { assertReleaseMetadata } from "../assertions/release-metadata.ts";
import { assert, assertSpecVersion } from "../core/assert.ts";
import { digestPattern } from "../core/patterns.ts";
import { problemStatusBySlug } from "../core/problem-registry.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

interface LifecycleProblemDetailsAssertion {
  ctx: ValidationContext;
  failuresByEndpoint: Map<JsonValue, Set<JsonValue>>;
  fixture: JsonValue;
  label: string;
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

function assertReleaseUploadCoverage(
  releaseUploadLifecycle: JsonValue,
  failuresByEndpoint: Map<JsonValue, Set<JsonValue>>,
  expectedFailuresByEndpoint: Map<string, string[]>,
): void {
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
  for (const requiredState of ["pending-upload", "uploading", "uploaded", "expired", "failed"]) {
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

function assertReleaseUploadIntent(ctx: ValidationContext, fixture: JsonValue): void {
  ctx.validate("releaseUploadIntent", fixture.payload, `release upload lifecycle ${fixture.name}`);
  assert(
    fixture.payload.mediaType === "application/gzip",
    `release upload lifecycle ${fixture.name} must use application/gzip`,
  );
  assertHttpPutUpload(fixture, "release upload lifecycle");
  assertExpectedUploadState(fixture, "release upload lifecycle");
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
  recordEndpointFailure(failuresByEndpoint, fixture.endpoint, fixture.expected.failureCategory);
}

function assertReleaseUploadFixture(
  ctx: ValidationContext,
  fixture: JsonValue,
  failuresByEndpoint: Map<JsonValue, Set<JsonValue>>,
): void {
  if (fixture.schema === "release-upload-intent") {
    assertReleaseUploadIntent(ctx, fixture);
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
  const failuresByEndpoint = new Map<JsonValue, Set<JsonValue>>();
  for (const fixture of releaseUploadLifecycle.fixtures) {
    assertReleaseUploadFixture(ctx, fixture, failuresByEndpoint);
  }
  assertReleaseUploadCoverage(
    releaseUploadLifecycle,
    failuresByEndpoint,
    expectedProblemsByEndpoint(ctx, ["Release upload intent", "Release upload finalize"]),
  );
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
    states: new Set(),
  };
  for (const fixture of trustUploadLifecycle.fixtures) {
    assertTrustUploadFixture(ctx, fixture, coverage);
  }
  return coverage;
}

function assertTrustUploadCoverage(
  coverage: JsonValue,
  expectedFailuresByEndpoint: Map<string, string[]>,
): void {
  for (const requiredState of ["pending-upload", "uploading", "uploaded", "expired", "failed"]) {
    assert(
      coverage.states.has(requiredState),
      `trust upload lifecycle missing ${requiredState} state`,
    );
  }
  for (const requiredTrustUploadCategory of ["bom", "provenance", "signature"]) {
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
}

function assertTrustUploadLifecycle(ctx: ValidationContext): void {
  const trustUploadLifecycle = ctx.readJson("conformance/fixtures/trust-upload-lifecycle.json");
  assertSpecVersion(ctx, trustUploadLifecycle, "trust upload lifecycle fixture");
  const coverage = collectTrustUploadCoverage(ctx, trustUploadLifecycle);
  assertTrustUploadCoverage(
    coverage,
    expectedProblemsByEndpoint(ctx, ["Trust upload intent", "Trust upload finalize"]),
  );
}

function run(ctx: ValidationContext): void {
  assertReleaseUploadLifecycle(ctx);
  assertTrustUploadLifecycle(ctx);
}

export { run };
