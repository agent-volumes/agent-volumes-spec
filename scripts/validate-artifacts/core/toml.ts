import { assert } from "./assert.ts";
import type { JsonObject, JsonValue } from "./types.ts";

const stripTomlComment = (line: JsonValue) => {
  let inString = false;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\" && inString) {
      escaped = true;
      continue;
    }
    if (character === '"') {
      inString = !inString;
      continue;
    }
    if (character === "#" && !inString) {
      return line.slice(0, index);
    }
  }
  return line;
};

const splitTomlArray = (content: JsonValue) => {
  const items = [];
  let token = "";
  let inString = false;
  let escaped = false;
  for (const character of content) {
    if (escaped) {
      token += character;
      escaped = false;
      continue;
    }
    if (character === "\\" && inString) {
      token += character;
      escaped = true;
      continue;
    }
    if (character === '"') {
      token += character;
      inString = !inString;
      continue;
    }
    if (character === "," && !inString) {
      if (token.trim()) {
        items.push(token.trim());
      }
      token = "";
      continue;
    }
    token += character;
  }
  if (token.trim()) {
    items.push(token.trim());
  }
  return items;
};

const parseTomlKey = (key: string): string => {
  const trimmed = key.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed);
  }
  assert(/^[A-Za-z0-9_-]+$/.test(trimmed), `unsupported TOML key in fixture: ${trimmed}`);
  return trimmed;
};

const parseTomlScalar = (value: string): JsonValue => {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed);
  }
  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  if (/^-?(?:0|[1-9]\d*)$/.test(trimmed)) {
    return Number(trimmed);
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const content = trimmed.slice(1, -1).trim();
    return content ? splitTomlArray(content).map((item: string) => parseTomlScalar(item)) : [];
  }
  throw new Error(`unsupported TOML scalar in fixture: ${trimmed}`);
};

const resolveTomlPath = (
  rootObject: JsonObject,
  header: string,
  arrayTable: boolean,
): JsonObject => {
  const pathParts = header.split(".").map((part: string) => parseTomlKey(part));
  let parent = rootObject;
  for (const part of pathParts.slice(0, -1)) {
    parent[part] ??= {};
    assert(
      !Array.isArray(parent[part]),
      `unsupported nested TOML path below array table: ${header}`,
    );
    parent = parent[part];
  }
  const finalPart = pathParts[pathParts.length - 1];
  assert(finalPart, `unsupported empty TOML path in fixture: ${header}`);
  if (arrayTable) {
    parent[finalPart] ??= [];
    assert(
      Array.isArray(parent[finalPart]),
      `TOML array table conflicts with singleton table: ${header}`,
    );
    const item: JsonObject = {};
    parent[finalPart].push(item);
    return item;
  }
  parent[finalPart] ??= {};
  assert(
    !Array.isArray(parent[finalPart]),
    `TOML singleton table conflicts with array table: ${header}`,
  );
  return parent[finalPart];
};

// Fixture-scoped TOML subset parser for deterministic authored-source vectors.
// It intentionally covers only the TOML shapes used by manifest-parse-cases.json;
// Conforming clients still need a real TOML v1.1.0 parser.
const parseFixtureTomlSubset = (source: string, label: string): JsonObject => {
  const parsed: JsonObject = {};
  let current = parsed;
  const lines = source.split(/\r?\n/);
  for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
    const line = stripTomlComment(lines[lineNumber]).trim();
    if (!line) {
      continue;
    }
    const arrayTableMatch = line.match(/^\[\[([^\]]+)\]\]$/);
    if (arrayTableMatch) {
      current = resolveTomlPath(parsed, arrayTableMatch[1], true);
      continue;
    }
    const tableMatch = line.match(/^\[([^\]]+)\]$/);
    if (tableMatch) {
      current = resolveTomlPath(parsed, tableMatch[1], false);
      continue;
    }
    const assignmentIndex = line.indexOf("=");
    assert(assignmentIndex > 0, `${label} has unsupported TOML line ${lineNumber + 1}: ${line}`);
    const key = parseTomlKey(line.slice(0, assignmentIndex));
    current[key] = parseTomlScalar(line.slice(assignmentIndex + 1));
  }
  return parsed;
};

export {
  parseFixtureTomlSubset,
  parseTomlKey,
  parseTomlScalar,
  resolveTomlPath,
  splitTomlArray,
  stripTomlComment,
};
