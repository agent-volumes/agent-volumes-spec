import { assert, assertSpecVersion } from "../core/assert.ts";
import { HTTP_ACCEPTED } from "../core/numeric-constants.ts";
import { problemTypePattern } from "../core/patterns.ts";
import { problemStatusBySlug } from "../core/problem-registry.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

interface ProblemFixtureAssertion {
  ctx: ValidationContext;
  relativePath: JsonValue;
  label: JsonValue;
  expectedFailuresByEndpoint: JsonValue;
}

interface ProblemFixtureFailureAssertion {
  ctx: ValidationContext;
  label: JsonValue;
  expectedFailuresByEndpoint: JsonValue;
  fixture: JsonValue;
}

interface EndpointProblemFixtureAssertion extends ProblemFixtureFailureAssertion {
  actualFailuresByEndpoint: Map<JsonValue, Set<JsonValue>>;
}

interface LifecycleMutationFixtureAssertion extends ProblemFixtureFailureAssertion {
  actualFailuresByEndpoint: Map<JsonValue, Set<JsonValue>>;
  actualSuccessesByEndpoint: Map<JsonValue, Set<JsonValue>>;
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

function assertProblemFixtureFailure({
  ctx,
  label,
  expectedFailuresByEndpoint,
  fixture,
}: ProblemFixtureFailureAssertion): void {
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
}

function recordEndpointValue(
  valuesByEndpoint: Map<JsonValue, Set<JsonValue>>,
  endpoint: JsonValue,
  value: JsonValue,
): void {
  if (!valuesByEndpoint.has(endpoint)) {
    valuesByEndpoint.set(endpoint, new Set());
  }
  valuesByEndpoint.get(endpoint)?.add(value);
}

function assertLifecycleSuccessFixture(
  label: JsonValue,
  actualSuccessesByEndpoint: Map<JsonValue, Set<JsonValue>>,
  fixture: JsonValue,
): void {
  assert(
    fixture.expected.valid === true,
    `${label} ${fixture.name} success case must be expected valid`,
  );
  assert(
    fixture.expected.status === HTTP_ACCEPTED,
    `${label} ${fixture.name} success case must expect HTTP 202`,
  );
  assert(fixture.payload === null, `${label} ${fixture.name} empty response payload must be null`);
  assert(
    ["accepted", "tombstoned"].includes(fixture.expected.lifecycleState),
    `${label} ${fixture.name} empty response must model accepted or tombstoned lifecycle state`,
  );
  recordEndpointValue(actualSuccessesByEndpoint, fixture.endpoint, fixture.expected.lifecycleState);
}

interface LifecycleOutcomeAssertion {
  label: JsonValue;
  expectedFailuresByEndpoint: JsonValue;
  actualFailuresByEndpoint: Map<JsonValue, Set<JsonValue>>;
  actualSuccessesByEndpoint: Map<JsonValue, Set<JsonValue>>;
}

interface EndpointFailureExpectation {
  label: JsonValue;
  endpoint: JsonValue;
  expectedFailures: JsonValue[];
  actualFailuresByEndpoint: Map<JsonValue, Set<JsonValue>>;
}

function assertEndpointExpectedFailures({
  label,
  endpoint,
  expectedFailures,
  actualFailuresByEndpoint,
}: EndpointFailureExpectation): void {
  const actualFailures = actualFailuresByEndpoint.get(endpoint) ?? new Set();
  for (const expectedFailure of expectedFailures) {
    assert(
      actualFailures.has(expectedFailure),
      `${label} missing ${expectedFailure} for ${endpoint}`,
    );
  }
}

function assertEndpointExpectedSuccesses(
  label: JsonValue,
  endpoint: JsonValue,
  actualSuccessesByEndpoint: Map<JsonValue, Set<JsonValue>>,
): void {
  const actualSuccesses = actualSuccessesByEndpoint.get(endpoint) ?? new Set();
  for (const expectedSuccess of ["accepted", "tombstoned"]) {
    assert(
      actualSuccesses.has(expectedSuccess),
      `${label} missing ${expectedSuccess} success for ${endpoint}`,
    );
  }
}

function assertExpectedLifecycleOutcomes({
  label,
  expectedFailuresByEndpoint,
  actualFailuresByEndpoint,
  actualSuccessesByEndpoint,
}: LifecycleOutcomeAssertion): void {
  for (const [endpoint, expectedFailures] of expectedFailuresByEndpoint) {
    assertEndpointExpectedFailures({ actualFailuresByEndpoint, endpoint, expectedFailures, label });
    assertEndpointExpectedSuccesses(label, endpoint, actualSuccessesByEndpoint);
  }
}

function assertExpectedFailures(
  label: JsonValue,
  expectedFailuresByEndpoint: JsonValue,
  actualFailuresByEndpoint: Map<JsonValue, Set<JsonValue>>,
): void {
  for (const [endpoint, expectedFailures] of expectedFailuresByEndpoint) {
    assertEndpointExpectedFailures({ actualFailuresByEndpoint, endpoint, expectedFailures, label });
  }
}

function assertEndpointProblemFixture({
  ctx,
  label,
  expectedFailuresByEndpoint,
  actualFailuresByEndpoint,
  fixture,
}: EndpointProblemFixtureAssertion): void {
  assert(
    fixture.schema === "problem-details",
    `${label} ${fixture.name} must use problem-details schema`,
  );
  assertProblemFixtureFailure({ ctx, expectedFailuresByEndpoint, fixture, label });
  recordEndpointValue(actualFailuresByEndpoint, fixture.endpoint, fixture.expected.failureCategory);
}

function assertLifecycleMutationFixture({
  ctx,
  label,
  expectedFailuresByEndpoint,
  actualFailuresByEndpoint,
  actualSuccessesByEndpoint,
  fixture,
}: LifecycleMutationFixtureAssertion): void {
  assert(fixture.endpoint, `${label} ${fixture.name} must declare endpoint`);
  assert(
    expectedFailuresByEndpoint.has(fixture.endpoint),
    `${label} ${fixture.name} uses unexpected endpoint ${fixture.endpoint}`,
  );
  if (fixture.schema === "problem-details") {
    assertProblemFixtureFailure({ ctx, expectedFailuresByEndpoint, fixture, label });
    recordEndpointValue(
      actualFailuresByEndpoint,
      fixture.endpoint,
      fixture.expected.failureCategory,
    );
  } else if (fixture.schema === "empty-response") {
    assertLifecycleSuccessFixture(label, actualSuccessesByEndpoint, fixture);
  } else {
    assert(false, `${label} ${fixture.name} uses unsupported schema ${fixture.schema}`);
  }
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
  const actualFailuresByEndpoint = new Map<JsonValue, Set<JsonValue>>();
  for (const fixture of fixtureSet.fixtures) {
    assertEndpointProblemFixture({
      actualFailuresByEndpoint,
      ctx,
      expectedFailuresByEndpoint,
      fixture,
      label,
    });
  }
  assertExpectedFailures(label, expectedFailuresByEndpoint, actualFailuresByEndpoint);
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
  const actualFailuresByEndpoint = new Map<JsonValue, Set<JsonValue>>();
  const actualSuccessesByEndpoint = new Map<JsonValue, Set<JsonValue>>();

  for (const fixture of fixtureSet.fixtures) {
    assertLifecycleMutationFixture({
      actualFailuresByEndpoint,
      actualSuccessesByEndpoint,
      ctx,
      expectedFailuresByEndpoint,
      fixture,
      label,
    });
  }

  assertExpectedLifecycleOutcomes({
    actualFailuresByEndpoint,
    actualSuccessesByEndpoint,
    expectedFailuresByEndpoint,
    label,
  });
}

export { assertEndpointProblemFixtures, assertLifecycleMutationFixtures, assertProblemDetails };
