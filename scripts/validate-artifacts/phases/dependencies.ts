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

function parseComponentDependencyPurl(componentPurl: JsonValue): JsonValue {
  const match = componentPurl.match(componentPurlPattern);
  const [, scope, name] = match || [];
  return {
    hasVersion: Boolean(match && match[3]),
    parentName: scope ? `@${scope}/${name}` : name,
  };
}

export function run(ctx: ValidationContext): void {
  const componentDependencyCases = ctx.readJson(
    "conformance/fixtures/component-dependency-validation-cases.json",
  );
  ctx.validate(
    "componentDependencyValidationCase",
    componentDependencyCases,
    "component dependency validation cases fixture",
  );
  for (const dependencyCase of componentDependencyCases.cases) {
    const declaredComponents = new Set(dependencyCase.declaredComponents);
    const parentDependencies = new Set(Object.keys(dependencyCase["volume-dependencies"]));
    const resolvedComponents = new Set(dependencyCase.resolvedComponents);
    const requestedDependencies = Object.values(
      dependencyCase["component-dependencies"],
    ).flat() as string[];
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
    if (dependencyCase.expected.failureCategory === "missing-component-dependency") {
      assert(
        missingDependencies.length > EMPTY_COUNT,
        `component dependency case ${dependencyCase.name} must contain a missing dependency`,
      );
    }
    if (dependencyCase.expected.failureCategory === "unknown-local-component") {
      assert(
        unknownLocalComponents.length > EMPTY_COUNT,
        `component dependency case ${dependencyCase.name} must contain a component-dependencies key absent from declaredComponents`,
      );
    }
    if (dependencyCase.expected.failureCategory === "invalid-component-purl") {
      assert(
        invalidComponentPurls.length > EMPTY_COUNT,
        `component dependency case ${dependencyCase.name} must contain an invalid component purl candidate`,
      );
    }
    if (dependencyCase.expected.failureCategory === "missing-parent-volume-dependency") {
      assert(
        missingParentDependencies.length > EMPTY_COUNT,
        `component dependency case ${dependencyCase.name} must contain a versionless component dependency without a parent volume dependency`,
      );
    }
    if (dependencyCase.expected.valid === true) {
      assert(
        missingDependencies.length === EMPTY_COUNT,
        `component dependency case ${dependencyCase.name} must be semantically valid`,
      );
      assert(
        unknownLocalComponents.length === EMPTY_COUNT,
        `component dependency case ${dependencyCase.name} must only use declared component-dependencies keys`,
      );
      assert(
        invalidComponentPurls.length === EMPTY_COUNT,
        `component dependency case ${dependencyCase.name} must only use valid component purls`,
      );
      assert(
        missingParentDependencies.length === EMPTY_COUNT,
        `component dependency case ${dependencyCase.name} must only use versionless references backed by parent volume dependencies`,
      );
    }
  }
  assert(
    componentDependencyCases.cases.some((dependencyCase: JsonValue) =>
      (Object.values(dependencyCase["component-dependencies"]).flat() as string[]).some(
        (dependency: JsonValue) =>
          /^pkg:volume\/[^@#]+#/.test(dependency) ||
          /^pkg:volume\/%40[^/]+\/[^@#]+#/.test(dependency),
      ),
    ),
    "component dependency cases must include versionless authoring references",
  );

  const externalDependencyCases = ctx.readJson(
    "conformance/fixtures/external-dependency-validation-cases.json",
  );
  ctx.validate(
    "externalDependencyValidationCase",
    externalDependencyCases,
    "external dependency validation cases fixture",
  );
  assertSpecVersion(ctx, externalDependencyCases, "external dependency validation cases");
  const purlVersCompatibilityExceptions = ctx.readJson(
    "conformance/purl-vers-compatibility-exceptions.json",
  );
  ctx.validate(
    "purlVersCompatibilityExceptions",
    purlVersCompatibilityExceptions,
    "PURL/VERS compatibility exceptions",
  );
  assertSpecVersion(ctx, purlVersCompatibilityExceptions, "PURL/VERS compatibility exceptions");
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
  assert(
    purlVersCompatibilityExceptions.exceptions.some(
      (exception: JsonValue) =>
        exception.id === "pub-dart" &&
        exception.purlType === "pub" &&
        exception.versScheme === "dart",
    ),
    "PURL/VERS compatibility exceptions must include pub/dart",
  );
  const purlVersExceptionPairs = new Set(
    purlVersCompatibilityExceptions.exceptions.map(
      (exception: JsonValue) => `${exception.purlType}:${exception.versScheme}`,
    ),
  );
  for (const externalDependencyCase of externalDependencyCases.cases) {
    const declaredComponents = new Set(externalDependencyCase.declaredComponents);
    const seenSemanticKeys = new Map();
    for (const dependency of externalDependencyCase["external-dependencies"]) {
      assert(
        isExternalDependencyPurpose(dependency.purpose) ||
          externalDependencyCase.expected.failureCategory === "invalid-external-dependency-purpose",
        `external dependency case ${externalDependencyCase.name} invalid purpose must be expected`,
      );
      const parsedPurl = parseExternalDependencyPurl(dependency.purl);
      const versScheme = parseVersScheme(dependency.constraint);
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
      for (const component of dependency.components ?? []) {
        assert(
          declaredComponents.has(component) ||
            externalDependencyCase.expected.failureCategory ===
              "unknown-external-dependency-component",
          `external dependency case ${externalDependencyCase.name} unknown component must be expected`,
        );
      }
      const key = externalDependencySemanticKey(dependency);
      if (seenSemanticKeys.has(key)) {
        const previousConstraint = seenSemanticKeys.get(key);
        const normalizedPreviousConstraint =
          normalizeVersConstraintForComparison(previousConstraint);
        const normalizedCurrentConstraint = normalizeVersConstraintForComparison(
          dependency.constraint,
        );
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
    if (externalDependencyCase.expected.valid === false) {
      assert(
        typeof externalDependencyCase.expected.failureCategory === "string",
        `external dependency case ${externalDependencyCase.name} invalid cases need a failureCategory`,
      );
    }
    if (externalDependencyCase.expected.valid === true) {
      assert(
        Array.isArray(externalDependencyCase.expected.semanticKeys) &&
          externalDependencyCase.expected.semanticKeys.length ===
            externalDependencyCase["external-dependencies"].length,
        `external dependency case ${externalDependencyCase.name} successful cases need semanticKeys`,
      );
      for (const [index, semanticKey] of externalDependencyCase.expected.semanticKeys.entries()) {
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
        if (semanticKey.declarationKey) {
          assert(
            semanticKey.declarationKey === declarationKeyForSemanticKey(semanticKey),
            `external dependency case ${externalDependencyCase.name} declaration key must match JCS input`,
          );
        }
      }
    }
  }
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
  for (const requiredFailure of [
    "invalid-external-dependency-purl",
    "external-dependency-volume-purl",
    "invalid-external-dependency-constraint",
    "external-dependency-constraint-type-mismatch",
    "invalid-external-dependency-purpose",
    "unknown-external-dependency-component",
    "duplicate-external-dependency",
    "conflicting-external-dependency",
  ]) {
    assert(
      externalDependencyCases.cases.some(
        (externalDependencyCase: JsonValue) =>
          externalDependencyCase.expected.failureCategory === requiredFailure,
      ),
      `external dependency validation cases must include ${requiredFailure}`,
    );
  }

  const semanticValidationCases = ctx.readJson(
    "conformance/fixtures/semantic-validation-cases.json",
  );
  ctx.validate(
    "semanticValidationCase",
    semanticValidationCases,
    "semantic validation cases fixture",
  );
  const canonicalHookEvents = new Set([
    "SessionStart",
    "SessionEnd",
    "Setup",
    "UserPromptSubmit",
    "Stop",
    "StopFailure",
    "PreToolUse",
    "PostToolUse",
    "PostToolUseFailure",
    "PostToolBatch",
    "SubagentStart",
    "SubagentStop",
    "TaskCreated",
    "TaskCompleted",
    "InstructionsLoaded",
    "ConfigChange",
    "CwdChanged",
    "FileChanged",
    "PreCompact",
    "PostCompact",
  ]);
  const supportedEntrypointExtensionsByType = {
    agent: new Set([".md", ".yaml"]),
    command: new Set([".md"]),
    hook: new Set([".md", ".yaml", ".js", ".mjs", ".sh", ".py"]),
    "lsp-server": new Set([".json"]),
    "mcp-server": new Set([".json"]),
    skill: new Set([".md"]),
    tool: new Set([".json", ".yaml", ".js", ".mjs", ".sh", ".py"]),
  };
  type ComponentType = keyof typeof supportedEntrypointExtensionsByType;
  const supportedEntrypointExtensionMap: Record<
    ComponentType,
    Set<string>
  > = supportedEntrypointExtensionsByType;

  const isComponentType = (value: JsonValue): value is ComponentType =>
    typeof value === "string" && Object.hasOwn(supportedEntrypointExtensionsByType, value);

  for (const semanticCase of semanticValidationCases.cases) {
    for (const warning of semanticCase.expected.warnings ?? []) {
      assertWarning(ctx, warning, `semantic validation case ${semanticCase.name} warning`);
    }
    const { component } = semanticCase.payload;
    if (component) {
      const extension = path.posix.extname(component.entrypoint);
      const componentType = component.type;
      const supportedExtensions = isComponentType(componentType)
        ? supportedEntrypointExtensionMap[componentType]
        : new Set();
      if (semanticCase.expected.valid === true && supportedExtensions) {
        assert(
          supportedExtensions.has(extension),
          `semantic validation case ${semanticCase.name} valid ${component.type} must use supported entrypoint extension`,
        );
      }
      if (component.type === "hook" && semanticCase.expected.valid === true) {
        assert(
          canonicalHookEvents.has(semanticCase.payload.hook?.event),
          `semantic validation case ${semanticCase.name} valid hook must use canonical event vocabulary`,
        );
        assert(
          ["command", "script", "module"].includes(semanticCase.payload.hook?.type),
          `semantic validation case ${semanticCase.name} valid hook must use baseline hook type`,
        );
      }
      if (
        component.type === "tool" &&
        semanticCase.expected.failureCategory === "unsupported-entrypoint-format"
      ) {
        assert(
          !supportedEntrypointExtensionsByType.tool.has(extension),
          `semantic validation case ${semanticCase.name} unsupported tool format must not reject JSON/YAML/script baseline formats`,
        );
      }
    }
    if (semanticCase.expected.failureCategory === "invalid-spdx-expression") {
      assert(
        !isRecognizedSpdxExpressionShape(semanticCase.payload.license),
        `semantic validation case ${semanticCase.name} must exercise invalid SPDX expression shape`,
      );
    }
  }
  for (const requiredComponentFailure of [
    "missing-entrypoint",
    "missing-command-trigger",
    "invalid-command-trigger",
    "missing-skill-description",
    "unsupported-hook-event",
    "unsupported-entrypoint-format",
    "invalid-lsp-descriptor",
    "invalid-spdx-expression",
  ]) {
    assert(
      semanticValidationCases.cases.some(
        (semanticCase: JsonValue) =>
          semanticCase.area === "manifest" &&
          semanticCase.expected.failureCategory === requiredComponentFailure,
      ),
      `semantic validation cases must include component entrypoint failure ${requiredComponentFailure}`,
    );
  }
  for (const componentType of [
    "agent",
    "skill",
    "command",
    "tool",
    "hook",
    "mcp-server",
    "lsp-server",
  ]) {
    assert(
      semanticValidationCases.cases.some(
        (semanticCase: JsonValue) =>
          semanticCase.area === "manifest" &&
          semanticCase.expected.valid === true &&
          semanticCase.payload.component?.type === componentType,
      ) ||
        semanticValidationCases.cases.some(
          (semanticCase: JsonValue) =>
            semanticCase.area === "warning" &&
            semanticCase.expected.valid === true &&
            semanticCase.payload.component?.type === componentType,
        ),
      `semantic validation cases must include positive ${componentType} component case`,
    );
  }
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
  for (const compatibilityCaseName of [
    "compatibility-preserves-semver-looking-runtime-expression",
    "compatibility-preserves-date-like-protocol-expression",
    "compatibility-preserves-short-numeric-protocol-expression",
    "unknown-compatibility-scheme-is-advisory-not-rejection",
  ]) {
    assert(
      semanticValidationCases.cases.some(
        (semanticCase: JsonValue) =>
          semanticCase.name === compatibilityCaseName && semanticCase.expected.valid === true,
      ),
      `semantic validation cases must include positive compatibility expression case ${compatibilityCaseName}`,
    );
  }
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

  const externalDependencyPotentialExposureCases = ctx.readJson(
    "conformance/fixtures/external-dependency-potential-exposure-cases.json",
  );
  assertSpecVersion(
    ctx,
    externalDependencyPotentialExposureCases,
    "external dependency potential exposure cases",
  );
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
  for (const exposureCase of externalDependencyPotentialExposureCases.cases) {
    const advisoryMatches = exposureCase.advisoryMatches ?? [exposureCase.advisoryMatch];
    assert(
      externalDependencyDeclarationKeyPattern.test(exposureCase.declaration.declarationKey),
      `potential exposure case ${exposureCase.name} needs a declaration key`,
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
    }
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
      assert(
        exposureCase.expected.warningCount === (exposureCase.expected.warnings ?? []).length,
        `potential exposure case ${exposureCase.name} warningCount must match emitted warnings`,
      );
    }
    if (exposureCase.expected.dedupIdentities) {
      const expectedIdentities = (exposureCase.expected.warnings ?? []).map(
        (warning: JsonValue) => [
          exposureCase.declaration.declarationKey,
          warning.context.advisoryMatch.canonicalId,
          warning.context.advisoryMatch.affectedPurl,
          warning.context.advisoryMatch.affectedRange,
        ],
      );
      assert(
        exposureCase.expected.dedupIdentities.length === expectedIdentities.length,
        `potential exposure case ${exposureCase.name} dedupIdentities must match emitted warning identities`,
      );
      assert(
        new Set(
          exposureCase.expected.dedupIdentities.map((identity: JsonValue) =>
            identity.join("\u0000"),
          ),
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
      assert(
        exposureCase.expected.warningCount === (exposureCase.expected.warnings ?? []).length,
        `potential exposure case ${exposureCase.name} warningCount must match emitted warnings`,
      );
    }
  }
  assert(
    externalDependencyPotentialExposureCases.cases.some(
      (exposureCase: JsonValue) =>
        exposureCase.name === "same-advisory-distinct-affected-ranges-emit-distinct-warnings",
    ),
    "potential exposure cases must include same-advisory distinct affected range warning coverage",
  );
  for (const requiredIntersection of ["intersects", "does-not-intersect", "indeterminate"]) {
    assert(
      externalDependencyPotentialExposureCases.cases.some(
        (exposureCase: JsonValue) => exposureCase.expected.intersection === requiredIntersection,
      ),
      `potential exposure cases must include ${requiredIntersection}`,
    );
  }
}
