import { assertConformanceCoverageReferences } from "../assertions/conformance-coverage.ts";
import {
  findExternalReference,
  findProperty,
  findSpdxExternalRef,
  parseStablePropertyJson,
} from "../assertions/mapping-artifacts.ts";
import { assertCycloneDxArtifact } from "../assertions/trust-artifacts.ts";
import {
  assertWarningFixtureCoverage,
  assertWarningSchemaDescribesCoreCategories,
} from "../assertions/warnings.ts";
import { assert, assertDeepEqual, assertSpecVersion, stableJsonStringify } from "../core/assert.ts";
import {
  CONFORMANCE_REQUIREMENT_ID_PAD_WIDTH,
  EMPTY_COUNT,
  INCREMENT_STEP,
  REQUIRED_ROLE_CONFORMANCE_REQUIREMENT_COUNT,
  SHA256_INTEGRITY_PREFIX_LENGTH,
} from "../core/numeric-constants.ts";
import {
  canonicalComponentPurl,
  canonicalReleasePurl,
  compareStrings,
  declarationKeyForSemanticKey,
} from "../core/purl.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

interface MappingSampleContext {
  sampleManifest: JsonValue;
  sampleVolume: JsonValue;
  sampleRelease: JsonValue;
  sampleDigest: string;
  sampleCycloneDx: JsonValue;
  sampleSpdx: JsonValue;
  sampleSpdxExternalDependencies: JsonValue;
  sampleExternalDependencyPredicate: JsonValue;
  sampleSlsa: JsonValue;
  sampleComponentPurls: Map<JsonValue, string>;
}

interface ExternalDependencyContext {
  externalDependency: JsonValue;
  declarationKey: string;
  scope: JsonValue;
}

function extractSpecRequirementIds(specText: string): string[] {
  const requirementIds = [];
  for (const match of specText.matchAll(/\*\*(AV-(?:BIB|CLI)-\d{3})\*\*/g)) {
    const [, requirementId] = match;
    assert(requirementId, "spec conformance requirement ID capture failed");
    requirementIds.push(requirementId);
  }
  return requirementIds;
}

function coverageRequirementsById(conformanceCoverage: JsonValue): Map<string, JsonValue> {
  return new Map(
    conformanceCoverage.requirements.map((requirement: JsonValue) => [requirement.id, requirement]),
  );
}

function expectedConformanceRequirementIds(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_value: unknown, index: number) => {
    const requirementNumber = String(index + INCREMENT_STEP).padStart(
      CONFORMANCE_REQUIREMENT_ID_PAD_WIDTH,
      "0",
    );
    return `${prefix}-${requirementNumber}`;
  });
}

function assertConformanceRequirementIdRange(specRequirementIds: string[]): void {
  assertDeepEqual(
    specRequirementIds.filter((id: string) => id.startsWith("AV-BIB-")),
    expectedConformanceRequirementIds("AV-BIB", REQUIRED_ROLE_CONFORMANCE_REQUIREMENT_COUNT),
    "spec bibliotheca conformance requirement IDs must be contiguous AV-BIB-001 through AV-BIB-018",
  );
  assertDeepEqual(
    specRequirementIds.filter((id: string) => id.startsWith("AV-CLI-")),
    expectedConformanceRequirementIds("AV-CLI", REQUIRED_ROLE_CONFORMANCE_REQUIREMENT_COUNT),
    "spec client conformance requirement IDs must be contiguous AV-CLI-001 through AV-CLI-018",
  );
}

function normalizeFixtureReference(fixturePath: string): string {
  return fixturePath.replace(/^conformance\/fixtures\//, "").replace(/^conformance\//, "");
}

function coverageFixtureNames(requirement: JsonValue): Set<string> {
  return new Set(
    requirement.coverage.map((coverage: JsonValue) => normalizeFixtureReference(coverage.fixture)),
  );
}

function matrixFamilyFixtureNames(endpointFamily: JsonValue): string[] {
  return (endpointFamily.fixtures ?? []).map((fixturePath: JsonValue) =>
    normalizeFixtureReference(fixturePath),
  );
}

function assertConformanceRequirementParity(
  ctx: ValidationContext,
  conformanceCoverage: JsonValue,
): void {
  const specRequirementIds = extractSpecRequirementIds(ctx.readText("agent-volumes-spec.md"));
  assertDeepEqual(
    [...new Set(specRequirementIds)].toSorted(compareStrings),
    specRequirementIds.toSorted(compareStrings),
    "spec role-scoped conformance requirement IDs must be unique",
  );
  assert(
    specRequirementIds.some((id: string) => id.startsWith("AV-BIB-")) &&
      specRequirementIds.some((id: string) => id.startsWith("AV-CLI-")),
    "spec role-scoped conformance requirement IDs must include bibliotheca and client IDs",
  );
  assertConformanceRequirementIdRange(specRequirementIds);
  assertDeepEqual(
    conformanceCoverage.requirements.map((requirement: JsonValue) => requirement.id),
    specRequirementIds,
    "conformance coverage requirement IDs must match agent-volumes-spec.md",
  );
}

function assertOpenapiMatrixRequirementCoverage(
  ctx: ValidationContext,
  conformanceCoverage: JsonValue,
): void {
  const openapiOperationMatrix = ctx.readJson("conformance/fixtures/openapi-operation-matrix.json");
  const requirementsById = coverageRequirementsById(conformanceCoverage);

  for (const endpointFamily of openapiOperationMatrix.endpointFamilies) {
    const familyFixtureNames = matrixFamilyFixtureNames(endpointFamily);
    for (const requirementId of endpointFamily.requirements) {
      const requirement = requirementsById.get(requirementId);
      assert(
        requirement,
        `OpenAPI operation matrix ${endpointFamily.name} references missing requirement ${requirementId}`,
      );
      assert(
        requirement.role === "bibliotheca",
        `OpenAPI operation matrix ${endpointFamily.name} requirement ${requirementId} must be bibliotheca-scoped`,
      );
    }
    assert(
      endpointFamily.requirements.some((requirementId: JsonValue) => {
        const requirement = requirementsById.get(requirementId);
        return (
          requirement &&
          familyFixtureNames.some((fixtureName: string) =>
            coverageFixtureNames(requirement).has(fixtureName),
          )
        );
      }),
      `OpenAPI operation matrix ${endpointFamily.name} must share fixture evidence with conformance coverage`,
    );
  }
}

function assertConformanceSearchCoverage(conformanceCoverage: JsonValue): void {
  assert(
    conformanceCoverage.requirements.some((requirement: JsonValue) =>
      requirement.coverage.some(
        (coverage: JsonValue) => coverage.fixture === "search-results.json",
      ),
    ),
    "conformance coverage fixture must map search API coverage",
  );
}

function assertWarningCoverage(ctx: ValidationContext): void {
  assertWarningSchemaDescribesCoreCategories(ctx);
  assertWarningFixtureCoverage(ctx, [
    "conformance/fixtures/capability-metadata-unknown-tolerance.json",
    "conformance/fixtures/exact-release-metadata-cases.json",
    "conformance/fixtures/external-dependency-potential-exposure-cases.json",
    "conformance/fixtures/manifest-parse-cases.json",
    "conformance/fixtures/manifest-unknown-field-warning.json",
    "conformance/fixtures/resolver-cases.json",
    "conformance/fixtures/semantic-validation-cases.json",
  ]);
}

function validateFixtureSchemaMap(ctx: ValidationContext): void {
  const fixtureSchemaMap = ctx.readJson("conformance/fixture-schema-map.json");
  assertSpecVersion(ctx, fixtureSchemaMap, "fixture schema map");
  assert(Array.isArray(fixtureSchemaMap.artifacts), "fixture schema map must list artifacts");
  const mappedArtifactPaths = fixtureSchemaMap.artifacts.map((artifact: JsonValue) => {
    assert(typeof artifact.path === "string", "fixture schema map artifact needs path");
    assert(ctx.pathExists(artifact.path), `${artifact.path} must exist`);
    assert(
      ctx.readJsonPaths.has(artifact.path),
      `${artifact.path} must be connected to scripts/validate-artifacts.ts`,
    );
    assert(
      [
        "whole-file-schema",
        "case-payload-schema",
        "wrapper-payload-schema",
        "algorithmic-vector",
      ].includes(artifact.validationUnit),
      `${artifact.path} must declare a known validation unit`,
    );
    assert(typeof artifact.validator === "string", `${artifact.path} must declare validator`);
    if (artifact.schema) {
      assert(ctx.pathExists(artifact.schema), `${artifact.path} schema must exist`);
    }
    return artifact.path;
  });
  assertDeepEqual(
    mappedArtifactPaths.toSorted(compareStrings),
    [...ctx.readJsonPaths]
      .filter((pathName: string) => pathName.startsWith("conformance/"))
      .toSorted(compareStrings),
    "fixture schema map artifact inventory",
  );
}

function countReportOutcomes(conformanceReport: JsonValue, outcome: string): number {
  return conformanceReport.results.filter((result: JsonValue) => result.outcome === outcome).length;
}

function assertConformanceReportSummary(conformanceReport: JsonValue): void {
  const passed = countReportOutcomes(conformanceReport, "pass");
  const failed = countReportOutcomes(conformanceReport, "fail");
  const skipped = countReportOutcomes(conformanceReport, "skip");
  assert(
    conformanceReport.summary.total === conformanceReport.results.length,
    "conformance report summary total must match result count",
  );
  assert(
    conformanceReport.summary.passed === passed &&
      conformanceReport.summary.failed === failed &&
      conformanceReport.summary.skipped === skipped,
    "conformance report summary outcome counts must match results",
  );
  assert(
    conformanceReport.summary.outcome === (failed > EMPTY_COUNT ? "fail" : "pass"),
    "conformance report summary outcome must reflect failed result count",
  );
}

function assertConformanceReportStableIds(conformanceReport: JsonValue): void {
  const resultIds = conformanceReport.results.map((result: JsonValue) => result.id);
  assert(
    new Set(resultIds).size === resultIds.length,
    "conformance report result IDs must be unique",
  );
  assert(
    resultIds.every((id: JsonValue) => id === id.toLowerCase()),
    "conformance report result IDs must remain lowercase stable slugs",
  );
}

function validateConformanceReport(ctx: ValidationContext): void {
  const conformanceReport = ctx.readJson("conformance/fixtures/conformance-report.json");
  ctx.validate("conformanceReport", conformanceReport, "conformance report fixture");
  assertSpecVersion(ctx, conformanceReport, "conformance report fixture");
  assertConformanceReportSummary(conformanceReport);
  assertConformanceReportStableIds(conformanceReport);
}

function validateConformanceCoverage(ctx: ValidationContext): void {
  const conformanceCoverage = ctx.readJson("conformance/fixtures/conformance-coverage.json");
  ctx.validate("conformanceCoverage", conformanceCoverage, "conformance coverage fixture");
  assertSpecVersion(ctx, conformanceCoverage, "conformance coverage fixture");
  assertConformanceCoverageReferences(ctx, conformanceCoverage);
  assertConformanceRequirementParity(ctx, conformanceCoverage);
  assertOpenapiMatrixRequirementCoverage(ctx, conformanceCoverage);
  assertConformanceSearchCoverage(conformanceCoverage);
}

function expectedMappingFields(): string[] {
  return [
    "volume.name",
    "volume.version",
    "volume.description",
    "volume.documentation",
    "volume.license",
    "volume.homepage",
    "volume.repository",
    "publisher.id",
    "components[].type",
    "components[].name",
    "components[].entrypoint",
    "dependencies",
    "release.logicalIdentity",
    "release.immutableContentIdentity",
    "provenance.source-repo",
    "provenance.build.system",
    "provenance.build.workflow",
    "provenance.build.signed",
    "volume.role",
    "volume.secondary-roles",
    "volume.keywords",
    "volume.providers / components[].providers",
    "runtimes[]",
    "protocols[]",
    "environment",
    "external-dependencies[]",
    "permissions / components[].permissions",
    "component-dependencies",
  ];
}

function assertMappingMatrixExpectedFields(mappingMatrix: JsonValue): void {
  for (const field of expectedMappingFields()) {
    assert(
      mappingMatrix.entries.some((entry: JsonValue) => entry.agentVolumesField === field),
      `mapping matrix missing ${field}`,
    );
  }
}

function assertMappingMatrixTargets(mappingMatrix: JsonValue): void {
  for (const entry of mappingMatrix.entries) {
    assert(
      entry.cyclonedx || entry.spdx || entry.slsa,
      `mapping matrix entry ${entry.agentVolumesField} must map to at least one target`,
    );
  }
}

function assertMappingMatrixOrdering(mappingMatrix: JsonValue): void {
  const mappingFields = mappingMatrix.entries.map((entry: JsonValue) => entry.agentVolumesField);
  assert(
    new Set(mappingFields).size === mappingFields.length,
    "mapping matrix agentVolumesField entries must be unique",
  );
  assert(
    mappingFields.join("\n") === [...mappingFields].toSorted(compareStrings).join("\n"),
    "mapping matrix entries must be ordered by agentVolumesField for stable serialization",
  );
}

function assertExtensionMappingMetadata(
  entry: JsonValue,
  family: string,
  mapping: JsonValue,
): void {
  assert(
    mapping.extensionNamespace?.startsWith("agent-volumes") ||
      mapping.extensionNamespace?.startsWith("https://agentvolumes.org/"),
    `mapping matrix ${entry.agentVolumesField}.${family} extension mapping needs Agent Volumes namespace`,
  );
  assert(
    typeof mapping.serialization === "string" && mapping.serialization.length > EMPTY_COUNT,
    `mapping matrix ${entry.agentVolumesField}.${family} extension mapping needs serialization guidance`,
  );
}

function assertLossyMappingMetadata(entry: JsonValue, family: string, mapping: JsonValue): void {
  assert(
    typeof mapping.lossiness === "string" && mapping.lossiness.length > EMPTY_COUNT,
    `mapping matrix ${entry.agentVolumesField}.${family} lossy mapping needs lossiness explanation`,
  );
}

function assertMappingMetadataForEntry(entry: JsonValue): void {
  for (const family of ["cyclonedx", "spdx", "slsa"]) {
    const mapping = entry[family];
    if (mapping?.kind === "extension") {
      assertExtensionMappingMetadata(entry, family, mapping);
    }
    if (mapping?.kind === "lossy") {
      assertLossyMappingMetadata(entry, family, mapping);
    }
  }
}

function assertMappingMatrixMetadata(mappingMatrix: JsonValue): void {
  for (const entry of mappingMatrix.entries) {
    assertMappingMetadataForEntry(entry);
  }
}

function validateMappingMatrix(ctx: ValidationContext): void {
  const mappingMatrix = ctx.readJson("conformance/fixtures/mapping-matrix.json");
  ctx.validate("mappingMatrix", mappingMatrix, "mapping matrix fixture");
  assertSpecVersion(ctx, mappingMatrix, "mapping matrix fixture");
  assertMappingMatrixExpectedFields(mappingMatrix);
  assertMappingMatrixTargets(mappingMatrix);
  assertMappingMatrixOrdering(mappingMatrix);
  assertMappingMatrixMetadata(mappingMatrix);
}

function externalDependencyScope(externalDependency: JsonValue): JsonValue {
  return externalDependency.components ?? [];
}

function externalDependencyDeclarationKey(externalDependency: JsonValue, scope: JsonValue): string {
  return declarationKeyForSemanticKey({
    purl: externalDependency.purl,
    purpose: externalDependency.purpose,
    scope,
  });
}

function createExternalDependencyContext(externalDependency: JsonValue): ExternalDependencyContext {
  const scope = externalDependencyScope(externalDependency);
  return {
    declarationKey: externalDependencyDeclarationKey(externalDependency, scope),
    externalDependency,
    scope,
  };
}

function createSampleComponentPurls(
  sampleManifest: JsonValue,
  sampleVolume: JsonValue,
): Map<JsonValue, string> {
  return new Map<JsonValue, string>(
    sampleManifest.components.map((component: JsonValue): [JsonValue, string] => [
      component.name,
      canonicalComponentPurl(sampleVolume.name, sampleVolume.version, component),
    ]),
  );
}

function createMappingSampleContext(ctx: ValidationContext): MappingSampleContext {
  const mappingSample = ctx.readJson("conformance/fixtures/mapping-sample.json");
  ctx.validate("mappingSample", mappingSample, "mapping sample fixture");
  assertSpecVersion(ctx, mappingSample, "mapping sample fixture");
  ctx.validate("volume", mappingSample.sourceManifest, "mapping sample source manifest");

  const sampleManifest = mappingSample.sourceManifest;
  const sampleVolume = sampleManifest.volume;
  const sampleRelease = mappingSample.releaseSubject;
  const sampleDigest = sampleRelease.integrity.slice(SHA256_INTEGRITY_PREFIX_LENGTH);

  return {
    sampleComponentPurls: createSampleComponentPurls(sampleManifest, sampleVolume),
    sampleCycloneDx: mappingSample.exports.cyclonedx,
    sampleDigest,
    sampleExternalDependencyPredicate:
      mappingSample.exports.externalDependencyDeclarationsPredicate,
    sampleManifest,
    sampleRelease,
    sampleSlsa: mappingSample.exports.slsa,
    sampleSpdx: mappingSample.exports.spdx,
    sampleSpdxExternalDependencies: mappingSample.exports.spdxExternalDependencies,
    sampleVolume,
  };
}

function assertMappingSampleReleaseAndCycloneDxEnvelope(sample: MappingSampleContext): void {
  const { sampleVolume, sampleRelease, sampleCycloneDx } = sample;
  assert(
    sampleRelease.purl === canonicalReleasePurl(sampleVolume.name, sampleVolume.version),
    "mapping sample release purl must be canonical",
  );
  assert(
    sampleCycloneDx.bomFormat === "CycloneDX",
    "mapping sample CycloneDX export must declare bomFormat",
  );
  assert(
    sampleCycloneDx.specVersion === "1.7",
    "mapping sample CycloneDX export must declare specVersion 1.7",
  );
  assertCycloneDxArtifact(sampleCycloneDx, {
    format: { version: "1.7" },
    name: "mapping-sample-cyclonedx-export",
    subject: sampleRelease,
  });
}

function assertCycloneDxRootIdentity(sample: MappingSampleContext, cyclonedxRoot: JsonValue): void {
  const { sampleManifest, sampleVolume } = sample;
  assert(
    cyclonedxRoot.name === sampleVolume.name,
    "mapping sample CycloneDX root component name must map volume.name",
  );
  assert(
    cyclonedxRoot.version === sampleVolume.version,
    "mapping sample CycloneDX root component version must map volume.version",
  );
  assert(
    cyclonedxRoot.description === sampleVolume.description,
    "mapping sample CycloneDX description must map volume.description",
  );
  assert(
    cyclonedxRoot.publisher === sampleManifest.publisher.id,
    "mapping sample CycloneDX publisher must map publisher.id",
  );
  assert(
    cyclonedxRoot.licenses?.some(
      (licenseChoice: JsonValue) => licenseChoice.license?.id === sampleVolume.license,
    ),
    "mapping sample CycloneDX license id must map volume.license",
  );
}

function assertCycloneDxRootExternalReferences(
  sample: MappingSampleContext,
  cyclonedxRoot: JsonValue,
): void {
  const { sampleVolume } = sample;
  findExternalReference({
    label: "mapping sample CycloneDX root",
    references: cyclonedxRoot.externalReferences,
    type: "website",
    url: sampleVolume.homepage,
  });
  findExternalReference({
    label: "mapping sample CycloneDX root",
    references: cyclonedxRoot.externalReferences,
    type: "vcs",
    url: sampleVolume.repository,
  });
  findExternalReference({
    label: "mapping sample CycloneDX root",
    references: cyclonedxRoot.externalReferences,
    type: "documentation",
    url: sampleVolume.documentation,
  });
}

function assertCycloneDxRootJsonProperties(
  sample: MappingSampleContext,
  cyclonedxRoot: JsonValue,
): void {
  const { sampleManifest, sampleVolume } = sample;
  assertDeepEqual(
    parseStablePropertyJson(
      cyclonedxRoot.properties,
      "agent-volumes:component-dependencies",
      "mapping sample CycloneDX root",
    ),
    sampleManifest["component-dependencies"],
    "mapping sample CycloneDX component-dependencies property",
  );
  assertDeepEqual(
    parseStablePropertyJson(
      cyclonedxRoot.properties,
      "agent-volumes:environment",
      "mapping sample CycloneDX root",
    ),
    sampleManifest.environment,
    "mapping sample CycloneDX environment property",
  );
  assertDeepEqual(
    parseStablePropertyJson(
      cyclonedxRoot.properties,
      "agent-volumes:keywords",
      "mapping sample CycloneDX root",
    ),
    sampleVolume.keywords,
    "mapping sample CycloneDX keywords property",
  );
  assertDeepEqual(
    parseStablePropertyJson(
      cyclonedxRoot.properties,
      "agent-volumes:permissions",
      "mapping sample CycloneDX root",
    ),
    sampleManifest.permissions,
    "mapping sample CycloneDX permissions property",
  );
  assertDeepEqual(
    parseStablePropertyJson(
      cyclonedxRoot.properties,
      "agent-volumes:protocols",
      "mapping sample CycloneDX root",
    ),
    sampleManifest.protocols,
    "mapping sample CycloneDX protocols property",
  );
  assertDeepEqual(
    parseStablePropertyJson(
      cyclonedxRoot.properties,
      "agent-volumes:providers",
      "mapping sample CycloneDX root",
    ),
    sampleVolume.providers,
    "mapping sample CycloneDX providers property",
  );
  assert(
    findProperty(cyclonedxRoot.properties, "agent-volumes:role", "mapping sample CycloneDX root")
      .value === sampleVolume.role,
    "mapping sample CycloneDX role property must map volume.role",
  );
  assertDeepEqual(
    parseStablePropertyJson(
      cyclonedxRoot.properties,
      "agent-volumes:runtimes",
      "mapping sample CycloneDX root",
    ),
    sampleManifest.runtimes,
    "mapping sample CycloneDX runtimes property",
  );
  assertDeepEqual(
    parseStablePropertyJson(
      cyclonedxRoot.properties,
      "agent-volumes:secondary-roles",
      "mapping sample CycloneDX root",
    ),
    sampleVolume["secondary-roles"],
    "mapping sample CycloneDX secondary-roles property",
  );
}

function assertCycloneDxMetadataBuildProperties(sample: MappingSampleContext): void {
  const { sampleManifest, sampleCycloneDx } = sample;
  assert(
    findProperty(
      sampleCycloneDx.metadata.properties,
      "agent-volumes:build-system",
      "mapping sample CycloneDX metadata",
    ).value === sampleManifest.provenance.build.system,
    "mapping sample CycloneDX build-system property must map provenance.build.system",
  );
  assert(
    findProperty(
      sampleCycloneDx.metadata.properties,
      "agent-volumes:build-workflow",
      "mapping sample CycloneDX metadata",
    ).value === sampleManifest.provenance.build.workflow,
    "mapping sample CycloneDX build-workflow property must map provenance.build.workflow",
  );
}

function assertCycloneDxRoot(sample: MappingSampleContext): void {
  const cyclonedxRoot = sample.sampleCycloneDx.metadata.component;
  assertCycloneDxRootIdentity(sample, cyclonedxRoot);
  assertCycloneDxRootExternalReferences(sample, cyclonedxRoot);
  assertCycloneDxRootJsonProperties(sample, cyclonedxRoot);
  assertCycloneDxMetadataBuildProperties(sample);
}

function assertCycloneDxComponent(component: JsonValue, sample: MappingSampleContext): void {
  const { sampleCycloneDx, sampleComponentPurls } = sample;
  const componentPurl = sampleComponentPurls.get(component.name);
  const cyclonedxComponent = sampleCycloneDx.components.find(
    (candidate: JsonValue) => candidate.purl === componentPurl,
  );
  assert(cyclonedxComponent, `mapping sample CycloneDX export needs component ${component.name}`);
  assert(
    cyclonedxComponent.name === component.name,
    `mapping sample CycloneDX component ${component.name} must map name`,
  );
  assert(
    findProperty(
      cyclonedxComponent.properties,
      "agent-volumes:type",
      `mapping sample CycloneDX component ${component.name}`,
    ).value === component.type,
    `mapping sample CycloneDX component ${component.name} must map type`,
  );
  assert(
    findProperty(
      cyclonedxComponent.properties,
      "agent-volumes:entrypoint",
      `mapping sample CycloneDX component ${component.name}`,
    ).value === component.entrypoint,
    `mapping sample CycloneDX component ${component.name} must map entrypoint`,
  );
  assertDeepEqual(
    parseStablePropertyJson(
      cyclonedxComponent.properties,
      "agent-volumes:permissions",
      `mapping sample CycloneDX component ${component.name}`,
    ),
    component.permissions,
    `mapping sample CycloneDX component ${component.name} permissions property`,
  );
  assertDeepEqual(
    parseStablePropertyJson(
      cyclonedxComponent.properties,
      "agent-volumes:providers",
      `mapping sample CycloneDX component ${component.name}`,
    ),
    component.providers,
    `mapping sample CycloneDX component ${component.name} providers property`,
  );
}

function assertCycloneDxComponents(sample: MappingSampleContext): void {
  for (const component of sample.sampleManifest.components) {
    assertCycloneDxComponent(component, sample);
  }
}

function assertCycloneDxDependencyGraph(sample: MappingSampleContext): void {
  const { sampleRelease, sampleCycloneDx, sampleComponentPurls } = sample;
  assert(
    sampleCycloneDx.dependencies.some(
      (dependency: JsonValue) =>
        dependency.ref === sampleRelease.purl &&
        dependency.dependsOn.includes("pkg:volume/github-provider@2.1.0"),
    ),
    "mapping sample CycloneDX dependencies graph must map volume dependencies",
  );
  assert(
    sampleCycloneDx.dependencies.some(
      (dependency: JsonValue) =>
        dependency.ref === sampleComponentPurls.get("summarize-paper") &&
        dependency.dependsOn.includes("pkg:volume/github-provider@2.1.0#tool/read-pr"),
    ),
    "mapping sample CycloneDX dependencies graph must map component dependencies",
  );
}

function assertCycloneDxExternalComponentProperties(
  cyclonedxExternalComponent: JsonValue,
  externalContext: ExternalDependencyContext,
): void {
  const { externalDependency, declarationKey, scope } = externalContext;
  for (const [propertyName, expectedValue] of [
    ["agent-volumes:external-dependency", "true"],
    ["agent-volumes:declaration-key", declarationKey],
    ["agent-volumes:declaration-only", "true"],
    ["agent-volumes:constraint", externalDependency.constraint],
    ["agent-volumes:purpose", externalDependency.purpose],
    ["agent-volumes:scope", stableJsonStringify(scope)],
    ["agent-volumes:resolved-evidence", "false"],
  ]) {
    assert(
      findProperty(
        cyclonedxExternalComponent.properties,
        propertyName,
        `mapping sample CycloneDX ${declarationKey}`,
      ).value === expectedValue,
      `mapping sample CycloneDX ${declarationKey} property ${propertyName} must match`,
    );
  }
}

function assertCycloneDxExternalDependency(
  externalDependency: JsonValue,
  sample: MappingSampleContext,
): void {
  const externalContext = createExternalDependencyContext(externalDependency);
  const { declarationKey } = externalContext;
  const cyclonedxExternalComponent = sample.sampleCycloneDx.components.find(
    (component: JsonValue) =>
      component["bom-ref"] === `agent-volumes:external-dependency:${declarationKey}`,
  );
  assert(
    cyclonedxExternalComponent,
    `mapping sample CycloneDX needs external declaration ${declarationKey}`,
  );
  assert(
    cyclonedxExternalComponent.isExternal === true,
    `mapping sample CycloneDX ${declarationKey} must be external`,
  );
  assert(
    cyclonedxExternalComponent.purl === externalDependency.purl,
    `mapping sample CycloneDX ${declarationKey} purl must match`,
  );
  assert(
    cyclonedxExternalComponent.versionRange === externalDependency.constraint,
    `mapping sample CycloneDX ${declarationKey} versionRange must carry VERS constraint`,
  );
  assertCycloneDxExternalComponentProperties(cyclonedxExternalComponent, externalContext);
  assert(
    !cyclonedxExternalComponent.hashes && !cyclonedxExternalComponent.version,
    `mapping sample CycloneDX ${declarationKey} must not claim resolved hashes or exact resolved version`,
  );
}

function assertCycloneDxExternalDependencies(sample: MappingSampleContext): void {
  for (const externalDependency of sample.sampleManifest["external-dependencies"]) {
    assertCycloneDxExternalDependency(externalDependency, sample);
  }
}

function assertCycloneDxMappingSample(sample: MappingSampleContext): void {
  assertMappingSampleReleaseAndCycloneDxEnvelope(sample);
  assertCycloneDxRoot(sample);
  assertCycloneDxComponents(sample);
  assertCycloneDxDependencyGraph(sample);
  assertCycloneDxExternalDependencies(sample);
}

function assertSpdxRootPackageBasics(sample: MappingSampleContext, spdxPackage: JsonValue): void {
  const { sampleVolume, sampleDigest } = sample;
  assert(
    spdxPackage.versionInfo === sampleVolume.version,
    "mapping sample SPDX versionInfo must map volume.version",
  );
  assert(
    spdxPackage.summary === sampleVolume.description,
    "mapping sample SPDX summary must map volume.description",
  );
  assert(
    spdxPackage.packageHomePage === sampleVolume.homepage,
    "mapping sample SPDX packageHomePage must map volume.homepage",
  );
  assert(
    spdxPackage.licenseConcluded === sampleVolume.license,
    "mapping sample SPDX licenseConcluded must map volume.license",
  );
  assert(
    spdxPackage.checksums?.some(
      (checksum: JsonValue) =>
        checksum.algorithm === "SHA256" && checksum.checksumValue === sampleDigest,
    ),
    "mapping sample SPDX checksum must bind immutable release identity",
  );
}

function assertSpdxRootExternalRefs(sample: MappingSampleContext, spdxPackage: JsonValue): void {
  const { sampleRelease, sampleVolume } = sample;
  findSpdxExternalRef({
    externalRefs: spdxPackage.externalRefs,
    label: "mapping sample SPDX root package",
    referenceCategory: "PACKAGE-MANAGER",
    referenceLocator: sampleRelease.purl,
    referenceType: "purl",
  });
  findSpdxExternalRef({
    externalRefs: spdxPackage.externalRefs,
    label: "mapping sample SPDX root package",
    referenceCategory: "OTHER",
    referenceLocator: sampleVolume.documentation,
    referenceType: "agent-volumes:documentation",
  });
  findSpdxExternalRef({
    externalRefs: spdxPackage.externalRefs,
    label: "mapping sample SPDX root package",
    referenceCategory: "OTHER",
    referenceLocator: sampleVolume.repository,
    referenceType: "agent-volumes:vcs",
  });
}

function assertSpdxRootComment(sample: MappingSampleContext, spdxPackage: JsonValue): void {
  const { sampleVolume } = sample;
  assertDeepEqual(
    JSON.parse(spdxPackage.comment),
    {
      "agent-volumes:keywords": sampleVolume.keywords,
      "agent-volumes:providers": sampleVolume.providers,
      "agent-volumes:role": sampleVolume.role,
    },
    "mapping sample SPDX lossy comment payload",
  );
}

function assertSpdxRootRelationships(sample: MappingSampleContext): void {
  const { sampleSpdx } = sample;
  assert(
    sampleSpdx.relationships.some(
      (relationship: JsonValue) =>
        relationship.spdxElementId === "SPDXRef-Package-research-agent-pack" &&
        relationship.relationshipType === "DEPENDS_ON" &&
        relationship.relatedSpdxElement === "SPDXRef-Package-github-provider",
    ),
    "mapping sample SPDX relationships must map volume dependencies",
  );
}

function assertSpdxRootAndRelationships(sample: MappingSampleContext): void {
  const { sampleVolume, sampleSpdx } = sample;
  assert(sampleSpdx.spdxVersion === "SPDX-2.3", "mapping sample SPDX export must declare SPDX-2.3");
  const spdxPackage = sampleSpdx.packages.find(
    (spdxPackageCandidate: JsonValue) => spdxPackageCandidate.name === sampleVolume.name,
  );
  assert(spdxPackage, "mapping sample SPDX export needs root package");
  assertSpdxRootPackageBasics(sample, spdxPackage);
  assertSpdxRootExternalRefs(sample, spdxPackage);
  assertSpdxRootComment(sample, spdxPackage);
  assertSpdxRootRelationships(sample);
}

function assertSpdxExternalDependencyProfile(sample: MappingSampleContext): void {
  const { sampleSpdxExternalDependencies } = sample;
  assert(
    sampleSpdxExternalDependencies?.spdxVersion === "SPDX-3.0.1",
    "mapping sample external dependency SPDX profile must declare SPDX-3.0.1",
  );
  assert(
    sampleSpdxExternalDependencies.profile ===
      "https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#",
    "mapping sample external dependency SPDX profile must use Agent Volumes namespace",
  );
}

function assertSpdxExternalDependencyExtensionFields(
  spdxExtension: JsonValue,
  externalContext: ExternalDependencyContext,
): void {
  const { externalDependency, declarationKey, scope } = externalContext;
  assert(
    spdxExtension["av:purl"] === externalDependency.purl,
    `mapping sample SPDX ${declarationKey} purl must match`,
  );
  assert(
    spdxExtension["av:constraint"] === externalDependency.constraint,
    `mapping sample SPDX ${declarationKey} constraint must match`,
  );
  assert(
    spdxExtension["av:purpose"] === externalDependency.purpose,
    `mapping sample SPDX ${declarationKey} purpose must match`,
  );
  assertDeepEqual(
    spdxExtension["av:scope"],
    scope,
    `mapping sample SPDX ${declarationKey} scope must match`,
  );
  assert(
    spdxExtension["av:declarationOnly"] === true,
    `mapping sample SPDX ${declarationKey} must be declaration-only`,
  );
  assert(
    spdxExtension["av:resolvedEvidence"] === false,
    `mapping sample SPDX ${declarationKey} must deny resolved evidence`,
  );
}

function assertSpdxDoesNotProjectInventory(
  sample: MappingSampleContext,
  externalContext: ExternalDependencyContext,
): void {
  const { externalDependency, declarationKey } = externalContext;
  assert(
    !sample.sampleSpdx.packages.some((spdxPackageCandidate: JsonValue) =>
      spdxPackageCandidate.externalRefs?.some(
        (externalRef: JsonValue) => externalRef.referenceLocator === externalDependency.purl,
      ),
    ),
    `mapping sample SPDX ${declarationKey} must not project declaration-only dependency as Package inventory`,
  );
}

function assertSpdxExternalDependency(
  externalDependency: JsonValue,
  sample: MappingSampleContext,
): void {
  const externalContext = createExternalDependencyContext(externalDependency);
  const { declarationKey } = externalContext;
  const spdxExtension = sample.sampleSpdxExternalDependencies.elements?.find(
    (extension: JsonValue) => extension["av:declarationKey"] === declarationKey,
  );
  assert(
    spdxExtension,
    `mapping sample SPDX needs external declaration extension ${declarationKey}`,
  );
  assertSpdxExternalDependencyExtensionFields(spdxExtension, externalContext);
  assertSpdxDoesNotProjectInventory(sample, externalContext);
}

function assertSpdxExternalDependencies(sample: MappingSampleContext): void {
  assertSpdxExternalDependencyProfile(sample);
  for (const externalDependency of sample.sampleManifest["external-dependencies"]) {
    assertSpdxExternalDependency(externalDependency, sample);
  }
}

function assertExternalDependencyPredicateEnvelope(
  ctx: ValidationContext,
  sample: MappingSampleContext,
): void {
  const { sampleExternalDependencyPredicate, sampleRelease, sampleDigest } = sample;
  ctx.validate(
    "externalDependencyDeclarationsPredicate",
    sampleExternalDependencyPredicate,
    "mapping sample external dependency declarations predicate export",
  );
  assert(
    sampleExternalDependencyPredicate.predicateType ===
      "https://agentvolumes.org/predicates/external-dependency-declarations/v0.1",
    "mapping sample external dependency predicate must use Agent Volumes predicate type",
  );
  assert(
    sampleExternalDependencyPredicate.subject.some(
      (subject: JsonValue) =>
        subject.name === sampleRelease.purl && subject.digest?.sha256 === sampleDigest,
    ),
    "mapping sample external dependency predicate subject must bind release subject",
  );
  assert(
    sampleExternalDependencyPredicate.predicate.semantics === "declaration-only",
    "mapping sample external dependency predicate semantics must be declaration-only",
  );
}

function assertExternalDependencyPredicateDeclarationFields(
  predicateDeclaration: JsonValue,
  externalContext: ExternalDependencyContext,
): void {
  const { externalDependency, declarationKey, scope } = externalContext;
  assert(
    predicateDeclaration.purl === externalDependency.purl,
    `mapping sample external dependency predicate ${declarationKey} purl must match`,
  );
  assert(
    predicateDeclaration.constraint === externalDependency.constraint,
    `mapping sample external dependency predicate ${declarationKey} constraint must match`,
  );
  assert(
    predicateDeclaration.purpose === externalDependency.purpose,
    `mapping sample external dependency predicate ${declarationKey} purpose must match`,
  );
  assertDeepEqual(
    predicateDeclaration.scope,
    scope,
    `mapping sample external dependency predicate ${declarationKey} scope must match`,
  );
  assert(
    predicateDeclaration.declarationOnly === true,
    `mapping sample external dependency predicate ${declarationKey} must be declaration-only`,
  );
  assert(
    predicateDeclaration.resolvedEvidence === false,
    `mapping sample external dependency predicate ${declarationKey} must deny resolved evidence`,
  );
}

function assertExternalDependencyPredicateDeclaration(
  externalDependency: JsonValue,
  sample: MappingSampleContext,
): void {
  const externalContext = createExternalDependencyContext(externalDependency);
  const { declarationKey } = externalContext;
  const predicateDeclaration = sample.sampleExternalDependencyPredicate.predicate.declarations.find(
    (declaration: JsonValue) => declaration.declarationKey === declarationKey,
  );
  assert(
    predicateDeclaration,
    `mapping sample external dependency predicate needs declaration ${declarationKey}`,
  );
  assertExternalDependencyPredicateDeclarationFields(predicateDeclaration, externalContext);
}

function assertExternalDependencyDeclarationsPredicate(
  ctx: ValidationContext,
  sample: MappingSampleContext,
): void {
  assertExternalDependencyPredicateEnvelope(ctx, sample);
  for (const externalDependency of sample.sampleManifest["external-dependencies"]) {
    assertExternalDependencyPredicateDeclaration(externalDependency, sample);
  }
}

function assertSlsaEnvelope(sample: MappingSampleContext): void {
  const { sampleSlsa, sampleRelease, sampleDigest, sampleManifest } = sample;
  assert(
    sampleSlsa._type === "https://in-toto.io/Statement/v1",
    "mapping sample SLSA export must be in-toto Statement v1",
  );
  assert(
    sampleSlsa.predicateType === "https://slsa.dev/provenance/v1",
    "mapping sample SLSA export must use SLSA v1 predicate",
  );
  assert(
    sampleSlsa.subject.some(
      (subject: JsonValue) =>
        subject.name === sampleRelease.purl && subject.digest?.sha256 === sampleDigest,
    ),
    "mapping sample SLSA subject must bind release subject",
  );
  assert(
    sampleSlsa.predicate.buildDefinition.buildType,
    "mapping sample SLSA export must declare buildType",
  );
  assert(
    sampleSlsa.predicate.runDetails.builder.id === sampleManifest.provenance.build.system,
    "mapping sample SLSA builder id must map provenance.build.system",
  );
}

function assertSlsaProvenanceParameters(sample: MappingSampleContext): void {
  const { sampleSlsa, sampleManifest } = sample;
  assert(
    sampleSlsa.predicate.buildDefinition.externalParameters.workflow ===
      sampleManifest.provenance.build.workflow,
    "mapping sample SLSA workflow parameter must map provenance.build.workflow",
  );
  assert(
    sampleSlsa.predicate.buildDefinition.externalParameters.sourceRepo ===
      sampleManifest.provenance["source-repo"],
    "mapping sample SLSA sourceRepo parameter must map provenance.source-repo",
  );
  assert(
    sampleSlsa.predicate.materials.some(
      (material: JsonValue) => material.uri === sampleManifest.provenance["source-repo"],
    ),
    "mapping sample SLSA materials must include provenance.source-repo",
  );
}

function assertSlsaOmitsExternalDependency(
  sample: MappingSampleContext,
  externalDependency: JsonValue,
): void {
  const { sampleSlsa } = sample;
  assert(
    !sampleSlsa.subject.some((subject: JsonValue) => subject.name === externalDependency.purl),
    `mapping sample SLSA subject must omit external dependency ${externalDependency.purl}`,
  );
  assert(
    !sampleSlsa.predicate.materials.some(
      (material: JsonValue) => material.uri === externalDependency.purl,
    ),
    `mapping sample SLSA materials must omit external dependency ${externalDependency.purl}`,
  );
  assert(
    !(sampleSlsa.predicate.resolvedDependencies ?? []).some(
      (dependency: JsonValue) => dependency.uri === externalDependency.purl,
    ),
    `mapping sample SLSA resolvedDependencies must omit external dependency ${externalDependency.purl}`,
  );
  assert(
    !(sampleSlsa.predicate.byproducts ?? []).some(
      (byproduct: JsonValue) => byproduct.uri === externalDependency.purl,
    ),
    `mapping sample SLSA byproducts must omit external dependency ${externalDependency.purl}`,
  );
  assert(
    !stableJsonStringify(sampleSlsa.predicate.buildDefinition.internalParameters ?? {}).includes(
      externalDependency.purl,
    ),
    `mapping sample SLSA internalParameters must omit external dependency ${externalDependency.purl}`,
  );
}

function assertSlsaExternalDependencyOmissions(sample: MappingSampleContext): void {
  for (const externalDependency of sample.sampleManifest["external-dependencies"]) {
    assertSlsaOmitsExternalDependency(sample, externalDependency);
  }
}

function assertSlsa(sample: MappingSampleContext): void {
  assertSlsaEnvelope(sample);
  assertSlsaProvenanceParameters(sample);
  assertSlsaExternalDependencyOmissions(sample);
}

function validateMappingSample(ctx: ValidationContext): void {
  const sample = createMappingSampleContext(ctx);
  assertCycloneDxMappingSample(sample);
  assertSpdxRootAndRelationships(sample);
  assertSpdxExternalDependencies(sample);
  assertExternalDependencyDeclarationsPredicate(ctx, sample);
  assertSlsa(sample);
}

export function run(ctx: ValidationContext): void {
  validateConformanceReport(ctx);
  validateConformanceCoverage(ctx);
  assertWarningCoverage(ctx);
  validateMappingMatrix(ctx);
  validateMappingSample(ctx);
  validateFixtureSchemaMap(ctx);
}
