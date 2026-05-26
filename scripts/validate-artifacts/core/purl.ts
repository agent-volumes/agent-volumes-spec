import crypto from "node:crypto";

import { assert, stableJsonStringify } from "./assert.ts";
import {
  componentNamePattern,
  coreExternalDependencyPurposes,
  externalDependencyPurposeExtensionPattern,
  shallowPurlPattern,
  shallowVersPattern,
  volumeNamePattern,
} from "./patterns.ts";
import type { JsonValue } from "./types.ts";

const canonicalReleasePurl = (volume: JsonValue, version: JsonValue) => {
  assert(volumeNamePattern.test(volume), `cannot canonicalize invalid volume name: ${volume}`);
  if (volume.startsWith("@")) {
    const [scope, name] = volume.slice(1).split("/");
    return `pkg:volume/%40${scope}/${name}@${version}`;
  }
  return `pkg:volume/${volume}@${version}`;
};

const canonicalComponentPurl = (volume: JsonValue, version: JsonValue, component: JsonValue) => {
  assert(
    componentNamePattern.test(component.name),
    `cannot canonicalize invalid component name: ${component.name}`,
  );
  return `${canonicalReleasePurl(volume, version)}#${component.type}/${component.name}`;
};

const parseExternalDependencyPurl = (purl: JsonValue) => {
  const match = purl.match(shallowPurlPattern);
  const [, type, remainder] = match || [];
  return {
    hasSubpath: match ? purl.includes("#") : false,
    hasVersion: match ? /(?:^|[^?])@[^/?#]+/.test(remainder.split("?")[0]) : false,
    type: type ? type.toLowerCase() : "",
  };
};

const parseVersScheme = (constraint: JsonValue) =>
  constraint.match(shallowVersPattern)?.[1].toLowerCase();

const normalizeVersConstraintForComparison = (constraint: JsonValue) => {
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

const isExternalDependencyPurpose = (purpose: JsonValue) =>
  coreExternalDependencyPurposes.has(purpose) ||
  externalDependencyPurposeExtensionPattern.test(purpose);

const compareStrings = (left: string, right: string): number => left.localeCompare(right);

const externalDependencyScope = (dependency: JsonValue) =>
  [...(dependency.components ?? [])].toSorted(compareStrings);

const externalDependencySemanticKey = (dependency: JsonValue) =>
  stableJsonStringify({
    purl: dependency.purl,
    purpose: dependency.purpose,
    scope: externalDependencyScope(dependency),
  });

const declarationKeyInput = (semanticKey: JsonValue) => ({
  purl: semanticKey.purl,
  purpose: semanticKey.purpose,
  scope: semanticKey.scope.length === 0 ? { kind: "volume" } : { components: semanticKey.scope },
});

const declarationKeyForSemanticKey = (semanticKey: JsonValue) => {
  const input = stableJsonStringify(declarationKeyInput(semanticKey));
  return `av-extdep-v1:sha256:${crypto.createHash("sha256").update(input, "utf8").digest("hex")}`;
};

const routeIdentityFromPath = (route: JsonValue) => {
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

const assertRouteMetadataIdentity = (route: JsonValue, metadata: JsonValue, label: JsonValue) => {
  const identity = routeIdentityFromPath(route);
  assert(identity, `${label} needs a parseable release route`);
  assert(metadata.name === identity.name, `${label} metadata name must match route identity`);
  assert(
    metadata.version === identity.version,
    `${label} metadata version must match route identity`,
  );
};

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
