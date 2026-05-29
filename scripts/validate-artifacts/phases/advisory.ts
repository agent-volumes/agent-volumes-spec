import { assert, assertSpecVersion } from "../core/assert.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

function validateBaselineAdvisoryFixtures(ctx: ValidationContext): void {
  ctx.validate("advisory", ctx.readJson("conformance/fixtures/advisory.json"), "advisory fixture");
  ctx.validate(
    "advisory",
    ctx.readJson("conformance/fixtures/advisory-withdrawn.json"),
    "withdrawn advisory fixture",
  );
  ctx.validate(
    "advisoryList",
    ctx.readJson("conformance/fixtures/advisory-list.json"),
    "advisory list fixture",
  );
  ctx.validate(
    "searchResults",
    ctx.readJson("conformance/fixtures/search-results.json"),
    "search results fixture",
  );
}

function assertAdvisoryTargetsVolume(advisory: JsonValue, label: string): void {
  assert(advisory.affected?.volume, `${label} must declare affected.volume`);
  assert(!advisory.affected?.component, `${label} must not use component-level targeting`);
  for (const impact of advisory.affected?.componentImpact ?? []) {
    assert(
      typeof impact.note === "string",
      `${label} componentImpact must remain informational metadata`,
    );
  }
}

function assertBaselineAdvisorySemantics(ctx: ValidationContext): void {
  const advisory = ctx.readJson("conformance/fixtures/advisory.json");
  assert(
    ctx.readJson("conformance/fixtures/advisory-withdrawn.json").withdrawn?.at,
    "withdrawn advisory fixture must include withdrawn.at",
  );
  assert(
    advisory.affected.ranges.some((range: JsonValue) =>
      range.events.some((event: JsonValue) => "limit" in event),
    ),
    "advisory fixture must exercise limit event semantics",
  );
  assertAdvisoryTargetsVolume(advisory, "advisory fixture");
}

function readAdvisoryValidationCases(ctx: ValidationContext): JsonValue {
  const advisoryValidationCases = ctx.readJson(
    "conformance/fixtures/advisory-validation-cases.json",
  );
  ctx.validate(
    "advisoryValidationCase",
    advisoryValidationCases,
    "advisory validation cases fixture",
  );
  assertSpecVersion(ctx, advisoryValidationCases, "advisory validation cases fixture");
  return advisoryValidationCases;
}

function validateAdvisoryValidationCases(
  ctx: ValidationContext,
  advisoryValidationCases: JsonValue,
): void {
  for (const advisoryCase of advisoryValidationCases.cases) {
    if (advisoryCase.expected.valid) {
      ctx.validate(
        "advisory",
        advisoryCase.payload,
        `advisory validation case ${advisoryCase.name}`,
      );
      assertAdvisoryTargetsVolume(
        advisoryCase.payload,
        `advisory validation case ${advisoryCase.name}`,
      );
    } else {
      ctx.validateExpectedFailure(
        "advisory",
        advisoryCase.payload,
        `advisory validation case ${advisoryCase.name}`,
      );
    }
  }
}

function assertAdvisoryRelationshipCoverage(advisoryValidationCases: JsonValue): void {
  const advisoryRelationshipTypes = new Set(
    advisoryValidationCases.cases.flatMap((advisoryCase: JsonValue) =>
      (advisoryCase.payload.relationships ?? []).map(
        (relationship: JsonValue) => relationship.type,
      ),
    ),
  );
  for (const relationshipType of ["supersedes", "superseded-by", "related", "duplicate-of"]) {
    assert(
      advisoryRelationshipTypes.has(relationshipType),
      `advisory validation cases missing ${relationshipType}`,
    );
  }
  assert(
    advisoryValidationCases.cases.some(
      (advisoryCase: JsonValue) =>
        advisoryCase.expected.failureCategory === "invalid-advisory-relationship",
    ),
    "advisory validation cases must include invalid relationship failure",
  );
  assert(
    advisoryValidationCases.cases.some(
      (advisoryCase: JsonValue) => advisoryCase.payload.affected?.componentImpact,
    ),
    "advisory validation cases must exercise informational componentImpact metadata",
  );
}

function run(ctx: ValidationContext): void {
  validateBaselineAdvisoryFixtures(ctx);
  assertBaselineAdvisorySemantics(ctx);
  const advisoryValidationCases = readAdvisoryValidationCases(ctx);
  validateAdvisoryValidationCases(ctx, advisoryValidationCases);
  assertAdvisoryRelationshipCoverage(advisoryValidationCases);
}

export { run };
