import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { JsonValue } from "./types.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const readJsonPaths = new Set<string>();

function normalizeRelativePath(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}

function readJsonFile(relativePath: string): JsonValue {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
}

function readJson(relativePath: string): JsonValue {
  readJsonPaths.add(normalizeRelativePath(relativePath));
  return readJsonFile(relativePath);
}

function readText(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function pathExists(relativePath: string): boolean {
  return fs.existsSync(path.join(root, relativePath));
}

function isDirectory(relativePath: string): boolean {
  return fs.statSync(path.join(root, relativePath)).isDirectory();
}

export { isDirectory, pathExists, readJson, readJsonFile, readJsonPaths, readText, root };
