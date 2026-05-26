import type { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import Ajv2020 from "ajv/dist/2020";

import { assert } from "./assert.ts";
import { readJson, readJsonFile } from "./files.ts";
import type { JsonValue } from "./types.ts";

const ajv = new Ajv2020({ allErrors: true, strict: true, validateSchema: true });
addFormats(ajv);

const schemas = {
  advisory: readJson("schemas/advisory.schema.json"),
  advisoryList: readJson("schemas/advisory-list.schema.json"),
  advisoryValidationCase: readJson("schemas/advisory-validation-case.schema.json"),
  bridgeMetadata: readJson("schemas/bridge-metadata.schema.json"),
  capabilityMetadata: readJson("schemas/capability-metadata.schema.json"),
  componentDependencyValidationCase: readJson(
    "schemas/component-dependency-validation-case.schema.json",
  ),
  conformanceCoverage: readJson("schemas/conformance-coverage.schema.json"),
  conformanceReport: readJson("schemas/conformance-report.schema.json"),
  exactReleaseMetadataCase: readJson("schemas/exact-release-metadata-case.schema.json"),
  externalDependencyDeclarationsPredicate: readJson(
    "schemas/external-dependency-declarations-predicate.schema.json",
  ),
  externalDependencyPotentialExposureWarningContext: readJson(
    "schemas/external-dependency-potential-exposure-warning-context.schema.json",
  ),
  externalDependencyValidationCase: readJson(
    "schemas/external-dependency-validation-case.schema.json",
  ),
  manifestParseCase: readJson("schemas/manifest-parse-case.schema.json"),
  mappingMatrix: readJson("schemas/mapping-matrix.schema.json"),
  mappingSample: readJson("schemas/mapping-sample.schema.json"),
  problemDetails: readJson("schemas/problem-details.schema.json"),
  problemRegistry: readJson("schemas/problem-registry.schema.json"),
  purlVersCompatibilityExceptions: readJson(
    "schemas/purl-vers-compatibility-exceptions.schema.json",
  ),
  releaseMetadata: readJson("schemas/release-metadata.schema.json"),
  releaseUploadFinalize: readJson("schemas/release-upload-finalize.schema.json"),
  releaseUploadIntent: readJson("schemas/release-upload-intent.schema.json"),
  searchResults: readJson("schemas/search-results.schema.json"),
  semanticValidationCase: readJson("schemas/semantic-validation-case.schema.json"),
  trustArtifactVerificationCase: readJson("schemas/trust-artifact-verification-case.schema.json"),
  trustDetail: readJson("schemas/trust-detail.schema.json"),
  trustSummary: readJson("schemas/trust-summary.schema.json"),
  trustUploadFinalize: readJson("schemas/trust-upload-finalize.schema.json"),
  trustUploadIntent: readJson("schemas/trust-upload-intent.schema.json"),
  upstreamBaseline: readJson("schemas/upstream-baseline.schema.json"),
  versionIndex: readJson("schemas/version-index.schema.json"),
  versionIndexRow: readJson("schemas/version-index-row.schema.json"),
  volume: readJson("schemas/volume.schema.json"),
  warning: readJson("schemas/warning.schema.json"),
};

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
