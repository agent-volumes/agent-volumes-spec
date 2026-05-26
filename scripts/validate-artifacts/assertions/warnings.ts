import { assert } from "../core/assert.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

export const assertWarning = (ctx: ValidationContext, warning: JsonValue, label: JsonValue) => {
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
};
