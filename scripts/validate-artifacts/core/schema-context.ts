import fs from "node:fs";
import path from "node:path";

import type { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import Ajv2020 from "ajv/dist/2020";

import { getCurrentSpecVersion, getSchemaIdPrefix } from "../../release-version.ts";
import { assert } from "./assert.ts";
import { readJson, readJsonFile, root } from "./files.ts";
import type { JsonValue } from "./types.ts";

const ajv = new Ajv2020({ allErrors: true, strict: true, validateSchema: true });
addFormats(ajv);

const JSON_SCHEMA_DRAFT_2020_12 = "https://json-schema.org/draft/2020-12/schema";
const JSON_SCHEMA_FILE_SUFFIX = ".schema.json";
const currentSpecVersion = getCurrentSpecVersion();
const schemaIdPrefix = getSchemaIdPrefix();

const schemaEntries = [
  ["advisory", "schemas/advisory.schema.json"],
  ["advisoryList", "schemas/advisory-list.schema.json"],
  ["advisoryValidationCase", "schemas/advisory-validation-case.schema.json"],
  ["bridgeMetadata", "schemas/bridge-metadata.schema.json"],
  ["capabilityMetadata", "schemas/capability-metadata.schema.json"],
  ["componentDependencyValidationCase", "schemas/component-dependency-validation-case.schema.json"],
  ["conformanceCoverage", "schemas/conformance-coverage.schema.json"],
  ["conformanceReport", "schemas/conformance-report.schema.json"],
  ["exactReleaseMetadataCase", "schemas/exact-release-metadata-case.schema.json"],
  [
    "externalDependencyDeclarationsPredicate",
    "schemas/external-dependency-declarations-predicate.schema.json",
  ],
  [
    "externalDependencyPotentialExposureWarningContext",
    "schemas/external-dependency-potential-exposure-warning-context.schema.json",
  ],
  ["externalDependencyValidationCase", "schemas/external-dependency-validation-case.schema.json"],
  ["manifestParseCase", "schemas/manifest-parse-case.schema.json"],
  ["mappingMatrix", "schemas/mapping-matrix.schema.json"],
  ["mappingSample", "schemas/mapping-sample.schema.json"],
  ["openapiOperationMatrix", "schemas/openapi-operation-matrix.schema.json"],
  ["problemDetails", "schemas/problem-details.schema.json"],
  ["problemRegistry", "schemas/problem-registry.schema.json"],
  ["purlVersCompatibilityExceptions", "schemas/purl-vers-compatibility-exceptions.schema.json"],
  ["releaseMetadata", "schemas/release-metadata.schema.json"],
  ["releaseUploadFinalize", "schemas/release-upload-finalize.schema.json"],
  ["releaseUploadIntent", "schemas/release-upload-intent.schema.json"],
  ["searchResults", "schemas/search-results.schema.json"],
  ["semanticValidationCase", "schemas/semantic-validation-case.schema.json"],
  ["trustArtifactVerificationCase", "schemas/trust-artifact-verification-case.schema.json"],
  ["trustDetail", "schemas/trust-detail.schema.json"],
  ["trustSummary", "schemas/trust-summary.schema.json"],
  ["trustUploadFinalize", "schemas/trust-upload-finalize.schema.json"],
  ["trustUploadIntent", "schemas/trust-upload-intent.schema.json"],
  ["upstreamBaseline", "schemas/upstream-baseline.schema.json"],
  ["versionIndex", "schemas/version-index.schema.json"],
  ["versionIndexRow", "schemas/version-index-row.schema.json"],
  ["volume", "schemas/volume.schema.json"],
  ["warning", "schemas/warning.schema.json"],
] as const;

const nonSchemaArtifacts = new Set(["schemas/reserved-extension-namespaces.json"]);
const registeredSchemaPaths = new Set<string>(
  schemaEntries.map(([, relativePath]) => relativePath),
);

const schemas = Object.fromEntries(
  schemaEntries.map(([name, relativePath]) => [name, readJson(relativePath)]),
);

function assertSchemaRegistryInventory(): void {
  const schemaFiles = fs
    .readdirSync(path.join(root, "schemas"))
    .filter((entry: string) => entry.endsWith(".json"))
    .map((entry: string) => `schemas/${entry}`)
    .toSorted();
  for (const schemaFile of schemaFiles) {
    assert(
      registeredSchemaPaths.has(schemaFile) || nonSchemaArtifacts.has(schemaFile),
      `${schemaFile} must be registered in schema-context.ts or listed as a non-schema artifact`,
    );
  }
  for (const schemaPath of registeredSchemaPaths) {
    assert(
      schemaFiles.includes(schemaPath),
      `${schemaPath} is registered but missing from schemas/`,
    );
  }
}

assertSchemaRegistryInventory();

function assertRegisteredSchemaMetadata(relativePath: string, schema: JsonValue): void {
  assert(
    relativePath.endsWith(JSON_SCHEMA_FILE_SUFFIX),
    `${relativePath} must use the ${JSON_SCHEMA_FILE_SUFFIX} suffix`,
  );
  assert(
    schema.$schema === JSON_SCHEMA_DRAFT_2020_12,
    `${relativePath} must declare Draft 2020-12 $schema`,
  );
  assert(
    schema.$id === `${schemaIdPrefix}${relativePath}`,
    `${relativePath} must use release-scoped $id ${schemaIdPrefix}${relativePath}`,
  );
}

function assertNonSchemaArtifactMetadata(relativePath: string): void {
  assert(
    !relativePath.endsWith(JSON_SCHEMA_FILE_SUFFIX),
    `${relativePath} must not use the ${JSON_SCHEMA_FILE_SUFFIX} suffix`,
  );
  const artifact = readJsonFile(relativePath);
  assert(
    artifact.$id === `${schemaIdPrefix}${relativePath}`,
    `${relativePath} must use release-scoped $id ${schemaIdPrefix}${relativePath}`,
  );
  assert(
    artifact.specVersion === currentSpecVersion,
    `${relativePath} must declare specVersion ${currentSpecVersion}`,
  );
}

for (const [, relativePath] of schemaEntries) {
  assertRegisteredSchemaMetadata(relativePath, readJson(relativePath));
}

for (const artifactPath of nonSchemaArtifacts) {
  assertNonSchemaArtifactMetadata(artifactPath);
}

for (const schema of Object.values(schemas)) {
  ajv.addSchema(schema);
}

const validators: Record<string, ValidateFunction> = Object.fromEntries(
  Object.entries(schemas).map(([name, schema]) => [
    name,
    ajv.getSchema(schema.$id) ?? ajv.compile(schema),
  ]),
);

function validate(name: string, value: JsonValue, label: string): void {
  const validator = validators[name];
  assert(validator, `Missing ${name} schema validator`);
  const ok = validator(value);
  assert(ok, `${label} failed ${name} schema validation: ${ajv.errorsText(validator.errors)}`);
}

function validateExpectedFailure(name: string, value: JsonValue, label: string): void {
  const validator = validators[name];
  assert(validator, `Missing ${name} schema validator`);
  const ok = validator(value);
  assert(!ok, `${label} unexpectedly passed ${name} schema validation`);
}

const reservedExtensionNamespaces = readJsonFile("schemas/reserved-extension-namespaces.json");

export { ajv, reservedExtensionNamespaces, schemas, validate, validateExpectedFailure, validators };
