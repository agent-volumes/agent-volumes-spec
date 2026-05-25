#!/usr/bin/env bun
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = dirname(scriptDir);

const semverPattern =
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-((0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(\.(0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(\+([0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*))?$/;

function run(command: string, args: string[]): void {
  const result = spawnSync(resolveCommand(command), args, {
    cwd: repoRoot,
    env: process.env,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function resolveCommand(command: string): string {
  const executable = process.platform === 'win32' ? `${command}.cmd` : command;
  const localCommand = join(repoRoot, 'node_modules', '.bin', executable);

  return existsSync(localCommand) ? localCommand : command;
}

async function versionFromSpec(): Promise<string> {
  const specPath = join(repoRoot, 'agent-volumes-spec.md');
  const spec = await readFile(specPath, 'utf8');
  const match = /^\*\*Version:\*\*\s+(.+)$/m.exec(spec);

  if (!match?.[1]) {
    throw new Error('Could not find "**Version:** <version>" in agent-volumes-spec.md.');
  }

  return match[1].trim();
}

function normalizeVersion(rawVersion: string): string {
  const version = rawVersion.replace(/^v/, '');

  if (!semverPattern.test(version)) {
    throw new Error(`Invalid version: '${rawVersion}'. Expected SemVer, such as 0.1.0-rc.1.`);
  }

  return version;
}

const rawVersion = process.argv[2] ?? process.env.SPEC_VERSION ?? (await versionFromSpec());
const specVersion = normalizeVersion(rawVersion);
const outputPath = join('site', 'spec', specVersion, 'api-reference', 'bibliotheca.openapi.json');

await mkdir(join(repoRoot, dirname(outputPath)), { recursive: true });

run('redocly', ['bundle', 'openapi/bibliotheca.openapi.yaml', '--output', outputPath, '--ext', 'json']);
run('prettier', ['--write', outputPath]);
