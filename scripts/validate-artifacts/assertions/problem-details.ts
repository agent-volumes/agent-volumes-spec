import { assert, assertSpecVersion } from "../core/assert.ts";
import { HTTP_ACCEPTED } from "../core/numeric-constants.ts";
import { problemStatusBySlug, problemTypePattern } from "../core/patterns.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

interface ProblemFixtureAssertion {
  ctx: ValidationContext;
  relativePath: JsonValue;
  label: JsonValue;
  expectedFailuresByEndpoint: JsonValue;
}

function assertProblemDetails(ctx: ValidationContext, payload: JsonValue, label: JsonValue): void {
  ctx.validate("problemDetails", payload, label);
  assert(problemTypePattern.test(payload.type), `${label} must use Agent Volumes problem type URI`);
  const slug = payload.type.replace("https://agentvolumes.org/problems/", "");
  assert(problemStatusBySlug.has(slug), `${label} uses unknown problem type: ${slug}`);
  assert(typeof payload.title === "string", `${label} needs problem title`);
  assert(typeof payload.status === "number", `${label} needs numeric problem status`);
  assert(
    payload.status === problemStatusBySlug.get(slug),
    `${label} status must match problem type ${slug}`,
  );
}

function assertEndpointProblemFixtures({
  ctx,
  relativePath,
  label,
  expectedFailuresByEndpoint,
}: ProblemFixtureAssertion): void {
  const fixtureSet = ctx.readJson(relativePath);
  assertSpecVersion(ctx, fixtureSet, label);
  assert(Array.isArray(fixtureSet.fixtures), `${label} must contain fixtures`);
  const actualFailuresByEndpoint = new Map();
  for (const fixture of fixtureSet.fixtures) {
    assert(
      fixture.schema === "problem-details",
      `${label} ${fixture.name} must use problem-details schema`,
    );
    assert(fixture.endpoint, `${label} ${fixture.name} must declare endpoint`);
    assert(
      expectedFailuresByEndpoint.has(fixture.endpoint),
      `${label} ${fixture.name} uses unexpected endpoint ${fixture.endpoint}`,
    );
    assert(
      expectedFailuresByEndpoint.get(fixture.endpoint).includes(fixture.expected.failureCategory),
      `${label} ${fixture.name} uses unexpected failureCategory ${fixture.expected.failureCategory} for ${fixture.endpoint}`,
    );
    assertProblemDetails(ctx, fixture.payload, `${label} ${fixture.name}`);
    assert(
      fixture.payload.type.endsWith(`/${fixture.expected.failureCategory}`),
      `${label} ${fixture.name} failureCategory must match problem type slug`,
    );
    if (!actualFailuresByEndpoint.has(fixture.endpoint)) {
      actualFailuresByEndpoint.set(fixture.endpoint, new Set());
    }
    actualFailuresByEndpoint.get(fixture.endpoint).add(fixture.expected.failureCategory);
  }
  for (const [endpoint, expectedFailures] of expectedFailuresByEndpoint) {
    const actualFailures = actualFailuresByEndpoint.get(endpoint) ?? new Set();
    for (const expectedFailure of expectedFailures) {
      assert(
        actualFailures.has(expectedFailure),
        `${label} missing ${expectedFailure} for ${endpoint}`,
      );
    }
  }
}

function assertLifecycleMutationFixtures({
  ctx,
  relativePath,
  label,
  expectedFailuresByEndpoint,
}: ProblemFixtureAssertion): void {
  const fixtureSet = ctx.readJson(relativePath);
  assertSpecVersion(ctx, fixtureSet, label);
  assert(Array.isArray(fixtureSet.fixtures), `${label} must contain fixtures`);
  const actualFailuresByEndpoint = new Map();
  const actualSuccessesByEndpoint = new Map();

  for (const fixture of fixtureSet.fixtures) {
    assert(fixture.endpoint, `${label} ${fixture.name} must declare endpoint`);
    assert(
      expectedFailuresByEndpoint.has(fixture.endpoint),
      `${label} ${fixture.name} uses unexpected endpoint ${fixture.endpoint}`,
    );

    if (fixture.schema === "problem-details") {
      assert(
        expectedFailuresByEndpoint.get(fixture.endpoint).includes(fixture.expected.failureCategory),
        `${label} ${fixture.name} uses unexpected failureCategory ${fixture.expected.failureCategory} for ${fixture.endpoint}`,
      );
      assertProblemDetails(ctx, fixture.payload, `${label} ${fixture.name}`);
      assert(
        fixture.payload.type.endsWith(`/${fixture.expected.failureCategory}`),
        `${label} ${fixture.name} failureCategory must match problem type slug`,
      );
      if (!actualFailuresByEndpoint.has(fixture.endpoint)) {
        actualFailuresByEndpoint.set(fixture.endpoint, new Set());
      }
      actualFailuresByEndpoint.get(fixture.endpoint).add(fixture.expected.failureCategory);
    } else if (fixture.schema === "empty-response") {
      assert(
        fixture.expected.valid === true,
        `${label} ${fixture.name} success case must be expected valid`,
      );
      assert(
        fixture.expected.status === HTTP_ACCEPTED,
        `${label} ${fixture.name} success case must expect HTTP 202`,
      );
      if (!actualSuccessesByEndpoint.has(fixture.endpoint)) {
        actualSuccessesByEndpoint.set(fixture.endpoint, new Set());
      }

      assert(
        fixture.payload === null,
        `${label} ${fixture.name} empty response payload must be null`,
      );
      assert(
        ["accepted", "tombstoned"].includes(fixture.expected.lifecycleState),
        `${label} ${fixture.name} empty response must model accepted or tombstoned lifecycle state`,
      );
      actualSuccessesByEndpoint.get(fixture.endpoint).add(fixture.expected.lifecycleState);
    } else {
      assert(false, `${label} ${fixture.name} uses unsupported schema ${fixture.schema}`);
    }
  }

  for (const [endpoint, expectedFailures] of expectedFailuresByEndpoint) {
    const actualFailures = actualFailuresByEndpoint.get(endpoint) ?? new Set();
    for (const expectedFailure of expectedFailures) {
      assert(
        actualFailures.has(expectedFailure),
        `${label} missing ${expectedFailure} for ${endpoint}`,
      );
    }

    const actualSuccesses = actualSuccessesByEndpoint.get(endpoint) ?? new Set();
    for (const expectedSuccess of ["accepted", "tombstoned"]) {
      assert(
        actualSuccesses.has(expectedSuccess),
        `${label} missing ${expectedSuccess} success for ${endpoint}`,
      );
    }
  }
}

export { assertEndpointProblemFixtures, assertLifecycleMutationFixtures, assertProblemDetails };
