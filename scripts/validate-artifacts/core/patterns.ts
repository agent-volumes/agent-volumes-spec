export const volumeNamePattern =
  /^(@(?!.*--)[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?\/)?(?!.*--)[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/;
export const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
export const digestPattern = /^sha256:[a-f0-9]{64}$/;
export const externalDependencyDeclarationKeyPattern = /^av-extdep-v1:sha256:[a-f0-9]{64}$/;
export const gitCommitPattern = /^[a-f0-9]{40}$/;
export const componentNamePattern = /^(?!.*--)[a-z0-9](?:[a-z0-9-]{0,126}[a-z0-9])?$/;
export const shallowPurlPattern = /^pkg:([A-Za-z][A-Za-z0-9.+-]*)\/(.+)$/;
export const shallowVersPattern = /^vers:([A-Za-z][A-Za-z0-9.-]*)\/(\S+)$/;
export const coreExternalDependencyPurposes = new Set([
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
export const externalDependencyPurposeExtensionPattern =
  /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+:[a-z][a-z0-9-]*$/;
export const problemTypePattern = /^https:\/\/agentvolumes\.org\/problems\/[a-z0-9-]+$/;
export const problemStatusBySlug = new Map([
  ["authentication-required", 401],
  ["authorization-failed", 403],
  ["not-found", 404],
  ["validation-failed", 400],
  ["invalid-manifest", 400],
  ["invalid-archive", 400],
  ["identity-mismatch", 409],
  ["version-conflict", 409],
  ["digest-mismatch", 400],
  ["subject-binding-mismatch", 400],
  ["inconsistent-registry-state", 409],
  ["upload-expired", 410],
  ["missing-uploaded-bytes", 400],
  ["invalid-upload-state", 409],
  ["idempotency-conflict", 409],
  ["payload-too-large", 413],
  ["unsupported-media-type", 415],
  ["permission-escalation", 400],
  ["rate-limited", 429],
]);

export const isRecognizedSpdxExpressionShape = (expression: string) => {
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
      depth += 1;
      continue;
    }
    if (token === ")") {
      if (expectOperand || depth === 0) {
        return false;
      }
      depth -= 1;
      continue;
    }
    if (token === "AND" || token === "OR") {
      if (expectOperand) {
        return false;
      }
      expectOperand = true;
      continue;
    }
    if (token === "WITH") {
      if (expectOperand) {
        return false;
      }
      expectOperand = true;
      continue;
    }
    if (token === "+") {
      if (expectOperand) {
        return false;
      }
      continue;
    }
    if (!expectOperand) {
      return false;
    }
    expectOperand = false;
  }
  return tokens.length > 0 && depth === 0 && !expectOperand;
};
