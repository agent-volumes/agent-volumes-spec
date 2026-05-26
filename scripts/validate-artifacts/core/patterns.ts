import {
  EMPTY_COUNT,
  HTTP_BAD_REQUEST,
  HTTP_CONFLICT,
  HTTP_FORBIDDEN,
  HTTP_GONE,
  HTTP_NOT_FOUND,
  HTTP_PAYLOAD_TOO_LARGE,
  HTTP_TOO_MANY_REQUESTS,
  HTTP_UNAUTHORIZED,
  HTTP_UNSUPPORTED_MEDIA_TYPE,
  INCREMENT_STEP,
} from "./numeric-constants.ts";

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
const problemStatusBySlug = new Map([
  ["authentication-required", HTTP_UNAUTHORIZED],
  ["authorization-failed", HTTP_FORBIDDEN],
  ["not-found", HTTP_NOT_FOUND],
  ["validation-failed", HTTP_BAD_REQUEST],
  ["invalid-manifest", HTTP_BAD_REQUEST],
  ["invalid-archive", HTTP_BAD_REQUEST],
  ["identity-mismatch", HTTP_CONFLICT],
  ["version-conflict", HTTP_CONFLICT],
  ["digest-mismatch", HTTP_BAD_REQUEST],
  ["subject-binding-mismatch", HTTP_BAD_REQUEST],
  ["inconsistent-registry-state", HTTP_CONFLICT],
  ["upload-expired", HTTP_GONE],
  ["missing-uploaded-bytes", HTTP_BAD_REQUEST],
  ["invalid-upload-state", HTTP_CONFLICT],
  ["idempotency-conflict", HTTP_CONFLICT],
  ["payload-too-large", HTTP_PAYLOAD_TOO_LARGE],
  ["unsupported-media-type", HTTP_UNSUPPORTED_MEDIA_TYPE],
  ["permission-escalation", HTTP_BAD_REQUEST],
  ["rate-limited", HTTP_TOO_MANY_REQUESTS],
]);

function isRecognizedSpdxExpressionShape(expression: string): boolean {
  const tokenPattern =
    /\(|\)|\+|\bAND\b|\bOR\b|\bWITH\b|LicenseRef-[A-Za-z0-9.-]+|[A-Za-z0-9][A-Za-z0-9.-]*/g;
  const tokens = expression.match(tokenPattern) ?? [];
  if (tokens.join("") !== expression.replace(/\s+/g, "")) {
    return false;
  }
  let expectOperand = true;
  let depth = 0;
  for (const token of tokens) {
    if (token === "(") {
      if (!expectOperand) {
        return false;
      }
      depth += INCREMENT_STEP;
    } else if (token === ")") {
      if (expectOperand || depth === EMPTY_COUNT) {
        return false;
      }
      depth -= INCREMENT_STEP;
    } else if (token === "AND" || token === "OR") {
      if (expectOperand) {
        return false;
      }
      expectOperand = true;
    } else if (token === "WITH") {
      if (expectOperand) {
        return false;
      }
      expectOperand = true;
    } else if (token === "+") {
      if (expectOperand) {
        return false;
      }
    } else if (!expectOperand) {
      return false;
    } else {
      expectOperand = false;
    }
  }
  return tokens.length > EMPTY_COUNT && depth === EMPTY_COUNT && !expectOperand;
}

export {
  componentNamePattern,
  coreExternalDependencyPurposes,
  digestPattern,
  externalDependencyDeclarationKeyPattern,
  externalDependencyPurposeExtensionPattern,
  gitCommitPattern,
  isRecognizedSpdxExpressionShape,
  problemStatusBySlug,
  problemTypePattern,
  semverPattern,
  shallowPurlPattern,
  shallowVersPattern,
  volumeNamePattern,
};
