import path from "node:path";

import { assertWarning } from "../assertions/warnings.ts";
import { assert, assertDeepEqual, assertSpecVersion } from "../core/assert.ts";
import { EMPTY_COUNT } from "../core/numeric-constants.ts";
import {
  externalDependencyDeclarationKeyPattern,
  isRecognizedSpdxExpressionShape,
} from "../core/patterns.ts";
import {
  compareStrings,
  declarationKeyForSemanticKey,
  externalDependencyScope,
  externalDependencySemanticKey,
  isExternalDependencyPurpose,
  normalizeVersConstraintForComparison,
  parseExternalDependencyPurl,
  parseVersScheme,
} from "../core/purl.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

const componentPurlPattern =
  /^pkg:volume\/(?:%40((?![a-z0-9-]*--)[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?)\/)?((?![a-z0-9-]*--)[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?)(?:@(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?)?#(agent|skill|command|tool|hook|mcp-server|lsp-server)\/(?![a-z0-9-]*--)[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/;

const versionlessComponentPurlPatterns = [/^pkg:volume\/[^@#]+#/, /^pkg:volume\/%40[^/]+\/[^@#]+#/];

const requiredExternalDependencyFailures = [
  "invalid-external-dependency-purl",
  "external-dependency-volume-purl",
  "invalid-external-dependency-constraint",
  "external-dependency-constraint-type-mismatch",
  "invalid-external-dependency-purpose",
  "unknown-external-dependency-component",
  "duplicate-external-dependency",
  "conflicting-external-dependency",
];

const REQUIRED_VERS_BOUND_COUNT = 1;

type ComponentType = "agent" | "skill" | "command" | "tool" | "hook" | "mcp-server" | "lsp-server";

const requiredComponentFailures = [
  "missing-entrypoint",
  "missing-command-trigger",
  "invalid-command-trigger",
  "missing-skill-description",
  "unsupported-hook-event",
  "unsupported-entrypoint-format",
  "invalid-lsp-descriptor",
  "invalid-spdx-expression",
];

const componentTypes: ComponentType[] = [
  "agent",
  "skill",
  "command",
  "tool",
  "hook",
  "mcp-server",
  "lsp-server",
];

const positiveCompatibilityCaseNames = [
  "compatibility-preserves-semver-looking-runtime-expression",
  "compatibility-preserves-date-like-protocol-expression",
  "compatibility-preserves-short-numeric-protocol-expression",
  "unknown-compatibility-scheme-is-advisory-not-rejection",
];

const requiredExposureIntersections = ["intersects", "does-not-intersect", "indeterminate"];

const versComparatorPattern =
  /^(<|<=|>|>=|=)(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

const versVersionCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "case",
});

interface ComponentDependencyPurlParts {
  hasVersion: boolean;
  parentName: JsonValue;
}

interface ComponentDependencyFindings {
  invalidComponentPurls: JsonValue;
  missingDependencies: JsonValue;
  missingParentDependencies: JsonValue;
  unknownLocalComponents: JsonValue;
}

interface ExternalDependencyValidationState {
  declaredComponents: Set<JsonValue>;
  purlVersExceptionPairs: Set<string>;
  seenSemanticKeys: Map<JsonValue, JsonValue>;
}

interface VersBound {
  inclusive: boolean;
  version: string;
}

interface VersRange {
  lower: VersBound;
  scheme: string;
  upper: VersBound;
}

type VersIntersection = "intersects" | "does-not-intersect" | "indeterminate";

interface ParsedVersComparator {
  operator: string;
  version: string;
}

interface ComparableVersRanges {
  affectedRange: VersRange;
  declarationRange: VersRange;
  parsedPurl: JsonValue;
}

interface SemanticVocabularies {
  baselineHookTypes: Set<JsonValue>;
  canonicalHookEvents: Set<JsonValue>;
  supportedEntrypointExtensionsByType: Record<ComponentType, Set<JsonValue>>;
}

function parseComponentDependencyPurl(componentPurl: JsonValue): ComponentDependencyPurlParts {
  const match = componentPurl.match(componentPurlPattern);
  const [, scope, name] = match || [];
  return {
    hasVersion: Boolean(match && match[3]),
    parentName: scope ? `@${scope}/${name}` : name,
  };
}

function isComponentType(value: JsonValue): value is ComponentType {
  return (
    typeof value === "string" && componentTypes.some((componentType) => componentType === value)
  );
}

function getComponentDependencyFindings(dependencyCase: JsonValue): ComponentDependencyFindings {
  const declaredComponents = new Set(dependencyCase.declaredComponents);
  const parentDependencies = new Set(Object.keys(dependencyCase["volume-dependencies"]));
  const resolvedComponents = new Set(dependencyCase.resolvedComponents);
  const requestedDependencies = Object.values(dependencyCase["component-dependencies"]).flat();
  const invalidComponentPurls = requestedDependencies.filter(
    (dependency: JsonValue) => !componentPurlPattern.test(dependency),
  );
  const validRequestedDependencies = requestedDependencies.filter((dependency: JsonValue) =>
    componentPurlPattern.test(dependency),
  );
  const missingDependencies = validRequestedDependencies.filter(
    (dependency: JsonValue) => !resolvedComponents.has(dependency),
  );
  const unknownLocalComponents = Object.keys(dependencyCase["component-dependencies"]).filter(
    (componentName: JsonValue) => !declaredComponents.has(componentName),
  );
  const missingParentDependencies = validRequestedDependencies.filter((dependency: JsonValue) => {
    const parsedDependency = parseComponentDependencyPurl(dependency);
    if (parsedDependency.hasVersion) {
      return false;
    }
    return !parentDependencies.has(parsedDependency.parentName);
  });
  return {
    invalidComponentPurls,
    missingDependencies,
    missingParentDependencies,
    unknownLocalComponents,
  };
}

function assertComponentDependencyExpectedMetadata(dependencyCase: JsonValue): void {
  if (typeof dependencyCase.expected.failureCategory === "string") {
    assert(
      dependencyCase.expected.valid === false,
      `component dependency case ${dependencyCase.name} with a failureCategory must be invalid`,
    );
  }
  if (dependencyCase.expected.valid === false) {
    assert(
      typeof dependencyCase.expected.failureCategory === "string",
      `component dependency case ${dependencyCase.name} must declare a failureCategory when invalid`,
    );
  }
}

function assertComponentDependencyFailureCategory(
  dependencyCase: JsonValue,
  findings: ComponentDependencyFindings,
): void {
  if (dependencyCase.expected.failureCategory === "missing-component-dependency") {
    assert(
      findings.missingDependencies.length > EMPTY_COUNT,
      `component dependency case ${dependencyCase.name} must contain a missing dependency`,
    );
  }
  if (dependencyCase.expected.failureCategory === "unknown-local-component") {
    assert(
      findings.unknownLocalComponents.length > EMPTY_COUNT,
      `component dependency case ${dependencyCase.name} must contain a component-dependencies key absent from declaredComponents`,
    );
  }
  if (dependencyCase.expected.failureCategory === "invalid-component-purl") {
    assert(
      findings.invalidComponentPurls.length > EMPTY_COUNT,
      `component dependency case ${dependencyCase.name} must contain an invalid component purl candidate`,
    );
  }
  if (dependencyCase.expected.failureCategory === "missing-parent-volume-dependency") {
    assert(
      findings.missingParentDependencies.length > EMPTY_COUNT,
      `component dependency case ${dependencyCase.name} must contain a versionless component dependency without a parent volume dependency`,
    );
  }
}

function assertValidComponentDependencyCase(
  dependencyCase: JsonValue,
  findings: ComponentDependencyFindings,
): void {
  if (dependencyCase.expected.valid === true) {
    assert(
      findings.missingDependencies.length === EMPTY_COUNT,
      `component dependency case ${dependencyCase.name} must be semantically valid`,
    );
    assert(
      findings.unknownLocalComponents.length === EMPTY_COUNT,
      `component dependency case ${dependencyCase.name} must only use declared component-dependencies keys`,
    );
    assert(
      findings.invalidComponentPurls.length === EMPTY_COUNT,
      `component dependency case ${dependencyCase.name} must only use valid component purls`,
    );
    assert(
      findings.missingParentDependencies.length === EMPTY_COUNT,
      `component dependency case ${dependencyCase.name} must only use versionless references backed by parent volume dependencies`,
    );
  }
}

function validateComponentDependencyCase(dependencyCase: JsonValue): void {
  const findings = getComponentDependencyFindings(dependencyCase);
  assertComponentDependencyExpectedMetadata(dependencyCase);
  assertComponentDependencyFailureCategory(dependencyCase, findings);
  assertValidComponentDependencyCase(dependencyCase, findings);
}

function assertVersionlessAuthoringReferences(componentDependencyCases: JsonValue): void {
  assert(
    componentDependencyCases.cases.some((dependencyCase: JsonValue) =>
      Object.values(dependencyCase["component-dependencies"])
        .flat()
        .some((dependency: JsonValue) =>
          versionlessComponentPurlPatterns.some((pattern: RegExp) => pattern.test(dependency)),
        ),
    ),
    "component dependency cases must include versionless authoring references",
  );
}

function validateComponentDependencyCases(ctx: ValidationContext): void {
  const componentDependencyCases = ctx.readJson(
    "conformance/fixtures/component-dependency-validation-cases.json",
  );
  ctx.validate(
    "componentDependencyValidationCase",
    componentDependencyCases,
    "component dependency validation cases fixture",
  );
  for (const dependencyCase of componentDependencyCases.cases) {
    validateComponentDependencyCase(dependencyCase);
  }
  assertVersionlessAuthoringReferences(componentDependencyCases);
}

function assertExternalDependencyPurpose(
  externalDependencyCase: JsonValue,
  dependency: JsonValue,
): void {
  assert(
    isExternalDependencyPurpose(dependency.purpose) ||
      externalDependencyCase.expected.failureCategory === "invalid-external-dependency-purpose",
    `external dependency case ${externalDependencyCase.name} invalid purpose must be expected`,
  );
}

function assertExternalDependencyPurl(
  externalDependencyCase: JsonValue,
  dependency: JsonValue,
): void {
  const parsedPurl = parseExternalDependencyPurl(dependency.purl);
  if (parsedPurl.type) {
    assert(
      !parsedPurl.hasVersion ||
        externalDependencyCase.expected.failureCategory === "invalid-external-dependency-purl",
      `external dependency case ${externalDependencyCase.name} versioned PURL must be an expected PURL failure`,
    );
    assert(
      !parsedPurl.hasSubpath ||
        externalDependencyCase.expected.failureCategory === "invalid-external-dependency-purl",
      `external dependency case ${externalDependencyCase.name} subpath PURL must be an expected PURL failure`,
    );
    assert(
      parsedPurl.type !== "volume" ||
        externalDependencyCase.expected.failureCategory === "external-dependency-volume-purl",
      `external dependency case ${externalDependencyCase.name} pkg:volume must be an expected volume-purl failure`,
    );
  }
}

function assertExternalDependencyPurlVersCompatibility(
  externalDependencyCase: JsonValue,
  dependency: JsonValue,
  purlVersExceptionPairs: Set<string>,
): void {
  const parsedPurl = parseExternalDependencyPurl(dependency.purl);
  const versScheme = parseVersScheme(dependency.constraint);
  if (parsedPurl && versScheme && parsedPurl.type !== "volume") {
    const compatible =
      parsedPurl.type === versScheme ||
      purlVersExceptionPairs.has(`${parsedPurl.type}:${versScheme}`);
    assert(
      compatible ||
        externalDependencyCase.expected.failureCategory ===
          "external-dependency-constraint-type-mismatch",
      `external dependency case ${externalDependencyCase.name} PURL/VERS mismatch must be expected`,
    );
  }
}

function assertExternalDependencyComponents(
  externalDependencyCase: JsonValue,
  dependency: JsonValue,
  declaredComponents: Set<JsonValue>,
): void {
  for (const component of dependency.components ?? []) {
    assert(
      declaredComponents.has(component) ||
        externalDependencyCase.expected.failureCategory === "unknown-external-dependency-component",
      `external dependency case ${externalDependencyCase.name} unknown component must be expected`,
    );
  }
}

function assertExternalDependencySemanticKeyUniqueness(
  externalDependencyCase: JsonValue,
  dependency: JsonValue,
  seenSemanticKeys: Map<JsonValue, JsonValue>,
): void {
  const key = externalDependencySemanticKey(dependency);
  if (seenSemanticKeys.has(key)) {
    const previousConstraint = seenSemanticKeys.get(key);
    const normalizedPreviousConstraint = normalizeVersConstraintForComparison(previousConstraint);
    const normalizedCurrentConstraint = normalizeVersConstraintForComparison(dependency.constraint);
    const expectedCategory =
      normalizedPreviousConstraint === normalizedCurrentConstraint
        ? "duplicate-external-dependency"
        : "conflicting-external-dependency";
    assert(
      externalDependencyCase.expected.failureCategory === expectedCategory,
      `external dependency case ${externalDependencyCase.name} duplicate semantic key must classify as ${expectedCategory}`,
    );
  }
  seenSemanticKeys.set(key, dependency.constraint);
}

function validateExternalDependency(
  externalDependencyCase: JsonValue,
  dependency: JsonValue,
  state: ExternalDependencyValidationState,
): void {
  assertExternalDependencyPurpose(externalDependencyCase, dependency);
  assertExternalDependencyPurl(externalDependencyCase, dependency);
  assertExternalDependencyPurlVersCompatibility(
    externalDependencyCase,
    dependency,
    state.purlVersExceptionPairs,
  );
  assertExternalDependencyComponents(externalDependencyCase, dependency, state.declaredComponents);
  assertExternalDependencySemanticKeyUniqueness(
    externalDependencyCase,
    dependency,
    state.seenSemanticKeys,
  );
}

function validateExternalDependencySemanticKey(
  externalDependencyCase: JsonValue,
  index: JsonValue,
  semanticKey: JsonValue,
): void {
  const dependency = externalDependencyCase["external-dependencies"][index];
  assert(
    semanticKey.purl === dependency.purl,
    `external dependency case ${externalDependencyCase.name} semantic key purl must match dependency`,
  );
  assert(
    semanticKey.purpose === dependency.purpose,
    `external dependency case ${externalDependencyCase.name} semantic key purpose must match dependency`,
  );
  assertDeepEqual(
    semanticKey.scope,
    externalDependencyScope(dependency),
    `external dependency case ${externalDependencyCase.name} semantic key scope must match dependency scope`,
  );
  assert(
    !Object.hasOwn(semanticKey, "constraint"),
    `external dependency case ${externalDependencyCase.name} semantic key excludes constraint`,
  );
  const sortedScope = [...semanticKey.scope].toSorted(compareStrings);
  assertDeepEqual(
    semanticKey.scope,
    sortedScope,
    `external dependency case ${externalDependencyCase.name} semantic key scope`,
  );
  assert(
    semanticKey.declarationKey === declarationKeyForSemanticKey(semanticKey),
    `external dependency case ${externalDependencyCase.name} declaration key must match JCS input`,
  );
}

function validateExternalDependencySemanticKeys(externalDependencyCase: JsonValue): void {
  if (externalDependencyCase.expected.valid === true) {
    assert(
      Array.isArray(externalDependencyCase.expected.semanticKeys) &&
        externalDependencyCase.expected.semanticKeys.length ===
          externalDependencyCase["external-dependencies"].length,
      `external dependency case ${externalDependencyCase.name} successful cases need semanticKeys`,
    );
    for (const [index, semanticKey] of externalDependencyCase.expected.semanticKeys.entries()) {
      validateExternalDependencySemanticKey(externalDependencyCase, index, semanticKey);
    }
  }
}

function assertExternalDependencyCaseCoverage(externalDependencyCases: JsonValue): void {
  assert(
    externalDependencyCases.cases.some(
      (externalDependencyCase: JsonValue) =>
        externalDependencyCase.name === "normalized-equivalent-vers-constraints-are-duplicate",
    ),
    "external dependency validation cases must include normalized-equivalent VERS duplicate coverage",
  );
  assert(
    externalDependencyCases.cases.some(
      (externalDependencyCase: JsonValue) =>
        externalDependencyCase.name === "normalized-distinct-vers-constraints-are-conflict",
    ),
    "external dependency validation cases must include normalized VERS conflict coverage",
  );
  for (const requiredFailure of requiredExternalDependencyFailures) {
    assert(
      externalDependencyCases.cases.some(
        (externalDependencyCase: JsonValue) =>
          externalDependencyCase.expected.failureCategory === requiredFailure,
      ),
      `external dependency validation cases must include ${requiredFailure}`,
    );
  }
}

function validateExternalDependencyCase(
  externalDependencyCase: JsonValue,
  purlVersExceptionPairs: Set<string>,
): void {
  const declaredComponents = new Set(externalDependencyCase.declaredComponents);
  const seenSemanticKeys = new Map();
  const state = {
    declaredComponents,
    purlVersExceptionPairs,
    seenSemanticKeys,
  };
  for (const dependency of externalDependencyCase["external-dependencies"]) {
    validateExternalDependency(externalDependencyCase, dependency, state);
  }
  if (externalDependencyCase.expected.valid === false) {
    assert(
      typeof externalDependencyCase.expected.failureCategory === "string",
      `external dependency case ${externalDependencyCase.name} invalid cases need a failureCategory`,
    );
  }
  validateExternalDependencySemanticKeys(externalDependencyCase);
}

function validateExternalDependencyCases(
  externalDependencyCases: JsonValue,
  purlVersExceptionPairs: Set<string>,
): void {
  for (const externalDependencyCase of externalDependencyCases.cases) {
    validateExternalDependencyCase(externalDependencyCase, purlVersExceptionPairs);
  }
  assertExternalDependencyCaseCoverage(externalDependencyCases);
}

function validateInvalidPurlVersCompatibilityExceptionCases(ctx: ValidationContext): void {
  const invalidPurlVersCompatibilityExceptions = ctx.readJson(
    "conformance/fixtures/purl-vers-compatibility-exceptions-invalid.json",
  );
  assertSpecVersion(
    ctx,
    invalidPurlVersCompatibilityExceptions,
    "invalid PURL/VERS compatibility exception cases",
  );
  for (const invalidExceptionCase of invalidPurlVersCompatibilityExceptions.cases) {
    ctx.validateExpectedFailure(
      "purlVersCompatibilityExceptions",
      invalidExceptionCase.payload,
      `invalid PURL/VERS compatibility exception case ${invalidExceptionCase.name}`,
    );
    assert(
      invalidExceptionCase.expected.valid === false,
      `invalid PURL/VERS compatibility exception case ${invalidExceptionCase.name} must fail`,
    );
  }
}

function assertPurlVersCompatibilityExceptionCoverage(
  purlVersCompatibilityExceptions: JsonValue,
): void {
  assert(
    purlVersCompatibilityExceptions.exceptions.some(
      (exception: JsonValue) =>
        exception.id === "pub-dart" &&
        exception.purlType === "pub" &&
        exception.versScheme === "dart",
    ),
    "PURL/VERS compatibility exceptions must include pub/dart",
  );
}

function validatePurlVersCompatibilityExceptions(ctx: ValidationContext): Set<string> {
  const purlVersCompatibilityExceptions = ctx.readJson(
    "conformance/purl-vers-compatibility-exceptions.json",
  );
  ctx.validate(
    "purlVersCompatibilityExceptions",
    purlVersCompatibilityExceptions,
    "PURL/VERS compatibility exceptions",
  );
  assertSpecVersion(ctx, purlVersCompatibilityExceptions, "PURL/VERS compatibility exceptions");
  validateInvalidPurlVersCompatibilityExceptionCases(ctx);
  assertPurlVersCompatibilityExceptionCoverage(purlVersCompatibilityExceptions);
  return new Set(
    purlVersCompatibilityExceptions.exceptions.map(
      (exception: JsonValue) => `${exception.purlType}:${exception.versScheme}`,
    ),
  );
}

function validateExternalDependencyDomain(ctx: ValidationContext): Set<string> {
  const externalDependencyCases = ctx.readJson(
    "conformance/fixtures/external-dependency-validation-cases.json",
  );
  ctx.validate(
    "externalDependencyValidationCase",
    externalDependencyCases,
    "external dependency validation cases fixture",
  );
  assertSpecVersion(ctx, externalDependencyCases, "external dependency validation cases");
  const purlVersExceptionPairs = validatePurlVersCompatibilityExceptions(ctx);
  validateExternalDependencyCases(externalDependencyCases, purlVersExceptionPairs);
  return purlVersExceptionPairs;
}

function semanticVocabularies(semanticValidationCases: JsonValue): SemanticVocabularies {
  const { componentEntrypointExtensions } = semanticValidationCases.vocabularies;
  const supportedEntrypointExtensionsByType = {
    agent: new Set<JsonValue>(),
    command: new Set<JsonValue>(),
    hook: new Set<JsonValue>(),
    "lsp-server": new Set<JsonValue>(),
    "mcp-server": new Set<JsonValue>(),
    skill: new Set<JsonValue>(),
    tool: new Set<JsonValue>(),
  };
  for (const componentType of componentTypes) {
    supportedEntrypointExtensionsByType[componentType] = new Set(
      componentEntrypointExtensions[componentType],
    );
  }
  return {
    baselineHookTypes: new Set(semanticValidationCases.vocabularies.baselineHookTypes),
    canonicalHookEvents: new Set(semanticValidationCases.vocabularies.canonicalHookEvents),
    supportedEntrypointExtensionsByType,
  };
}

function validateSemanticHookCase(
  semanticCase: JsonValue,
  component: JsonValue,
  vocabularies: SemanticVocabularies,
): void {
  if (component.type === "hook" && semanticCase.expected.valid === true) {
    assert(
      vocabularies.canonicalHookEvents.has(semanticCase.payload.hook?.event),
      `semantic validation case ${semanticCase.name} valid hook must use canonical event vocabulary`,
    );
    assert(
      vocabularies.baselineHookTypes.has(semanticCase.payload.hook?.type),
      `semantic validation case ${semanticCase.name} valid hook must use baseline hook type`,
    );
  }
}

function validateUnsupportedToolEntrypointCase(
  semanticCase: JsonValue,
  component: JsonValue,
  vocabularies: SemanticVocabularies,
): void {
  if (
    component.type === "tool" &&
    semanticCase.expected.failureCategory === "unsupported-entrypoint-format"
  ) {
    const extension = path.posix.extname(component.entrypoint);
    assert(
      !vocabularies.supportedEntrypointExtensionsByType.tool.has(extension),
      `semantic validation case ${semanticCase.name} unsupported tool format must not reject JSON/YAML/script baseline formats`,
    );
  }
}

interface EntrypointArchivePath {
  escapedArchiveRoot: boolean;
  path: string;
}

function entrypointArchivePath(
  semanticCase: JsonValue,
  component: JsonValue,
): EntrypointArchivePath {
  assert(
    typeof component.entrypoint === "string",
    `semantic validation case ${semanticCase.name} component entrypoint must be a string`,
  );
  const entrypointPath = component.entrypoint.startsWith("./")
    ? component.entrypoint.slice("./".length)
    : component.entrypoint;
  const archivePath = path.posix.normalize(entrypointPath);
  return {
    escapedArchiveRoot:
      archivePath === "." || archivePath.startsWith("../") || path.posix.isAbsolute(archivePath),
    path: archivePath,
  };
}

function releaseEntryTypeForPath(payload: JsonValue, archivePath: string): JsonValue {
  const releaseEntry = payload.releaseEntries?.find(
    (entry: JsonValue) => entry.path === archivePath,
  );
  if (releaseEntry) {
    return releaseEntry.entryType;
  }
  if (payload.releaseFiles?.includes(archivePath)) {
    return "file";
  }
  return false;
}

function assertMissingEntrypointArchiveCase(
  semanticCase: JsonValue,
  archivePath: EntrypointArchivePath,
): void {
  if (semanticCase.expected.failureCategory === "missing-entrypoint") {
    assert(
      archivePath.escapedArchiveRoot ||
        !releaseEntryTypeForPath(semanticCase.payload, archivePath.path),
      `semantic validation case ${semanticCase.name} missing entrypoint must not resolve to a regular release entry`,
    );
    return;
  }
}

function assertResolvedEntrypointArchiveCase(
  semanticCase: JsonValue,
  archivePath: EntrypointArchivePath,
): void {
  assert(
    !archivePath.escapedArchiveRoot,
    `semantic validation case ${semanticCase.name} component entrypoint must remain within the release archive`,
  );
  const entryType = releaseEntryTypeForPath(semanticCase.payload, archivePath.path);
  if (semanticCase.expected.failureCategory === "non-regular-archive-entry") {
    assert(
      entryType && entryType !== "file",
      `semantic validation case ${semanticCase.name} non-regular entrypoint must resolve to a non-file archive entry`,
    );
  }
  if (semanticCase.expected.valid === true) {
    assert(
      entryType === "file",
      `semantic validation case ${semanticCase.name} valid entrypoint must resolve to a regular release file`,
    );
  }
}

function validateSemanticEntrypointArchiveCase(
  semanticCase: JsonValue,
  component: JsonValue,
): void {
  if (!semanticCase.payload.releaseFiles && !semanticCase.payload.releaseEntries) {
    return;
  }
  const archivePath = entrypointArchivePath(semanticCase, component);
  assertMissingEntrypointArchiveCase(semanticCase, archivePath);
  if (semanticCase.expected.failureCategory === "missing-entrypoint") {
    return;
  }
  assertResolvedEntrypointArchiveCase(semanticCase, archivePath);
}

function validateSemanticCaseComponent(
  semanticCase: JsonValue,
  component: JsonValue,
  vocabularies: SemanticVocabularies,
): void {
  const extension = path.posix.extname(component.entrypoint);
  const componentType = component.type;
  const supportedExtensions = isComponentType(componentType)
    ? vocabularies.supportedEntrypointExtensionsByType[componentType]
    : new Set();
  if (semanticCase.expected.valid === true && supportedExtensions) {
    assert(
      supportedExtensions.has(extension),
      `semantic validation case ${semanticCase.name} valid ${component.type} must use supported entrypoint extension`,
    );
  }
  validateSemanticHookCase(semanticCase, component, vocabularies);
  validateUnsupportedToolEntrypointCase(semanticCase, component, vocabularies);
  validateSemanticEntrypointArchiveCase(semanticCase, component);
}

function validateSemanticValidationCase(
  ctx: ValidationContext,
  semanticCase: JsonValue,
  vocabularies: SemanticVocabularies,
): void {
  for (const warning of semanticCase.expected.warnings ?? []) {
    assertWarning(ctx, warning, `semantic validation case ${semanticCase.name} warning`);
  }
  const { component } = semanticCase.payload;
  if (component) {
    validateSemanticCaseComponent(semanticCase, component, vocabularies);
  }
  if (semanticCase.expected.failureCategory === "invalid-spdx-expression") {
    assert(
      !isRecognizedSpdxExpressionShape(semanticCase.payload.license),
      `semantic validation case ${semanticCase.name} must exercise invalid SPDX expression shape`,
    );
  }
}

function assertRequiredSemanticComponentFailures(semanticValidationCases: JsonValue): void {
  for (const requiredComponentFailure of requiredComponentFailures) {
    assert(
      semanticValidationCases.cases.some(
        (semanticCase: JsonValue) =>
          semanticCase.area === "manifest" &&
          semanticCase.expected.failureCategory === requiredComponentFailure,
      ),
      `semantic validation cases must include component entrypoint failure ${requiredComponentFailure}`,
    );
  }
}

function assertPositiveSemanticComponentCases(semanticValidationCases: JsonValue): void {
  for (const componentType of componentTypes) {
    assert(
      semanticValidationCases.cases.some(
        (semanticCase: JsonValue) =>
          semanticCase.area === "manifest" &&
          semanticCase.expected.valid === true &&
          semanticCase.payload.component?.type === componentType,
      ),
      `semantic validation cases must include positive ${componentType} component case`,
    );
  }
}

function assertSpecificPositiveSemanticComponentCases(semanticValidationCases: JsonValue): void {
  assert(
    semanticValidationCases.cases.some(
      (semanticCase: JsonValue) =>
        semanticCase.area === "manifest" &&
        semanticCase.expected.valid === true &&
        semanticCase.payload.component?.type === "agent" &&
        path.posix.extname(semanticCase.payload.component.entrypoint) === ".yaml",
    ),
    "semantic validation cases must include positive agent YAML entrypoint coverage",
  );
  assert(
    semanticValidationCases.cases.some(
      (semanticCase: JsonValue) =>
        semanticCase.area === "manifest" &&
        semanticCase.expected.valid === true &&
        semanticCase.payload.component?.type === "mcp-server" &&
        semanticCase.payload.component.entrypoint === "./.mcp.json" &&
        typeof semanticCase.payload.descriptor === "object" &&
        !Array.isArray(semanticCase.payload.descriptor),
    ),
    "semantic validation cases must include positive canonical MCP JSON object coverage",
  );
}

function assertSemanticWarningCoverage(semanticValidationCases: JsonValue): void {
  assert(
    semanticValidationCases.cases.some(
      (semanticCase: JsonValue) =>
        semanticCase.area === "warning" &&
        semanticCase.expected.warnings?.some(
          (warning: JsonValue) => warning.category === "noncanonical-entrypoint",
        ),
    ),
    "semantic validation cases must include noncanonical-entrypoint warning",
  );
  assert(
    semanticValidationCases.cases.some(
      (semanticCase: JsonValue) =>
        semanticCase.area === "warning" &&
        semanticCase.expected.warnings?.some(
          (warning: JsonValue) => warning.category === "deprecated",
        ),
    ),
    "semantic validation cases must include deprecated warning category",
  );
  assert(
    semanticValidationCases.cases.some(
      (semanticCase: JsonValue) =>
        semanticCase.area === "load" &&
        semanticCase.expected.failureCategory === "load-policy-blocked",
    ),
    "semantic validation cases must include load-time policy blocking boundary",
  );
}

function assertSemanticCompatibilityCoverage(semanticValidationCases: JsonValue): void {
  for (const compatibilityCaseName of positiveCompatibilityCaseNames) {
    assert(
      semanticValidationCases.cases.some(
        (semanticCase: JsonValue) =>
          semanticCase.name === compatibilityCaseName && semanticCase.expected.valid === true,
      ),
      `semantic validation cases must include positive compatibility expression case ${compatibilityCaseName}`,
    );
  }
}

function assertSemanticReleaseAndTrustCoverage(semanticValidationCases: JsonValue): void {
  assert(
    semanticValidationCases.cases.some(
      (semanticCase: JsonValue) =>
        semanticCase.expected.failureCategory === "non-regular-archive-entry",
    ),
    "semantic validation cases must include release file-selection non-regular entry failure",
  );
  assert(
    semanticValidationCases.cases.some(
      (semanticCase: JsonValue) => semanticCase.expected.failureCategory === "digest-mismatch",
    ),
    "semantic validation cases must include trust attachment byte identity mismatch",
  );
}

function assertSemanticValidationCaseCoverage(semanticValidationCases: JsonValue): void {
  assertRequiredSemanticComponentFailures(semanticValidationCases);
  assertPositiveSemanticComponentCases(semanticValidationCases);
  assertSpecificPositiveSemanticComponentCases(semanticValidationCases);
  assertSemanticWarningCoverage(semanticValidationCases);
  assertSemanticCompatibilityCoverage(semanticValidationCases);
  assertSemanticReleaseAndTrustCoverage(semanticValidationCases);
}

function validateSemanticValidationCases(ctx: ValidationContext): void {
  const semanticValidationCases = ctx.readJson(
    "conformance/fixtures/semantic-validation-cases.json",
  );
  ctx.validate(
    "semanticValidationCase",
    semanticValidationCases,
    "semantic validation cases fixture",
  );
  assertSpecVersion(ctx, semanticValidationCases, "semantic validation cases");
  const vocabularies = semanticVocabularies(semanticValidationCases);
  for (const semanticCase of semanticValidationCases.cases) {
    validateSemanticValidationCase(ctx, semanticCase, vocabularies);
  }
  assertSemanticValidationCaseCoverage(semanticValidationCases);
}

function declarationKeyForExposureDeclaration(declaration: JsonValue): string {
  return declarationKeyForSemanticKey({
    purl: declaration.purl,
    purpose: declaration.purpose,
    scope: externalDependencyScope(declaration),
  });
}

function assertPotentialExposureCaseInputs(
  exposureCase: JsonValue,
  advisoryMatches: JsonValue,
): void {
  assert(
    externalDependencyDeclarationKeyPattern.test(exposureCase.declaration.declarationKey),
    `potential exposure case ${exposureCase.name} needs a declaration key`,
  );
  assert(
    exposureCase.declaration.declarationKey ===
      declarationKeyForExposureDeclaration(exposureCase.declaration),
    `potential exposure case ${exposureCase.name} declaration key must match JCS input`,
  );
  assert(
    advisoryMatches.every((advisoryMatch: JsonValue) => typeof advisoryMatch !== "undefined"),
    `potential exposure case ${exposureCase.name} needs advisory match input`,
  );
  assert(
    ["intersects", "does-not-intersect", "indeterminate"].includes(
      exposureCase.expected.intersection,
    ),
    `potential exposure case ${exposureCase.name} needs an intersection state`,
  );
}

function compareVersVersions(left: string, right: string): number {
  return versVersionCollator.compare(left, right);
}

/* eslint-disable no-magic-numbers -- Comparator result checks conventionally compare against 0. */
function stricterLowerBound(left: VersBound, right: VersBound): VersBound {
  const comparison = compareVersVersions(left.version, right.version);
  if (comparison > 0) {
    return left;
  }
  if (comparison < 0) {
    return right;
  }
  return { inclusive: left.inclusive && right.inclusive, version: left.version };
}

function stricterUpperBound(left: VersBound, right: VersBound): VersBound {
  const comparison = compareVersVersions(left.version, right.version);
  if (comparison < 0) {
    return left;
  }
  if (comparison > 0) {
    return right;
  }
  return { inclusive: left.inclusive && right.inclusive, version: left.version };
}
/* eslint-enable no-magic-numbers */

function parseVersComparator(term: string): ParsedVersComparator | false {
  const match = versComparatorPattern.exec(term);
  if (!match) {
    return false;
  }
  const [, operator, major, minor, patch, prerelease] = match;
  assert(operator && major && minor && patch, `VERS comparator must be complete: ${term}`);
  return {
    operator,
    version: `${major}.${minor}.${patch}${prerelease ? `-${prerelease}` : ""}`,
  };
}

function addParsedVersBound(
  lowerBounds: VersBound[],
  upperBounds: VersBound[],
  comparator: ParsedVersComparator,
): void {
  if (comparator.operator === ">=" || comparator.operator === ">") {
    lowerBounds.push({ inclusive: comparator.operator === ">=", version: comparator.version });
  }
  if (comparator.operator === "<=" || comparator.operator === "<") {
    upperBounds.push({ inclusive: comparator.operator === "<=", version: comparator.version });
  }
  if (comparator.operator === "=") {
    lowerBounds.push({ inclusive: true, version: comparator.version });
    upperBounds.push({ inclusive: true, version: comparator.version });
  }
}

function parseVersBounds(terms: string[]): { lower: VersBound; upper: VersBound } | false {
  const lowerBounds: VersBound[] = [];
  const upperBounds: VersBound[] = [];
  for (const term of terms) {
    const comparator = parseVersComparator(term);
    if (!comparator) {
      return false;
    }
    addParsedVersBound(lowerBounds, upperBounds, comparator);
  }
  const [lower] = lowerBounds;
  const [upper] = upperBounds;
  return lowerBounds.length === REQUIRED_VERS_BOUND_COUNT &&
    upperBounds.length === REQUIRED_VERS_BOUND_COUNT &&
    lower &&
    upper
    ? { lower, upper }
    : false;
}

function parseVersRange(constraint: JsonValue): VersRange | false {
  const scheme = typeof constraint === "string" ? parseVersScheme(constraint) : false;
  if (typeof scheme !== "string") {
    return false;
  }
  const bounds = parseVersBounds(constraint.slice(`vers:${scheme}/`.length).split("|"));
  return bounds ? { ...bounds, scheme } : false;
}

function versRangesIntersect(left: VersRange, right: VersRange): boolean {
  const lower = stricterLowerBound(left.lower, right.lower);
  const upper = stricterUpperBound(left.upper, right.upper);
  const comparison = compareVersVersions(lower.version, upper.version);
  // eslint-disable-next-line no-magic-numbers -- Comparator result checks conventionally compare against 0.
  return comparison < 0 || (comparison === 0 && lower.inclusive && upper.inclusive);
}

function hasBroadPrereleaseBound(range: VersRange): boolean {
  return [range.lower.version, range.upper.version].some((version: string) => {
    const [, prerelease] = version.split("-");
    return Boolean(prerelease && !prerelease.includes("."));
  });
}

function rangesAreComparable(
  comparableRanges: ComparableVersRanges,
  purlVersExceptionPairs: Set<string>,
): boolean {
  const { affectedRange, declarationRange, parsedPurl } = comparableRanges;
  return (
    declarationRange.scheme === affectedRange.scheme &&
    (parsedPurl.type === declarationRange.scheme ||
      purlVersExceptionPairs.has(`${parsedPurl.type}:${declarationRange.scheme}`))
  );
}

function parsedPotentialExposureRanges(
  exposureCase: JsonValue,
  advisoryMatch: JsonValue,
): ComparableVersRanges | false {
  const declarationRange = parseVersRange(exposureCase.declaration.constraint);
  const affectedRange = parseVersRange(advisoryMatch.affectedRange);
  if (!declarationRange || !affectedRange) {
    return false;
  }
  return {
    affectedRange,
    declarationRange,
    parsedPurl: parseExternalDependencyPurl(exposureCase.declaration.purl),
  };
}

function rangesHaveBroadPrereleaseBounds(comparableRanges: ComparableVersRanges): boolean {
  return (
    hasBroadPrereleaseBound(comparableRanges.declarationRange) ||
    hasBroadPrereleaseBound(comparableRanges.affectedRange)
  );
}

function actualPotentialExposureIntersection(intersections: VersIntersection[]): VersIntersection {
  const intersectionSet = new Set(intersections);
  if (intersectionSet.has("intersects")) {
    return "intersects";
  }
  if (intersectionSet.has("indeterminate")) {
    return "indeterminate";
  }
  return "does-not-intersect";
}

function potentialExposureIntersection(
  exposureCase: JsonValue,
  advisoryMatch: JsonValue,
  purlVersExceptionPairs: Set<string>,
): VersIntersection {
  if (exposureCase.declaration.purl !== advisoryMatch.affectedPurl) {
    return "does-not-intersect";
  }
  const comparableRanges = parsedPotentialExposureRanges(exposureCase, advisoryMatch);
  if (!comparableRanges) {
    return "indeterminate";
  }
  if (!rangesAreComparable(comparableRanges, purlVersExceptionPairs)) {
    return "indeterminate";
  }
  if (rangesHaveBroadPrereleaseBounds(comparableRanges)) {
    return "indeterminate";
  }
  return versRangesIntersect(comparableRanges.declarationRange, comparableRanges.affectedRange)
    ? "intersects"
    : "does-not-intersect";
}

function assertPotentialExposureIntersectionResult(
  exposureCase: JsonValue,
  advisoryMatches: JsonValue,
  purlVersExceptionPairs: Set<string>,
): void {
  const intersections = advisoryMatches.map((advisoryMatch: JsonValue) =>
    potentialExposureIntersection(exposureCase, advisoryMatch, purlVersExceptionPairs),
  );
  assert(
    actualPotentialExposureIntersection(intersections) === exposureCase.expected.intersection,
    `potential exposure case ${exposureCase.name} intersection must match deterministic evaluator`,
  );
}

function emittedPotentialExposureWarningIdentities(exposureCase: JsonValue): string[] {
  return (exposureCase.expected.warnings ?? []).map((warning: JsonValue) =>
    [
      warning.context.dependency.declarationKey,
      warning.context.advisoryMatch.canonicalId,
      warning.context.advisoryMatch.affectedPurl,
      warning.context.advisoryMatch.affectedRange,
    ].join("\u0000"),
  );
}

function assertPotentialExposureWarningDeduplication(exposureCase: JsonValue): void {
  const warningIdentities = emittedPotentialExposureWarningIdentities(exposureCase);
  assert(
    new Set(warningIdentities).size === warningIdentities.length,
    `potential exposure case ${exposureCase.name} warnings must be deduplicated by declaration/advisory/range tuple`,
  );
  if (typeof exposureCase.duplicateInputs === "number") {
    assert(
      exposureCase.duplicateInputs > warningIdentities.length,
      `potential exposure case ${exposureCase.name} duplicate input count must exceed emitted warning identities`,
    );
  }
}

function assertSortedUniqueStrings(values: JsonValue, label: string): void {
  if (typeof values === "undefined") {
    return;
  }
  assertDeepEqual(values, [...values].toSorted(compareStrings), `${label} must be sorted`);
  assert(new Set(values).size === values.length, `${label} must be duplicate-free`);
}

function assertAdvisoryMatchSourceIdentity(advisoryMatch: JsonValue, label: string): void {
  assertSortedUniqueStrings(advisoryMatch.sourceIds, `${label} sourceIds`);
  assertSortedUniqueStrings(advisoryMatch.aliases, `${label} aliases`);
}

function validatePotentialExposureWarnings(
  ctx: ValidationContext,
  exposureCase: JsonValue,
  advisoryMatches: JsonValue,
): void {
  for (const advisoryMatch of advisoryMatches) {
    assertAdvisoryMatchSourceIdentity(
      advisoryMatch,
      `potential exposure case ${exposureCase.name}`,
    );
  }
  for (const warning of exposureCase.expected.warnings ?? []) {
    assertWarning(ctx, warning, `potential exposure case ${exposureCase.name} warning`);
    assert(
      warning.context.dependency.declarationKey === exposureCase.declaration.declarationKey,
      `potential exposure case ${exposureCase.name} warning declaration key must match declaration`,
    );
    assert(
      advisoryMatches.some(
        (advisoryMatch: JsonValue) =>
          warning.context.advisoryMatch.canonicalId === advisoryMatch.canonicalId &&
          warning.context.advisoryMatch.affectedPurl === advisoryMatch.affectedPurl &&
          warning.context.advisoryMatch.affectedRange === advisoryMatch.affectedRange,
      ),
      `potential exposure case ${exposureCase.name} warning advisory match identity must match input`,
    );
    assertAdvisoryMatchSourceIdentity(
      warning.context.advisoryMatch,
      `potential exposure case ${exposureCase.name} warning`,
    );
  }
}

function assertPotentialExposureIntersectionExpectation(exposureCase: JsonValue): void {
  if (exposureCase.expected.intersection === "intersects") {
    assert(
      (exposureCase.expected.warnings ?? []).some(
        (warning: JsonValue) => warning.category === "external-dependency-potential-exposure",
      ),
      `potential exposure case ${exposureCase.name} intersecting cases must emit a potential exposure warning`,
    );
  }
  if (exposureCase.expected.intersection !== "intersects") {
    assert(
      (exposureCase.expected.warnings ?? []).length === EMPTY_COUNT,
      `potential exposure case ${exposureCase.name} non-intersecting/indeterminate cases must not emit potential exposure warnings`,
    );
  }
}

function assertPotentialExposureWarningCount(exposureCase: JsonValue): void {
  assert(
    exposureCase.expected.warningCount === (exposureCase.expected.warnings ?? []).length,
    `potential exposure case ${exposureCase.name} warningCount must match emitted warnings`,
  );
}

function validatePotentialExposureDedupIdentity(exposureCase: JsonValue): void {
  if (exposureCase.expected.dedupIdentity) {
    assert(
      exposureCase.expected.dedupIdentity.join("\u0000") ===
        [
          exposureCase.declaration.declarationKey,
          exposureCase.advisoryMatch.canonicalId,
          exposureCase.advisoryMatch.affectedPurl,
          exposureCase.advisoryMatch.affectedRange,
        ].join("\u0000"),
      `potential exposure case ${exposureCase.name} dedup identity must use declaration/advisory/range tuple`,
    );
    assertPotentialExposureWarningCount(exposureCase);
  }
}

function validatePotentialExposureDedupIdentities(exposureCase: JsonValue): void {
  if (exposureCase.expected.dedupIdentities) {
    const expectedIdentities = (exposureCase.expected.warnings ?? []).map((warning: JsonValue) => [
      exposureCase.declaration.declarationKey,
      warning.context.advisoryMatch.canonicalId,
      warning.context.advisoryMatch.affectedPurl,
      warning.context.advisoryMatch.affectedRange,
    ]);
    assert(
      exposureCase.expected.dedupIdentities.length === expectedIdentities.length,
      `potential exposure case ${exposureCase.name} dedupIdentities must match emitted warning identities`,
    );
    assert(
      new Set(
        exposureCase.expected.dedupIdentities.map((identity: JsonValue) => identity.join("\u0000")),
      ).size === exposureCase.expected.dedupIdentities.length,
      `potential exposure case ${exposureCase.name} dedupIdentities must be distinct`,
    );
    for (const expectedIdentity of expectedIdentities) {
      assert(
        exposureCase.expected.dedupIdentities.some(
          (dedupIdentity: JsonValue) =>
            dedupIdentity.join("\u0000") === expectedIdentity.join("\u0000"),
        ),
        `potential exposure case ${exposureCase.name} dedupIdentities must use declaration/advisory/range tuples`,
      );
    }
    assertPotentialExposureWarningCount(exposureCase);
  }
}

function assertPotentialExposureCoverage(
  externalDependencyPotentialExposureCases: JsonValue,
): void {
  assert(
    externalDependencyPotentialExposureCases.cases.some(
      (exposureCase: JsonValue) =>
        exposureCase.name === "same-advisory-distinct-affected-ranges-emit-distinct-warnings",
    ),
    "potential exposure cases must include same-advisory distinct affected range warning coverage",
  );
  for (const requiredIntersection of requiredExposureIntersections) {
    assert(
      externalDependencyPotentialExposureCases.cases.some(
        (exposureCase: JsonValue) => exposureCase.expected.intersection === requiredIntersection,
      ),
      `potential exposure cases must include ${requiredIntersection}`,
    );
  }
}

function validateInvalidPotentialExposureWarningContexts(ctx: ValidationContext): void {
  const invalidPotentialExposureWarningContexts = ctx.readJson(
    "conformance/fixtures/external-dependency-potential-exposure-warning-context-invalid.json",
  );
  assertSpecVersion(
    ctx,
    invalidPotentialExposureWarningContexts,
    "invalid external dependency warning context cases",
  );
  for (const invalidWarningContextCase of invalidPotentialExposureWarningContexts.cases) {
    ctx.validateExpectedFailure(
      "externalDependencyPotentialExposureWarningContext",
      invalidWarningContextCase.context,
      `invalid external dependency warning context case ${invalidWarningContextCase.name}`,
    );
    assert(
      invalidWarningContextCase.expected.valid === false,
      `invalid external dependency warning context case ${invalidWarningContextCase.name} must fail`,
    );
  }
}

function validateExternalDependencyPotentialExposureCase(
  ctx: ValidationContext,
  exposureCase: JsonValue,
  purlVersExceptionPairs: Set<string>,
): void {
  const advisoryMatches = exposureCase.advisoryMatches ?? [exposureCase.advisoryMatch];
  assertPotentialExposureCaseInputs(exposureCase, advisoryMatches);
  assertPotentialExposureIntersectionResult(exposureCase, advisoryMatches, purlVersExceptionPairs);
  validatePotentialExposureWarnings(ctx, exposureCase, advisoryMatches);
  assertPotentialExposureIntersectionExpectation(exposureCase);
  assertPotentialExposureWarningDeduplication(exposureCase);
  validatePotentialExposureDedupIdentity(exposureCase);
  validatePotentialExposureDedupIdentities(exposureCase);
}

function validateExternalDependencyPotentialExposureCases(
  ctx: ValidationContext,
  purlVersExceptionPairs: Set<string>,
): void {
  const externalDependencyPotentialExposureCases = ctx.readJson(
    "conformance/fixtures/external-dependency-potential-exposure-cases.json",
  );
  assertSpecVersion(
    ctx,
    externalDependencyPotentialExposureCases,
    "external dependency potential exposure cases",
  );
  validateInvalidPotentialExposureWarningContexts(ctx);
  for (const exposureCase of externalDependencyPotentialExposureCases.cases) {
    validateExternalDependencyPotentialExposureCase(ctx, exposureCase, purlVersExceptionPairs);
  }
  assertPotentialExposureCoverage(externalDependencyPotentialExposureCases);
}

export function run(ctx: ValidationContext): void {
  validateComponentDependencyCases(ctx);
  const purlVersExceptionPairs = validateExternalDependencyDomain(ctx);
  validateSemanticValidationCases(ctx);
  validateExternalDependencyPotentialExposureCases(ctx, purlVersExceptionPairs);
}
