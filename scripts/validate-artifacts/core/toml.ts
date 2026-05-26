import { assert } from "./assert.ts";
import {
  EMPTY_COUNT,
  FIRST_CONTENT_INDEX,
  HUMAN_LINE_NUMBER_OFFSET,
  INCREMENT_STEP,
  LAST_ITEM_OFFSET,
  TOML_ASSIGNMENT_MINIMUM_INDEX,
} from "./numeric-constants.ts";
import type { JsonObject, JsonValue } from "./types.ts";

function stripTomlComment(line: JsonValue): JsonValue {
  let inString = false;
  let escaped = false;
  for (let index = EMPTY_COUNT; index < line.length; index += INCREMENT_STEP) {
    const character = line[index];
    if (escaped) {
      escaped = false;
    } else if (character === "\\" && inString) {
      escaped = true;
    } else if (character === '"') {
      inString = !inString;
    } else if (character === "#" && !inString) {
      return line.slice(EMPTY_COUNT, index);
    }
  }
  return line;
}

function splitTomlArray(content: JsonValue): JsonValue[] {
  const items = [];
  let token = "";
  let inString = false;
  let escaped = false;
  for (const character of content) {
    if (escaped) {
      token += character;
      escaped = false;
    } else if (character === "\\" && inString) {
      token += character;
      escaped = true;
    } else if (character === '"') {
      token += character;
      inString = !inString;
    } else if (character === "," && !inString) {
      if (token.trim()) {
        items.push(token.trim());
      }
      token = "";
    } else {
      token += character;
    }
  }
  if (token.trim()) {
    items.push(token.trim());
  }
  return items;
}

function parseTomlKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed);
  }
  assert(/^[A-Za-z0-9_-]+$/.test(trimmed), `unsupported TOML key in fixture: ${trimmed}`);
  return trimmed;
}

function parseTomlScalar(value: string): JsonValue {
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
    const content = trimmed.slice(FIRST_CONTENT_INDEX, LAST_ITEM_OFFSET).trim();
    return content ? splitTomlArray(content).map((item: string) => parseTomlScalar(item)) : [];
  }
  throw new Error(`unsupported TOML scalar in fixture: ${trimmed}`);
}

function resolveTomlPath(rootObject: JsonObject, header: string, arrayTable: boolean): JsonObject {
  const pathParts = header.split(".").map((part: string) => parseTomlKey(part));
  let parent = rootObject;
  for (const part of pathParts.slice(EMPTY_COUNT, LAST_ITEM_OFFSET)) {
    parent[part] ??= {};
    assert(
      !Array.isArray(parent[part]),
      `unsupported nested TOML path below array table: ${header}`,
    );
    parent = parent[part];
  }
  const finalPart = pathParts[pathParts.length - FIRST_CONTENT_INDEX];
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
}

// Fixture-scoped TOML subset parser for deterministic authored-source vectors.
// It intentionally covers only the TOML shapes used by manifest-parse-cases.json;
// Conforming clients still need a real TOML v1.1.0 parser.
function parseFixtureTomlSubset(source: string, label: string): JsonObject {
  const parsed: JsonObject = {};
  let current = parsed;
  const lines = source.split(/\r?\n/);
  for (let lineNumber = EMPTY_COUNT; lineNumber < lines.length; lineNumber += INCREMENT_STEP) {
    const line = stripTomlComment(lines[lineNumber]).trim();
    if (line) {
      const arrayTableMatch = line.match(/^\[\[([^\]]+)\]\]$/);
      if (arrayTableMatch) {
        current = resolveTomlPath(parsed, arrayTableMatch[1], true);
      } else {
        const tableMatch = line.match(/^\[([^\]]+)\]$/);
        if (tableMatch) {
          current = resolveTomlPath(parsed, tableMatch[1], false);
        } else {
          const assignmentIndex = line.indexOf("=");
          assert(
            assignmentIndex > TOML_ASSIGNMENT_MINIMUM_INDEX,
            `${label} has unsupported TOML line ${lineNumber + HUMAN_LINE_NUMBER_OFFSET}: ${line}`,
          );
          const key = parseTomlKey(line.slice(EMPTY_COUNT, assignmentIndex));
          current[key] = parseTomlScalar(line.slice(assignmentIndex + FIRST_CONTENT_INDEX));
        }
      }
    }
  }
  return parsed;
}

export {
  parseFixtureTomlSubset,
  parseTomlKey,
  parseTomlScalar,
  resolveTomlPath,
  splitTomlArray,
  stripTomlComment,
};
