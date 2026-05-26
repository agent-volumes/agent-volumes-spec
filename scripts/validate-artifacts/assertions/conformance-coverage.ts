import fs from "node:fs";
import path from "node:path";

import { assert, assertUniqueStrings } from "../core/assert.ts";
import { readJsonFile } from "../core/files.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

export const caseNamesFromFixture = (fixture: JsonValue) => {
  const names = [];
  for (const collectionName of ["cases", "fixtures"]) {
    const collection = fixture[collectionName];
    if (!Array.isArray(collection)) {
      continue;
    }
    for (const item of collection) {
      if (typeof item.name === "string") {
        names.push(item.name);
      }
    }
  }
  return names;
};

export const resolveCoverageReference = (ctx: ValidationContext, fixtureName: JsonValue) => {
  const candidates = [
    `conformance/fixtures/${fixtureName}`,
    `conformance/${fixtureName}`,
    `openapi/${fixtureName}`,
  ];
  if (fixtureName.startsWith("schemas/")) {
    candidates.push(fixtureName);
  }
  return candidates.find((candidate: JsonValue) => ctx.pathExists(candidate));
};

export const assertConformanceCoverageReferences = (
  ctx: ValidationContext,
  conformanceCoverage: JsonValue,
) => {
  const requirementIds = conformanceCoverage.requirements.map(
    (requirement: JsonValue) => requirement.id,
  );
  assertUniqueStrings(requirementIds, "conformance coverage requirement IDs");
  const seenCoverageTuples = new Set();

  for (const requirement of conformanceCoverage.requirements) {
    for (const coverage of requirement.coverage) {
      const tuple = `${requirement.id}:${coverage.fixture}:${coverage.case ?? ""}:${coverage.area}:${
        coverage.coverageType ?? ""
      }`;
      assert(!seenCoverageTuples.has(tuple), `conformance coverage duplicate tuple ${tuple}`);
      seenCoverageTuples.add(tuple);

      const resolvedPath = resolveCoverageReference(ctx, coverage.fixture);
      assert(
        resolvedPath,
        `conformance coverage ${requirement.id} references missing fixture ${coverage.fixture}`,
      );
      if (ctx.isDirectory(resolvedPath)) {
        assert(
          !coverage.case,
          `conformance coverage ${requirement.id} cannot name a case for directory ${coverage.fixture}`,
        );
        continue;
      }
      if (!coverage.case) {
        continue;
      }

      assert(
        resolvedPath.startsWith("conformance/fixtures/") && resolvedPath.endsWith(".json"),
        `conformance coverage ${requirement.id} case ${coverage.case} must reference a JSON fixture file`,
      );
      const fixture = readJsonFile(resolvedPath);
      const caseNames = caseNamesFromFixture(fixture);
      assert(
        caseNames.length > 0,
        `conformance coverage ${requirement.id} references case ${coverage.case} in non-case fixture ${coverage.fixture}`,
      );
      assertUniqueStrings(caseNames, `${coverage.fixture} case names`);
      assert(
        caseNames.includes(coverage.case),
        `conformance coverage ${requirement.id} references missing case ${coverage.case} in ${coverage.fixture}`,
      );
    }
  }
};

export const assertNoUnvalidatedConformanceFixtures = (ctx: ValidationContext) => {
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
};
