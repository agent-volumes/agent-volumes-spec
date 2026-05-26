import fs from "node:fs";
import path from "node:path";

import { assert, assertSpecVersion, stableJsonStringify } from "../core/assert.ts";
import { compareStrings } from "../core/purl.ts";
import {
  schemas,
  reservedExtensionNamespaces,
  validateExpectedFailure,
} from "../core/schema-context.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

export const assertReservedExtensionNamespaceDrift = (ctx: ValidationContext) => {
  assert(
    reservedExtensionNamespaces.$id ===
      "https://agentvolumes.org/spec/0.1.0-rc.1/schemas/reserved-extension-namespaces.json",
    "reserved extension namespace artifact must use the rc.1 schema ID",
  );
  assertSpecVersion(ctx, reservedExtensionNamespaces, "reserved extension namespace artifact");
  assert(
    Array.isArray(reservedExtensionNamespaces.reserved) &&
      reservedExtensionNamespaces.reserved.length > 0,
    "reserved extension namespace artifact must list reserved namespaces",
  );
  assertUniqueStrings(reservedExtensionNamespaces.reserved, "reserved extension namespaces");

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

  const reservedFixture = ctx.readJsonFile(
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
};

export const assertSiteSchemaPublicationDrift = (ctx: ValidationContext) => {
  const schemaDirectory = path.join(ctx.root, "schemas");
  const siteSchemaDirectory = path.join(ctx.root, "site/spec/0.1.0-rc.1/schemas");
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
};

export const assertSpdxExternalDependencyContextDrift = (ctx: ValidationContext) => {
  const namespace = "https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#";
  const canonicalContextPath = "site/contexts/spdx-external-dependency-declarations-v0.1.jsonld";
  const archivedContextPath =
    "site/spec/0.1.0-rc.1/contexts/spdx-external-dependency-declarations-v0.1.jsonld";
  const contextArtifact = ctx.readJsonFile(canonicalContextPath);

  assert(
    fs.readFileSync(path.join(ctx.root, canonicalContextPath), "utf8") ===
      fs.readFileSync(path.join(ctx.root, archivedContextPath), "utf8"),
    "SPDX external dependency canonical JSON-LD context must match release archive copy",
  );
  const context = contextArtifact["@context"];

  assert(
    context && typeof context === "object",
    "SPDX external dependency JSON-LD context must define @context",
  );
  assert(
    context["@version"] === 1.1,
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

  const mappingSampleFixture = ctx.readJsonFile("conformance/fixtures/mapping-sample.json");
  const spdxExternalDependencyExport = mappingSampleFixture.exports?.spdxExternalDependencies;
  assert(
    spdxExternalDependencyExport?.profile === namespace,
    "mapping sample SPDX external dependency profile must match JSON-LD context namespace",
  );
  assert(
    Array.isArray(spdxExternalDependencyExport.elements) &&
      spdxExternalDependencyExport.elements.length > 0,
    "mapping sample SPDX external dependency export must include elements",
  );

  const termsUsedByFixture = new Set<string>();
  for (const element of spdxExternalDependencyExport.elements) {
    assert(
      element["@context"]?.av === namespace,
      "mapping sample SPDX element av prefix must match JSON-LD context",
    );

    const typeValue = element["@type"];
    if (typeof typeValue === "string" && typeValue.startsWith("av:")) {
      termsUsedByFixture.add(typeValue.slice(3));
    }

    for (const key of Object.keys(element)) {
      if (key.startsWith("av:")) {
        termsUsedByFixture.add(key.slice(3));
      }
    }
  }

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
};

import { assertUniqueStrings, assertDeepEqual } from "../core/assert.ts";
