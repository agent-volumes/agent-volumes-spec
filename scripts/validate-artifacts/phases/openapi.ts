import YAML from "yaml";

import { assertProblemDetails } from "../assertions/problem-details.ts";
import { assert } from "../core/assert.ts";
import { EMPTY_COUNT, FIRST_CONTENT_INDEX } from "../core/numeric-constants.ts";
import { problemStatusBySlug } from "../core/patterns.ts";
import { schemas } from "../core/schema-context.ts";
import type { JsonObject, JsonValue, ValidationContext } from "../core/types.ts";

const REQUIRED_OPERATIONS = [
  { auth: "Public", method: "get", operationId: "searchVolumes", pathName: "/api/v1/search" },
  {
    auth: "Bearer",
    method: "post",
    operationId: "createVolumeUploadIntent",
    pathName: "/api/v1/volumes/{name}",
  },
  {
    auth: "Bearer",
    method: "post",
    operationId: "finalizeVolumeUpload",
    pathName: "/api/v1/volumes/{name}/uploads/{uploadId}/finalize",
  },
  {
    auth: "Bearer",
    method: "post",
    operationId: "createScopedVolumeUploadIntent",
    pathName: "/api/v1/volumes/@{scope}/{name}",
  },
  {
    auth: "Bearer",
    method: "post",
    operationId: "finalizeScopedVolumeUpload",
    pathName: "/api/v1/volumes/@{scope}/{name}/uploads/{uploadId}/finalize",
  },
  {
    auth: "Public",
    method: "get",
    operationId: "getVolumeRelease",
    pathName: "/api/v1/volumes/{name}/{version}",
  },
  {
    auth: "Bearer",
    method: "delete",
    operationId: "unpublishVolumeRelease",
    pathName: "/api/v1/volumes/{name}/{version}",
  },
  {
    auth: "Public",
    method: "get",
    operationId: "getScopedVolumeRelease",
    pathName: "/api/v1/volumes/@{scope}/{name}/{version}",
  },
  {
    auth: "Bearer",
    method: "delete",
    operationId: "unpublishScopedVolumeRelease",
    pathName: "/api/v1/volumes/@{scope}/{name}/{version}",
  },
  {
    auth: "Public",
    method: "get",
    operationId: "getVolumeVersionIndex",
    pathName: "/api/v1/index/volumes/{name}",
  },
  {
    auth: "Public",
    method: "get",
    operationId: "getScopedVolumeVersionIndex",
    pathName: "/api/v1/index/volumes/@{scope}/{name}",
  },
  {
    auth: "Public",
    method: "get",
    operationId: "getVolumeTrustSummary",
    pathName: "/api/v1/volumes/{name}/{version}/trust/summary",
  },
  {
    auth: "Public",
    method: "get",
    operationId: "getScopedVolumeTrustSummary",
    pathName: "/api/v1/volumes/@{scope}/{name}/{version}/trust/summary",
  },
  {
    auth: "Public",
    method: "get",
    operationId: "getVolumeTrustDetail",
    pathName: "/api/v1/volumes/{name}/{version}/trust/detail",
  },
  {
    auth: "Bearer",
    method: "post",
    operationId: "createVolumeTrustUploadIntent",
    pathName: "/api/v1/volumes/{name}/{version}/trust/uploads",
  },
  {
    auth: "Bearer",
    method: "post",
    operationId: "finalizeVolumeTrustUpload",
    pathName: "/api/v1/volumes/{name}/{version}/trust/uploads/{uploadId}/finalize",
  },
  {
    auth: "Public",
    method: "get",
    operationId: "getScopedVolumeTrustDetail",
    pathName: "/api/v1/volumes/@{scope}/{name}/{version}/trust/detail",
  },
  {
    auth: "Bearer",
    method: "post",
    operationId: "createScopedVolumeTrustUploadIntent",
    pathName: "/api/v1/volumes/@{scope}/{name}/{version}/trust/uploads",
  },
  {
    auth: "Bearer",
    method: "post",
    operationId: "finalizeScopedVolumeTrustUpload",
    pathName: "/api/v1/volumes/@{scope}/{name}/{version}/trust/uploads/{uploadId}/finalize",
  },
  {
    auth: "Public",
    method: "get",
    operationId: "searchAdvisories",
    pathName: "/api/v1/advisories",
  },
  {
    auth: "Public",
    method: "get",
    operationId: "getAdvisory",
    pathName: "/api/v1/advisories/{advisoryId}",
  },
  {
    auth: "Public",
    method: "get",
    operationId: "getCapabilityMetadata",
    pathName: "/api/v1/capabilities",
  },
] as const;

const IDEMPOTENCY_OPERATIONS = new Set([
  "createVolumeUploadIntent",
  "finalizeVolumeUpload",
  "createScopedVolumeUploadIntent",
  "finalizeScopedVolumeUpload",
  "createVolumeTrustUploadIntent",
  "finalizeVolumeTrustUpload",
  "createScopedVolumeTrustUploadIntent",
  "finalizeScopedVolumeTrustUpload",
]);

const CONFLICT_RESPONSE_PATHS = [
  "/api/v1/index/volumes/{name}",
  "/api/v1/index/volumes/@{scope}/{name}",
  "/api/v1/volumes/{name}/{version}",
  "/api/v1/volumes/@{scope}/{name}/{version}",
  "/api/v1/volumes/{name}/{version}/trust/summary",
  "/api/v1/volumes/@{scope}/{name}/{version}/trust/summary",
  "/api/v1/volumes/{name}/{version}/trust/detail",
  "/api/v1/volumes/@{scope}/{name}/{version}/trust/detail",
] as const;

const OPENAPI_SCHEMA_PARITY_PAIRS = [
  ["NameSegment", "nameSegment"],
  ["ScopeName", "scopeName"],
  ["VolumeName", "volumeName"],
  ["SemVer", "semver"],
] as const;

const EXPECTED_PARAMETER_REF_BY_NAME: Record<string, string> = {
  name: "#/components/schemas/NameSegment",
  scope: "#/components/schemas/ScopeName",
  version: "#/components/schemas/SemVer",
};

const OPENAPI_OPERATION_METHODS = ["get", "post", "put", "patch", "delete"] as const;

const SCOPED_UPLOAD_OPERATION_FIXTURE_ENDPOINTS = new Map([
  ["createScopedVolumeUploadIntent", "POST /api/v1/volumes/@{scope}/{name}"],
  [
    "finalizeScopedVolumeUpload",
    "POST /api/v1/volumes/@{scope}/{name}/uploads/{uploadId}/finalize",
  ],
  [
    "createScopedVolumeTrustUploadIntent",
    "POST /api/v1/volumes/@{scope}/{name}/{version}/trust/uploads",
  ],
  [
    "finalizeScopedVolumeTrustUpload",
    "POST /api/v1/volumes/@{scope}/{name}/{version}/trust/uploads/{uploadId}/finalize",
  ],
]);

interface OpenapiOperation {
  method: string;
  operation: JsonObject;
  operationId: string;
  pathName: string;
  security: JsonValue;
}

interface ScopedUploadFixtureEvidenceAssertion {
  ctx: ValidationContext;
  endpoint: string;
  endpointFamily: JsonValue;
  operationId: string;
}

function readOpenapi(ctx: ValidationContext): JsonObject {
  try {
    return YAML.parse(ctx.readText("openapi/bibliotheca.openapi.yaml"));
  } catch (error) {
    throw new Error(
      `OpenAPI YAML semantic validation failed: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isOpenapiOperationMethod(method: string): boolean {
  return OPENAPI_OPERATION_METHODS.some((operationMethod: string) => operationMethod === method);
}

function collectOpenapiOperations(openapi: JsonObject): OpenapiOperation[] {
  const operations: OpenapiOperation[] = [];
  assert(isJsonObject(openapi.paths), "OpenAPI paths must be an object");
  for (const [pathName, pathItem] of Object.entries(openapi.paths)) {
    assert(isJsonObject(pathItem), `OpenAPI ${pathName} path item must be an object`);
    for (const [method, operation] of Object.entries(pathItem)) {
      if (isOpenapiOperationMethod(method)) {
        assert(
          isJsonObject(operation),
          `OpenAPI ${pathName} ${method} must define an operation object`,
        );
        assert(
          typeof operation.operationId === "string" && operation.operationId.length > EMPTY_COUNT,
          `OpenAPI ${method.toUpperCase()} ${pathName} must define operationId`,
        );
        operations.push({
          method,
          operation,
          operationId: operation.operationId,
          pathName,
          security: operation.security,
        });
      }
    }
  }
  return operations;
}

function addMatrixFamilyOperations(
  matrixAuthById: Map<string, string>,
  endpointFamily: JsonValue,
): void {
  for (const operationId of endpointFamily.operations) {
    assert(
      !matrixAuthById.has(operationId),
      `OpenAPI operation matrix must list ${operationId} exactly once`,
    );
    matrixAuthById.set(operationId, endpointFamily.auth);
  }
}

function operationMatrixAuthById(openapiOperationMatrix: JsonValue): Map<string, string> {
  const matrixAuthById = new Map<string, string>();
  for (const endpointFamily of openapiOperationMatrix.endpointFamilies) {
    addMatrixFamilyOperations(matrixAuthById, endpointFamily);
  }
  return matrixAuthById;
}

function fixtureSetContainsEndpoint(fixtureSet: JsonValue, endpoint: string): boolean {
  return (
    Array.isArray(fixtureSet.fixtures) &&
    fixtureSet.fixtures.some((fixture: JsonValue) => fixture.endpoint === endpoint)
  );
}

function assertMatrixFixtureReferences(
  ctx: ValidationContext,
  openapiOperationMatrix: JsonValue,
): void {
  for (const endpointFamily of openapiOperationMatrix.endpointFamilies) {
    for (const fixturePath of endpointFamily.fixtures ?? []) {
      assert(
        ctx.pathExists(fixturePath),
        `OpenAPI operation matrix ${endpointFamily.name} references missing fixture ${fixturePath}`,
      );
    }
  }
}

function assertScopedUploadFixtureEvidence({
  ctx,
  endpoint,
  endpointFamily,
  operationId,
}: ScopedUploadFixtureEvidenceAssertion): void {
  const fixtures = endpointFamily.fixtures ?? [];
  assert(
    fixtures.length > EMPTY_COUNT,
    `OpenAPI operation matrix ${operationId} must reference a fixture with scoped endpoint evidence`,
  );
  assert(
    fixtures.some((fixturePath: JsonValue) =>
      fixtureSetContainsEndpoint(ctx.readJson(fixturePath), endpoint),
    ),
    `OpenAPI operation matrix ${operationId} fixtures must include ${endpoint}`,
  );
}

function assertScopedUploadOperationFixtures(
  ctx: ValidationContext,
  openapiOperationMatrix: JsonValue,
): void {
  for (const endpointFamily of openapiOperationMatrix.endpointFamilies) {
    for (const operationId of endpointFamily.operations) {
      const scopedUploadEndpoint = SCOPED_UPLOAD_OPERATION_FIXTURE_ENDPOINTS.get(operationId);
      if (scopedUploadEndpoint) {
        assertScopedUploadFixtureEvidence({
          ctx,
          endpoint: scopedUploadEndpoint,
          endpointFamily,
          operationId,
        });
      }
    }
  }
}

function operationDeclaresBearerAuth(operation: OpenapiOperation): boolean {
  if (!Array.isArray(operation.security)) {
    return false;
  }
  return operation.security.some(
    (securityRequirement: JsonValue) =>
      isJsonObject(securityRequirement) && Array.isArray(securityRequirement.bearerAuth),
  );
}

function assertOperationAuthBoundary(operation: OpenapiOperation, expectedAuth: string): void {
  if (expectedAuth === "Bearer") {
    assert(
      operationDeclaresBearerAuth(operation),
      `OpenAPI ${operation.operationId} must declare bearerAuth per operation matrix`,
    );
    return;
  }
  assert(
    expectedAuth === "Public",
    `OpenAPI operation matrix must classify ${operation.operationId} auth as Public or Bearer`,
  );
  assert(
    typeof operation.security === "undefined" ||
      (Array.isArray(operation.security) && operation.security.length === EMPTY_COUNT),
    `OpenAPI ${operation.operationId} must remain public per operation matrix`,
  );
}

function assertOperationCoverageMatrix(
  ctx: ValidationContext,
  openapi: JsonObject,
  openapiOperationMatrix: JsonValue,
): void {
  const operations = collectOpenapiOperations(openapi);
  const matrixAuthById = operationMatrixAuthById(openapiOperationMatrix);
  assert(
    operations.length === matrixAuthById.size,
    "OpenAPI operation matrix must contain exactly one row entry per operationId",
  );
  for (const operation of operations) {
    const expectedAuth = matrixAuthById.get(operation.operationId);
    assert(
      typeof expectedAuth === "string",
      `OpenAPI operation matrix missing ${operation.operationId}`,
    );
    assertOperationAuthBoundary(operation, expectedAuth);
  }
  assertMatrixFixtureReferences(ctx, openapiOperationMatrix);
  assertScopedUploadOperationFixtures(ctx, openapiOperationMatrix);
}

function operationKey(method: string, pathName: string): string {
  return `${method.toUpperCase()} ${pathName}`;
}

function assertRequiredOperations(openapi: JsonObject): void {
  const operationsByKey = new Map(
    collectOpenapiOperations(openapi).map((operation: OpenapiOperation) => [
      operationKey(operation.method, operation.pathName),
      operation,
    ]),
  );
  for (const requiredOperation of REQUIRED_OPERATIONS) {
    const operation = operationsByKey.get(
      operationKey(requiredOperation.method, requiredOperation.pathName),
    );
    assert(
      operation,
      `OpenAPI document must define ${requiredOperation.method.toUpperCase()} ${requiredOperation.pathName}`,
    );
    assert(
      operation.operationId === requiredOperation.operationId,
      `OpenAPI ${operationKey(requiredOperation.method, requiredOperation.pathName)} must use operationId ${requiredOperation.operationId}`,
    );
    assertOperationAuthBoundary(operation, requiredOperation.auth);
  }
}

function operationHasIdempotencyHeader(operation: OpenapiOperation): boolean {
  return (operation.operation.parameters ?? []).some(
    (parameter: JsonValue) => parameter.in === "header" && parameter.name === "Idempotency-Key",
  );
}

function assertUploadIdempotency(openapi: JsonObject): void {
  for (const operation of collectOpenapiOperations(openapi)) {
    if (IDEMPOTENCY_OPERATIONS.has(operation.operationId)) {
      assert(
        operationHasIdempotencyHeader(operation),
        `OpenAPI ${operation.operationId} must accept Idempotency-Key header`,
      );
    }
  }
}

function assertConflictResponses(openapi: JsonObject): void {
  for (const pathName of CONFLICT_RESPONSE_PATHS) {
    assert(
      openapi.paths[pathName]?.get?.responses?.["409"]?.$ref === "#/components/responses/Conflict",
      `OpenAPI GET ${pathName} must expose 409 Conflict for inconsistent registry state`,
    );
  }
}

function assertOpenapiSchemaParity(openapi: JsonObject): void {
  assert(
    openapi.components?.schemas?.ProblemDetails,
    "OpenAPI document must define ProblemDetails schema",
  );
  for (const [openapiName, schemaDefName] of OPENAPI_SCHEMA_PARITY_PAIRS) {
    const openapiSchema = openapi.components?.schemas?.[openapiName];
    const jsonSchema = schemas.volume.$defs[schemaDefName];
    assert(openapiSchema, `OpenAPI document must define ${openapiName} schema`);
    assert(
      openapiSchema.type === jsonSchema.type,
      `OpenAPI ${openapiName}.type must match volume schema`,
    );
    assert(
      openapiSchema.pattern === jsonSchema.pattern,
      `OpenAPI ${openapiName}.pattern must match volume schema`,
    );
    if (typeof jsonSchema.maxLength !== "undefined") {
      assert(
        openapiSchema.maxLength === jsonSchema.maxLength,
        `OpenAPI ${openapiName}.maxLength must match volume schema`,
      );
    }
  }
}

function problemComponentName(slug: string): string {
  return `${slug
    .split("-")
    .map((part: JsonValue) => `${part[0].toUpperCase()}${part.slice(FIRST_CONTENT_INDEX)}`)
    .join("")}Problem`;
}

function assertProblemDetailsComponents(openapi: JsonObject): void {
  assert(
    Array.isArray(openapi.components.schemas.ProblemDetails?.oneOf) &&
      openapi.components.schemas.ProblemDetails.oneOf.length === problemStatusBySlug.size,
    "OpenAPI ProblemDetails must expose one variant for each standalone problem-details type",
  );
  for (const [slug, status] of problemStatusBySlug) {
    const componentName = problemComponentName(slug);
    const problemSchema = openapi.components.schemas[componentName];
    assert(problemSchema, `OpenAPI ProblemDetails must define ${componentName}`);
    const constraint = problemSchema.allOf?.[1]?.properties;
    assert(
      constraint?.type?.const === `https://agentvolumes.org/problems/${slug}` &&
        constraint?.status?.const === status,
      `OpenAPI ${componentName} must mirror standalone problem type/status mapping`,
    );
  }
}

function assertOpenapiStandaloneSchemaLinks(openapi: JsonObject): void {
  assert(
    openapi.components.schemas.ProblemDetailsBase?.required?.join(",") ===
      schemas.problemDetails.required.join(","),
    "OpenAPI ProblemDetailsBase.required must match standalone schema",
  );
  assert(
    openapi.components.schemas.SearchResults.$ref === "../schemas/search-results.schema.json",
    "OpenAPI SearchResults must reference standalone search-results schema",
  );
  assert(
    openapi.components.schemas.VersionIndex?.properties?.items?.items?.$ref ===
      "../schemas/version-index-row.schema.json",
    "OpenAPI VersionIndex must expose version-index-row items while standalone version-index schema validates fixtures",
  );
  assert(
    openapi.components.schemas.AdvisoryList?.properties?.items?.items?.$ref ===
      "../schemas/advisory.schema.json",
    "OpenAPI AdvisoryList must expose advisory items while standalone advisory-list schema validates fixtures",
  );
}

function assertOpenapiEndpointSchemas(openapi: JsonObject): void {
  assert(
    openapi.paths["/api/v1/index/volumes/{name}"].get.responses["200"].content["application/json"]
      .schema.$ref === "#/components/schemas/VersionIndex" &&
      openapi.paths["/api/v1/index/volumes/@{scope}/{name}"].get.responses["200"].content[
        "application/json"
      ].schema.$ref === "#/components/schemas/VersionIndex",
    "OpenAPI version index endpoints must use the VersionIndex component",
  );
  assert(
    openapi.paths["/api/v1/advisories"].get.responses["200"].content["application/json"].schema
      .$ref === "#/components/schemas/AdvisoryList",
    "OpenAPI advisory list endpoint must use the AdvisoryList component",
  );
}

function assertProblemContentExamples(
  ctx: ValidationContext,
  responseName: string,
  problemContent: JsonValue,
): void {
  assert(
    isJsonObject(problemContent),
    `OpenAPI ${responseName} problem response content must be an object`,
  );
  assert(
    isJsonObject(problemContent.examples),
    `OpenAPI ${responseName} problem response must include representative examples`,
  );
  for (const [exampleName, example] of Object.entries(problemContent.examples)) {
    assert(
      isJsonObject(example),
      `OpenAPI ${responseName} problem example ${exampleName} must be an object`,
    );
    assertProblemDetails(
      ctx,
      example.value,
      `OpenAPI ${responseName} problem example ${exampleName}`,
    );
  }
}

function assertProblemResponseExamples(ctx: ValidationContext, openapi: JsonObject): void {
  for (const [responseName, response] of Object.entries(openapi.components.responses)) {
    assert(isJsonObject(response), `OpenAPI ${responseName} response must be an object`);
    const problemContent = response.content?.["application/problem+json"];
    if (problemContent) {
      assertProblemContentExamples(ctx, responseName, problemContent);
    }
  }
}

function assertPathParameterSchema(pathName: string, method: string, parameter: JsonValue): void {
  if (parameter.in !== "path") {
    return;
  }
  const expectedRef = EXPECTED_PARAMETER_REF_BY_NAME[parameter.name];
  if (expectedRef) {
    assert(
      parameter.schema?.$ref === expectedRef,
      `OpenAPI ${method.toUpperCase()} ${pathName} path parameter ${parameter.name} must use ${expectedRef}`,
    );
  }
}

function assertOperationPathParameters(
  pathName: string,
  method: string,
  operation: JsonValue,
): void {
  assert(isJsonObject(operation), `OpenAPI ${pathName} ${method} must define an operation object`);
  for (const parameter of operation.parameters ?? []) {
    assertPathParameterSchema(pathName, method, parameter);
  }
}

function assertPathParameterSchemas(openapi: JsonObject): void {
  assert(isJsonObject(openapi.paths), "OpenAPI paths must be an object");
  for (const [pathName, pathItem] of Object.entries(openapi.paths)) {
    assert(isJsonObject(pathItem), `OpenAPI ${pathName} path item must be an object`);
    for (const [method, operation] of Object.entries(pathItem)) {
      if (isOpenapiOperationMethod(method)) {
        assertOperationPathParameters(pathName, method, operation);
      }
    }
  }
}

function assertOpenapiDocument(
  ctx: ValidationContext,
  openapi: JsonObject,
  openapiOperationMatrix: JsonValue,
): void {
  assert(openapi.openapi === "3.1.1", "OpenAPI document must declare version 3.1.1");
  assertRequiredOperations(openapi);
  assertOperationCoverageMatrix(ctx, openapi, openapiOperationMatrix);
  assertUploadIdempotency(openapi);
  assertConflictResponses(openapi);
  assertOpenapiSchemaParity(openapi);
  assertProblemDetailsComponents(openapi);
  assertOpenapiStandaloneSchemaLinks(openapi);
  assertOpenapiEndpointSchemas(openapi);
  assertPathParameterSchemas(openapi);
}

export function run(ctx: ValidationContext): void {
  const openapi = readOpenapi(ctx);
  const openapiOperationMatrix = ctx.readJson("conformance/fixtures/openapi-operation-matrix.json");
  ctx.validate(
    "openapiOperationMatrix",
    openapiOperationMatrix,
    "OpenAPI operation matrix fixture",
  );
  assertOpenapiDocument(ctx, openapi, openapiOperationMatrix);
  assertProblemResponseExamples(ctx, openapi);
}
