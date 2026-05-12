#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RESET='\033[0m'

error() {
  printf "%bError:%b %s\n" "${RED}" "${RESET}" "$1" >&2
  exit 1
}

info() {
  printf "%b→%b %s\n" "${GREEN}" "${RESET}" "$1"
}

warn() {
  printf "%bWarning:%b %s\n" "${YELLOW}" "${RESET}" "$1" >&2
}

git_cmd() {
  GIT_MASTER=1 git "$@"
}

usage() {
  cat <<'USAGE'
Usage: scripts/create-release-tag.sh <version> [options]

Create a signed annotated release tag for an Agent Volumes specification draft,
release candidate, or stable release.

Arguments:
  version              SemVer version, with or without leading "v"
                       (example: 0.1.0-draft.5 or v0.1.0-draft.5)

Options:
  --target <ref>       Git ref to tag (default: HEAD)
  --push              Push the tag to origin after local verification
  --no-push           Do not prompt to push the tag
  --edit              Open the generated tag message in $EDITOR before tagging
  --no-edit           Show the generated tag message but do not prompt to edit it
  --yes               Skip confirmation prompts; requires --push or --no-push
  --skip-checks       Skip release-freeze validation commands
  --allow-dirty       Allow a dirty working tree while tagging the target ref
  -h, --help          Show this help

Examples:
  scripts/create-release-tag.sh 0.1.0-draft.5 --edit --push
  bun run release:tag -- v0.1.0-draft.5 --no-edit --no-push
USAGE
}

VERSION_ARG=""
TARGET_REF="HEAD"
PUSH_MODE="prompt"
EDIT_MODE="prompt"
CONFIRM_MODE="prompt"
RUN_CHECKS=true
ALLOW_DIRTY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    --target)
      [[ $# -ge 2 ]] || error "--target requires a ref argument."
      TARGET_REF="$2"
      shift 2
      ;;
    --push)
      PUSH_MODE="yes"
      shift
      ;;
    --no-push)
      PUSH_MODE="no"
      shift
      ;;
    --edit)
      EDIT_MODE="yes"
      shift
      ;;
    --no-edit)
      EDIT_MODE="no"
      shift
      ;;
    --yes)
      CONFIRM_MODE="yes"
      shift
      ;;
    --skip-checks)
      RUN_CHECKS=false
      shift
      ;;
    --allow-dirty)
      ALLOW_DIRTY=true
      shift
      ;;
    --*)
      error "Unknown option: $1"
      ;;
    *)
      if [[ -n "${VERSION_ARG}" ]]; then
        error "Unexpected extra argument: $1"
      fi
      VERSION_ARG="$1"
      shift
      ;;
  esac
done

[[ -n "${VERSION_ARG}" ]] || { usage; exit 1; }

if [[ "${CONFIRM_MODE}" == "yes" && "${PUSH_MODE}" == "prompt" ]]; then
  error "--yes requires an explicit --push or --no-push decision."
fi

if ! git_cmd rev-parse --git-dir >/dev/null 2>&1; then
  error "Not a git repository. Run this script from within the repository."
fi

SPEC_VERSION="${VERSION_ARG#v}"
TAG_NAME="v${SPEC_VERSION}"
SEMVER_PATTERN='^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-((0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*)(\.(0|[1-9][0-9]*|[0-9]*[A-Za-z-][0-9A-Za-z-]*))*))?(\+([0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*))?$'

if [[ ! "${SPEC_VERSION}" =~ ${SEMVER_PATTERN} ]]; then
  error "Invalid version: '${VERSION_ARG}'. Expected SemVer, such as 0.1.0-draft.5."
fi

info "Preparing signed annotated tag: ${TAG_NAME}"

TARGET_COMMIT="$(git_cmd rev-parse --verify "${TARGET_REF}^{commit}")" || error "Cannot resolve target ref: ${TARGET_REF}"
TARGET_SUBJECT="$(git_cmd log -1 --format='%s' "${TARGET_COMMIT}")"

git_cmd fetch --tags origin >/dev/null 2>&1 || warn "Could not fetch tags from origin; continuing with local tag checks."

if git_cmd rev-parse -q --verify "refs/tags/${TAG_NAME}" >/dev/null; then
  error "Tag '${TAG_NAME}' already exists locally."
fi

if git_cmd ls-remote --exit-code --tags origin "refs/tags/${TAG_NAME}" >/dev/null 2>&1; then
  error "Tag '${TAG_NAME}' already exists on origin."
fi

if [[ "${ALLOW_DIRTY}" != "true" && -n "$(git_cmd status --porcelain)" ]]; then
  git_cmd status --short >&2
  error "Working tree is dirty. Commit or stash changes, or pass --allow-dirty to tag ${TARGET_REF} anyway."
fi

if ! grep -q "\*\*Version:\*\* ${SPEC_VERSION}" agent-volumes-spec.md; then
  error "agent-volumes-spec.md does not declare '**Version:** ${SPEC_VERSION}'."
fi

if ! grep -R -q "https://agentvolumes.org/spec/${SPEC_VERSION}/schemas/" schemas; then
  error "schemas/ does not contain schema IDs for spec version ${SPEC_VERSION}."
fi

if grep -q '| pending |' openapi/PROSE-DRIFT-AUDIT.md; then
  warn "openapi/PROSE-DRIFT-AUDIT.md still contains pending release-freeze rows."
fi

SIGNING_KEY="$(git_cmd config --get user.signingkey || true)"
GPG_FORMAT="$(git_cmd config --get gpg.format || true)"

if [[ -z "${SIGNING_KEY}" ]]; then
  error "Git user.signingkey is not configured; signed tags are required."
fi

if [[ -z "${GPG_FORMAT}" || "${GPG_FORMAT}" == "openpgp" ]]; then
  if ! gpg --list-secret-keys "${SIGNING_KEY}" >/dev/null 2>&1; then
    error "Git signing key '${SIGNING_KEY}' was not found in the local GPG secret keyring."
  fi
  info "GPG signing key found: ${SIGNING_KEY}"
else
  info "Git signing format is '${GPG_FORMAT}'; git will use the configured signing backend."
fi

CHECK_SUMMARY="not run (--skip-checks)"
if [[ "${RUN_CHECKS}" == "true" ]]; then
  info "Running release-freeze validation commands."
  bun run changelog:check
  bun run format:check
  bun run lint:md
  bun run lint:openapi
  bun run validate:artifacts
  CHECK_SUMMARY="format:check, lint:md, lint:openapi, validate:artifacts passed"
fi

CHANGELOG_SECTION="$(python3 - "${SPEC_VERSION}" <<'PY'
import re
import sys
from pathlib import Path

version = sys.argv[1]
path = Path('CHANGELOG.md')
if not path.exists():
    raise SystemExit('CHANGELOG.md does not exist')

text = path.read_text(encoding='utf-8')
pattern = re.compile(rf"^## \[{re.escape(version)}\].*?(?=^## \[|\Z)", re.MULTILINE | re.DOTALL)
match = pattern.search(text)
if not match:
    raise SystemExit(f'CHANGELOG.md does not contain a [{version}] section')

section = match.group(0).strip()
if 'raw git' in section.lower():
    raise SystemExit(f'CHANGELOG.md [{version}] section still appears uncurated')

print(section)
PY
)" || error "CHANGELOG.md must contain a curated [${SPEC_VERSION}] release entry before tagging."

TAG_MESSAGE="Agent Volumes Specification ${TAG_NAME}

Spec Version: ${SPEC_VERSION}
Release Type: Draft release
Status: Working Draft; suitable for coordinated prototype implementations
Date: $(date -u +%Y-%m-%d)
Target Commit: ${TARGET_COMMIT}
Target Subject: ${TARGET_SUBJECT}
Verification: ${CHECK_SUMMARY}

CHANGELOG.md entry
${CHANGELOG_SECTION}

Notes:
- This tag fixes the ${TAG_NAME} specification snapshot.
- Future draft, release-candidate, or stable releases are separate release lines.
- The normative release surface is the prose specification plus version-aligned schemas, OpenAPI contract, and conformance fixtures."

TAG_MESSAGE_FILE="$(mktemp)"
trap 'rm -f "${TAG_MESSAGE_FILE}"' EXIT
printf '%s\n' "${TAG_MESSAGE}" > "${TAG_MESSAGE_FILE}"

print_summary() {
  printf "\n==================================\n"
  printf "Tag:        %s\n" "${TAG_NAME}"
  printf "Version:    %s\n" "${SPEC_VERSION}"
  printf "Target:     %s\n" "${TARGET_COMMIT}"
  printf "Signed:     yes\n"
  printf "Checks:     %s\n" "${CHECK_SUMMARY}"
  printf "Last tag:   %s\n" "${LAST_TAG:-none}"
  printf "Push mode:  %s\n" "${PUSH_MODE}"
  printf "==================================\n\n"
}

print_message_preview() {
  printf "Tag message preview:\n"
  printf '%s\n' '---'
  cat "${TAG_MESSAGE_FILE}"
  printf '%s\n\n' '---'
}

print_summary
print_message_preview

if [[ "${EDIT_MODE}" == "prompt" ]]; then
  printf "\nEdit tag message before creating '${TAG_NAME}'? [y/N] "
  read -r EDIT_CONFIRM
  if [[ "${EDIT_CONFIRM}" == "y" || "${EDIT_CONFIRM}" == "Y" ]]; then
    EDIT_MODE="yes"
  else
    EDIT_MODE="no"
  fi
fi

if [[ "${EDIT_MODE}" == "yes" ]]; then
  "${EDITOR:-vi}" "${TAG_MESSAGE_FILE}"
  info "Tag message updated from editor."
  print_summary
  print_message_preview
fi

if [[ "${CONFIRM_MODE}" != "yes" ]]; then
  printf "Create signed tag '${TAG_NAME}'? [y/N] "
  read -r CREATE_CONFIRM
  if [[ "${CREATE_CONFIRM}" != "y" && "${CREATE_CONFIRM}" != "Y" ]]; then
    info "Aborted. No tag was created."
    exit 0
  fi
fi

git_cmd tag -s "${TAG_NAME}" "${TARGET_COMMIT}" -F "${TAG_MESSAGE_FILE}"
git_cmd tag -v "${TAG_NAME}"
info "Tag '${TAG_NAME}' created and signature verified locally."

if [[ "${PUSH_MODE}" == "prompt" ]]; then
  printf "Push tag '${TAG_NAME}' to origin? [y/N] "
  read -r PUSH_CONFIRM
  if [[ "${PUSH_CONFIRM}" == "y" || "${PUSH_CONFIRM}" == "Y" ]]; then
    PUSH_MODE="yes"
  else
    PUSH_MODE="no"
  fi
fi

if [[ "${PUSH_MODE}" == "yes" ]]; then
  git_cmd push origin "${TAG_NAME}"
  info "Tag '${TAG_NAME}' pushed to origin."
else
  info "Tag '${TAG_NAME}' created locally but not pushed."
  printf "  To push later: GIT_MASTER=1 git push origin %s\n" "${TAG_NAME}"
fi

printf "\nDone.\n"
