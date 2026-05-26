import {
  assertEndpointProblemFixtures,
  assertLifecycleMutationFixtures,
  assertProblemDetails,
} from "../assertions/problem-details.ts";
import { assert, assertSpecVersion } from "../core/assert.ts";
import { problemStatusBySlug } from "../core/patterns.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

export const run = (ctx: ValidationContext) => {
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

  assertEndpointProblemFixtures(
    ctx,
    "conformance/fixtures/catalog-search-failure-cases.json",
    "catalog search failure cases",
    new Map([["GET /api/v1/search", ["validation-failed", "rate-limited"]]]),
  );
  assertEndpointProblemFixtures(
    ctx,
    "conformance/fixtures/advisory-search-failure-cases.json",
    "advisory search failure cases",
    new Map([["GET /api/v1/advisories", ["validation-failed", "rate-limited"]]]),
  );
  assertLifecycleMutationFixtures(
    ctx,
    "conformance/fixtures/lifecycle-mutation-cases.json",
    "lifecycle mutation cases",
    new Map([
      [
        "DELETE /api/v1/volumes/{name}/{version}",
        [
          "authentication-required",
          "authorization-failed",
          "not-found",
          "inconsistent-registry-state",
          "rate-limited",
        ],
      ],
      [
        "DELETE /api/v1/volumes/@{scope}/{name}/{version}",
        [
          "authentication-required",
          "authorization-failed",
          "not-found",
          "inconsistent-registry-state",
          "rate-limited",
        ],
      ],
    ]),
  );
  assertEndpointProblemFixtures(
    ctx,
    "conformance/fixtures/trust-summary-failure-cases.json",
    "trust summary failure cases",
    new Map([
      [
        "GET /api/v1/volumes/{name}/{version}/trust/summary",
        ["not-found", "inconsistent-registry-state", "rate-limited"],
      ],
      [
        "GET /api/v1/volumes/@{scope}/{name}/{version}/trust/summary",
        ["not-found", "inconsistent-registry-state", "rate-limited"],
      ],
    ]),
  );
  assertEndpointProblemFixtures(
    ctx,
    "conformance/fixtures/trust-detail-failure-cases.json",
    "trust detail failure cases",
    new Map([
      [
        "GET /api/v1/volumes/{name}/{version}/trust/detail",
        ["not-found", "inconsistent-registry-state", "rate-limited"],
      ],
      [
        "GET /api/v1/volumes/@{scope}/{name}/{version}/trust/detail",
        ["not-found", "inconsistent-registry-state", "rate-limited"],
      ],
    ]),
  );
};
