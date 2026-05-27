import { assert, assertUniqueStrings } from "./assert.ts";
import { readJson } from "./files.ts";
import type { JsonValue } from "./types.ts";

const PROBLEM_TYPE_PREFIX = "https://agentvolumes.org/problems/";

function problemSlugFromType(type: string): string {
  assert(
    type.startsWith(PROBLEM_TYPE_PREFIX),
    `problem registry type must use ${PROBLEM_TYPE_PREFIX}`,
  );
  return type.slice(PROBLEM_TYPE_PREFIX.length);
}

function problemStatusEntries(problemRegistry: JsonValue): [string, number][] {
  assert(Array.isArray(problemRegistry.problems), "problem registry must list problems");
  const entries: [string, number][] = [];
  for (const problem of problemRegistry.problems) {
    assert(typeof problem.slug === "string", "problem registry problem needs slug");
    assert(typeof problem.type === "string", `problem registry ${problem.slug} needs type`);
    assert(typeof problem.status === "number", `problem registry ${problem.slug} needs status`);
    assert(
      problemSlugFromType(problem.type) === problem.slug,
      `problem registry ${problem.slug} type must end with slug`,
    );
    entries.push([problem.slug, problem.status]);
  }
  assertUniqueStrings(
    entries.map(([slug]) => slug),
    "problem registry slugs",
  );
  return entries;
}

const problemRegistry = readJson("conformance/fixtures/problem-registry.json");
const problemStatusBySlug = new Map(problemStatusEntries(problemRegistry));

export { problemRegistry, problemStatusBySlug };
