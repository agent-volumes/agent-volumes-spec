import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { JsonValue } from "./types.ts";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export const readJsonPaths = new Set<string>();

const normalizeRelativePath = (relativePath: string): string =>
  relativePath.split(path.sep).join("/");

export const readJsonFile = (relativePath: string): JsonValue =>
  JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));

export const readJson = (relativePath: string): JsonValue => {
  readJsonPaths.add(normalizeRelativePath(relativePath));
  return readJsonFile(relativePath);
};

export const readText = (relativePath: string): string =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

export const pathExists = (relativePath: string): boolean =>
  fs.existsSync(path.join(root, relativePath));

export const isDirectory = (relativePath: string): boolean =>
  fs.statSync(path.join(root, relativePath)).isDirectory();
