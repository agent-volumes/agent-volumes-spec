import { assert } from "../core/assert.ts";
import { EMPTY_COUNT } from "../core/numeric-constants.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

const coreWarningCategories = [
  "unknown-field",
  "deprecated",
  "migration",
  "unknown-capability-field",
  "unknown-capability-value",
  "yanked-version",
  "stale-trust-evidence-only",
  "insufficient-current-trust-evidence",
  "noncanonical-entrypoint",
  "external-dependency-potential-exposure",
] as const;

const proseOnlyWarningCategories = new Set([
  "migration",
  "stale-trust-evidence-only",
  "insufficient-current-trust-evidence",
]);

function assertWarningSchemaDescribesCoreCategories(ctx: ValidationContext): void {
  const { description } = ctx.schemas.warning.properties.category;
  for (const category of coreWarningCategories) {
    assert(description.includes(category), `warning schema must describe ${category}`);
  }
}

function collectWarningsFromValue(value: JsonValue, warnings: JsonValue[]): void {
  const pending = [value];
  while (pending.length > EMPTY_COUNT) {
    const currentValue = pending.pop();
    if (Array.isArray(currentValue)) {
      pending.push(...currentValue);
    } else if (currentValue && typeof currentValue === "object") {
      if (Array.isArray(currentValue.warnings)) {
        warnings.push(...currentValue.warnings);
      }
      pending.push(...Object.values(currentValue));
    }
  }
}

function assertWarning(ctx: ValidationContext, warning: JsonValue, label: JsonValue): void {
  ctx.validate("warning", warning, label);
  if (warning.category === "external-dependency-potential-exposure") {
    assert(
      warning.context && typeof warning.context === "object",
      `${label} needs potential-exposure context`,
    );
    ctx.validate(
      "externalDependencyPotentialExposureWarningContext",
      warning.context,
      `${label} potential-exposure context`,
    );
  }
}

function assertWarningFixtureCoverage(ctx: ValidationContext, fixturePaths: string[]): void {
  const fixtureWarnings: JsonValue[] = [];
  for (const fixturePath of fixturePaths) {
    collectWarningsFromValue(ctx.readJson(fixturePath), fixtureWarnings);
  }
  const fixtureCategories = new Set(fixtureWarnings.map((warning: JsonValue) => warning.category));
  for (const category of coreWarningCategories) {
    if (!proseOnlyWarningCategories.has(category)) {
      assert(fixtureCategories.has(category), `warning fixtures must cover ${category}`);
    }
  }
  for (const warning of fixtureWarnings) {
    assertWarning(ctx, warning, `warning fixture category ${warning.category}`);
  }
}

export { assertWarning, assertWarningFixtureCoverage, assertWarningSchemaDescribesCoreCategories };
