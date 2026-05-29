import { assert, assertSpecVersion } from "../core/assert.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

const semverCollator = new Intl.Collator("en", { numeric: true, sensitivity: "case" });
const COMPARE_EQUAL = 0;
const COMPARE_BEFORE = -1;
const COMPARE_AFTER = 1;

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

function eventKind(event: JsonValue): string {
  const [kind] = Object.keys(event);
  assert(kind, "advisory range event must declare an event kind");
  return kind;
}

function eventVersion(event: JsonValue): string {
  return event[eventKind(event)];
}

function compareAdvisoryVersions(left: string, right: string): number {
  if (left === right) {
    return COMPARE_EQUAL;
  }
  if (left === "0") {
    return COMPARE_BEFORE;
  }
  if (right === "0") {
    return COMPARE_AFTER;
  }
  return semverCollator.compare(left, right);
}

function closesInvalidRange(event: JsonValue, lowerBound: string, hasOpenRange: boolean): boolean {
  return !hasOpenRange || compareAdvisoryVersions(eventVersion(event), lowerBound) <= COMPARE_EQUAL;
}

function nextRangeState(
  event: JsonValue,
  lowerBound: string,
  hasOpenRange: boolean,
): { invalid: boolean; lowerBound: string; open: boolean } {
  const kind = eventKind(event);
  if (kind === "introduced") {
    return { invalid: hasOpenRange, lowerBound: eventVersion(event), open: true };
  }
  if (["fixed", "lastAffected", "limit"].includes(kind)) {
    return {
      invalid: closesInvalidRange(event, lowerBound, hasOpenRange),
      lowerBound,
      open: false,
    };
  }
  return { invalid: false, lowerBound, open: hasOpenRange };
}

function hasInvalidRangeEventOrder(events: JsonValue): boolean {
  let lowerBound = "0";
  let hasOpenRange = false;
  for (const event of events) {
    const {
      invalid,
      lowerBound: nextLowerBound,
      open,
    } = nextRangeState(event, lowerBound, hasOpenRange);
    if (invalid) {
      return true;
    }
    lowerBound = nextLowerBound;
    hasOpenRange = open;
  }
  return false;
}

function assertInvalidAdvisoryRangeEvents(advisoryCase: JsonValue): void {
  assert(
    advisoryCase.payload.affected.ranges.some((range: JsonValue) =>
      hasInvalidRangeEventOrder(range.events),
    ),
    `advisory validation case ${advisoryCase.name} must contain invalid range event semantics`,
  );
}

function validateAdvisoryValidationCases(
  ctx: ValidationContext,
  advisoryValidationCases: JsonValue,
): void {
  for (const advisoryCase of advisoryValidationCases.cases) {
    const label = `advisory validation case ${advisoryCase.name}`;
    const hasSemanticFailure =
      advisoryCase.expected.failureCategory === "invalid-advisory-range-events";
    if (advisoryCase.expected.valid) {
      ctx.validate("advisory", advisoryCase.payload, label);
      assertAdvisoryTargetsVolume(advisoryCase.payload, label);
    } else if (hasSemanticFailure) {
      ctx.validate("advisory", advisoryCase.payload, label);
      assertInvalidAdvisoryRangeEvents(advisoryCase);
    } else {
      ctx.validateExpectedFailure("advisory", advisoryCase.payload, label);
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

function assertAdvisoryRangeEventCoverage(advisoryValidationCases: JsonValue): void {
  assert(
    advisoryValidationCases.cases.some(
      (advisoryCase: JsonValue) =>
        advisoryCase.expected.failureCategory === "invalid-advisory-range-events",
    ),
    "advisory validation cases must include invalid range event semantic coverage",
  );
}

function run(ctx: ValidationContext): void {
  validateBaselineAdvisoryFixtures(ctx);
  assertBaselineAdvisorySemantics(ctx);
  const advisoryValidationCases = readAdvisoryValidationCases(ctx);
  validateAdvisoryValidationCases(ctx, advisoryValidationCases);
  assertAdvisoryRelationshipCoverage(advisoryValidationCases);
  assertAdvisoryRangeEventCoverage(advisoryValidationCases);
}

export { run };
