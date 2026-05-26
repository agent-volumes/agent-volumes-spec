import { assert } from "../core/assert.ts";
import {
  digestPattern,
  externalDependencyDeclarationKeyPattern,
  semverPattern,
  volumeNamePattern,
} from "../core/patterns.ts";
import { canonicalReleasePurl } from "../core/purl.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

export function assertReleaseMetadata(
  ctx: ValidationContext,
  metadata: JsonValue,
  label: JsonValue,
): void {
  ctx.validate("releaseMetadata", metadata, label);
  assert(volumeNamePattern.test(metadata.name), `${label} needs canonical full volume name`);
  assert(semverPattern.test(metadata.version), `${label} needs SemVer version`);
  assert(digestPattern.test(metadata.integrity), `${label} needs valid integrity`);
  assert(
    metadata.purl === canonicalReleasePurl(metadata.name, metadata.version),
    `${label} purl must match canonical release identity`,
  );
  assert(
    metadata.status && typeof metadata.status === "object",
    `${label} needs lifecycle status metadata`,
  );
  assert(
    ["available", "yanked", "tombstoned", "blocked", "unavailable"].includes(metadata.status.state),
    `${label} needs a recognized lifecycle status`,
  );
  if (["available", "yanked"].includes(metadata.status.state)) {
    assert(metadata.dist && typeof metadata.dist === "object", `${label} needs dist metadata`);
    assert(["cdn", "git"].includes(metadata.dist.source), `${label} needs cdn or git dist source`);
  }
  if (["blocked", "tombstoned", "unavailable"].includes(metadata.status.state)) {
    assert(
      !metadata.dist,
      `${label} must not expose installable dist metadata for ${metadata.status.state}`,
    );
  }
  for (const externalDependency of metadata.externalDependencies ?? []) {
    assert(
      externalDependencyDeclarationKeyPattern.test(externalDependency.declarationKey),
      `${label} external dependency needs stable declaration key`,
    );
    assert(
      !Object.hasOwn(externalDependency, "resolvedVersion") &&
        !Object.hasOwn(externalDependency, "digest"),
      `${label} external dependency must remain declaration-only`,
    );
  }
}
