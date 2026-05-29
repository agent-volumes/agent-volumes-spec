import { assertProblemDetails } from "../assertions/problem-details.ts";
import { assertReleaseMetadata } from "../assertions/release-metadata.ts";
import { assertWarning } from "../assertions/warnings.ts";
import { assert, assertDeepEqual, assertSpecVersion } from "../core/assert.ts";
import {
  EMPTY_COUNT,
  FIRST_CONTENT_INDEX,
  INCREMENT_STEP,
  MINIMAL_CARDINALITY,
  REQUIRED_COMPONENT_COUNT,
  REQUIRED_VERSION_INDEX_ROWS,
} from "../core/numeric-constants.ts";
import { assertRouteMetadataIdentity, routeIdentityFromPath } from "../core/purl.ts";
import { parseFixtureTomlSubset } from "../core/toml.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

const permissionOrder = {
  browser: {
    deny: new Set(["deny"]),
    read: new Set(["deny", "read"]),
    "read-write": new Set(["deny", "read", "write", "read-write"]),
    write: new Set(["deny", "write"]),
  },
  filesystem: {
    deny: new Set(["deny"]),
    read: new Set(["deny", "read"]),
    "read-write": new Set(["deny", "read", "write", "read-write"]),
    write: new Set(["deny", "write"]),
  },
  network: {
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

const exactSemverRangePattern =
  /^=?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const comparatorRangePattern =
  /^(<|<=|>|>=|=)(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

type PermissionSurface = keyof typeof permissionOrder;

interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string;
}

interface ResolverRequirementGroup {
  requirements: JsonValue[];
  rows: JsonValue[];
  volume: string;
}

function isPermissionEscalation(
  surface: PermissionSurface,
  parent: JsonValue,
  child: JsonValue,
): boolean {
  if (typeof parent !== "string" || typeof child !== "string") {
    return false;
  }
  const parentPermission = Object.entries(permissionOrder[surface]).find(
    ([permission]) => permission === parent,
  );
  return Boolean(parentPermission && !parentPermission[1].has(child));
}

function compileSemverRangeValidator(ctx: ValidationContext): (range: JsonValue) => boolean {
  const semverRangeSchema = {
    $ref: `${ctx.schemas.volume.$id}#/$defs/semverRange`,
    $schema: "https://json-schema.org/draft/2020-12/schema",
  };
  const validateSemverRange = ctx.ajv.compile(semverRangeSchema);
  return (range: JsonValue): boolean => validateSemverRange(range);
}

function parseSemver(version: string): ParsedSemver {
  const match = exactSemverRangePattern.exec(version);
  assert(match, `SemVer value must be parseable: ${version}`);
  const major = match[1];
  const minor = match[2];
  const patch = match[3];
  assert(major && minor && patch, `SemVer value must include major, minor, and patch: ${version}`);
  return {
    major: Number.parseInt(major, 10),
    minor: Number.parseInt(minor, 10),
    patch: Number.parseInt(patch, 10),
    prerelease: match[4] ?? "",
  };
}

function comparePrerelease(left: string, right: string): number {
  if (left === right) {
    return 0;
  }
  if (!left) {
    return 1;
  }
  if (!right) {
    return -1;
  }
  return left.localeCompare(right);
}

function nextBreakingBoundary(version: string): string {
  const parsed = parseSemver(version);
  if (parsed.major > EMPTY_COUNT) {
    return `${parsed.major + INCREMENT_STEP}.0.0`;
  }
  if (parsed.minor > EMPTY_COUNT) {
    return `0.${parsed.minor + INCREMENT_STEP}.0`;
  }
  return `0.0.${parsed.patch + INCREMENT_STEP}`;
}

function compareSemver(left: string, right: string): number {
  const leftVersion = parseSemver(left);
  const rightVersion = parseSemver(right);
  for (const key of ["major", "minor", "patch"] as const) {
    if (leftVersion[key] !== rightVersion[key]) {
      return leftVersion[key] - rightVersion[key];
    }
  }
  return comparePrerelease(leftVersion.prerelease, rightVersion.prerelease);
}

function compareSemverWithOperator(version: string, operator: string, target: string): boolean {
  const comparison = compareSemver(version, target);
  if (operator === "<") {
    return comparison < 0;
  }
  if (operator === "<=") {
    return comparison <= 0;
  }
  if (operator === ">") {
    return comparison > 0;
  }
  if (operator === ">=") {
    return comparison >= 0;
  }
  return comparison === 0;
}

function caretUpperBound(version: string): string {
  return nextBreakingBoundary(version);
}

function tildeUpperBound(version: string): string {
  const parsed = parseSemver(version);
  return `${parsed.major}.${parsed.minor + INCREMENT_STEP}.0`;
}

function satisfiesCaretRange(version: string, range: string): boolean {
  const lowerBound = range.slice(FIRST_CONTENT_INDEX);
  return (
    compareSemverWithOperator(version, ">=", lowerBound) &&
    compareSemverWithOperator(version, "<", caretUpperBound(lowerBound))
  );
}

function satisfiesTildeRange(version: string, range: string): boolean {
  const lowerBound = range.slice(FIRST_CONTENT_INDEX);
  return (
    compareSemverWithOperator(version, ">=", lowerBound) &&
    compareSemverWithOperator(version, "<", tildeUpperBound(lowerBound))
  );
}

function satisfiesComparatorRange(version: string, range: string): boolean {
  const comparatorMatch = comparatorRangePattern.exec(range);
  assert(comparatorMatch, `Unsupported resolver range term: ${range}`);
  const operator = comparatorMatch[1];
  assert(operator, `Unsupported resolver range operator: ${range}`);
  return compareSemverWithOperator(version, operator, range.slice(operator.length));
}

function satisfiesRangeTerm(version: string, range: string): boolean {
  if (range.startsWith("^")) {
    return satisfiesCaretRange(version, range);
  }
  if (range.startsWith("~")) {
    return satisfiesTildeRange(version, range);
  }
  const exactMatch = exactSemverRangePattern.exec(range);
  if (exactMatch) {
    return compareSemverWithOperator(version, "=", range.replace(/^=/, ""));
  }
  return satisfiesComparatorRange(version, range);
}

function satisfiesSemverRange(version: string, range: string): boolean {
  return range
    .split(/,|\s+/)
    .filter((term: string) => term.length > EMPTY_COUNT)
    .every((term: string) => satisfiesRangeTerm(version, term));
}

function validateMinimalManifestFixture(ctx: ValidationContext): void {
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
}

function validateComponentManifestFixture(ctx: ValidationContext): void {
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
      manifestComponentFixture.canonicalParsedData.components.length === REQUIRED_COMPONENT_COUNT,
    "component package manifest fixture must declare exactly one component",
  );
}

function validateInvalidComponentRoleFixture(ctx: ValidationContext): void {
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
      invalidComponentRoleFixture.canonicalParsedData.components.length > MINIMAL_CARDINALITY,
    "invalid component role fixture must exercise multiple component declarations",
  );
  assert(
    invalidComponentRoleFixture.expected.failureCategory === "invalid-component-role-cardinality",
    "invalid component role fixture must classify component role cardinality failure",
  );
}

function validateProviderManifestFixture(ctx: ValidationContext): void {
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
      manifestProviderFixture.canonicalParsedData.volume.providers?.length > EMPTY_COUNT,
    "provider package manifest fixture must declare provider metadata",
  );
}

function validateMetaManifestFixture(ctx: ValidationContext): void {
  const manifestMetaFixture = ctx.readJson("conformance/fixtures/manifest-valid-meta.json");
  assertSpecVersion(ctx, manifestMetaFixture, "meta package manifest fixture");
  ctx.validate("volume", manifestMetaFixture.canonicalParsedData, "meta package manifest fixture");
  assert(
    manifestMetaFixture.expected.valid === true,
    "meta package manifest fixture must be expected valid",
  );
}

function validateUnknownFieldManifestFixture(ctx: ValidationContext): void {
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
}

function validateBaseManifestRoleFixtures(ctx: ValidationContext): void {
  validateMinimalManifestFixture(ctx);
  validateComponentManifestFixture(ctx);
  validateInvalidComponentRoleFixture(ctx);
  validateProviderManifestFixture(ctx);
  validateMetaManifestFixture(ctx);
  validateUnknownFieldManifestFixture(ctx);
}

function validateManifestParseCaseOutcome(
  ctx: ValidationContext,
  manifestParseCase: JsonValue,
  parsed: JsonValue,
): void {
  if (manifestParseCase.expected.valid) {
    ctx.validate("volume", parsed, `manifest parse case ${manifestParseCase.name}`);
  } else {
    ctx.validateExpectedFailure("volume", parsed, `manifest parse case ${manifestParseCase.name}`);
  }
}

function assertNoDefaultMaterialization(manifestParseCase: JsonValue, parsed: JsonValue): void {
  if (manifestParseCase.name === "no-default-materialization") {
    assert(
      !Object.hasOwn(parsed, "permissions") && !Object.hasOwn(parsed.components[0], "permissions"),
      "manifest parse case no-default-materialization must not inject permission defaults",
    );
  }
}

function assertInvalidManifestShape(manifestParseCase: JsonValue, parsed: JsonValue): void {
  if (manifestParseCase.expected.failureCategory === "invalid-manifest-shape") {
    assert(
      manifestParseCase.expected.path === "components" && !Array.isArray(parsed.components),
      `manifest parse case ${manifestParseCase.name} must fail because components is not an array table`,
    );
  }
}

function validateManifestParseCase(ctx: ValidationContext, manifestParseCase: JsonValue): void {
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
  validateManifestParseCaseOutcome(ctx, manifestParseCase, parsed);
  assertNoDefaultMaterialization(manifestParseCase, parsed);
  assertInvalidManifestShape(manifestParseCase, parsed);
}

function validateManifestParseCases(ctx: ValidationContext): void {
  const manifestParseCases = ctx.readJson("conformance/fixtures/manifest-parse-cases.json");
  ctx.validate("manifestParseCase", manifestParseCases, "manifest parse cases fixture");
  assertSpecVersion(ctx, manifestParseCases, "manifest parse cases");
  for (const manifestParseCase of manifestParseCases.cases) {
    validateManifestParseCase(ctx, manifestParseCase);
  }
  assert(
    manifestParseCases.cases.some(
      (manifestParseCase: JsonValue) =>
        manifestParseCase.name === "invalid-singleton-component-shape",
    ),
    "manifest parse cases must include singleton component shape rejection",
  );
}

function validateInvalidManifestFixtures(ctx: ValidationContext): void {
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
}

function validateDuplicateComponentFixture(ctx: ValidationContext): void {
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
}

function validateSiblingPermissionEscalationFixture(ctx: ValidationContext): void {
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
}

function validatePermissionEscalationFixtures(ctx: ValidationContext): void {
  const permissionFixture = ctx.readJson("conformance/fixtures/permission-escalation.json");
  assertSpecVersion(ctx, permissionFixture, "permission escalation manifest fixture");
  ctx.validate(
    "volume",
    permissionFixture.canonicalParsedData,
    "permission escalation manifest fixture",
  );

  const parentFilesystem = permissionFixture.canonicalParsedData.permissions.filesystem;
  const childFilesystem =
    permissionFixture.canonicalParsedData.components[0].permissions.filesystem;
  assert(
    isPermissionEscalation("filesystem", parentFilesystem, childFilesystem),
    "permission escalation fixture must actually broaden component permissions",
  );
  assert(
    isPermissionEscalation(
      "network",
      permissionFixture.canonicalParsedData.permissions.network,
      permissionFixture.canonicalParsedData.components[1].permissions.network,
    ),
    "permission escalation fixture must exercise network permission broadening",
  );
  assert(
    isPermissionEscalation(
      "browser",
      permissionFixture.canonicalParsedData.permissions.browser,
      permissionFixture.canonicalParsedData.components[2].permissions.browser,
    ),
    "permission escalation fixture must exercise browser permission broadening",
  );
  assert(
    permissionFixture.expected.valid === false,
    "permission escalation fixture must be an expected failure",
  );

  validateSiblingPermissionEscalationFixture(ctx);
}

function validateVersionIndexCases(ctx: ValidationContext): void {
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
    versionIndexFixture.items.length >= REQUIRED_VERSION_INDEX_ROWS,
    "version index collection fixture must include multiple rows",
  );
}

function validateSemverRangeCases(ctx: ValidationContext): void {
  const validateSemverRange = compileSemverRangeValidator(ctx);
  const semverRangeCases = ctx.readJson("conformance/fixtures/semver-range-cases.json");
  assertSpecVersion(ctx, semverRangeCases, "semver range cases");
  for (const range of semverRangeCases.accepted) {
    assert(validateSemverRange(range), `semver range case should be accepted: ${range}`);
  }
  for (const range of semverRangeCases.rejected) {
    assert(!validateSemverRange(range), `semver range case should be rejected: ${range}`);
  }
}

function validateVersionIndexAndSemverRangeCases(ctx: ValidationContext): void {
  validateVersionIndexCases(ctx);
  validateSemverRangeCases(ctx);
}

function assertExactPinnedYankedWarningSuccess(resolverCases: JsonValue): void {
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
}

function validateResolverCaseWarnings(ctx: ValidationContext, resolverCases: JsonValue): void {
  for (const resolverCase of resolverCases.cases) {
    for (const warning of resolverCase.expected.warnings ?? []) {
      assertWarning(ctx, warning, `resolver case ${resolverCase.name} warning`);
    }
  }
}

function assertRequiredResolverFailures(resolverCases: JsonValue): void {
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
}

function validateResolverRequirements(
  resolverCase: JsonValue,
  validateSemverRange: (range: JsonValue) => boolean,
): void {
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
}

function validateResolverVersionIndexRows(ctx: ValidationContext, resolverCase: JsonValue): void {
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
}

function assertResolverMetadataIdentity(
  resolverCase: JsonValue,
  releaseMetadata: JsonValue,
  key: string,
): void {
  if (resolverCase.requestRoute && resolverCase.expected.failureCategory !== "identity-mismatch") {
    assertRouteMetadataIdentity(
      resolverCase.requestRoute,
      releaseMetadata,
      `resolver case ${resolverCase.name} exact metadata ${key}`,
    );
  }
}

function assertResolverIdentityMismatch(resolverCase: JsonValue, releaseMetadata: JsonValue): void {
  if (resolverCase.expected.failureCategory === "identity-mismatch") {
    const identity = routeIdentityFromPath(resolverCase.requestRoute);
    assert(
      identity,
      `resolver case ${resolverCase.name} needs a parseable route for identity mismatch`,
    );
    assert(
      releaseMetadata.name !== identity.name || releaseMetadata.version !== identity.version,
      `resolver case ${resolverCase.name} must exercise route/metadata identity mismatch`,
    );
  }
}

function validateResolverExactReleaseMetadata(
  ctx: ValidationContext,
  resolverCase: JsonValue,
): void {
  if (resolverCase.exactReleaseMetadata) {
    for (const [key, metadata] of Object.entries(resolverCase.exactReleaseMetadata)) {
      const releaseMetadata: JsonValue = metadata;
      assertReleaseMetadata(
        ctx,
        releaseMetadata,
        `resolver case ${resolverCase.name} exact metadata ${key}`,
      );
      assertResolverMetadataIdentity(resolverCase, releaseMetadata, key);
      assertResolverIdentityMismatch(resolverCase, releaseMetadata);
    }
  }
}

function resolverRequirementGroups(resolverCase: JsonValue): ResolverRequirementGroup[] {
  const requirementsByVolume = new Map<string, JsonValue[]>();
  for (const requirement of resolverCase.requirements ?? []) {
    if (!requirementsByVolume.has(requirement.volume)) {
      requirementsByVolume.set(requirement.volume, []);
    }
    requirementsByVolume.get(requirement.volume)?.push(requirement);
  }
  return [...requirementsByVolume].map(([volume, requirements]) => ({
    requirements,
    rows: resolverCase.versionIndexRows?.[volume] ?? [],
    volume,
  }));
}

function rowMatchesRequirements(row: JsonValue, requirements: JsonValue[]): boolean {
  return requirements.every((requirement: JsonValue) =>
    satisfiesSemverRange(row.version, requirement.constraint),
  );
}

function eligibleResolverRows(
  group: ResolverRequirementGroup,
  resolverCase: JsonValue,
): JsonValue[] {
  return group.rows.filter((row: JsonValue) => {
    if (!rowMatchesRequirements(row, group.requirements)) {
      return false;
    }
    if (resolverCase.resolutionMode === "exact-pinned") {
      return true;
    }
    return row.status?.state === "available";
  });
}

function resolverLifecycleFailure(row: JsonValue): string {
  if (row.status?.state === "blocked") {
    return "blocked";
  }
  if (row.status?.state === "tombstoned") {
    return "tombstoned";
  }
  return "availability-or-registry-state";
}

function assertResolverFailureOutcome(resolverCase: JsonValue, failureCategory?: string): void {
  assert(
    resolverCase.expected.outcome === "failure",
    `resolver case ${resolverCase.name} must expect failure`,
  );
  if (failureCategory) {
    assert(
      resolverCase.expected.failureCategory === failureCategory,
      `resolver case ${resolverCase.name} must fail as ${failureCategory}`,
    );
  }
}

function resolverFailureCategoryForUnselectedRow(resolverCase: JsonValue, row: JsonValue): string {
  if (resolverCase.resolutionMode === "exact-pinned" && row) {
    return resolverLifecycleFailure(row);
  }
  return "";
}

function selectedResolverRows(resolverCase: JsonValue): Map<string, JsonValue> {
  const selectedRows = new Map<string, JsonValue>();
  for (const group of resolverRequirementGroups(resolverCase)) {
    const eligibleRows = eligibleResolverRows(group, resolverCase).toSorted(
      (left: JsonValue, right: JsonValue) => compareSemver(right.version, left.version),
    );
    if (eligibleRows.length === EMPTY_COUNT) {
      const matchingRow = group.rows.find((row: JsonValue) =>
        rowMatchesRequirements(row, group.requirements),
      );
      assertResolverFailureOutcome(
        resolverCase,
        resolverFailureCategoryForUnselectedRow(resolverCase, matchingRow),
      );
      return selectedRows;
    }
    selectedRows.set(group.volume, eligibleRows[0]);
  }
  return selectedRows;
}

function assertResolverSelectedRows(resolverCase: JsonValue): void {
  if (resolverCase.kind === "informational" || !resolverCase.requirements) {
    return;
  }
  const selectedRows = selectedResolverRows(resolverCase);
  if (resolverCase.expected.outcome === "failure") {
    return;
  }
  for (const [volume, selectedVersion] of Object.entries(resolverCase.expected.selected ?? {})) {
    assert(
      typeof selectedVersion === "string",
      `resolver case ${resolverCase.name} selected version must be a string`,
    );
    assert(
      selectedRows.get(volume)?.version === selectedVersion,
      `resolver case ${resolverCase.name} must select ${volume}@${selectedVersion}`,
    );
  }
}

function exactMetadataForSelectedRow(
  resolverCase: JsonValue,
  volume: string,
  row: JsonValue,
): JsonValue {
  return resolverCase.exactReleaseMetadata?.[`${volume}@${row.version}`];
}

function assertResolverReleaseMetadataConsistency(resolverCase: JsonValue): void {
  if (!resolverCase.exactReleaseMetadata || !resolverCase.versionIndexRows) {
    return;
  }
  for (const [volume, rows] of Object.entries(resolverCase.versionIndexRows)) {
    assert(
      Array.isArray(rows),
      `resolver case ${resolverCase.name} versionIndexRows.${volume} must be an array`,
    );
    for (const row of rows) {
      const exactMetadata = exactMetadataForSelectedRow(resolverCase, volume, row);
      if (exactMetadata) {
        const consistent = row.integrity === exactMetadata.integrity;
        if (!consistent) {
          assertResolverFailureOutcome(resolverCase, "inconsistent-registry-state");
        }
      }
    }
  }
}

function validateResolverCase(
  ctx: ValidationContext,
  resolverCase: JsonValue,
  validateSemverRange: (range: JsonValue) => boolean,
): void {
  assert(
    !("dependencies" in resolverCase),
    `resolver case ${resolverCase.name} must use requirements, not dependencies`,
  );
  validateResolverRequirements(resolverCase, validateSemverRange);
  validateResolverVersionIndexRows(ctx, resolverCase);
  validateResolverExactReleaseMetadata(ctx, resolverCase);
  assertResolverSelectedRows(resolverCase);
  assertResolverReleaseMetadataConsistency(resolverCase);
}

function validateResolverCases(ctx: ValidationContext): void {
  const resolverCases = ctx.readJson("conformance/fixtures/resolver-cases.json");
  const validateSemverRange = compileSemverRangeValidator(ctx);
  assertSpecVersion(ctx, resolverCases, "resolver cases");
  assertExactPinnedYankedWarningSuccess(resolverCases);
  validateResolverCaseWarnings(ctx, resolverCases);
  assertRequiredResolverFailures(resolverCases);
  for (const resolverCase of resolverCases.cases) {
    validateResolverCase(ctx, resolverCase, validateSemverRange);
  }
}

function assertYankedExactInstallWarning(exactCase: JsonValue): void {
  if (exactCase.metadata.status.state === "yanked") {
    assert(
      exactCase.expected.warnings?.some(
        (warning: JsonValue) => warning.category === "yanked-version",
      ),
      `exact release metadata case ${exactCase.name} must warn for yanked exact install`,
    );
  }
}

function validateExactReleaseMetadataSuccess(ctx: ValidationContext, exactCase: JsonValue): void {
  if (exactCase.metadata) {
    assertReleaseMetadata(ctx, exactCase.metadata, `exact release metadata case ${exactCase.name}`);
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
    assertYankedExactInstallWarning(exactCase);
  }
}

function validateExactReleaseMetadataProblem(ctx: ValidationContext, exactCase: JsonValue): void {
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
}

function assertNonInstallableDistFailure(exactCase: JsonValue): void {
  if (exactCase.expected.failureCategory === "non-installable-dist") {
    assert(
      ["blocked", "tombstoned", "unavailable"].includes(exactCase.invalidMetadata.status?.state),
      `exact release metadata case ${exactCase.name} invalid metadata must use non-installable lifecycle state`,
    );
    assert(
      exactCase.invalidMetadata.dist,
      `exact release metadata case ${exactCase.name} invalid metadata must exercise forbidden dist`,
    );
  }
}

function assertResolvedExternalDependencyEvidenceFailure(exactCase: JsonValue): void {
  if (exactCase.expected.failureCategory === "resolved-external-dependency-evidence") {
    assert(
      exactCase.invalidMetadata.externalDependencies?.some((dependency: JsonValue) =>
        Object.hasOwn(dependency, "resolvedVersion"),
      ),
      `exact release metadata case ${exactCase.name} must exercise forbidden resolved external dependency evidence`,
    );
  }
}

function validateExactReleaseMetadataInvalidMetadata(
  ctx: ValidationContext,
  exactCase: JsonValue,
): void {
  if (exactCase.invalidMetadata) {
    ctx.validateExpectedFailure(
      "releaseMetadata",
      exactCase.invalidMetadata,
      `exact release metadata case ${exactCase.name}`,
    );
    assertNonInstallableDistFailure(exactCase);
    assertResolvedExternalDependencyEvidenceFailure(exactCase);
  }
}

function validateExactReleaseMetadataCase(ctx: ValidationContext, exactCase: JsonValue): void {
  for (const warning of exactCase.expected.warnings ?? []) {
    assertWarning(ctx, warning, `exact release metadata case ${exactCase.name} warning`);
  }
  validateExactReleaseMetadataSuccess(ctx, exactCase);
  validateExactReleaseMetadataProblem(ctx, exactCase);
  validateExactReleaseMetadataInvalidMetadata(ctx, exactCase);
}

function assertRequiredExactReleaseMetadataDistSources(exactReleaseMetadataCases: JsonValue): void {
  for (const requiredDistSource of ["cdn", "git"]) {
    assert(
      exactReleaseMetadataCases.cases.some(
        (exactCase: JsonValue) => exactCase.expected.distSource === requiredDistSource,
      ),
      `exact release metadata cases missing ${requiredDistSource} success`,
    );
  }
}

function assertRequiredExactReleaseMetadataFailures(exactReleaseMetadataCases: JsonValue): void {
  for (const requiredFailure of ["blocked", "tombstoned", "availability-or-registry-state"]) {
    assert(
      exactReleaseMetadataCases.cases.some(
        (exactCase: JsonValue) => exactCase.expected.failureCategory === requiredFailure,
      ),
      `exact release metadata cases missing ${requiredFailure} failure`,
    );
  }
}

function validateExactReleaseMetadataCases(ctx: ValidationContext): void {
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
    validateExactReleaseMetadataCase(ctx, exactCase);
  }
  assertRequiredExactReleaseMetadataDistSources(exactReleaseMetadataCases);
  assertRequiredExactReleaseMetadataFailures(exactReleaseMetadataCases);
}

export function run(ctx: ValidationContext): void {
  validateBaseManifestRoleFixtures(ctx);
  validateManifestParseCases(ctx);
  validateInvalidManifestFixtures(ctx);
  validateDuplicateComponentFixture(ctx);
  validatePermissionEscalationFixtures(ctx);
  validateVersionIndexAndSemverRangeCases(ctx);
  validateResolverCases(ctx);
  validateExactReleaseMetadataCases(ctx);
}
