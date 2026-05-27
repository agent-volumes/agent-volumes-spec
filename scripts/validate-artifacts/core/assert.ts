import { getCurrentSpecVersion } from "../../release-version.ts";
import type { JsonValue, ValidationContext } from "./types.ts";

const currentSpecVersion = getCurrentSpecVersion();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function stableJsonStringify(value: JsonValue): string {
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
}

function assertSpecVersion(_ctx: ValidationContext, fixture: JsonValue, label: JsonValue): void {
  assert(
    fixture.specVersion === currentSpecVersion,
    `${label} must declare specVersion ${currentSpecVersion}`,
  );
}

function assertDeepEqual(actual: JsonValue, expected: JsonValue, label: JsonValue): void {
  assert(stableJsonStringify(actual) === stableJsonStringify(expected), `${label} must round-trip`);
}

function assertUniqueStrings(values: JsonValue, label: JsonValue): void {
  assert(new Set(values).size === values.length, `${label} must be unique`);
}

export { assert, assertDeepEqual, assertSpecVersion, assertUniqueStrings, stableJsonStringify };
