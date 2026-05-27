import { EMPTY_COUNT, INCREMENT_STEP } from "./numeric-constants.ts";

const volumeNamePattern =
  /^(@(?!.*--)[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\/)?(?!.*--)[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/;
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const digestPattern = /^sha256:[a-f0-9]{64}$/;
const externalDependencyDeclarationKeyPattern = /^av-extdep-v1:sha256:[a-f0-9]{64}$/;
const gitCommitPattern = /^[a-f0-9]{40}$/;
const componentNamePattern = /^(?!.*--)[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/;
const shallowPurlPattern = /^pkg:([A-Za-z][A-Za-z0-9.+-]*)\/(.+)$/;
const shallowVersPattern = /^vers:([A-Za-z][A-Za-z0-9.-]*)\/(\S+)$/;
const coreExternalDependencyPurposes = new Set([
  "runtime",
  "build",
  "development",
  "test",
  "optional",
  "peer",
  "source",
  "documentation",
  "other",
]);
const externalDependencyPurposeExtensionPattern =
  /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+:[a-z][a-z0-9-]*$/;
const problemTypePattern = /^https:\/\/agentvolumes\.org\/problems\/[a-z0-9-]+$/;

interface SpdxExpressionState {
  expectOperand: boolean;
  depth: number;
}

function hasOnlyRecognizedSpdxTokens(expression: string, tokens: string[]): boolean {
  return tokens.join("") === expression.replace(/\s+/g, "");
}

function parseSpdxOpenParen(state: SpdxExpressionState): boolean {
  if (!state.expectOperand) {
    return false;
  }
  state.depth += INCREMENT_STEP;
  return true;
}

function parseSpdxCloseParen(state: SpdxExpressionState): boolean {
  if (state.expectOperand || state.depth === EMPTY_COUNT) {
    return false;
  }
  state.depth -= INCREMENT_STEP;
  return true;
}

function parseSpdxOperator(state: SpdxExpressionState): boolean {
  if (state.expectOperand) {
    return false;
  }
  state.expectOperand = true;
  return true;
}

function parseSpdxOperand(state: SpdxExpressionState): boolean {
  if (!state.expectOperand) {
    return false;
  }
  state.expectOperand = false;
  return true;
}

function parseSpdxExpressionToken(state: SpdxExpressionState, token: string): boolean {
  if (token === "(") {
    return parseSpdxOpenParen(state);
  }
  if (token === ")") {
    return parseSpdxCloseParen(state);
  }
  if (token === "AND" || token === "OR" || token === "WITH") {
    return parseSpdxOperator(state);
  }
  if (token === "+") {
    return !state.expectOperand;
  }
  return parseSpdxOperand(state);
}

function parseSpdxExpressionTokens(tokens: string[]): boolean {
  const state: SpdxExpressionState = { depth: EMPTY_COUNT, expectOperand: true };
  for (const token of tokens) {
    if (!parseSpdxExpressionToken(state, token)) {
      return false;
    }
  }
  return tokens.length > EMPTY_COUNT && state.depth === EMPTY_COUNT && !state.expectOperand;
}

function isRecognizedSpdxExpressionShape(expression: string): boolean {
  const tokenPattern =
    /\(|\)|\+|\bAND\b|\bOR\b|\bWITH\b|LicenseRef-[A-Za-z0-9.-]+|[A-Za-z0-9][A-Za-z0-9.-]*/g;
  const tokens = expression.match(tokenPattern) ?? [];
  return hasOnlyRecognizedSpdxTokens(expression, tokens) && parseSpdxExpressionTokens(tokens);
}

export {
  componentNamePattern,
  coreExternalDependencyPurposes,
  digestPattern,
  externalDependencyDeclarationKeyPattern,
  externalDependencyPurposeExtensionPattern,
  gitCommitPattern,
  isRecognizedSpdxExpressionShape,
  problemTypePattern,
  semverPattern,
  shallowPurlPattern,
  shallowVersPattern,
  volumeNamePattern,
};
