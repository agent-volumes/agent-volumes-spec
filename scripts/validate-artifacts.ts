import {
  assertNoUnvalidatedConformanceFixtures,
  assertNoUnvalidatedRootConformanceArtifacts,
} from "./validate-artifacts/assertions/conformance-coverage.ts";
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
import { run as runAdvisoryPhase } from "./validate-artifacts/phases/advisory.ts";
import { run as runCapabilityAndBridgePhase } from "./validate-artifacts/phases/capability-and-bridge.ts";
import { run as runConformanceAndMappingPhase } from "./validate-artifacts/phases/conformance-and-mapping.ts";
import { run as runDependenciesPhase } from "./validate-artifacts/phases/dependencies.ts";
import { run as runIntegrityAndArchivesPhase } from "./validate-artifacts/phases/integrity-and-archives.ts";
import { run as runManifestPermissionsResolutionPhase } from "./validate-artifacts/phases/manifest-permissions-resolution.ts";
import { run as runOpenapiPhase } from "./validate-artifacts/phases/openapi.ts";
import { run as runProblemsAndLifecyclePhase } from "./validate-artifacts/phases/problems-and-lifecycle.ts";
import { run as runTrustPhase } from "./validate-artifacts/phases/trust.ts";
import { run as runUploadLifecyclePhase } from "./validate-artifacts/phases/upload-lifecycle.ts";

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
  runAdvisoryPhase,
  runTrustPhase,
  runCapabilityAndBridgePhase,
  runProblemsAndLifecyclePhase,
  runUploadLifecyclePhase,
  runManifestPermissionsResolutionPhase,
  runIntegrityAndArchivesPhase,
  runDependenciesPhase,
  runConformanceAndMappingPhase,
  runOpenapiPhase,
];

for (const phase of phases) {
  phase(ctx);
}

assertNoUnvalidatedConformanceFixtures(ctx);
assertNoUnvalidatedRootConformanceArtifacts(ctx);

console.log("Artifact validation passed.");
