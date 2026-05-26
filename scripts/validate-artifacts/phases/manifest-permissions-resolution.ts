import { assertProblemDetails } from "../assertions/problem-details.ts";
import { assertReleaseMetadata } from "../assertions/release-metadata.ts";
import { assertWarning } from "../assertions/warnings.ts";
import { assert, assertSpecVersion, assertDeepEqual } from "../core/assert.ts";
import { routeIdentityFromPath, assertRouteMetadataIdentity } from "../core/purl.ts";
import { parseFixtureTomlSubset } from "../core/toml.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

export const run = (ctx: ValidationContext) => {
  const manifestValidFixture = ctx.readJson("conformance/fixtures/manifest-valid-minimal.json");
  assertSpecVersion(ctx, manifestValidFixture, "minimal valid manifest fixture");
  ctx.validate(
    "volume",
    manifestValidFixture.canonicalParsedData,
    "minimal valid manifest fixture",
  );
  assert(
    manifestValidFixture.expected.valid === true,
    "minimal valid manifest fixture must be expected valid",
  );

  const manifestComponentFixture = ctx.readJson(
    "conformance/fixtures/manifest-valid-component.json",
  );
  assertSpecVersion(ctx, manifestComponentFixture, "component package manifest fixture");
  ctx.validate(
    "volume",
    manifestComponentFixture.canonicalParsedData,
    "component package manifest fixture",
  );
  assert(
    manifestComponentFixture.expected.valid === true,
    "component package manifest fixture must be expected valid",
  );
  assert(
    manifestComponentFixture.canonicalParsedData.volume.role === "component" &&
      manifestComponentFixture.canonicalParsedData.components.length === 1,
    "component package manifest fixture must declare exactly one component",
  );

  const invalidComponentRoleFixture = ctx.readJson(
    "conformance/fixtures/manifest-invalid-component-role-multiple-components.json",
  );
  assertSpecVersion(ctx, invalidComponentRoleFixture, "invalid component role manifest fixture");
  ctx.validate(
    "volume",
    invalidComponentRoleFixture.canonicalParsedData,
    "invalid component role manifest fixture",
  );
  assert(
    invalidComponentRoleFixture.canonicalParsedData.volume.role === "component" &&
      invalidComponentRoleFixture.canonicalParsedData.components.length > 1,
    "invalid component role fixture must exercise multiple component declarations",
  );
  assert(
    invalidComponentRoleFixture.expected.failureCategory === "invalid-component-role-cardinality",
    "invalid component role fixture must classify component role cardinality failure",
  );

  const manifestProviderFixture = ctx.readJson("conformance/fixtures/manifest-valid-provider.json");
  assertSpecVersion(ctx, manifestProviderFixture, "provider package manifest fixture");
  ctx.validate(
    "volume",
    manifestProviderFixture.canonicalParsedData,
    "provider package manifest fixture",
  );
  assert(
    manifestProviderFixture.expected.valid === true,
    "provider package manifest fixture must be expected valid",
  );
  assert(
    manifestProviderFixture.canonicalParsedData.volume.role === "provider" &&
      manifestProviderFixture.canonicalParsedData.volume.providers?.length > 0,
    "provider package manifest fixture must declare provider metadata",
  );

  const manifestMetaFixture = ctx.readJson("conformance/fixtures/manifest-valid-meta.json");
  assertSpecVersion(ctx, manifestMetaFixture, "meta package manifest fixture");
  ctx.validate("volume", manifestMetaFixture.canonicalParsedData, "meta package manifest fixture");
  assert(
    manifestMetaFixture.expected.valid === true,
    "meta package manifest fixture must be expected valid",
  );

  const unknownFieldFixture = ctx.readJson(
    "conformance/fixtures/manifest-unknown-field-warning.json",
  );
  assertSpecVersion(ctx, unknownFieldFixture, "unknown-field manifest fixture");
  ctx.validate("volume", unknownFieldFixture.canonicalParsedData, "unknown-field manifest fixture");
  assert(
    unknownFieldFixture.expected.warnings.some(
      (warning: JsonValue) => warning.category === "unknown-field",
    ),
    "unknown-field manifest fixture must expect an unknown-field warning",
  );
  for (const warning of unknownFieldFixture.expected.warnings) {
    assertWarning(ctx, warning, "unknown-field manifest warning");
  }

  const manifestParseCases = ctx.readJson("conformance/fixtures/manifest-parse-cases.json");
  ctx.validate("manifestParseCase", manifestParseCases, "manifest parse cases fixture");
  assertSpecVersion(ctx, manifestParseCases, "manifest parse cases");
  for (const manifestParseCase of manifestParseCases.cases) {
    const parsed = parseFixtureTomlSubset(
      manifestParseCase.authoredToml,
      `manifest parse case ${manifestParseCase.name}`,
    );
    assertDeepEqual(
      parsed,
      manifestParseCase.expected.canonicalParsedData,
      `manifest parse case ${manifestParseCase.name}`,
    );
    for (const warning of manifestParseCase.expected.warnings ?? []) {
      assertWarning(ctx, warning, `manifest parse case ${manifestParseCase.name} warning`);
    }
    if (manifestParseCase.expected.valid) {
      ctx.validate("volume", parsed, `manifest parse case ${manifestParseCase.name}`);
    } else {
      ctx.validateExpectedFailure(
        "volume",
        parsed,
        `manifest parse case ${manifestParseCase.name}`,
      );
    }
    if (manifestParseCase.name === "no-default-materialization") {
      assert(
        !Object.hasOwn(parsed, "permissions") &&
          !Object.hasOwn(parsed.components[0], "permissions"),
        "manifest parse case no-default-materialization must not inject permission defaults",
      );
    }
    if (manifestParseCase.expected.failureCategory === "invalid-manifest-shape") {
      assert(
        manifestParseCase.expected.path === "components" && !Array.isArray(parsed.components),
        `manifest parse case ${manifestParseCase.name} must fail because components is not an array table`,
      );
    }
  }
  assert(
    manifestParseCases.cases.some(
      (manifestParseCase: JsonValue) =>
        manifestParseCase.name === "invalid-singleton-component-shape",
    ),
    "manifest parse cases must include singleton component shape rejection",
  );

  for (const [fixturePath, label] of [
    ["conformance/fixtures/manifest-invalid-name.json", "invalid-name manifest fixture"],
    ["conformance/fixtures/manifest-invalid-version.json", "invalid-version manifest fixture"],
    [
      "conformance/fixtures/manifest-invalid-external-dependency-unknown-field.json",
      "invalid external dependency unknown field manifest fixture",
    ],
    [
      "conformance/fixtures/manifest-invalid-external-dependency-empty-components.json",
      "invalid external dependency empty components manifest fixture",
    ],
    [
      "conformance/fixtures/manifest-invalid-external-dependency-duplicate-components.json",
      "invalid external dependency duplicate components manifest fixture",
    ],
  ] as const) {
    const fixture = ctx.readJson(fixturePath);
    assertSpecVersion(ctx, fixture, label);
    ctx.validateExpectedFailure("volume", fixture.canonicalParsedData, label);
    assert(fixture.expected.valid === false, `${label} must be expected invalid`);
  }

  const duplicateComponentFixture = ctx.readJson(
    "conformance/fixtures/manifest-invalid-duplicate-component.json",
  );
  assertSpecVersion(ctx, duplicateComponentFixture, "duplicate component manifest fixture");
  ctx.validate(
    "volume",
    duplicateComponentFixture.canonicalParsedData,
    "duplicate component manifest fixture structural schema",
  );
  assert(
    duplicateComponentFixture.expected.valid === false,
    "duplicate component manifest fixture must be an expected failure",
  );
  const componentNames = duplicateComponentFixture.canonicalParsedData.components.map(
    (component: JsonValue) => component.name,
  );
  assert(
    new Set(componentNames).size !== componentNames.length,
    "duplicate component manifest fixture must contain duplicate component names",
  );

  const permissionFixture = ctx.readJson("conformance/fixtures/permission-escalation.json");
  assertSpecVersion(ctx, permissionFixture, "permission escalation manifest fixture");
  ctx.validate(
    "volume",
    permissionFixture.canonicalParsedData,
    "permission escalation manifest fixture",
  );

  const permissionOrder = {
    filesystem: {
      deny: new Set(["deny"]),
      read: new Set(["deny", "read"]),
      "read-write": new Set(["deny", "read", "write", "read-write"]),
      write: new Set(["deny", "write"]),
    },
    shell: {
      allow: new Set(["deny", "allow"]),
      deny: new Set(["deny"]),
    },
  };
  type PermissionSurface = keyof typeof permissionOrder;
  const isPermissionEscalation = (
    surface: PermissionSurface,
    parent: JsonValue,
    child: JsonValue,
  ): boolean => {
    if (surface === "filesystem") {
      if (typeof parent !== "string" || !Object.hasOwn(permissionOrder.filesystem, parent)) {
        return false;
      }
      return !permissionOrder.filesystem[parent as keyof typeof permissionOrder.filesystem].has(
        child,
      );
    }
    if (typeof parent !== "string" || !Object.hasOwn(permissionOrder.shell, parent)) {
      return false;
    }
    return !permissionOrder.shell[parent as keyof typeof permissionOrder.shell].has(child);
  };
  const parentFilesystem = permissionFixture.canonicalParsedData.permissions.filesystem;
  const childFilesystem =
    permissionFixture.canonicalParsedData.components[0].permissions.filesystem;
  assert(
    isPermissionEscalation("filesystem", parentFilesystem, childFilesystem),
    "permission escalation fixture must actually broaden component permissions",
  );
  assert(
    permissionFixture.expected.valid === false,
    "permission escalation fixture must be an expected failure",
  );

  const siblingPermissionFixture = ctx.readJson(
    "conformance/fixtures/permission-sibling-escalation.json",
  );
  assertSpecVersion(
    ctx,
    siblingPermissionFixture,
    "permission sibling escalation manifest fixture",
  );
  ctx.validate(
    "volume",
    siblingPermissionFixture.canonicalParsedData,
    "permission sibling escalation manifest fixture",
  );
  assert(
    isPermissionEscalation(
      "filesystem",
      siblingPermissionFixture.canonicalParsedData.permissions.filesystem,
      siblingPermissionFixture.canonicalParsedData.components[0].permissions.filesystem,
    ),
    "permission sibling escalation fixture must treat read and write as sibling permissions",
  );
  assert(
    siblingPermissionFixture.expected.valid === false,
    "permission sibling escalation fixture must be an expected failure",
  );

  const versionIndexRowCases = ctx.readJson("conformance/fixtures/version-index-row-cases.json");
  assertSpecVersion(ctx, versionIndexRowCases, "version index row cases");
  for (const fixture of versionIndexRowCases.fixtures) {
    if (fixture.expected.valid) {
      ctx.validate("versionIndexRow", fixture.payload, `version index row ${fixture.name}`);
    } else {
      ctx.validateExpectedFailure(
        "versionIndexRow",
        fixture.payload,
        `version index row ${fixture.name}`,
      );
    }
  }
  const versionIndexFixture = ctx.readJson("conformance/fixtures/version-index.json");
  ctx.validate("versionIndex", versionIndexFixture, "version index collection fixture");
  assert(
    versionIndexFixture.items.length >= 2,
    "version index collection fixture must include multiple rows",
  );

  const semverRangeCases = ctx.readJson("conformance/fixtures/semver-range-cases.json");
  assertSpecVersion(ctx, semverRangeCases, "semver range cases");
  const semverRangeSchema = {
    $ref: `${ctx.schemas.volume.$id}#/$defs/semverRange`,
    $schema: "https://json-schema.org/draft/2020-12/schema",
  };
  const validateSemverRange = ctx.ajv.compile(semverRangeSchema);
  for (const range of semverRangeCases.accepted) {
    assert(validateSemverRange(range), `semver range case should be accepted: ${range}`);
  }
  for (const range of semverRangeCases.rejected) {
    assert(!validateSemverRange(range), `semver range case should be rejected: ${range}`);
  }

  const resolverCases = ctx.readJson("conformance/fixtures/resolver-cases.json");
  assertSpecVersion(ctx, resolverCases, "resolver cases");
  assert(
    resolverCases.cases.some(
      (resolverCase: JsonValue) =>
        resolverCase.resolutionMode === "exact-pinned" &&
        resolverCase.expected.outcome === "success" &&
        resolverCase.expected.warnings?.some(
          (warning: JsonValue) => warning.category === "yanked-version",
        ),
    ),
    "resolver cases must include exact-pinned yanked warning success",
  );
  for (const resolverCase of resolverCases.cases) {
    for (const warning of resolverCase.expected.warnings ?? []) {
      assertWarning(ctx, warning, `resolver case ${resolverCase.name} warning`);
    }
  }
  for (const requiredFailure of ["blocked", "tombstoned", "availability-or-registry-state"]) {
    assert(
      resolverCases.cases.some(
        (resolverCase: JsonValue) =>
          resolverCase.resolutionMode === "exact-pinned" &&
          resolverCase.expected.failureCategory === requiredFailure,
      ),
      `resolver cases must include exact-pinned ${requiredFailure} failure`,
    );
  }
  for (const resolverCase of resolverCases.cases) {
    assert(
      !("dependencies" in resolverCase),
      `resolver case ${resolverCase.name} must use requirements, not dependencies`,
    );
    if (resolverCase.requirements) {
      assert(
        Array.isArray(resolverCase.requirements),
        `resolver case ${resolverCase.name} requirements must be an array`,
      );
      for (const requirement of resolverCase.requirements) {
        assert(
          typeof requirement.requester === "string",
          `resolver case ${resolverCase.name} requirement needs requester`,
        );
        assert(
          typeof requirement.volume === "string",
          `resolver case ${resolverCase.name} requirement needs volume`,
        );
        assert(
          validateSemverRange(requirement.constraint),
          `resolver case ${resolverCase.name} has invalid constraint: ${requirement.constraint}`,
        );
      }
    }
    if (resolverCase.versionIndexRows) {
      for (const [volume, rows] of Object.entries(resolverCase.versionIndexRows)) {
        assert(
          Array.isArray(rows),
          `resolver case ${resolverCase.name} versionIndexRows.${volume} must be an array`,
        );
        for (const row of rows) {
          ctx.validate(
            "versionIndexRow",
            row,
            `resolver case ${resolverCase.name} version index row for ${volume}`,
          );
        }
      }
    }
    if (resolverCase.exactReleaseMetadata) {
      for (const [key, metadata] of Object.entries(resolverCase.exactReleaseMetadata) as [
        string,
        Record<string, JsonValue>,
      ][]) {
        assertReleaseMetadata(
          ctx,
          metadata,
          `resolver case ${resolverCase.name} exact metadata ${key}`,
        );
        if (
          resolverCase.requestRoute &&
          resolverCase.expected.failureCategory !== "identity-mismatch"
        ) {
          assertRouteMetadataIdentity(
            resolverCase.requestRoute,
            metadata,
            `resolver case ${resolverCase.name} exact metadata ${key}`,
          );
        }
        if (resolverCase.expected.failureCategory === "identity-mismatch") {
          const identity = routeIdentityFromPath(resolverCase.requestRoute);
          assert(
            identity,
            `resolver case ${resolverCase.name} needs a parseable route for identity mismatch`,
          );
          assert(
            metadata.name !== identity.name || metadata.version !== identity.version,
            `resolver case ${resolverCase.name} must exercise route/metadata identity mismatch`,
          );
        }
      }
    }
  }

  const exactReleaseMetadataCases = ctx.readJson(
    "conformance/fixtures/exact-release-metadata-cases.json",
  );
  ctx.validate(
    "exactReleaseMetadataCase",
    exactReleaseMetadataCases,
    "exact release metadata cases fixture",
  );
  assertSpecVersion(ctx, exactReleaseMetadataCases, "exact release metadata cases");
  for (const exactCase of exactReleaseMetadataCases.cases) {
    for (const warning of exactCase.expected.warnings ?? []) {
      assertWarning(ctx, warning, `exact release metadata case ${exactCase.name} warning`);
    }
    if (exactCase.metadata) {
      assertReleaseMetadata(
        ctx,
        exactCase.metadata,
        `exact release metadata case ${exactCase.name}`,
      );
      assertRouteMetadataIdentity(
        exactCase.requestRoute,
        exactCase.metadata,
        `exact release metadata case ${exactCase.name}`,
      );
      assert(
        exactCase.expected.outcome === "success",
        `exact release metadata case ${exactCase.name} with metadata must be successful`,
      );
      assert(
        exactCase.expected.installable === true,
        `exact release metadata case ${exactCase.name} with metadata must be installable`,
      );
      assert(
        exactCase.metadata.dist?.source === exactCase.expected.distSource,
        `exact release metadata case ${exactCase.name} distSource must match metadata`,
      );
      if (exactCase.metadata.status.state === "yanked") {
        assert(
          exactCase.expected.warnings?.some(
            (warning: JsonValue) => warning.category === "yanked-version",
          ),
          `exact release metadata case ${exactCase.name} must warn for yanked exact install`,
        );
      }
    }
    if (exactCase.problem) {
      assertProblemDetails(ctx, exactCase.problem, `exact release metadata case ${exactCase.name}`);
      assert(
        exactCase.expected.outcome === "failure" && exactCase.expected.installable === false,
        `exact release metadata case ${exactCase.name} problem must be a non-installable failure`,
      );
      assert(
        ["blocked", "tombstoned", "availability-or-registry-state"].includes(
          exactCase.expected.failureCategory,
        ),
        `exact release metadata case ${exactCase.name} must use portable lifecycle failure category`,
      );
    }
    if (exactCase.invalidMetadata) {
      ctx.validateExpectedFailure(
        "releaseMetadata",
        exactCase.invalidMetadata,
        `exact release metadata case ${exactCase.name}`,
      );
      if (exactCase.expected.failureCategory === "non-installable-dist") {
        assert(
          ["blocked", "tombstoned", "unavailable"].includes(
            exactCase.invalidMetadata.status?.state,
          ),
          `exact release metadata case ${exactCase.name} invalid metadata must use non-installable lifecycle state`,
        );
        assert(
          exactCase.invalidMetadata.dist,
          `exact release metadata case ${exactCase.name} invalid metadata must exercise forbidden dist`,
        );
      }
      if (exactCase.expected.failureCategory === "resolved-external-dependency-evidence") {
        assert(
          exactCase.invalidMetadata.externalDependencies?.some((dependency: JsonValue) =>
            Object.hasOwn(dependency, "resolvedVersion"),
          ),
          `exact release metadata case ${exactCase.name} must exercise forbidden resolved external dependency evidence`,
        );
      }
    }
  }
  for (const requiredDistSource of ["cdn", "git"]) {
    assert(
      exactReleaseMetadataCases.cases.some(
        (exactCase: JsonValue) => exactCase.expected.distSource === requiredDistSource,
      ),
      `exact release metadata cases missing ${requiredDistSource} success`,
    );
  }
  for (const requiredFailure of ["blocked", "tombstoned", "availability-or-registry-state"]) {
    assert(
      exactReleaseMetadataCases.cases.some(
        (exactCase: JsonValue) => exactCase.expected.failureCategory === requiredFailure,
      ),
      `exact release metadata cases missing ${requiredFailure} failure`,
    );
  }
};
