import { assertNoUnvalidatedConformanceFixtures } from "./validate-artifacts/assertions/conformance-coverage.ts";
import {
  isDirectory,
  pathExists,
  readJson,
  readJsonFile,
  readJsonPaths,
  readText,
  root,
} from "./validate-artifacts/core/files.ts";
import {
  ajv,
  reservedExtensionNamespaces,
  schemas,
  validate,
  validateExpectedFailure,
} from "./validate-artifacts/core/schema-context.ts";
import * as advisoryPhase from "./validate-artifacts/phases/advisory.ts";
import * as capabilityAndBridgePhase from "./validate-artifacts/phases/capability-and-bridge.ts";
import * as conformanceAndMappingPhase from "./validate-artifacts/phases/conformance-and-mapping.ts";
import * as dependenciesPhase from "./validate-artifacts/phases/dependencies.ts";
import * as integrityAndArchivesPhase from "./validate-artifacts/phases/integrity-and-archives.ts";
import * as manifestPermissionsResolutionPhase from "./validate-artifacts/phases/manifest-permissions-resolution.ts";
import * as openapiPhase from "./validate-artifacts/phases/openapi.ts";
import * as problemsAndLifecyclePhase from "./validate-artifacts/phases/problems-and-lifecycle.ts";
import * as trustPhase from "./validate-artifacts/phases/trust.ts";
import * as uploadLifecyclePhase from "./validate-artifacts/phases/upload-lifecycle.ts";

const ctx = {
  ajv,
  isDirectory,
  pathExists,
  readJson,
  readJsonFile,
  readJsonPaths,
  readText,
  reservedExtensionNamespaces,
  root,
  schemas,
  validate,
  validateExpectedFailure,
};

const phases = [
  advisoryPhase,
  trustPhase,
  capabilityAndBridgePhase,
  problemsAndLifecyclePhase,
  uploadLifecyclePhase,
  manifestPermissionsResolutionPhase,
  integrityAndArchivesPhase,
  dependenciesPhase,
  conformanceAndMappingPhase,
  openapiPhase,
];

for (const phase of phases) {
  phase.run(ctx);
}

assertNoUnvalidatedConformanceFixtures(ctx);

console.log("Artifact validation passed.");
