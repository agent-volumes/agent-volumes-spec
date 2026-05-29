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
- `spec-lint-and-format.yml` is the normal development validation gate and must
  not regenerate immutable `site/spec/<version>/...` release archives.
- `release-publication-artifacts.yml` is the explicit release-freeze drift gate.
  It accepts a manual `spec-version` input, rebuilds release-scoped OpenAPI and
  schema publication artifacts for that version, and fails if those generated
  artifacts differ from the committed release snapshot.

## ANTI-PATTERNS

- Do **not** inline Scorecard, Dependency Review, or OSV Scanner logic when the org reusable workflow provides it.
- Do **not** add unpinned marketplace actions outside the org reusable-workflow exception.
- Do **not** remove site validation from spec CI; `site/` is release-coupled publication source.

## COMMANDS

```bash
bun install --frozen-lockfile
(cd site && bun install --frozen-lockfile)
bun run build:site:openapi -- <version>
bun run build:site:schemas -- <version>
bun run format:check
bun run changelog:check
bun run lint:md
bun run lint:openapi
bun run lint:site
bun run validate:artifacts
```
