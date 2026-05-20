# GITHUB WORKFLOWS

Repository CI and consumers of organization-wide reusable security workflows. Workflow policy is partly local and partly inherited from `agent-volumes/.github`.

## STRUCTURE

```text
.github/workflows/
├── spec-lint-and-format.yml   # Main repo validation gate
├── scorecard.yml              # Org reusable OpenSSF Scorecard workflow
├── dependency-review.yml      # Org reusable dependency review workflow
├── osv-scanner-pr.yml         # Org reusable PR OSV scan
└── osv-scanner-full.yml       # Org reusable scheduled/full OSV scan
```

## WHERE TO LOOK

| Task                        | File                       | Notes                                      |
| --------------------------- | -------------------------- | ------------------------------------------ |
| Change validation sequence  | `spec-lint-and-format.yml` | Root + site Bun installs, lint, validate   |
| Change Scorecard            | `scorecard.yml`            | Delegates to `agent-volumes/.github`       |
| Change dependency review    | `dependency-review.yml`    | Delegates to `agent-volumes/.github`       |
| Change OSV scans            | `osv-scanner-*.yml`        | Delegates to `agent-volumes/.github`       |
| Check org workflow contract | `agent-volumes/.github`    | README/SECURITY/CONTRIBUTING are authority |

## CONVENTIONS

- Use job-level least-privilege `permissions`; avoid broad top-level `permissions: read-all` unless the org reusable workflow requires it.
- Non-reusable third-party actions must be pinned by full commit SHA.
- Reusable workflows from `agent-volumes/.github` are the only SHA-pinning exception and may use `@main`.
- The main workflow uses `step-security/harden-runner` with `egress-policy: audit`.
- `spec-lint-and-format.yml` must rebuild the release-scoped OpenAPI publication artifact for the version declared in `agent-volumes-spec.md`, such as `site/spec/<version>/api-reference/bibliotheca.openapi.json`, and fail if it differs from the committed generated artifact.

## ANTI-PATTERNS

- Do **not** inline Scorecard, Dependency Review, or OSV Scanner logic when the org reusable workflow provides it.
- Do **not** add unpinned marketplace actions outside the org reusable-workflow exception.
- Do **not** remove site validation from spec CI; `site/` is release-coupled publication source.

## COMMANDS

```bash
bun install --frozen-lockfile
(cd site && bun install --frozen-lockfile)
bun run build:site:openapi
bun run format:check
bun run changelog:check
bun run lint:md
bun run lint:openapi
bun run lint:site
bun run validate:artifacts
```
