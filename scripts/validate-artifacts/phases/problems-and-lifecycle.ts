import {
  assertEndpointProblemFixtures,
  assertLifecycleMutationFixtures,
  assertProblemDetails,
} from "../assertions/problem-details.ts";
import { assert, assertDeepEqual, assertSpecVersion } from "../core/assert.ts";
import { problemStatusBySlug } from "../core/problem-registry.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

const PROBLEM_TYPE_PREFIX = "https://agentvolumes.org/problems/";

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

function assertProblemDetailsCases(ctx: ValidationContext): void {
  const problemDetailsCases = ctx.readJson("conformance/fixtures/problem-details-cases.json");
  assertSpecVersion(ctx, problemDetailsCases, "problem details cases");
  assert(
    problemDetailsCases.cases.length === problemStatusBySlug.size,
    "problem details cases must cover every baseline problem type",
  );
  for (const problemCase of problemDetailsCases.cases) {
    assertProblemDetails(ctx, problemCase, `problem details case ${problemCase.type}`);
  }
  for (const slug of problemStatusBySlug.keys()) {
    assert(
      problemDetailsCases.cases.some((problemCase: JsonValue) =>
        problemCase.type.endsWith(`/${slug}`),
      ),
      `problem details cases missing ${slug}`,
    );
  }
}

function problemTypesFromRegistry(problemRegistry: JsonValue): string[] {
  return problemRegistry.problems.map((problem: JsonValue) => problem.type);
}

function problemSlugsFromRegistry(problemRegistry: JsonValue): string[] {
  return problemRegistry.problems.map((problem: JsonValue) => problem.slug);
}

function problemStatusByTypeFromRegistry(problemRegistry: JsonValue): Map<string, number> {
  return new Map(
    problemRegistry.problems.map((problem: JsonValue) => [problem.type, problem.status]),
  );
}

function problemDetailsStatusConstraints(ctx: ValidationContext): Map<string, number> {
  return new Map(
    ctx.schemas.problemDetails.allOf.map((constraint: JsonValue) => [
      constraint.if.properties.type.const,
      constraint.then.properties.status.const,
    ]),
  );
}

function assertProblemDetailsStatusConstraints(
  ctx: ValidationContext,
  problemRegistry: JsonValue,
): void {
  const expectedStatusByType = problemStatusByTypeFromRegistry(problemRegistry);
  const actualStatusByType = problemDetailsStatusConstraints(ctx);
  assert(
    actualStatusByType.size === expectedStatusByType.size,
    "problem-details schema must constrain every registered problem type",
  );
  for (const [type, status] of expectedStatusByType) {
    assert(
      actualStatusByType.get(type) === status,
      `${type} status constraint must match problem registry`,
    );
  }
}

function assertProblemTaxonomyParity(ctx: ValidationContext, problemRegistry: JsonValue): void {
  const registryTypes = problemTypesFromRegistry(problemRegistry);
  const registrySlugs = problemSlugsFromRegistry(problemRegistry);
  assertDeepEqual(
    registrySlugs,
    ctx.schemas.problemRegistry.$defs.problemSlug.enum,
    "problem registry slug enum",
  );
  assertDeepEqual(
    registryTypes,
    ctx.schemas.problemRegistry.$defs.problemType.enum,
    "problem registry type enum",
  );
  assertDeepEqual(
    registryTypes,
    ctx.schemas.problemDetails.properties.type.enum,
    "problem-details type enum",
  );
  for (const [index, type] of registryTypes.entries()) {
    assert(
      type === `${PROBLEM_TYPE_PREFIX}${registrySlugs[index]}`,
      `problem taxonomy ${registrySlugs[index]} type must use reserved prefix`,
    );
  }
  assertProblemDetailsStatusConstraints(ctx, problemRegistry);
}

function assertProblemRegistry(ctx: ValidationContext): void {
  const problemRegistry = ctx.readJson("conformance/fixtures/problem-registry.json");
  ctx.validate("problemRegistry", problemRegistry, "problem registry fixture");
  assertSpecVersion(ctx, problemRegistry, "problem registry fixture");
  assert(
    problemRegistry.problems.length === problemStatusBySlug.size,
    "problem registry must cover every baseline problem type",
  );
  for (const problem of problemRegistry.problems) {
    assert(
      problem.type.endsWith(`/${problem.slug}`),
      `problem registry ${problem.slug} type must end with slug`,
    );
    assert(
      problem.status === problemStatusBySlug.get(problem.slug),
      `problem registry ${problem.slug} status must match`,
    );
  }
  assertProblemTaxonomyParity(ctx, problemRegistry);
}

function assertSearchProblemFixtures(ctx: ValidationContext): void {
  assertEndpointProblemFixtures({
    ctx,
    expectedFailuresByEndpoint: expectedProblemsByEndpoint(ctx, ["Catalog search"]),
    label: "catalog search failure cases",
    relativePath: "conformance/fixtures/catalog-search-failure-cases.json",
  });
  assertEndpointProblemFixtures({
    ctx,
    expectedFailuresByEndpoint: expectedProblemsByEndpoint(ctx, ["Advisory search"]),
    label: "advisory search failure cases",
    relativePath: "conformance/fixtures/advisory-search-failure-cases.json",
  });
  assertEndpointProblemFixtures({
    ctx,
    expectedFailuresByEndpoint: expectedProblemsByEndpoint(ctx, ["Advisory detail"]),
    label: "advisory detail failure cases",
    relativePath: "conformance/fixtures/advisory-detail-failure-cases.json",
  });
}

function assertLifecycleProblemFixtures(ctx: ValidationContext): void {
  assertLifecycleMutationFixtures({
    ctx,
    expectedFailuresByEndpoint: expectedProblemsByEndpoint(ctx, ["Unpublish / lifecycle mutation"]),
    label: "lifecycle mutation cases",
    relativePath: "conformance/fixtures/lifecycle-mutation-cases.json",
  });
}

function assertReleaseMetadataProblemFixtures(ctx: ValidationContext): void {
  assertEndpointProblemFixtures({
    ctx,
    expectedFailuresByEndpoint: expectedProblemsByEndpoint(ctx, ["Exact release metadata"]),
    label: "exact release metadata failure cases",
    relativePath: "conformance/fixtures/exact-release-metadata-failure-cases.json",
  });
}

function assertVersionIndexProblemFixtures(ctx: ValidationContext): void {
  assertEndpointProblemFixtures({
    ctx,
    expectedFailuresByEndpoint: expectedProblemsByEndpoint(ctx, ["Version index"]),
    label: "version index failure cases",
    relativePath: "conformance/fixtures/version-index-failure-cases.json",
  });
}

function assertCapabilityProblemFixtures(ctx: ValidationContext): void {
  assertEndpointProblemFixtures({
    ctx,
    expectedFailuresByEndpoint: expectedProblemsByEndpoint(ctx, ["Capability metadata"]),
    label: "capability metadata failure cases",
    relativePath: "conformance/fixtures/capability-metadata-failure-cases.json",
  });
}

function assertTrustProblemFixtures(ctx: ValidationContext): void {
  assertEndpointProblemFixtures({
    ctx,
    expectedFailuresByEndpoint: expectedProblemsByEndpoint(ctx, ["Trust summary"]),
    label: "trust summary failure cases",
    relativePath: "conformance/fixtures/trust-summary-failure-cases.json",
  });
  assertEndpointProblemFixtures({
    ctx,
    expectedFailuresByEndpoint: expectedProblemsByEndpoint(ctx, ["Trust detail"]),
    label: "trust detail failure cases",
    relativePath: "conformance/fixtures/trust-detail-failure-cases.json",
  });
}

function run(ctx: ValidationContext): void {
  assertProblemDetailsCases(ctx);
  assertProblemRegistry(ctx);
  assertSearchProblemFixtures(ctx);
  assertLifecycleProblemFixtures(ctx);
  assertReleaseMetadataProblemFixtures(ctx);
  assertVersionIndexProblemFixtures(ctx);
  assertCapabilityProblemFixtures(ctx);
  assertTrustProblemFixtures(ctx);
}

export { run };
