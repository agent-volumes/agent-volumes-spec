import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { JsonValue } from "./types.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const readJsonPaths = new Set<string>();

const normalizeRelativePath = (relativePath: string): string =>
  relativePath.split(path.sep).join("/");

const readJsonFile = (relativePath: string): JsonValue =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

const readJson = (relativePath: string): JsonValue => {
  readJsonPaths.add(normalizeRelativePath(relativePath));
  return readJsonFile(relativePath);
};

const readText = (relativePath: string): string =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

const pathExists = (relativePath: string): boolean => fs.existsSync(path.join(root, relativePath));

const isDirectory = (relativePath: string): boolean =>
  fs.statSync(path.join(root, relativePath)).isDirectory();

export { isDirectory, pathExists, readJson, readJsonFile, readJsonPaths, readText, root };
