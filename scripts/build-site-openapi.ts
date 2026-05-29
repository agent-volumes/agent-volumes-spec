#!/usr/bin/env bun

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveSpecVersion } from "./release-version.ts";
import { EXIT_FAILURE, EXIT_SUCCESS } from "./validate-artifacts/core/numeric-constants.ts";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);

function resolveCommand(command: string): string {
  const executable = process.platform === "win32" ? `${command}.cmd` : command;
  const localCommand = join(repoRoot, "node_modules", ".bin", executable);

  return existsSync(localCommand) ? localCommand : command;
}

function run(command: string, args: string[]): void {
  const result = spawnSync(resolveCommand(command), args, {
    cwd: repoRoot,
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== EXIT_SUCCESS) {
    process.exit(result.status ?? EXIT_FAILURE);
  }
}

const specVersion = resolveSpecVersion(process.argv[2]);
const outputPath = join("site", "spec", specVersion, "api-reference", "bibliotheca.openapi.json");

await mkdir(join(repoRoot, dirname(outputPath)), { recursive: true });

run("redocly", [
  "bundle",
  "openapi/bibliotheca.openapi.yaml",
  "--output",
  outputPath,
  "--ext",
  "json",
]);
run("prettier", ["--write", outputPath]);
