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

const PROTOTYPE_POLLUTING_TOML_KEYS = new Set(["__proto__", "constructor", "prototype"]);

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

interface TomlTokenState {
  token: string;
  inString: boolean;
  escaped: boolean;
}

function createTomlTokenState(): TomlTokenState {
  return { escaped: false, inString: false, token: "" };
}

function appendEscapedTomlCharacter(state: TomlTokenState, character: string): void {
  state.token += character;
  state.escaped = false;
}

function beginEscapedTomlCharacter(state: TomlTokenState, character: string): void {
  state.token += character;
  state.escaped = true;
}

function toggleTomlStringToken(state: TomlTokenState, character: string): void {
  state.token += character;
  state.inString = !state.inString;
}

function appendTomlArrayToken(items: JsonValue[], state: TomlTokenState): void {
  if (state.token.trim()) {
    items.push(state.token.trim());
  }
  state.token = "";
}

function consumeTomlArrayCharacter(
  items: JsonValue[],
  state: TomlTokenState,
  character: string,
): void {
  if (state.escaped) {
    appendEscapedTomlCharacter(state, character);
  } else if (character === "\\" && state.inString) {
    beginEscapedTomlCharacter(state, character);
  } else if (character === '"') {
    toggleTomlStringToken(state, character);
  } else if (character === "," && !state.inString) {
    appendTomlArrayToken(items, state);
  } else {
    state.token += character;
  }
}

function splitTomlArray(content: JsonValue): JsonValue[] {
  const items: JsonValue[] = [];
  const state = createTomlTokenState();
  for (const character of content) {
    consumeTomlArrayCharacter(items, state, character);
  }
  appendTomlArrayToken(items, state);
  return items;
}

function parseTomlKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    const parsed: unknown = JSON.parse(trimmed);
    assert(typeof parsed === "string", `unsupported TOML key in fixture: ${trimmed}`);
    assert(
      !PROTOTYPE_POLLUTING_TOML_KEYS.has(parsed),
      `unsupported prototype-polluting TOML key in fixture: ${parsed}`,
    );
    return parsed;
  }
  assert(/^[A-Za-z0-9_-]+$/.test(trimmed), `unsupported TOML key in fixture: ${trimmed}`);
  assert(
    !PROTOTYPE_POLLUTING_TOML_KEYS.has(trimmed),
    `unsupported prototype-polluting TOML key in fixture: ${trimmed}`,
  );
  return trimmed;
}

function isTomlStringScalar(value: string): boolean {
  return value.startsWith('"') && value.endsWith('"');
}

function parseTomlStringScalar(value: string): JsonValue {
  return JSON.parse(value);
}

function isTomlBooleanScalar(value: string): boolean {
  return value === "true" || value === "false";
}

function parseTomlBooleanScalar(value: string): boolean {
  return value === "true";
}

function isTomlIntegerScalar(value: string): boolean {
  return /^-?(?:0|[1-9]\d*)$/.test(value);
}

function parseTomlIntegerScalar(value: string): number {
  return Number(value);
}

function isTomlArrayScalar(value: string): boolean {
  return value.startsWith("[") && value.endsWith("]");
}

function parseTomlArrayScalar(value: string, parseItem: (item: string) => JsonValue): JsonValue[] {
  const content = value.slice(FIRST_CONTENT_INDEX, LAST_ITEM_OFFSET).trim();
  if (content) {
    return splitTomlArray(content).map((item: string) => parseItem(item));
  }
  return [];
}

function parseTomlScalar(value: string): JsonValue {
  const trimmed = value.trim();
  if (isTomlStringScalar(trimmed)) {
    return parseTomlStringScalar(trimmed);
  }
  if (isTomlBooleanScalar(trimmed)) {
    return parseTomlBooleanScalar(trimmed);
  }
  if (isTomlIntegerScalar(trimmed)) {
    return parseTomlIntegerScalar(trimmed);
  }
  if (isTomlArrayScalar(trimmed)) {
    return parseTomlArrayScalar(trimmed, parseTomlScalar);
  }
  throw new Error(`unsupported TOML scalar in fixture: ${trimmed}`);
}

function resolveTomlParentPath(
  rootObject: JsonObject,
  header: string,
  pathParts: string[],
): JsonObject {
  let parent = rootObject;
  for (const part of pathParts.slice(EMPTY_COUNT, LAST_ITEM_OFFSET)) {
    parent[part] ??= {};
    assert(
      !Array.isArray(parent[part]),
      `unsupported nested TOML path below array table: ${header}`,
    );
    parent = parent[part];
  }
  return parent;
}

function resolveTomlArrayTable(parent: JsonObject, header: string, finalPart: string): JsonObject {
  parent[finalPart] ??= [];
  assert(
    Array.isArray(parent[finalPart]),
    `TOML array table conflicts with singleton table: ${header}`,
  );
  const item: JsonObject = {};
  parent[finalPart].push(item);
  return item;
}

function resolveTomlSingletonTable(
  parent: JsonObject,
  header: string,
  finalPart: string,
): JsonObject {
  parent[finalPart] ??= {};
  assert(
    !Array.isArray(parent[finalPart]),
    `TOML singleton table conflicts with array table: ${header}`,
  );
  return parent[finalPart];
}

function resolveTomlPath(rootObject: JsonObject, header: string, arrayTable: boolean): JsonObject {
  const pathParts = header.split(".").map((part: string) => parseTomlKey(part));
  const parent = resolveTomlParentPath(rootObject, header, pathParts);
  const finalPart = pathParts[pathParts.length - FIRST_CONTENT_INDEX];
  assert(finalPart, `unsupported empty TOML path in fixture: ${header}`);
  return arrayTable
    ? resolveTomlArrayTable(parent, header, finalPart)
    : resolveTomlSingletonTable(parent, header, finalPart);
}

interface TomlLineParseOptions {
  parsed: JsonObject;
  current: JsonObject;
  line: string;
  lineContext: TomlLineContext;
}

interface TomlLineContext {
  label: string;
  lineNumber: number;
}

function parseTomlAssignment(
  current: JsonObject,
  line: string,
  lineContext: TomlLineContext,
): void {
  const assignmentIndex = line.indexOf("=");
  assert(
    assignmentIndex > TOML_ASSIGNMENT_MINIMUM_INDEX,
    `${lineContext.label} has unsupported TOML line ${
      lineContext.lineNumber + HUMAN_LINE_NUMBER_OFFSET
    }: ${line}`,
  );
  const key = parseTomlKey(line.slice(EMPTY_COUNT, assignmentIndex));
  current[key] = parseTomlScalar(line.slice(assignmentIndex + FIRST_CONTENT_INDEX));
}

function parseTomlLine({ parsed, current, line, lineContext }: TomlLineParseOptions): JsonObject {
  const arrayTableMatch = /^\[\[([^\]]+)\]\]$/.exec(line);
  const arrayTableHeader = arrayTableMatch?.[1];
  if (arrayTableHeader) {
    return resolveTomlPath(parsed, arrayTableHeader, true);
  }
  const tableMatch = /^\[([^\]]+)\]$/.exec(line);
  const tableHeader = tableMatch?.[1];
  if (tableHeader) {
    return resolveTomlPath(parsed, tableHeader, false);
  }
  parseTomlAssignment(current, line, lineContext);
  return current;
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
      current = parseTomlLine({ current, line, lineContext: { label, lineNumber }, parsed });
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
