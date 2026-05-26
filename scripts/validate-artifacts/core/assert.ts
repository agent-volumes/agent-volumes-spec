import type { JsonValue, ValidationContext } from "./types.ts";

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export const assertSpecVersion = (
  _ctx: ValidationContext,
  fixture: JsonValue,
  label: JsonValue,
) => {
  assert(fixture.specVersion === "0.1.0-rc.1", `${label} must declare specVersion 0.1.0-rc.1`);
};

export const assertDeepEqual = (actual: JsonValue, expected: JsonValue, label: JsonValue) => {
  assert(stableJsonStringify(actual) === stableJsonStringify(expected), `${label} must round-trip`);
};

export const assertUniqueStrings = (values: JsonValue, label: JsonValue) => {
  assert(new Set(values).size === values.length, `${label} must be unique`);
};

export const stableJsonStringify = (value: JsonValue): string => {
  if (Array.isArray(value)) {
    return `[${value.map((item: JsonValue) => stableJsonStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .toSorted()
      .map((key: JsonValue) => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};
