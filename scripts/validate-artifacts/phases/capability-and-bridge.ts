import { getCurrentSpecVersion } from "../../release-version.ts";
import {
  assertReservedExtensionNamespaceDrift,
  assertSiteSchemaPublicationDrift,
  assertSpdxExternalDependencyContextDrift,
} from "../assertions/publication-drift.ts";
import { assertWarning } from "../assertions/warnings.ts";
import { assert } from "../core/assert.ts";
import { REQUIRED_CAPABILITY_BRIDGE_PAIR_COUNT } from "../core/numeric-constants.ts";
import { semverPattern } from "../core/patterns.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

const currentSpecVersion = getCurrentSpecVersion();

function validateCapabilityMetadata(ctx: ValidationContext): JsonValue {
  ctx.validate(
    "capabilityMetadata",
    ctx.readJson("conformance/fixtures/capability-metadata.json"),
    "capability metadata fixture",
  );
  return ctx.readJson("conformance/fixtures/capability-metadata.json");
}

function assertCapabilityMetadataVersions(capabilityMetadata: JsonValue): void {
  assert(
    capabilityMetadata.specVersion === currentSpecVersion,
    `capability metadata fixture must declare specVersion ${currentSpecVersion}`,
  );
  assert(
    capabilityMetadata.schemaVersion === "1",
    "capability metadata fixture must declare schemaVersion 1",
  );
  assert(
    capabilityMetadata.apiVersion === "v1",
    "capability metadata fixture must declare apiVersion v1",
  );
  assert(
    Array.isArray(capabilityMetadata.compatibleSpecVersions) &&
      capabilityMetadata.compatibleSpecVersions.includes(currentSpecVersion) &&
      new Set(capabilityMetadata.compatibleSpecVersions).size ===
        capabilityMetadata.compatibleSpecVersions.length,
    `capability metadata fixture must declare unique exact compatibleSpecVersions including ${currentSpecVersion}`,
  );
}

function assertCapabilityMetadataApis(capabilityMetadata: JsonValue): void {
  for (const apiField of [
    "trustMetadata",
    "versionIndex",
    "releaseUploads",
    "trustUploads",
    "advisories",
  ]) {
    assert(
      typeof capabilityMetadata.apis[apiField] === "boolean",
      `capability metadata fixture must declare boolean apis.${apiField}`,
    );
  }
  for (const deliveryMode of ["cdn", "git"]) {
    assert(
      capabilityMetadata.deliveryModes.includes(deliveryMode),
      `capability metadata must include ${deliveryMode}`,
    );
  }
  for (const [surface, enabled] of Object.entries({
    releaseUploads: capabilityMetadata.apis.releaseUploads,
    trustUploads: capabilityMetadata.apis.trustUploads,
  })) {
    if (enabled) {
      assert(
        capabilityMetadata.uploadProfiles?.[surface]?.includes("http-put"),
        `capability metadata must advertise http-put for ${surface}`,
      );
    }
  }
}

function assertCapabilityUnknownTolerance(ctx: ValidationContext): void {
  const capabilityUnknownToleranceFixture = ctx.readJson(
    "conformance/fixtures/capability-metadata-unknown-tolerance.json",
  );
  assert(
    capabilityUnknownToleranceFixture.canonicalParsedData.specVersion === currentSpecVersion,
    `capability metadata unknown tolerance fixture must declare specVersion ${currentSpecVersion}`,
  );
  ctx.validate(
    "capabilityMetadata",
    capabilityUnknownToleranceFixture.canonicalParsedData,
    "capability metadata unknown tolerance fixture",
  );
  assert(
    capabilityUnknownToleranceFixture.expected.valid === true,
    "capability metadata unknown tolerance fixture must be expected valid",
  );
  assert(
    capabilityUnknownToleranceFixture.expected.warnings.some(
      (warning: JsonValue) => warning.category === "unknown-capability-field",
    ),
    "capability metadata unknown tolerance fixture must expect an unknown capability field warning",
  );
  assert(
    capabilityUnknownToleranceFixture.expected.warnings.some(
      (warning: JsonValue) =>
        warning.category === "unknown-capability-value" && warning.path === "deliveryModes[2]",
    ),
    "capability metadata unknown tolerance fixture must expect an unknown delivery mode value warning",
  );
  assert(
    capabilityUnknownToleranceFixture.expected.warnings.some(
      (warning: JsonValue) =>
        warning.category === "unknown-capability-value" &&
        warning.path.startsWith("uploadProfiles."),
    ),
    "capability metadata unknown tolerance fixture must expect an unknown upload profile value warning",
  );
  for (const warning of capabilityUnknownToleranceFixture.expected.warnings) {
    assertWarning(ctx, warning, "capability metadata unknown tolerance warning");
  }
}

function assertCapabilityReservedExtensions(ctx: ValidationContext): void {
  const capabilityReservedExtensionFixture = ctx.readJson(
    "conformance/fixtures/capability-metadata-reserved-extension-rejection.json",
  );
  ctx.validateExpectedFailure(
    "capabilityMetadata",
    capabilityReservedExtensionFixture.canonicalParsedData,
    "capability metadata reserved extension fixture",
  );
  assert(
    capabilityReservedExtensionFixture.expected.valid === false,
    "capability metadata reserved extension fixture must be an expected failure",
  );
}

function assertCapabilityInvalidCompatibility(ctx: ValidationContext): void {
  const capabilityInvalidCompatibilityFixture = ctx.readJson(
    "conformance/fixtures/capability-invalid-compatibility-cases.json",
  );
  for (const fixture of capabilityInvalidCompatibilityFixture.fixtures) {
    ctx.validateExpectedFailure(
      "capabilityMetadata",
      fixture.canonicalParsedData,
      `capability metadata invalid compatibility fixture ${fixture.name}`,
    );
    assert(
      fixture.expected.valid === false,
      `capability metadata invalid compatibility fixture ${fixture.name} must be an expected failure`,
    );
  }
}

function parseSemverCore(version: string): [number, number, number] {
  const [core = ""] = version.split("-");
  const [major = "0", minor = "0", patch = "0"] = core.split(".");
  return [Number.parseInt(major, 10), Number.parseInt(minor, 10), Number.parseInt(patch, 10)];
}

function isFutureSpecVersion(version: string): boolean {
  const [currentMajor, currentMinor, currentPatch] = parseSemverCore(currentSpecVersion);
  const [targetMajor, targetMinor, targetPatch] = parseSemverCore(version);
  if (targetMajor !== currentMajor) {
    return targetMajor > currentMajor;
  }
  if (targetMinor !== currentMinor) {
    return targetMinor > currentMinor;
  }
  if (targetPatch !== currentPatch) {
    return targetPatch > currentPatch;
  }
  return !version.includes("-") && currentSpecVersion.includes("-");
}

function assertBridgeRemovalTarget(bridgeMetadata: JsonValue, label: string): void {
  const targetSpecVersion = bridgeMetadata.removalTarget.specVersion;
  assert(
    typeof targetSpecVersion === "string" && semverPattern.test(targetSpecVersion),
    `${label} removalTarget.specVersion must be a SemVer version`,
  );
  assert(
    isFutureSpecVersion(targetSpecVersion),
    `${label} removalTarget.specVersion must target a future spec version`,
  );
}

function assertBridgeMetadata(ctx: ValidationContext): void {
  const bridgeMetadata = ctx.readJson("conformance/fixtures/bridge-metadata.json");
  ctx.validate("bridgeMetadata", bridgeMetadata, "bridge metadata fixture");
  assertBridgeRemovalTarget(bridgeMetadata, "bridge metadata fixture");
  const bridgeStatusVariants = ctx.readJson(
    "conformance/fixtures/bridge-metadata-status-variants.json",
  );
  for (const fixture of bridgeStatusVariants.fixtures) {
    ctx.validate("bridgeMetadata", fixture.payload, `bridge metadata ${fixture.name} fixture`);
    assertBridgeRemovalTarget(fixture.payload, `bridge metadata ${fixture.name} fixture`);
    assert(
      fixture.expected.valid === true,
      `bridge metadata ${fixture.name} fixture must be expected valid`,
    );
  }
  assert(
    new Set(bridgeStatusVariants.fixtures.map((fixture: JsonValue) => fixture.payload.status))
      .size === REQUIRED_CAPABILITY_BRIDGE_PAIR_COUNT,
    "bridge status variants fixture must cover distinct non-active statuses",
  );
}

function assertPublicationDrift(ctx: ValidationContext): void {
  assertReservedExtensionNamespaceDrift(ctx);
  assertSiteSchemaPublicationDrift(ctx);
  assertSpdxExternalDependencyContextDrift(ctx);
}

function run(ctx: ValidationContext): void {
  const capabilityMetadata = validateCapabilityMetadata(ctx);
  assertCapabilityMetadataVersions(capabilityMetadata);
  assertCapabilityMetadataApis(capabilityMetadata);
  assertCapabilityUnknownTolerance(ctx);
  assertCapabilityReservedExtensions(ctx);
  assertCapabilityInvalidCompatibility(ctx);
  assertBridgeMetadata(ctx);
  assertPublicationDrift(ctx);
}

export { run };
