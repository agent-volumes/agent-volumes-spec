import crypto from "node:crypto";

import { assert } from "./assert.ts";
import {
  componentNamePattern,
  shallowPurlPattern,
  shallowVersPattern,
  volumeNamePattern,
} from "./patterns.ts";
import type { JsonValue } from "./types.ts";

export const canonicalReleasePurl = (volume: JsonValue, version: JsonValue) => {
  assert(volumeNamePattern.test(volume), `cannot canonicalize invalid volume name: ${volume}`);
  if (volume.startsWith("@")) {
    const [scope, name] = volume.slice(1).split("/");
    return `pkg:volume/%40${scope}/${name}@${version}`;
  }
  return `pkg:volume/${volume}@${version}`;
};

export const canonicalComponentPurl = (
  volume: JsonValue,
  version: JsonValue,
  component: JsonValue,
) => {
  assert(
    componentNamePattern.test(component.name),
    `cannot canonicalize invalid component name: ${component.name}`,
  );
  return `${canonicalReleasePurl(volume, version)}#${component.type}/${component.name}`;
};

export const parseExternalDependencyPurl = (purl: JsonValue) => {
  const match = purl.match(shallowPurlPattern);
  if (!match) {
    return undefined;
  }
  const [, type, remainder] = match;
  return {
    hasSubpath: purl.includes("#"),
    hasVersion: /(?:^|[^?])@[^/?#]+/.test(remainder.split("?")[0]),
    type: type.toLowerCase(),
  };
};

export const parseVersScheme = (constraint: JsonValue) =>
  constraint.match(shallowVersPattern)?.[1].toLowerCase();

export const normalizeVersConstraintForComparison = (constraint: JsonValue) => {
  const match = constraint.match(shallowVersPattern);
  if (!match) {
    return constraint;
  }
  const [, rawScheme, expression] = match;
  return `vers:${rawScheme.toLowerCase()}/${expression
    .split("|")
    .map((term: JsonValue) => term.trim())
    .toSorted()
    .join("|")}`;
};

export const isExternalDependencyPurpose = (purpose: JsonValue) =>
  coreExternalDependencyPurposes.has(purpose) ||
  externalDependencyPurposeExtensionPattern.test(purpose);

export const compareStrings = (left: string, right: string): number => left.localeCompare(right);

export const externalDependencyScope = (dependency: JsonValue) =>
  [...(dependency.components ?? [])].toSorted(compareStrings);

export const externalDependencySemanticKey = (dependency: JsonValue) =>
  stableJsonStringify({
    purl: dependency.purl,
    purpose: dependency.purpose,
    scope: externalDependencyScope(dependency),
  });

export const declarationKeyInput = (semanticKey: JsonValue) => ({
  purl: semanticKey.purl,
  purpose: semanticKey.purpose,
  scope: semanticKey.scope.length === 0 ? { kind: "volume" } : { components: semanticKey.scope },
});

export const declarationKeyForSemanticKey = (semanticKey: JsonValue) => {
  const input = stableJsonStringify(declarationKeyInput(semanticKey));
  return `av-extdep-v1:sha256:${crypto.createHash("sha256").update(input, "utf8").digest("hex")}`;
};

export const routeIdentityFromPath = (route: JsonValue) => {
  const match = route.match(/^\/api\/v1\/volumes\/(?:@([^/]+)\/)?([^/]+)\/([^/]+)$/);
  if (!match) {
    return null;
  }
  const [, scope, name, version] = match;
  return {
    name: scope ? `@${scope}/${name}` : name,
    version,
  };
};

export const assertRouteMetadataIdentity = (
  route: JsonValue,
  metadata: JsonValue,
  label: JsonValue,
) => {
  const identity = routeIdentityFromPath(route);
  assert(identity, `${label} needs a parseable release route`);
  assert(metadata.name === identity.name, `${label} metadata name must match route identity`);
  assert(
    metadata.version === identity.version,
    `${label} metadata version must match route identity`,
  );
};

import { stableJsonStringify } from "./assert.ts";
import {
  coreExternalDependencyPurposes,
  externalDependencyPurposeExtensionPattern,
} from "./patterns.ts";
