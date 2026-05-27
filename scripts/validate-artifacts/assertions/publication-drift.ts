import fs from "node:fs";
import path from "node:path";

import {
  getCurrentSpecVersion,
  getReleaseArchiveRoot,
  getSchemaIdPrefix,
} from "../../release-version.ts";
import {
  assert,
  assertDeepEqual,
  assertSpecVersion,
  assertUniqueStrings,
  stableJsonStringify,
} from "../core/assert.ts";
import {
  AV_PREFIX_LENGTH,
  EMPTY_COUNT,
  JSON_LD_CONTEXT_VERSION,
} from "../core/numeric-constants.ts";
import { compareStrings } from "../core/purl.ts";
import {
  reservedExtensionNamespaces,
  schemas,
  validateExpectedFailure,
} from "../core/schema-context.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

const currentSpecVersion = getCurrentSpecVersion();
const releaseArchiveRoot = getReleaseArchiveRoot();
const schemaIdPrefix = getSchemaIdPrefix();

function assertReservedNamespaceArtifactShape(ctx: ValidationContext): void {
  assert(
    reservedExtensionNamespaces.$id ===
      `${schemaIdPrefix}schemas/reserved-extension-namespaces.json`,
    `reserved extension namespace artifact must use the ${currentSpecVersion} schema ID`,
  );
  assertSpecVersion(ctx, reservedExtensionNamespaces, "reserved extension namespace artifact");
  assert(
    Array.isArray(reservedExtensionNamespaces.reserved) &&
      reservedExtensionNamespaces.reserved.length > EMPTY_COUNT,
    "reserved extension namespace artifact must list reserved namespaces",
  );
  assertUniqueStrings(reservedExtensionNamespaces.reserved, "reserved extension namespaces");
}

function assertCapabilityMetadataReservedNamespaceSchema(): void {
  const extensionPropertyNames = schemas.capabilityMetadata.properties.extensions.propertyNames;
  const namespacePattern = extensionPropertyNames.allOf.find(
    (subschema: JsonValue) => typeof subschema.pattern === "string",
  )?.pattern;
  assert(namespacePattern, "capability metadata schema must define an extension namespace pattern");
  const validateNamespaceShape = new RegExp(namespacePattern);
  for (const namespace of reservedExtensionNamespaces.reserved) {
    assert(
      validateNamespaceShape.test(namespace),
      `reserved extension namespace ${namespace} must match schema pattern`,
    );
  }

  const reservedEnum = extensionPropertyNames.allOf.find((subschema: JsonValue) =>
    Array.isArray(subschema.not?.enum),
  )?.not.enum;
  assert(reservedEnum, "capability metadata schema must deny reserved extension namespaces");
  assert(
    stableJsonStringify([...reservedEnum].toSorted(compareStrings)) ===
      stableJsonStringify([...reservedExtensionNamespaces.reserved].toSorted(compareStrings)),
    "capability metadata schema reserved namespace enum must match reserved-extension-namespaces.json",
  );
}

function assertReservedNamespaceFixtureCoverage(ctx: ValidationContext): void {
  const reservedFixture = ctx.readJson(
    "conformance/fixtures/capability-metadata-reserved-extension-rejection.json",
  );
  const reservedFixtureNamespaces = Object.keys(
    reservedFixture.canonicalParsedData.extensions ?? {},
  );
  assert(
    reservedFixtureNamespaces.some((namespace: JsonValue) =>
      reservedExtensionNamespaces.reserved.includes(namespace),
    ),
    "capability metadata reserved extension fixture must exercise a reserved namespace from reserved-extension-namespaces.json",
  );
  for (const namespace of reservedExtensionNamespaces.reserved) {
    const candidate = {
      ...reservedFixture.canonicalParsedData,
      extensions: { [namespace]: { enabled: true } },
    };
    validateExpectedFailure(
      "capabilityMetadata",
      candidate,
      `capability metadata reserved namespace ${namespace}`,
    );
  }
}

function assertSiteSchemaPublicationDrift(ctx: ValidationContext): void {
  const schemaDirectory = path.join(ctx.root, "schemas");
  const siteSchemaDirectory = path.join(ctx.root, releaseArchiveRoot, "schemas");
  const schemaFiles = fs
    .readdirSync(schemaDirectory)
    .filter((entry: JsonValue) => entry.endsWith(".json"))
    .toSorted();

  for (const schemaFile of schemaFiles) {
    const canonicalPath = path.join(schemaDirectory, schemaFile);
    const sitePath = path.join(siteSchemaDirectory, schemaFile);

    assert(fs.existsSync(sitePath), `site schema publication missing ${schemaFile}`);
    assert(
      fs.readFileSync(sitePath, "utf8") === fs.readFileSync(canonicalPath, "utf8"),
      `site schema publication ${schemaFile} must match schemas/${schemaFile}`,
    );
  }

  const siteSchemaFiles = fs
    .readdirSync(siteSchemaDirectory)
    .filter((entry: JsonValue) => entry.endsWith(".json"))
    .toSorted();

  assert(
    stableJsonStringify(siteSchemaFiles) === stableJsonStringify(schemaFiles),
    "site schema publication file set must match schemas/*.json",
  );
}

function readSpdxExternalDependencyContext(ctx: ValidationContext): JsonValue {
  const canonicalContextPath = "site/contexts/spdx-external-dependency-declarations-v0.1.jsonld";
  const archivedContextPath = `${releaseArchiveRoot}/contexts/spdx-external-dependency-declarations-v0.1.jsonld`;
  assert(
    fs.readFileSync(path.join(ctx.root, canonicalContextPath), "utf8") ===
      fs.readFileSync(path.join(ctx.root, archivedContextPath), "utf8"),
    "SPDX external dependency canonical JSON-LD context must match release archive copy",
  );
  return ctx.readJsonFile(canonicalContextPath);
}

function assertSpdxContextHeader(context: JsonValue, namespace: string): void {
  assert(
    context && typeof context === "object",
    "SPDX external dependency JSON-LD context must define @context",
  );
  assert(
    context["@version"] === JSON_LD_CONTEXT_VERSION,
    "SPDX external dependency JSON-LD context must use JSON-LD 1.1",
  );
  assert(
    context["@protected"] === true,
    "SPDX external dependency JSON-LD context terms must be protected",
  );
  assert(
    context.av === namespace,
    "SPDX external dependency JSON-LD context av prefix must match profile namespace",
  );
  assert(
    context.xsd === "http://www.w3.org/2001/XMLSchema#",
    "SPDX external dependency JSON-LD context must define xsd",
  );
}

function collectSpdxElementTerms(termsUsedByFixture: Set<string>, element: JsonValue): void {
  const typeValue = element["@type"];
  if (typeof typeValue === "string" && typeValue.startsWith("av:")) {
    termsUsedByFixture.add(typeValue.slice(AV_PREFIX_LENGTH));
  }
  for (const key of Object.keys(element)) {
    if (key.startsWith("av:")) {
      termsUsedByFixture.add(key.slice(AV_PREFIX_LENGTH));
    }
  }
}

function collectSpdxTermsUsedByFixture(elements: JsonValue[], namespace: string): Set<string> {
  const termsUsedByFixture = new Set<string>();
  for (const element of elements) {
    assert(
      element["@context"]?.av === namespace,
      "mapping sample SPDX element av prefix must match JSON-LD context",
    );
    collectSpdxElementTerms(termsUsedByFixture, element);
  }
  return termsUsedByFixture;
}

function assertExpectedSpdxFixtureTerms(termsUsedByFixture: Set<string>): void {
  const expectedTerms = [
    "ExternalDependencyDeclaration",
    "constraint",
    "declarationKey",
    "declarationOnly",
    "purl",
    "purpose",
    "resolvedEvidence",
    "scope",
  ];
  assertDeepEqual(
    [...termsUsedByFixture].toSorted(compareStrings),
    expectedTerms.toSorted(compareStrings),
    "SPDX external dependency JSON-LD context fixture terms",
  );
}

function assertSpdxMappingFixtureTerms(ctx: ValidationContext, namespace: string): void {
  const mappingSampleFixture = ctx.readJson("conformance/fixtures/mapping-sample.json");
  const spdxExternalDependencyExport = mappingSampleFixture.exports?.spdxExternalDependencies;
  assert(
    spdxExternalDependencyExport?.profile === namespace,
    "mapping sample SPDX external dependency profile must match JSON-LD context namespace",
  );
  assert(
    Array.isArray(spdxExternalDependencyExport.elements) &&
      spdxExternalDependencyExport.elements.length > EMPTY_COUNT,
    "mapping sample SPDX external dependency export must include elements",
  );

  assertExpectedSpdxFixtureTerms(
    collectSpdxTermsUsedByFixture(spdxExternalDependencyExport.elements, namespace),
  );
}

function assertSpdxContextTerms(context: JsonValue): void {
  for (const term of [
    "ExternalDependencyDeclaration",
    "constraint",
    "declarationKey",
    "purl",
    "purpose",
  ]) {
    assert(
      context[term] === `av:${term}`,
      `SPDX external dependency JSON-LD context ${term} term must match namespace`,
    );
  }
  assertDeepEqual(
    context.scope,
    { "@container": "@set", "@id": "av:scope" },
    "SPDX external dependency JSON-LD context scope term",
  );
  assertDeepEqual(
    context.declarationOnly,
    { "@id": "av:declarationOnly", "@type": "xsd:boolean" },
    "SPDX external dependency JSON-LD context declarationOnly term",
  );
  assertDeepEqual(
    context.resolvedEvidence,
    { "@id": "av:resolvedEvidence", "@type": "xsd:boolean" },
    "SPDX external dependency JSON-LD context resolvedEvidence term",
  );
}

function assertReservedExtensionNamespaceDrift(ctx: ValidationContext): void {
  assertReservedNamespaceArtifactShape(ctx);
  assertCapabilityMetadataReservedNamespaceSchema();
  assertReservedNamespaceFixtureCoverage(ctx);
}

function assertSpdxExternalDependencyContextDrift(ctx: ValidationContext): void {
  const namespace = "https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#";
  const contextArtifact = readSpdxExternalDependencyContext(ctx);
  const context = contextArtifact["@context"];

  assertSpdxContextHeader(context, namespace);
  assertSpdxMappingFixtureTerms(ctx, namespace);
  assertSpdxContextTerms(context);
}

export {
  assertReservedExtensionNamespaceDrift,
  assertSiteSchemaPublicationDrift,
  assertSpdxExternalDependencyContextDrift,
};
