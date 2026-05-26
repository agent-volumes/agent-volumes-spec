import crypto from "node:crypto";

import { assert } from "../core/assert.ts";
import { errorMessage } from "../core/json.ts";
import type { JsonValue } from "../core/types.ts";

export const findProperty = (properties: JsonValue, name: JsonValue, label: JsonValue) => {
  const property = properties?.find((candidate: JsonValue) => candidate.name === name);
  assert(property, `${label} needs ${name} property`);
  return property;
};

export const parseStablePropertyJson = (
  properties: JsonValue,
  name: JsonValue,
  label: JsonValue,
) => {
  const property = findProperty(properties, name, label);
  let parsed: JsonValue = undefined;
  try {
    parsed = JSON.parse(property.value);
  } catch (error) {
    throw new Error(`${label} ${name} property must contain JSON: ${errorMessage(error)}`, {
      cause: error,
    });
  }
  assert(
    property.value === stableJsonStringify(parsed),
    `${label} ${name} property must use stable JSON serialization`,
  );
  return parsed;
};

export const findExternalReference = (
  references: JsonValue,
  type: JsonValue,
  url: JsonValue,
  label: JsonValue,
) => {
  assert(
    references?.some((reference: JsonValue) => reference.type === type && reference.url === url),
    `${label} needs ${type} external reference ${url}`,
  );
};

export const findSpdxExternalRef = (
  externalRefs: JsonValue,
  referenceCategory: JsonValue,
  referenceType: JsonValue,
  referenceLocator: JsonValue,
  label: JsonValue,
) => {
  assert(
    externalRefs?.some(
      (reference: JsonValue) =>
        reference.referenceCategory === referenceCategory &&
        reference.referenceType === referenceType &&
        reference.referenceLocator === referenceLocator,
    ),
    `${label} needs SPDX externalRef ${referenceCategory}/${referenceType}/${referenceLocator}`,
  );
};

export const decodeFixtureArtifact = (artifact: JsonValue, label: JsonValue) => {
  assert(artifact?.bytesBase64, `${label} needs artifact.bytesBase64`);
  const bytes = Buffer.from(artifact.bytesBase64, "base64");
  assert(bytes.length > 0, `${label} artifact bytes must not be empty`);
  const digest = `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`;
  assert(digest === artifact.artifactDigest, `${label} artifactDigest must match bytes`);
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    throw new Error(`${label} artifact bytes must parse as JSON: ${errorMessage(error)}`, {
      cause: error,
    });
  }
};

import { stableJsonStringify } from "../core/assert.ts";
