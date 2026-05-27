import fs from "node:fs";
import path from "node:path";

import { assert, assertUniqueStrings } from "../core/assert.ts";
import { EMPTY_COUNT } from "../core/numeric-constants.ts";
import type { JsonValue, ValidationContext } from "../core/types.ts";

const PROSE_BOUNDARY_FIXTURE = "REQUIREMENTS.md";

const PROSE_BOUNDARY_HEADINGS = [
  "live-registry-behavior",
  "local-authorization-policy",
  "runtime-adapter-behavior",
  "cryptographic-trust-roots",
  "search-ranking-and-catalog-ordering",
  "external-dependency-discovery-surfaces",
];

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

interface CoverageFixtureCaseAssertion {
  ctx: ValidationContext;
  resolvedPath: JsonValue;
  requirement: JsonValue;
  coverage: JsonValue;
}

function assertCoverageFixtureCase({
  ctx,
  resolvedPath,
  requirement,
  coverage,
}: CoverageFixtureCaseAssertion): void {
  assert(
    resolvedPath.startsWith("conformance/fixtures/") && resolvedPath.endsWith(".json"),
    `conformance coverage ${requirement.id} case ${coverage.case} must reference a JSON fixture file`,
  );
  const caseNames = caseNamesFromFixture(ctx.readJson(resolvedPath));
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
    assertCoverageFixtureCase({ coverage, ctx, requirement, resolvedPath });
  }
}

function assertProseBoundaryReference(
  requirement: JsonValue,
  coverage: JsonValue,
  proseBoundaryHeadings: Set<string>,
): void {
  if (coverage.coverageType !== "prose-boundary") {
    assert(
      !coverage.boundary,
      `conformance coverage ${requirement.id} boundary is only valid for prose-boundary coverage`,
    );
    return;
  }

  assert(
    coverage.fixture === PROSE_BOUNDARY_FIXTURE,
    `conformance coverage ${requirement.id} prose-boundary coverage must reference REQUIREMENTS.md`,
  );
  assert(
    coverage.boundary,
    `conformance coverage ${requirement.id} prose-boundary coverage must name a boundary`,
  );
  assert(
    proseBoundaryHeadings.has(coverage.boundary),
    `conformance coverage ${requirement.id} references missing prose boundary ${coverage.boundary}`,
  );
}

function proseBoundaryHeadingSlug(headingLine: string): string {
  return headingLine
    .replace(/^- \*\*/, "")
    .replace(/\*\*:.*$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function isProseBoundaryListItem(line: string, inProseBoundarySection: boolean): boolean {
  return inProseBoundarySection && line.startsWith("- **");
}

function extractProseBoundaryHeadings(requirementsText: string): Set<string> {
  const headings = new Set<string>();
  let inProseBoundarySection = false;
  for (const line of requirementsText.split("\n")) {
    if (line === "## Prose-boundary behavior") {
      inProseBoundarySection = true;
    } else if (inProseBoundarySection && line.startsWith("## ")) {
      break;
    } else if (isProseBoundaryListItem(line, inProseBoundarySection)) {
      headings.add(proseBoundaryHeadingSlug(line));
    }
  }
  return headings;
}

function assertKnownProseBoundaryHeadings(proseBoundaryHeadings: Set<string>): void {
  assertUniqueStrings([...proseBoundaryHeadings], "prose-boundary headings");
  for (const heading of PROSE_BOUNDARY_HEADINGS) {
    assert(
      proseBoundaryHeadings.has(heading),
      `conformance REQUIREMENTS.md missing prose-boundary heading ${heading}`,
    );
  }
}

function headingAnchorSlug(headingLine: string): string {
  return headingLine
    .replace(/^#+\s*/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractSpecAnchors(specText: string): Set<string> {
  const anchors = new Set<string>();
  for (const line of specText.split("\n")) {
    if (line.startsWith("#")) {
      anchors.add(`#${headingAnchorSlug(line)}`);
    }
  }
  return anchors;
}

function assertRequirementSpecAnchor(requirement: JsonValue, specAnchors: Set<string>): void {
  assert(
    typeof requirement.specAnchor === "string",
    `conformance coverage ${requirement.id} must declare specAnchor`,
  );
  assert(
    specAnchors.has(requirement.specAnchor),
    `conformance coverage ${requirement.id} references missing spec anchor ${requirement.specAnchor}`,
  );
}

interface CoverageReferenceAssertion {
  ctx: ValidationContext;
  proseBoundaryHeadings: Set<string>;
  seenCoverageTuples: Set<string>;
  requirement: JsonValue;
  coverage: JsonValue;
}

function assertCoverageReference({
  ctx,
  proseBoundaryHeadings,
  seenCoverageTuples,
  requirement,
  coverage,
}: CoverageReferenceAssertion): void {
  assertUniqueCoverageTuple(seenCoverageTuples, requirement, coverage);
  assertProseBoundaryReference(requirement, coverage, proseBoundaryHeadings);
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
  const proseBoundaryHeadings = extractProseBoundaryHeadings(
    ctx.readText("conformance/REQUIREMENTS.md"),
  );
  const specAnchors = extractSpecAnchors(ctx.readText("agent-volumes-spec.md"));
  assertKnownProseBoundaryHeadings(proseBoundaryHeadings);

  for (const requirement of conformanceCoverage.requirements) {
    assertRequirementSpecAnchor(requirement, specAnchors);
    for (const coverage of requirement.coverage) {
      assertCoverageReference({
        coverage,
        ctx,
        proseBoundaryHeadings,
        requirement,
        seenCoverageTuples,
      });
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
