import crypto from "node:crypto";

import { assert, stableJsonStringify } from "../core/assert.ts";
import { errorMessage } from "../core/json.ts";
import { EMPTY_COUNT } from "../core/numeric-constants.ts";
import type { JsonValue } from "../core/types.ts";

function findProperty(properties: JsonValue, name: JsonValue, label: JsonValue): JsonValue {
  const property = properties?.find((candidate: JsonValue) => candidate.name === name);
  assert(property, `${label} needs ${name} property`);
  return property;
}

function parseStablePropertyJson(
  properties: JsonValue,
  name: JsonValue,
  label: JsonValue,
): JsonValue {
  const property = findProperty(properties, name, label);
  const parsed = ((): JsonValue => {
    try {
      return JSON.parse(property.value);
    } catch (error) {
      throw new Error(`${label} ${name} property must contain JSON: ${errorMessage(error)}`, {
        cause: error,
      });
    }
  })();
  assert(
    property.value === stableJsonStringify(parsed),
    `${label} ${name} property must use stable JSON serialization`,
  );
  return parsed;
}

function findExternalReference(
  references: JsonValue,
  type: JsonValue,
  url: JsonValue,
  label: JsonValue,
): void {
  assert(
    references?.some((reference: JsonValue) => reference.type === type && reference.url === url),
    `${label} needs ${type} external reference ${url}`,
  );
}

function findSpdxExternalRef(
  externalRefs: JsonValue,
  referenceCategory: JsonValue,
  referenceType: JsonValue,
  referenceLocator: JsonValue,
  label: JsonValue,
): void {
  assert(
    externalRefs?.some(
      (reference: JsonValue) =>
        reference.referenceCategory === referenceCategory &&
        reference.referenceType === referenceType &&
        reference.referenceLocator === referenceLocator,
    ),
    `${label} needs SPDX externalRef ${referenceCategory}/${referenceType}/${referenceLocator}`,
  );
}

function decodeFixtureArtifact(artifact: JsonValue, label: JsonValue): JsonValue {
  assert(artifact?.bytesBase64, `${label} needs artifact.bytesBase64`);
  const bytes = Buffer.from(artifact.bytesBase64, "base64");
  assert(bytes.length > EMPTY_COUNT, `${label} artifact bytes must not be empty`);
  const digest = `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`;
  assert(digest === artifact.artifactDigest, `${label} artifactDigest must match bytes`);
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} artifact bytes must parse as JSON: ${errorMessage(error)}`, {
      cause: error,
    });
  }
}

export {
  decodeFixtureArtifact,
  findExternalReference,
  findProperty,
  findSpdxExternalRef,
  parseStablePropertyJson,
};
