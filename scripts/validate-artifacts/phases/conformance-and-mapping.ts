import { assertConformanceCoverageReferences } from "../assertions/conformance-coverage.ts";
import {
  findExternalReference,
  findProperty,
  findSpdxExternalRef,
  parseStablePropertyJson,
} from "../assertions/mapping-artifacts.ts";
import { assertCycloneDxArtifact } from "../assertions/trust-artifacts.ts";
import { assert, assertDeepEqual, assertSpecVersion, stableJsonStringify } from "../core/assert.ts";
import {
  EMPTY_COUNT,
  HUMAN_LINE_NUMBER_OFFSET,
  LISTING_ID_PAD_WIDTH,
  REQUIRED_CONFORMANCE_REQUIREMENT_COUNT,
  SHA256_INTEGRITY_PREFIX_LENGTH,
} from "../core/numeric-constants.ts";
import {
  canonicalComponentPurl,
  canonicalReleasePurl,
  compareStrings,
  declarationKeyForSemanticKey,
} from "../core/purl.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

export function run(ctx: ValidationContext): void {
  const conformanceCoverage = ctx.readJson("conformance/fixtures/conformance-coverage.json");
  ctx.validate("conformanceCoverage", conformanceCoverage, "conformance coverage fixture");
  assertSpecVersion(ctx, conformanceCoverage, "conformance coverage fixture");
  assertConformanceCoverageReferences(ctx, conformanceCoverage);
  const coverageRequirementIds = new Set(
    conformanceCoverage.requirements.map((requirement: JsonValue) => requirement.id),
  );
  for (const id of [
    ...Array.from(
      Array.from({ length: REQUIRED_CONFORMANCE_REQUIREMENT_COUNT }).keys(),
      (index: JsonValue) =>
        `AV-BIB-${String(index + HUMAN_LINE_NUMBER_OFFSET).padStart(LISTING_ID_PAD_WIDTH, "0")}`,
    ),
    ...Array.from(
      Array.from({ length: REQUIRED_CONFORMANCE_REQUIREMENT_COUNT }).keys(),
      (index: JsonValue) =>
        `AV-CLI-${String(index + HUMAN_LINE_NUMBER_OFFSET).padStart(LISTING_ID_PAD_WIDTH, "0")}`,
    ),
  ]) {
    assert(coverageRequirementIds.has(id), `conformance coverage fixture missing ${id}`);
  }
  assert(
    conformanceCoverage.requirements.some((requirement: JsonValue) =>
      requirement.coverage.some(
        (coverage: JsonValue) => coverage.fixture === "search-results.json",
      ),
    ),
    "conformance coverage fixture must map search API coverage",
  );

  const mappingMatrix = ctx.readJson("conformance/fixtures/mapping-matrix.json");
  ctx.validate("mappingMatrix", mappingMatrix, "mapping matrix fixture");
  assertSpecVersion(ctx, mappingMatrix, "mapping matrix fixture");
  for (const field of [
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
  ]) {
    assert(
      mappingMatrix.entries.some((entry: JsonValue) => entry.agentVolumesField === field),
      `mapping matrix missing ${field}`,
    );
  }
  for (const entry of mappingMatrix.entries) {
    assert(
      entry.cyclonedx || entry.spdx || entry.slsa,
      `mapping matrix entry ${entry.agentVolumesField} must map to at least one target`,
    );
  }
  const mappingFields = mappingMatrix.entries.map((entry: JsonValue) => entry.agentVolumesField);
  assert(
    new Set(mappingFields).size === mappingFields.length,
    "mapping matrix agentVolumesField entries must be unique",
  );
  assert(
    mappingFields.join("\n") === [...mappingFields].toSorted(compareStrings).join("\n"),
    "mapping matrix entries must be ordered by agentVolumesField for stable serialization",
  );
  for (const entry of mappingMatrix.entries) {
    for (const family of ["cyclonedx", "spdx", "slsa"]) {
      const mapping = entry[family];
      if (mapping) {
        if (mapping.kind === "extension") {
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
        if (mapping.kind === "lossy") {
          assert(
            typeof mapping.lossiness === "string" && mapping.lossiness.length > EMPTY_COUNT,
            `mapping matrix ${entry.agentVolumesField}.${family} lossy mapping needs lossiness explanation`,
          );
        }
      }
    }
  }

  const mappingSample = ctx.readJson("conformance/fixtures/mapping-sample.json");
  ctx.validate("mappingSample", mappingSample, "mapping sample fixture");
  assertSpecVersion(ctx, mappingSample, "mapping sample fixture");
  ctx.validate("volume", mappingSample.sourceManifest, "mapping sample source manifest");

  const sampleManifest = mappingSample.sourceManifest;
  const sampleVolume = sampleManifest.volume;
  const sampleRelease = mappingSample.releaseSubject;
  const sampleDigest = sampleRelease.integrity.slice(SHA256_INTEGRITY_PREFIX_LENGTH);
  const sampleCycloneDx = mappingSample.exports.cyclonedx;
  const sampleSpdx = mappingSample.exports.spdx;
  const sampleSpdxExternalDependencies = mappingSample.exports.spdxExternalDependencies;
  const sampleExternalDependencyPredicate =
    mappingSample.exports.externalDependencyDeclarationsPredicate;
  const sampleSlsa = mappingSample.exports.slsa;
  const sampleComponentPurls = new Map(
    sampleManifest.components.map((component: JsonValue) => [
      component.name,
      canonicalComponentPurl(sampleVolume.name, sampleVolume.version, component),
    ]),
  );

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

  const cyclonedxRoot = sampleCycloneDx.metadata.component;
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
  findExternalReference(
    cyclonedxRoot.externalReferences,
    "website",
    sampleVolume.homepage,
    "mapping sample CycloneDX root",
  );
  findExternalReference(
    cyclonedxRoot.externalReferences,
    "vcs",
    sampleVolume.repository,
    "mapping sample CycloneDX root",
  );
  findExternalReference(
    cyclonedxRoot.externalReferences,
    "documentation",
    sampleVolume.documentation,
    "mapping sample CycloneDX root",
  );
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

  for (const component of sampleManifest.components) {
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
  for (const externalDependency of sampleManifest["external-dependencies"]) {
    const scope = externalDependency.components ?? [];
    const declarationKey = declarationKeyForSemanticKey({
      purl: externalDependency.purl,
      purpose: externalDependency.purpose,
      scope,
    });
    const cyclonedxExternalComponent = sampleCycloneDx.components.find(
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
    assert(
      !cyclonedxExternalComponent.hashes && !cyclonedxExternalComponent.version,
      `mapping sample CycloneDX ${declarationKey} must not claim resolved hashes or exact resolved version`,
    );
  }

  assert(sampleSpdx.spdxVersion === "SPDX-2.3", "mapping sample SPDX export must declare SPDX-2.3");
  const spdxPackage = sampleSpdx.packages.find(
    (spdxPackageCandidate: JsonValue) => spdxPackageCandidate.name === sampleVolume.name,
  );
  assert(spdxPackage, "mapping sample SPDX export needs root package");
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
  findSpdxExternalRef(
    spdxPackage.externalRefs,
    "PACKAGE-MANAGER",
    "purl",
    sampleRelease.purl,
    "mapping sample SPDX root package",
  );
  findSpdxExternalRef(
    spdxPackage.externalRefs,
    "OTHER",
    "agent-volumes:documentation",
    sampleVolume.documentation,
    "mapping sample SPDX root package",
  );
  findSpdxExternalRef(
    spdxPackage.externalRefs,
    "OTHER",
    "agent-volumes:vcs",
    sampleVolume.repository,
    "mapping sample SPDX root package",
  );
  assertDeepEqual(
    JSON.parse(spdxPackage.comment),
    {
      "agent-volumes:keywords": sampleVolume.keywords,
      "agent-volumes:providers": sampleVolume.providers,
      "agent-volumes:role": sampleVolume.role,
    },
    "mapping sample SPDX lossy comment payload",
  );
  assert(
    sampleSpdx.relationships.some(
      (relationship: JsonValue) =>
        relationship.spdxElementId === "SPDXRef-Package-research-agent-pack" &&
        relationship.relationshipType === "DEPENDS_ON" &&
        relationship.relatedSpdxElement === "SPDXRef-Package-github-provider",
    ),
    "mapping sample SPDX relationships must map volume dependencies",
  );
  assert(
    sampleSpdxExternalDependencies?.spdxVersion === "SPDX-3.0.1",
    "mapping sample external dependency SPDX profile must declare SPDX-3.0.1",
  );
  assert(
    sampleSpdxExternalDependencies.profile ===
      "https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#",
    "mapping sample external dependency SPDX profile must use Agent Volumes namespace",
  );
  for (const externalDependency of sampleManifest["external-dependencies"]) {
    const scope = externalDependency.components ?? [];
    const declarationKey = declarationKeyForSemanticKey({
      purl: externalDependency.purl,
      purpose: externalDependency.purpose,
      scope,
    });
    const spdxExtension = sampleSpdxExternalDependencies.elements?.find(
      (extension: JsonValue) => extension["av:declarationKey"] === declarationKey,
    );
    assert(
      spdxExtension,
      `mapping sample SPDX needs external declaration extension ${declarationKey}`,
    );
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
    assert(
      !sampleSpdx.packages.some((spdxPackageCandidate: JsonValue) =>
        spdxPackageCandidate.externalRefs?.some(
          (externalRef: JsonValue) => externalRef.referenceLocator === externalDependency.purl,
        ),
      ),
      `mapping sample SPDX ${declarationKey} must not project declaration-only dependency as Package inventory`,
    );
  }

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
  for (const externalDependency of sampleManifest["external-dependencies"]) {
    const scope = externalDependency.components ?? [];
    const declarationKey = declarationKeyForSemanticKey({
      purl: externalDependency.purl,
      purpose: externalDependency.purpose,
      scope,
    });
    const predicateDeclaration = sampleExternalDependencyPredicate.predicate.declarations.find(
      (declaration: JsonValue) => declaration.declarationKey === declarationKey,
    );
    assert(
      predicateDeclaration,
      `mapping sample external dependency predicate needs declaration ${declarationKey}`,
    );
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
  for (const externalDependency of sampleManifest["external-dependencies"]) {
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
  }
}
