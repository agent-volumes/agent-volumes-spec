import crypto from "node:crypto";

import { assert, stableJsonStringify } from "./assert.ts";
import { EMPTY_COUNT, PURL_SCOPE_PREFIX_LENGTH } from "./numeric-constants.ts";
import {
  componentNamePattern,
  coreExternalDependencyPurposes,
  externalDependencyPurposeExtensionPattern,
  shallowPurlPattern,
  shallowVersPattern,
  volumeNamePattern,
} from "./patterns.ts";
import type { JsonValue } from "./types.ts";

function canonicalReleasePurl(volume: JsonValue, version: JsonValue): string {
  assert(volumeNamePattern.test(volume), `cannot canonicalize invalid volume name: ${volume}`);
  if (volume.startsWith("@")) {
    const [scope, name] = volume.slice(PURL_SCOPE_PREFIX_LENGTH).split("/");
    return `pkg:volume/%40${scope}/${name}@${version}`;
  }
  return `pkg:volume/${volume}@${version}`;
}

function canonicalComponentPurl(
  volume: JsonValue,
  version: JsonValue,
  component: JsonValue,
): string {
  assert(
    componentNamePattern.test(component.name),
    `cannot canonicalize invalid component name: ${component.name}`,
  );
  return `${canonicalReleasePurl(volume, version)}#${component.type}/${component.name}`;
}

function parseExternalDependencyPurl(purl: JsonValue): JsonValue {
  const match = purl.match(shallowPurlPattern);
  const [, type, remainder] = match || [];
  return {
    hasSubpath: match ? purl.includes("#") : false,
    hasVersion: match ? /(?:^|[^?])@[^/?#]+/.test(remainder.split("?")[0]) : false,
    type: type ? type.toLowerCase() : "",
  };
}

function parseVersScheme(constraint: JsonValue): JsonValue {
  return constraint.match(shallowVersPattern)?.[1].toLowerCase();
}

function normalizeVersConstraintForComparison(constraint: JsonValue): JsonValue {
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
}

function isExternalDependencyPurpose(purpose: JsonValue): boolean {
  return (
    coreExternalDependencyPurposes.has(purpose) ||
    externalDependencyPurposeExtensionPattern.test(purpose)
  );
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function externalDependencyScope(dependency: JsonValue): JsonValue[] {
  return [...(dependency.components ?? [])].toSorted(compareStrings);
}

function externalDependencySemanticKey(dependency: JsonValue): string {
  return stableJsonStringify({
    purl: dependency.purl,
    purpose: dependency.purpose,
    scope: externalDependencyScope(dependency),
  });
}

function declarationKeyInput(semanticKey: JsonValue): JsonValue {
  return {
    purl: semanticKey.purl,
    purpose: semanticKey.purpose,
    scope:
      semanticKey.scope.length === EMPTY_COUNT
        ? { kind: "volume" }
        : { components: semanticKey.scope },
  };
}

function declarationKeyForSemanticKey(semanticKey: JsonValue): string {
  const input = stableJsonStringify(declarationKeyInput(semanticKey));
  return `av-extdep-v1:sha256:${crypto.createHash("sha256").update(input, "utf8").digest("hex")}`;
}

function routeIdentityFromPath(route: JsonValue): JsonValue {
  const match = route.match(/^\/api\/v1\/volumes\/(?:@([^/]+)\/)?([^/]+)\/([^/]+)$/);
  if (!match) {
    return null;
  }
  const [, scope, name, version] = match;
  return {
    name: scope ? `@${scope}/${name}` : name,
    version,
  };
}

function assertRouteMetadataIdentity(
  route: JsonValue,
  metadata: JsonValue,
  label: JsonValue,
): void {
  const identity = routeIdentityFromPath(route);
  assert(identity, `${label} needs a parseable release route`);
  assert(metadata.name === identity.name, `${label} metadata name must match route identity`);
  assert(
    metadata.version === identity.version,
    `${label} metadata version must match route identity`,
  );
}

export {
  assertRouteMetadataIdentity,
  canonicalComponentPurl,
  canonicalReleasePurl,
  compareStrings,
  declarationKeyForSemanticKey,
  declarationKeyInput,
  externalDependencyScope,
  externalDependencySemanticKey,
  isExternalDependencyPurpose,
  normalizeVersConstraintForComparison,
  parseExternalDependencyPurl,
  parseVersScheme,
  routeIdentityFromPath,
};
