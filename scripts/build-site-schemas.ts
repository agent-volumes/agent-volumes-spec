#!/usr/bin/env bun
import { copyFile, mkdir, readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);

const semverPattern =
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-((0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(\.(0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(\+([0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*))?$/;

async function versionFromSpec(): Promise<string> {
  const specPath = join(repoRoot, "agent-volumes-spec.md");
  const spec = await readFile(specPath, "utf8");
  const match = /^\*\*Version:\*\*\s+(.+)$/m.exec(spec);

  if (!match?.[1]) {
    throw new Error('Could not find "**Version:** <version>" in agent-volumes-spec.md.');
  }

  return match[1].trim();
}

function normalizeVersion(rawVersion: string): string {
  const version = rawVersion.replace(/^v/, "");

  if (!semverPattern.test(version)) {
    throw new Error(`Invalid version: '${rawVersion}'. Expected SemVer, such as 0.1.0-rc.1.`);
  }

  return version;
}

const rawVersion = process.argv[2] ?? process.env.SPEC_VERSION ?? (await versionFromSpec());
const specVersion = normalizeVersion(rawVersion);
const sourceDir = join(repoRoot, "schemas");
const outputDir = join(repoRoot, "site", "spec", specVersion, "schemas");

await mkdir(outputDir, { recursive: true });

const sourceEntries = await readdir(sourceDir);
const schemaFiles = sourceEntries.filter((entry) => entry.endsWith(".json")).toSorted();

await Promise.all(
  schemaFiles.map(async (schemaFile) =>
    copyFile(join(sourceDir, schemaFile), join(outputDir, schemaFile)),
  ),
);

console.log(`Copied ${schemaFiles.length} schema artifacts to site/spec/${specVersion}/schemas/.`);
