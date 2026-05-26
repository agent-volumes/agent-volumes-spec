import { assert, assertSpecVersion } from "../core/assert.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

export function run(ctx: ValidationContext): void {
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
  assert(
    ctx.readJson("conformance/fixtures/advisory-withdrawn.json").withdrawn?.at,
    "withdrawn advisory fixture must include withdrawn.at",
  );
  assert(
    ctx
      .readJson("conformance/fixtures/advisory.json")
      .affected.ranges.some((range: JsonValue) =>
        range.events.some((event: JsonValue) => "limit" in event),
      ),
    "advisory fixture must exercise limit event semantics",
  );

  const advisoryValidationCases = ctx.readJson(
    "conformance/fixtures/advisory-validation-cases.json",
  );
  ctx.validate(
    "advisoryValidationCase",
    advisoryValidationCases,
    "advisory validation cases fixture",
  );
  assertSpecVersion(ctx, advisoryValidationCases, "advisory validation cases fixture");
  for (const advisoryCase of advisoryValidationCases.cases) {
    if (advisoryCase.expected.valid) {
      ctx.validate(
        "advisory",
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
