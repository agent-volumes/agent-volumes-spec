import YAML from "yaml";

import { assertProblemDetails } from "../assertions/problem-details.ts";
import { assert } from "../core/assert.ts";
import { FIRST_CONTENT_INDEX } from "../core/numeric-constants.ts";
import { problemStatusBySlug } from "../core/patterns.ts";
import { schemas } from "../core/schema-context.ts";
import type { JsonObject, JsonValue, ValidationContext } from "../core/types.ts";

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

export function run(ctx: ValidationContext): void {
  const openapi = readOpenapi(ctx);
  assert(openapi.openapi === "3.1.1", "OpenAPI document must declare version 3.1.1");
  assert(openapi.paths["/api/v1/search"], "OpenAPI document must define search path");
  assert(
    openapi.paths["/api/v1/capabilities"],
    "OpenAPI document must define capability metadata path",
  );
  assert(
    openapi.paths["/api/v1/index/volumes/{name}"],
    "OpenAPI document must define unscoped version index path",
  );
  assert(
    openapi.paths["/api/v1/index/volumes/@{scope}/{name}"],
    "OpenAPI document must define scoped version index path",
  );
  assert(
    openapi.paths["/api/v1/volumes/{name}"],
    "OpenAPI document must define unscoped release upload intent path",
  );
  assert(
    openapi.paths["/api/v1/volumes/{name}"].post.parameters.some(
      (parameter: JsonValue) => parameter.in === "header" && parameter.name === "Idempotency-Key",
    ),
    "OpenAPI unscoped release upload intent path must accept Idempotency-Key header",
  );
  assert(
    openapi.paths["/api/v1/volumes/{name}/uploads/{uploadId}/finalize"],
    "OpenAPI document must define unscoped release upload finalize path",
  );
  assert(
    openapi.paths["/api/v1/volumes/@{scope}/{name}"],
    "OpenAPI document must define scoped release upload intent path",
  );
  assert(
    openapi.paths["/api/v1/volumes/@{scope}/{name}"].post.parameters.some(
      (parameter: JsonValue) => parameter.in === "header" && parameter.name === "Idempotency-Key",
    ),
    "OpenAPI scoped release upload intent path must accept Idempotency-Key header",
  );
  assert(
    openapi.paths["/api/v1/volumes/@{scope}/{name}/uploads/{uploadId}/finalize"],
    "OpenAPI document must define scoped release upload finalize path",
  );
  assert(
    openapi.paths["/api/v1/volumes/{name}/{version}/trust/uploads"],
    "OpenAPI document must define unscoped trust upload intent path",
  );
  assert(
    openapi.paths["/api/v1/volumes/@{scope}/{name}/{version}/trust/uploads"],
    "OpenAPI document must define scoped trust upload intent path",
  );
  for (const pathName of [
    "/api/v1/index/volumes/{name}",
    "/api/v1/index/volumes/@{scope}/{name}",
    "/api/v1/volumes/{name}/{version}",
    "/api/v1/volumes/@{scope}/{name}/{version}",
    "/api/v1/volumes/{name}/{version}/trust/summary",
    "/api/v1/volumes/@{scope}/{name}/{version}/trust/summary",
    "/api/v1/volumes/{name}/{version}/trust/detail",
    "/api/v1/volumes/@{scope}/{name}/{version}/trust/detail",
  ]) {
    assert(
      openapi.paths[pathName]?.get?.responses?.["409"]?.$ref === "#/components/responses/Conflict",
      `OpenAPI GET ${pathName} must expose 409 Conflict for inconsistent registry state`,
    );
  }
  assert(
    openapi.components?.schemas?.ProblemDetails,
    "OpenAPI document must define ProblemDetails schema",
  );

  for (const [openapiName, schemaDefName] of [
    ["NameSegment", "nameSegment"],
    ["ScopeName", "scopeName"],
    ["VolumeName", "volumeName"],
    ["SemVer", "semver"],
  ] as [string, string][]) {
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
  assert(
    Array.isArray(openapi.components.schemas.ProblemDetails?.oneOf) &&
      openapi.components.schemas.ProblemDetails.oneOf.length === problemStatusBySlug.size,
    "OpenAPI ProblemDetails must expose one variant for each standalone problem-details type",
  );
  for (const [slug, status] of problemStatusBySlug) {
    const componentName = `${slug
      .split("-")
      .map((part: JsonValue) => `${part[0].toUpperCase()}${part.slice(FIRST_CONTENT_INDEX)}`)
      .join("")}Problem`;
    const problemSchema = openapi.components.schemas[componentName];
    assert(problemSchema, `OpenAPI ProblemDetails must define ${componentName}`);
    const constraint = problemSchema.allOf?.[1]?.properties;
    assert(
      constraint?.type?.const === `https://agentvolumes.org/problems/${slug}` &&
        constraint?.status?.const === status,
      `OpenAPI ${componentName} must mirror standalone problem type/status mapping`,
    );
  }
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
  for (const [responseName, response] of Object.entries(openapi.components.responses)) {
    assert(isJsonObject(response), `OpenAPI ${responseName} response must be an object`);
    const problemContent = response.content?.["application/problem+json"];
    if (problemContent) {
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
  }
  for (const [pathName, pathItem] of Object.entries(openapi.paths as JsonObject)) {
    for (const [method, operation] of Object.entries(pathItem as JsonObject)) {
      if (["get", "post", "put", "patch", "delete"].includes(method)) {
        assert(
          operation && typeof operation === "object",
          `OpenAPI ${pathName} ${method} must define an operation object`,
        );
        const operationObject = operation as JsonObject;
        for (const parameter of operationObject.parameters ?? []) {
          if (parameter.in === "path") {
            const expectedRefByName: Record<string, string> = {
              name: "#/components/schemas/NameSegment",
              scope: "#/components/schemas/ScopeName",
              version: "#/components/schemas/SemVer",
            };
            const expectedRef = expectedRefByName[parameter.name];
            if (expectedRef) {
              assert(
                parameter.schema?.$ref === expectedRef,
                `OpenAPI ${method.toUpperCase()} ${pathName} path parameter ${parameter.name} must use ${expectedRef}`,
              );
            }
          }
        }
      }
    }
  }
}
