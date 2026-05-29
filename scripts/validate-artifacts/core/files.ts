import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { JsonValue } from "./types.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const readJsonPaths = new Set<string>();
const jsonValuePaths = new WeakMap<object, string>();

function normalizeRelativePath(relativePath: string): string {
  return relativePath.split(path.sep).join("/");
}

function isConformanceJsonPath(relativePath: string): boolean {
  return relativePath.startsWith("conformance/") && relativePath.endsWith(".json");
}

function markJsonValuePath(value: JsonValue, relativePath: string): void {
  if (!value || typeof value !== "object") {
    return;
  }
  jsonValuePaths.set(value, relativePath);
  for (const nestedValue of Object.values(value)) {
    markJsonValuePath(nestedValue, relativePath);
  }
}

function readJsonUnchecked(relativePath: string): JsonValue {
  const value = JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  markJsonValuePath(value, relativePath);
  return value;
}

function readJsonFile(relativePath: string): JsonValue {
  const normalizedPath = normalizeRelativePath(relativePath);
  if (isConformanceJsonPath(normalizedPath)) {
    throw new Error(`${normalizedPath} must be read through ctx.readJson()`);
  }
  return readJsonUnchecked(relativePath);
}

function readJson(relativePath: string): JsonValue {
  const normalizedPath = normalizeRelativePath(relativePath);
  readJsonPaths.add(normalizedPath);
  return readJsonUnchecked(normalizedPath);
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

export {
  isDirectory,
  jsonValuePaths,
  pathExists,
  readJson,
  readJsonFile,
  readJsonPaths,
  readText,
  root,
};
