# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-10T21:30:13Z
**Commit:** f52b0ca
**Branch:** docs/draft-5-readiness-cleanup

## OVERVIEW

Agent Volumes specification repository — a **standards/spec repo**, not an application codebase. Prose specification (`agent-volumes-spec.md`) is the normative authority, accompanied by machine-readable JSON schemas, OpenAPI contract, conformance fixtures, and architecture decision records (ADRs).

When working in this repository, always consult the organization template repository [`agent-volumes/.github`](https://github.com/agent-volumes/.github) for authoritative guidelines and policies that may not be reflected in this repo's own files.

Before making changes—especially to CI/CD workflows, security-related configurations, or contribution processes—check the following documents in [`agent-volumes/.github`](https://github.com/agent-volumes/.github):

- **README.md**: Organization-wide reusable workflows, their interfaces, and consumer usage patterns.
- **SECURITY.md**: Supply chain integrity requirements, vulnerability reporting procedures, and security policy.
- **CONTRIBUTING.md**: Contribution boundaries, development expectations, and CI/CD requirements (e.g., SHA-pinned actions, harden-runner, job-level permissions).
- **CODE_OF_CONDUCT.md**: Behavioral expectations for community participation.

## Key Policy Notes

- **Reusable workflows**: The organization provides centralized reusable workflows for Scorecard, Dependency Review, and OSV Scanner. Prefer using these over inline implementations.
- **SHA pinning exception**: Reusable workflows from `agent-volumes/.github` are the sole exception to the organization's SHA-pinning requirement; they may be referenced via branch name (e.g., `@main`) rather than commit SHA.
- **Permissions**: Follow the principle of least privilege. Use job-level `permissions` over top-level `permissions: read-all` unless the template repo explicitly specifies otherwise.

## PR Template

When creating pull requests in this repository, use the organization's centralized PR template from [`agent-volumes/.github`](https://github.com/agent-volumes/.github/blob/main/.github/PULL_REQUEST_TEMPLATE.md):

- **URL**: `https://raw.githubusercontent.com/agent-volumes/.github/refs/heads/main/.github/PULL_REQUEST_TEMPLATE.md`
- Always fetch the latest template from this URL when creating PRs.
- The template includes sections for Summary, Related Issues, Change Type, Checklist, Testing, Documentation, and Rollout/Risk.

These documents contain critical context that cannot be inferred from this repository's contents alone.

## STRUCTURE

```text
agent-volumes-spec/
├── agent-volumes-spec.md      # Normative prose specification (v0.1.0-draft.5)
├── IMPLEMENTERS.md            # Implementation guide for prototype builders
├── schemas/                   # Normative JSON Schema artifacts
├── conformance/               # Offline conformance fixtures + runner contract
├── openapi/                   # Bibliotheca API contract + prose drift audit
├── decisions/                 # 110 ADRs (architecture decision records)
├── .agents/skills/            # Contributor dev tooling (NOT distributable)
└── scripts/                   # Artifact validation script
```

## WHERE TO LOOK

| Task                      | Location                                | Notes                               |
| ------------------------- | --------------------------------------- | ----------------------------------- |
| Edit spec prose           | `agent-volumes-spec.md`                 | Single-file monolithic spec         |
| Add/change schema         | `schemas/` + `conformance/fixtures/`    | Must update both + coverage         |
| Add conformance case      | `conformance/fixtures/`                 | Follow fixture family naming        |
| Check ADR history         | `decisions/`                            | Sequential numbering, 0001–0108     |
| Prose ↔ OpenAPI alignment | `openapi/PROSE-DRIFT-AUDIT.md`          | Run before release freeze           |
| Implementation guidance   | `IMPLEMENTERS.md`                       | Maps normative artifacts to tasks   |
| Dev skill scaffolding     | `.agents/skills/skill-creator/scripts/` | `init_skill.py`, `package_skill.py` |

## CONVENTIONS

**Formatting (Prettier)** — `.prettierrc`

- `singleQuote: true`, `trailingComma: "es5"`, `printWidth: 120`, `proseWrap: "preserve"`
- Applies to: `md`, `json`, `yaml`, `yml`, `mjs`

- Date notation: Human-readable documents intentionally use five-digit Human Era / Holocene Era (HE) dates such as `12026`; these are not Gregorian typos and must not be normalized to four-digit years. Machine-readable artifacts use the date and timestamp formats required by their schemas or external standards.

**Markdown lint** — `.markdownlint-cli2.jsonc`

- Dash-only lists (`MD004.style = "dash"`)
- Duplicate headings blocked among siblings only (`MD024.siblings_only = true`)
- Horizontal rules must be `---` (`MD035.style = "---"`)
- 20+ rules disabled; ignores `node_modules/**` and `.agents/skills/**`

**OpenAPI lint** — `redocly.yaml`

- Extends `recommended` + `spec`
- Downgrades to warnings: `no-ambiguous-paths`, `no-enum-type-mismatch`, `no-invalid-media-type-examples`, `spec-strict-refs`

**Git hooks** — `lefthook.yml`

- Pre-commit: auto-fix staged `md/json/yaml/yml/mjs` with Prettier
- Commit-msg: enforces `Signed-off-by:` (DCO sign-off)

**CI** — `.github/workflows/`

- `spec-lint-and-format.yml`: path-filtered, installs Bun, runs lint/format/validate
- Security workflows delegate to org reusable workflows (`agent-volumes/.github` @main) — the **sole SHA-pinning exception**
- Uses `harden-runner` and pinned action SHAs for non-reusable workflows

## ANTI-PATTERNS (THIS PROJECT)

- **Never** standardize implementation-local topics: lockfiles, registry priority, prerelease selection, token issuance, advisory writes, scanner interchange, multipart upload, universal trust roots.
- **Never** report unsupported artifact formats as "verified".
- **Never** treat conformance labels as certification badges or live-interoperability claims.
- **Never** count deferred topics as v0.1 readiness gaps unless the corresponding ADR trigger is met.
- Do **not** add catalog-specific frontmatter (`domain`, `subdomain`, `tags`, `frameworks`) to dev skills in `.agents/skills/`.
- Do **not** create README.md, CHANGELOG.md, or auxiliary docs inside skills — only `SKILL.md` + resources.
- Do **not** duplicate skill content between `.agents/skills/` and `catalog/skills/`.

## NORMATIVE LANGUAGE (BCP 14)

When editing normative prose — primarily `agent-volumes-spec.md` and machine-readable schema descriptions — use BCP 14 keywords with their RFC-defined meanings:

- **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are reserved for normative requirements and carry the meanings defined in [BCP 14](https://www.rfc-editor.org/info/bcp14), [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119), and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174).
- In **non-normative** sentences (explanations, examples, rationales, ADRs), prefer alternative phrasing and avoid lowercase variants of these terms to prevent ambiguity.
- Decision records under `decisions/` are non-normative context and are not subject to BCP 14 lowercase warnings.

## COMMANDS

```bash
# Install git hooks (auto-runs on bun install)
bunx lefthook install

# Lint and format
bun run lint:md
bun run lint:md:fix
bun run lint:openapi
bun run format
bun run format:check

# Validate all artifacts (schemas, fixtures, OpenAPI)
bun run validate:artifacts
```

## NOTES

- **No `src/`, `app/`, or `lib/` tree** — this is a spec repo, not an app.
- **No standard test runner** — validation is via `scripts/validate-artifacts.mjs` (AJV + bespoke logic), not Jest/Vitest/Pytest.
- **No local CONTRIBUTING.md** — org-wide CONTRIBUTING.md lives in `agent-volumes/.github`.
- **Schema ↔ prose lockstep** — schema artifacts are version-aligned with `agent-volumes-spec.md`. Material schema changes are normative draft changes.
- **Org context** — see [`agent-volumes/.github`](https://github.com/agent-volumes/.github) for reusable workflows, SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, and the centralized PR template.
- **SHA pinning exception** — reusable workflows from `agent-volumes/.github` may use `@main`; all other actions must be SHA-pinned.
