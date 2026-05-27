import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);
const specVersionHeaderPattern = /^\*\*Version:\*\*\s+(.+)$/m;
const semverPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

function normalizeSpecVersion(rawVersion: string): string {
  const version = rawVersion.replace(/^v/, "");

  if (!semverPattern.test(version)) {
    throw new Error(`Invalid version: '${rawVersion}'. Expected SemVer, such as 0.1.0-rc.1.`);
  }

  return version;
}

function versionFromSpec(): string {
  const spec = readFileSync(join(repoRoot, "agent-volumes-spec.md"), "utf8");
  const match = specVersionHeaderPattern.exec(spec);

  if (!match?.[1]) {
    throw new Error('Could not find "**Version:** <version>" in agent-volumes-spec.md.');
  }

  return normalizeSpecVersion(match[1].trim());
}

function resolveSpecVersion(rawVersion?: string): string {
  return normalizeSpecVersion(rawVersion ?? process.env.SPEC_VERSION ?? versionFromSpec());
}

function getCurrentSpecVersion(): string {
  return versionFromSpec();
}

function getCurrentSpecVersionWithPrefix(): string {
  return `v${getCurrentSpecVersion()}`;
}

function getReleaseArchiveRoot(): string {
  return `site/spec/${getCurrentSpecVersion()}`;
}

function getSchemaIdPrefix(): string {
  return `https://agentvolumes.org/spec/${getCurrentSpecVersion()}/`;
}

export {
  getCurrentSpecVersion,
  getCurrentSpecVersionWithPrefix,
  getReleaseArchiveRoot,
  getSchemaIdPrefix,
  normalizeSpecVersion,
  resolveSpecVersion,
  versionFromSpec,
};
