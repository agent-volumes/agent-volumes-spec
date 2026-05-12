#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

RED='\033[0;31m'
GREEN='\033[0;32m'
RESET='\033[0m'

error() {
  printf "%bError:%b %s\n" "${RED}" "${RESET}" "$1" >&2
  exit 1
}

info() {
  printf "%b→%b %s\n" "${GREEN}" "${RESET}" "$1"
}

usage() {
  cat <<'USAGE'
Usage: scripts/update-changelog.sh [options]

Generate or check CHANGELOG.md with git-cliff. Generated output is a draft:
maintainers must review and curate entries before a release tag is created.

Options:
  --tag <version>      Render unreleased changes as a specific version heading
                       (example: v0.1.0-draft.6)
  --check              Fail if generated output differs from CHANGELOG.md
  --print              Print generated output instead of writing CHANGELOG.md
  -h, --help           Show this help

Examples:
  scripts/update-changelog.sh
  scripts/update-changelog.sh --tag v0.1.0-draft.6
  scripts/update-changelog.sh --check
USAGE
}

TAG_ARG=""
CHECK_MODE=false
PRINT_MODE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --tag)
      [[ $# -ge 2 ]] || error "--tag requires a version argument."
      TAG_ARG="$2"
      shift 2
      ;;
    --check)
      CHECK_MODE=true
      shift
      ;;
    --print)
      PRINT_MODE=true
      shift
      ;;
    --*)
      error "Unknown option: $1"
      ;;
    *)
      error "Unexpected argument: $1"
      ;;
  esac
done

if [[ "${CHECK_MODE}" == "true" && "${PRINT_MODE}" == "true" ]]; then
  error "--check and --print cannot be combined."
fi

if command -v git-cliff >/dev/null 2>&1; then
  GIT_CLIFF=(git-cliff)
elif [[ -x "node_modules/.bin/git-cliff" ]]; then
  GIT_CLIFF=(node_modules/.bin/git-cliff)
else
  error "git-cliff is not installed. Run 'bun install' or install git-cliff locally."
fi

CLI_ARGS=(--config cliff.toml)
if [[ -n "${TAG_ARG}" ]]; then
  CLI_ARGS+=(--unreleased --tag "${TAG_ARG}")
fi

if [[ "${PRINT_MODE}" == "true" ]]; then
  "${GIT_CLIFF[@]}" "${CLI_ARGS[@]}"
  exit 0
fi

if [[ "${CHECK_MODE}" == "true" ]]; then
  python3 <<'PY'
import os
import re
import subprocess
from pathlib import Path

path = Path('CHANGELOG.md')
if not path.exists():
    raise SystemExit('CHANGELOG.md does not exist. Run scripts/update-changelog.sh first.')

text = path.read_text(encoding='utf-8')
required_fragments = [
    '# Changelog',
    'Keep a Changelog',
    'Semantic Versioning',
    '## [Unreleased]',
]
for fragment in required_fragments:
    if fragment not in text:
        raise SystemExit(f'CHANGELOG.md is missing required fragment: {fragment}')

env = dict(os.environ)
env['GIT_MASTER'] = '1'
tags = subprocess.check_output(
    ['git', 'tag', '--list', 'v[0-9]*', '--sort=creatordate'],
    env=env,
    text=True,
).splitlines()
for tag in tags:
    version = tag.removeprefix('v')
    if not re.search(rf'^## \[{re.escape(version)}\]', text, re.MULTILINE):
        raise SystemExit(f'CHANGELOG.md is missing release section for {version}')

if re.search(r'git log|raw git history|raw commit', text, re.IGNORECASE):
    raise SystemExit('CHANGELOG.md appears to contain raw-history placeholder wording')

for heading in re.findall(r'^## \[[^\]]+\] - .+$', text, re.MULTILINE):
    if not re.fullmatch(r'## \[[^\]]+\] - 1\d{4}-\d{2}-\d{2} HE', heading):
        raise SystemExit(
            'CHANGELOG.md release headings must use Human Era dates, '
            f'for example 12026-05-12 HE: {heading}'
        )
PY
  info "CHANGELOG.md structure is valid for tracked release tags."
  exit 0
fi

"${GIT_CLIFF[@]}" "${CLI_ARGS[@]}" --output CHANGELOG.md
info "CHANGELOG.md generated. Review and curate it before release."
