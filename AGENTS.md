# PROJECT KNOWLEDGE BASE

**Generated:** 2026-05-27T00:00:00+09:00
**Commit:** 1b13571
**Branch:** refactor/validate-artifacts-modularization

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
├── .editorconfig              # Repository-wide editor baseline
├── .prettierrc                # Prettier config for docs/data artifacts
├── .oxfmtrc.json              # Oxfmt config for JS/TS-family files
├── agent-volumes-spec.md      # Normative prose specification (v0.1.0-rc.1)
├── CHANGELOG.md               # Curated Keep a Changelog release history
├── IMPLEMENTERS.md            # Implementation guide for prototype builders
├── schemas/                   # Normative JSON Schema artifacts
├── conformance/               # Offline conformance fixtures + runner contract
├── openapi/                   # Bibliotheca API contract + prose drift audit
├── docs/                      # Project process, readiness, security, release docs
│   ├── docs/development/      # Validation workflow + TypeScript style guide
│   └── docs/decisions/        # 158 ADRs (architecture decision records)
├── site/                      # Mintlify source for public agentvolumes.org docs
├── .github/workflows/         # CI + org reusable security workflow consumers
├── .agents/skills/            # Contributor dev tooling (NOT distributable)
└── scripts/                   # Artifact validation script
```

## WHERE TO LOOK

| Task                      | Location                                | Notes                               |
| ------------------------- | --------------------------------------- | ----------------------------------- |
| Edit spec prose           | `agent-volumes-spec.md`                 | Single-file monolithic spec         |
| Add/change schema         | `schemas/` + `conformance/fixtures/`    | Must update both + coverage         |
| Add conformance case      | `conformance/fixtures/`                 | Follow fixture family naming        |
| Check ADR history         | `docs/decisions/`                       | Sequential numbering, 0001–0158     |
| Edit process docs         | `docs/`                                 | Non-normative policy/readiness docs |
| Edit public docs site     | `site/`                                 | Publication layer, not canonical    |
| Edit CI workflow          | `.github/workflows/`                    | SHA-pinning + org reusable policy   |
| Edit Bibliotheca API      | `openapi/bibliotheca.openapi.yaml`      | Keep drift audit + fixtures aligned |
| Prose ↔ OpenAPI alignment | `openapi/PROSE-DRIFT-AUDIT.md`          | Required before release freeze      |
| Update artifact validator | `scripts/validate-artifacts/`           | Modular phase/core/assertion runner |
| Release history           | `CHANGELOG.md`                          | Curated release notes               |
| Implementation guidance   | `IMPLEMENTERS.md`                       | Maps normative artifacts to tasks   |
| Dev skill scaffolding     | `.agents/skills/skill-creator/scripts/` | `init_skill.py`, `package_skill.py` |

## CONVENTIONS

- **EditorConfig** (`.editorconfig`): repository-wide baseline is UTF-8, LF line endings, two-space indentation, final newline insertion, trailing-whitespace trimming, and `max_line_length = 100`.
- **Oxfmt** (`.oxfmtrc.json`): JS/TS-family files use `trailingComma: "all"` and `sortImports: true`; line endings, indentation, and max line length come from `.editorconfig`.
- **Prettier** (`.prettierrc`): formats `md`, `mdx`, `json`, `yaml`, `yml`, `mdc`, `.prettierrc`, and `.oxfmtrc.json`; repo config sets only `trailingComma: "all"` plus an `*.mdc` Markdown parser override.

- Date notation: Human-readable documents intentionally use five-digit Human Era / Holocene Era (HE) dates such as `12026`; these are not Gregorian typos and must not be normalized to four-digit years. Machine-readable artifacts use the date and timestamp formats required by their schemas or external standards.

**Linting** — Three tools, no ESLint:

- **Oxlint** (`.oxlintrc.json`): TypeScript-aware, bans `any`, unsafe assertions, import cycles (maxDepth 3), complexity rules
- **TypeScript style guide** (`docs/development/code-style-guide.md`): required reference before editing `scripts/` TypeScript; explains active Oxlint rules and project exceptions for named exports, acyclic imports, parsed JSON typing, unsafe assertions, `null`/`undefined`, function declarations, and import sorting.
- **Markdownlint** (`.markdownlint-cli2.jsonc`): Dash-only lists (`MD004.style = "dash"`), sibling-only duplicate headings (`MD024.siblings_only = true`), `---` horizontal rules (`MD035.style = "---"`), 20+ rules disabled; ignores `node_modules/**`, `site/**`, and `.agents/skills/**`
- **Redocly** (`redocly.yaml`): Extends `recommended` + `spec`; downgrades to warnings: `no-ambiguous-paths`, `no-enum-type-mismatch`, `no-invalid-media-type-examples`, `spec-strict-refs`

- OpenAPI 3.1.1 uses JSON Schema 2020-12, external `../schemas/*` refs, scoped/unscoped route pairs, bearer auth only on protected writes, and closed RFC 9457 problem responses.

**Git hooks** — `lefthook.yml`

- Pre-commit: auto-fix staged `md/json/yaml/yml/mjs` with Prettier
- Pre-commit: validate changelog structure for release-related changes
- Commit-msg: enforces `Signed-off-by:` (DCO sign-off)

**CI** — `.github/workflows/`

- `spec-lint-and-format.yml`: path-filtered, installs Bun with `--frozen-lockfile --ignore-scripts`, rebuilds Mintlify OpenAPI/schema publication artifacts, fails on generated artifact drift, runs lint/format/site/artifact validation
- Security workflows delegate to org reusable workflows (`agent-volumes/.github` @main) — the **sole SHA-pinning exception**
- Uses `harden-runner` with `egress-policy: audit` and pinned action SHAs for non-reusable workflows
- `GIT_MASTER=1` normalizes git-sensitive script behavior in CI

## ANTI-PATTERNS (THIS PROJECT)

- **Never** standardize implementation-local topics: lockfiles, registry priority, prerelease selection, token issuance, advisory writes, scanner interchange, multipart upload, universal trust roots.
- **Never** report unsupported artifact formats as "verified".
- **Never** treat conformance labels as certification badges or live-interoperability claims.
- **Never** count deferred topics as v0.1 readiness gaps unless the corresponding ADR trigger is met.
- Do **not** add catalog-specific frontmatter (`domain`, `subdomain`, `tags`, `frameworks`) to dev skills in `.agents/skills/`.
- Do **not** create README.md, CHANGELOG.md, or auxiliary docs inside skills — only `SKILL.md` + resources.
- Do **not** duplicate skill content between `.agents/skills/` and `catalog/skills/`.
- Do **not** hand-edit release-scoped OpenAPI publication artifacts such as `site/spec/<version>/api-reference/bibliotheca.openapi.json`; regenerate them from `openapi/bibliotheca.openapi.yaml` with `bun run build:site:openapi -- <version>`.

## NORMATIVE LANGUAGE (BCP 14)

When editing normative prose — primarily `agent-volumes-spec.md` and machine-readable schema descriptions — use BCP 14 keywords with their RFC-defined meanings:

- **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are reserved for normative requirements and carry the meanings defined in [BCP 14](https://www.rfc-editor.org/info/bcp14), [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119), and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174).
- In **non-normative** sentences (explanations, examples, rationales, ADRs), prefer alternative phrasing and avoid lowercase variants of these terms to prevent ambiguity.
- Decision records under `docs/decisions/` are non-normative context and are not subject to BCP 14 lowercase warnings.

## COMMANDS

```bash
# Install git hooks (auto-runs on bun install)
bunx lefthook install

# Lint and format
bun run lint:md
bun run lint:md:fix
bun run lint:openapi
bun run lint:oxlint
bun run lint:oxlint:fix
bun run build:site:openapi -- <version>
bun run build:site:schemas -- <version>
bun run lint:site
bun run format
bun run format:check
bun run changelog:check

# Validate all artifacts (schemas, fixtures, OpenAPI)
bun run validate:artifacts

# Release helpers
bun run release:changelog
bun run release:tag
```

## NOTES

- **No `src/`, `app/`, or `lib/` tree** — this is a spec repo, not an app.
- **No standard test runner** — validation is via `scripts/validate-artifacts.ts` (AJV + bespoke logic), not Jest/Vitest/Pytest.
- **No local CONTRIBUTING.md** — org-wide CONTRIBUTING.md lives in `agent-volumes/.github`.
- **Schema ↔ prose lockstep** — schema artifacts are version-aligned with `agent-volumes-spec.md`. Material schema changes are normative draft changes.
- **Site is publication-only** — `site/` content and bundled OpenAPI output must link back to canonical sources and never override spec/schema/OpenAPI/conformance artifacts.
- **Hotspots** — `agent-volumes-spec.md`, `openapi/bibliotheca.openapi.yaml`, and `scripts/validate-artifacts/` are the largest maintenance-risk entry points; inspect local `AGENTS.md` files before editing their subtrees.
- **Changelog before tags** — release tags require a curated `CHANGELOG.md` entry for the target version; `git-cliff` output is only a draft.
- **Org context** — see [`agent-volumes/.github`](https://github.com/agent-volumes/.github) for reusable workflows, SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, and the centralized PR template.
- **SHA pinning exception** — reusable workflows from `agent-volumes/.github` may use `@main`; all other actions must be SHA-pinned.
- **Validator modularization** — `scripts/validate-artifacts.ts` orchestrates `scripts/validate-artifacts/` submodules (phases, core, assertions); check `scripts/validate-artifacts/AGENTS.md` before editing validator internals.

<!-- CODEGRAPH_START -->

## CodeGraph

This project has a CodeGraph MCP server (`codegraph_*` tools) configured. CodeGraph is a tree-sitter-parsed knowledge graph of every symbol, edge, and file. Reads are sub-millisecond and return structural information grep cannot.

### When to prefer codegraph over native search

Use codegraph for **structural** questions — what calls what, what would break, where is X defined, what is X's signature. Use native grep/read only for **literal text** queries (string contents, comments, log messages) or after you already have a specific file open.

| Question                                                  | Tool                                                                                 |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| "Where is X defined?" / "Find symbol named X"             | `codegraph_search`                                                                   |
| "What calls function Y?"                                  | `codegraph_callers`                                                                  |
| "What does Y call?"                                       | `codegraph_callees`                                                                  |
| "How does X reach/become Y? / trace the flow from X to Y" | `codegraph_trace` (one call = the whole path, incl. callback/React/JSX dynamic hops) |
| "What would break if I changed Z?"                        | `codegraph_impact`                                                                   |
| "Show me Y's signature / source / docstring"              | `codegraph_node`                                                                     |
| "Give me focused context for a task/area"                 | `codegraph_context`                                                                  |
| "See several related symbols' source at once"             | `codegraph_explore`                                                                  |
| "What files exist under path/"                            | `codegraph_files`                                                                    |
| "Is the index healthy?"                                   | `codegraph_status`                                                                   |

### Rules of thumb

- **Answer directly — don't delegate exploration.** For "how does X work" / architecture questions, answer with 2-3 codegraph calls: `codegraph_context` first, then ONE `codegraph_explore` for the source of the symbols it surfaces. For a specific **flow** ("how does X reach Y") start with `codegraph_trace` from→to — one call returns the whole path with dynamic hops bridged — then ONE `codegraph_explore` for the bodies; don't rebuild the path with `codegraph_search` + `codegraph_callers`. Codegraph IS the pre-built index, so spawning a separate file-reading sub-task/agent — or running a grep + read loop — repeats work codegraph already did and costs more for the same answer.
- **Trust codegraph results.** They come from a full AST parse. Do NOT re-verify them with grep — that's slower, less accurate, and wastes context.
- **Don't grep first** when looking up a symbol by name. `codegraph_search` is faster and returns kind + location + signature in one call.
- **Don't chain `codegraph_search` + `codegraph_node`** when you just want context — `codegraph_context` is one call.
- **Don't loop `codegraph_node` over many symbols** — one `codegraph_explore` call returns several symbols' source grouped in a single capped call, while each separate node/Read call re-reads the whole context and costs far more.
- **Index lag**: the file watcher debounces ~500ms behind writes; don't re-query immediately after editing a file in the same turn.

### If `.codegraph/` doesn't exist

The MCP server returns "not initialized." Ask the user: _"I notice this project doesn't have CodeGraph initialized. Want me to run `codegraph init -i` to build the index?"_

<!-- CODEGRAPH_END -->
