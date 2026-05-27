#!/usr/bin/env bun

import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveSpecVersion } from "./release-version.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);

const specVersion = resolveSpecVersion(process.argv[2]);
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
