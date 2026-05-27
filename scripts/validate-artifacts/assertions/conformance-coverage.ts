import fs from "node:fs";
import path from "node:path";

import { assert, assertUniqueStrings } from "../core/assert.ts";
import { readJsonFile } from "../core/files.ts";
import { EMPTY_COUNT } from "../core/numeric-constants.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

function caseNamesFromFixture(fixture: JsonValue): JsonValue[] {
  const names = [];
  for (const collectionName of ["cases", "fixtures"]) {
    const collection = fixture[collectionName];
    if (Array.isArray(collection)) {
      for (const item of collection) {
        if (typeof item.name === "string") {
          names.push(item.name);
        }
      }
    }
  }
  return names;
}

function resolveCoverageReference(ctx: ValidationContext, fixtureName: JsonValue): JsonValue {
  const candidates = [
    `conformance/fixtures/${fixtureName}`,
    `conformance/${fixtureName}`,
    `openapi/${fixtureName}`,
  ];
  if (fixtureName.startsWith("schemas/")) {
    candidates.push(fixtureName);
  }
  return candidates.find((candidate: JsonValue) => ctx.pathExists(candidate));
}

function assertUniqueCoverageTuple(
  seenCoverageTuples: Set<string>,
  requirement: JsonValue,
  coverage: JsonValue,
): void {
  const tuple = `${requirement.id}:${coverage.fixture}:${coverage.case ?? ""}:${coverage.area}:${
    coverage.coverageType ?? ""
  }`;
  assert(!seenCoverageTuples.has(tuple), `conformance coverage duplicate tuple ${tuple}`);
  seenCoverageTuples.add(tuple);
}

interface ResolvedCoverageReferenceAssertion {
  ctx: ValidationContext;
  resolvedPath: JsonValue;
  requirement: JsonValue;
  coverage: JsonValue;
}

function assertCoverageFixtureCase(
  resolvedPath: JsonValue,
  requirement: JsonValue,
  coverage: JsonValue,
): void {
  assert(
    resolvedPath.startsWith("conformance/fixtures/") && resolvedPath.endsWith(".json"),
    `conformance coverage ${requirement.id} case ${coverage.case} must reference a JSON fixture file`,
  );
  const caseNames = caseNamesFromFixture(readJsonFile(resolvedPath));
  assert(
    caseNames.length > EMPTY_COUNT,
    `conformance coverage ${requirement.id} references case ${coverage.case} in non-case fixture ${coverage.fixture}`,
  );
  assertUniqueStrings(caseNames, `${coverage.fixture} case names`);
  assert(
    caseNames.includes(coverage.case),
    `conformance coverage ${requirement.id} references missing case ${coverage.case} in ${coverage.fixture}`,
  );
}

function assertResolvedCoverageReference({
  ctx,
  resolvedPath,
  requirement,
  coverage,
}: ResolvedCoverageReferenceAssertion): void {
  if (ctx.isDirectory(resolvedPath)) {
    assert(
      !coverage.case,
      `conformance coverage ${requirement.id} cannot name a case for directory ${coverage.fixture}`,
    );
  } else if (coverage.case) {
    assertCoverageFixtureCase(resolvedPath, requirement, coverage);
  }
}

interface CoverageReferenceAssertion {
  ctx: ValidationContext;
  seenCoverageTuples: Set<string>;
  requirement: JsonValue;
  coverage: JsonValue;
}

function assertCoverageReference({
  ctx,
  seenCoverageTuples,
  requirement,
  coverage,
}: CoverageReferenceAssertion): void {
  assertUniqueCoverageTuple(seenCoverageTuples, requirement, coverage);
  const resolvedPath = resolveCoverageReference(ctx, coverage.fixture);
  assert(
    resolvedPath,
    `conformance coverage ${requirement.id} references missing fixture ${coverage.fixture}`,
  );
  assertResolvedCoverageReference({ coverage, ctx, requirement, resolvedPath });
}

function assertConformanceCoverageReferences(
  ctx: ValidationContext,
  conformanceCoverage: JsonValue,
): void {
  const requirementIds = conformanceCoverage.requirements.map(
    (requirement: JsonValue) => requirement.id,
  );
  assertUniqueStrings(requirementIds, "conformance coverage requirement IDs");
  const seenCoverageTuples = new Set<string>();

  for (const requirement of conformanceCoverage.requirements) {
    for (const coverage of requirement.coverage) {
      assertCoverageReference({ coverage, ctx, requirement, seenCoverageTuples });
    }
  }
}

function assertNoUnvalidatedConformanceFixtures(ctx: ValidationContext): void {
  const fixtureDirectory = path.join(ctx.root, "conformance/fixtures");
  const fixturePaths = fs
    .readdirSync(fixtureDirectory)
    .filter((entry: JsonValue) => entry.endsWith(".json"))
    .map((entry: JsonValue) => `conformance/fixtures/${entry}`)
    .toSorted();
  for (const fixturePath of fixturePaths) {
    assert(
      ctx.readJsonPaths.has(fixturePath),
      `${fixturePath} is not connected to scripts/validate-artifacts.ts`,
    );
  }
}

function assertNoUnvalidatedRootConformanceArtifacts(ctx: ValidationContext): void {
  const conformanceDirectory = path.join(ctx.root, "conformance");
  const conformanceArtifactPaths = fs
    .readdirSync(conformanceDirectory)
    .filter((entry: JsonValue) => entry.endsWith(".json"))
    .map((entry: JsonValue) => `conformance/${entry}`)
    .toSorted();
  for (const artifactPath of conformanceArtifactPaths) {
    assert(
      ctx.readJsonPaths.has(artifactPath),
      `${artifactPath} is not connected to scripts/validate-artifacts.ts`,
    );
  }
}

export {
  assertConformanceCoverageReferences,
  assertNoUnvalidatedConformanceFixtures,
  assertNoUnvalidatedRootConformanceArtifacts,
  caseNamesFromFixture,
  resolveCoverageReference,
};
