# VALIDATION SCRIPTS

Repository-maintenance scripts for specification artifacts. This is tooling, not runtime code for Agent Volumes implementations.

## STRUCTURE

```text
scripts/
├── validate-artifacts.ts           # AJV + bespoke schema/fixture/OpenAPI smoke runner
├── validate-artifacts/             # Validator modules
│   ├── core/                       # Schema context, AJV loader, shared utilities
│   ├── phases/                     # Validation phase orchestration
│   └── assertions/                 # Specific assertion families (fixtures, OpenAPI, etc.)
├── release-version.ts              # Shared spec-version resolver for builders and validators
├── build-site-openapi.ts           # Generates versioned OpenAPI publication artifact
├── build-site-schemas.ts           # Copies versioned schema publication artifacts
├── update-changelog.sh             # Changelog check/update/print/tag helper
└── create-release-tag.sh           # Release tag helper
```

## WHERE TO LOOK

| Task                        | File                    | Notes                                                                  |
| --------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| Add validator invariant     | `validate-artifacts/`   | Use local AGENTS.md; keep deterministic/offline                        |
| Add changelog rule          | `update-changelog.sh`   | Preserve Keep a Changelog + HE date handling                           |
| Tag release                 | `create-release-tag.sh` | Pair with curated `CHANGELOG.md` section                               |
| Resolve spec version        | `release-version.ts`    | Reads prose version and derives release paths/schema URL prefixes      |
| Build site OpenAPI artifact | `build-site-openapi.ts` | Generates `site/spec/<version>/api-reference/bibliotheca.openapi.json` |
| Build site schema artifacts | `build-site-schemas.ts` | Copies schemas into `site/spec/<version>/schemas/`                     |
| Check commands              | `../package.json`       | Scripts are exposed through Bun/npm                                    |

## VALIDATOR MAP

`validate-artifacts.ts` is now the orchestration shim: it builds the shared validation context, runs phase modules in order, then calls the fixture-connectivity guard. Detailed validator rules live in `validate-artifacts/AGENTS.md`.

## RELEASE VERSION HELPER

`release-version.ts` centralizes how repository-maintenance scripts read and
derive the current specification release version. Use it instead of hardcoding
`0.1.0-rc.1`, reconstructing `site/spec/<version>` paths, or rereading
`agent-volumes-spec.md` from individual scripts.

| Export                              | Use when                                                              | Result shape                                                 |
| ----------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| `normalizeSpecVersion(rawVersion)`  | Validating a user-provided or environment-provided version string     | SemVer without a leading `v`; throws for invalid input       |
| `versionFromSpec()`                 | Reading the prose `**Version:**` header directly                      | Current prose version without a leading `v`                  |
| `resolveSpecVersion(rawVersion?)`   | Building release-scoped site artifacts with CLI/env fallback behavior | CLI argument, then `SPEC_VERSION`, then prose header version |
| `getCurrentSpecVersion()`           | Validating current-release alignment                                  | Prose header version only; ignores `SPEC_VERSION`            |
| `getCurrentSpecVersionWithPrefix()` | Comparing or displaying the current version in tag form               | `v<version>`                                                 |
| `getReleaseArchiveRoot()`           | Locating the current generated release archive                        | `site/spec/<version>`                                        |
| `getSchemaIdPrefix()`               | Validating or constructing current release schema `$id` URL prefixes  | `https://agentvolumes.org/spec/<version>/`                   |

`SPEC_VERSION` is an optional environment variable consumed by
`resolveSpecVersion()` for publication builds. It is not a repository
configuration setting. Validators derive the current release version from
`agent-volumes-spec.md` through the current-version helpers instead.

`RELEASE_PUBLICATION_DRIFT_CHECK=1` enables release-freeze checks that compare
current canonical sources against `site/spec/<version>/...` publication archive
copies. Do not set it in normal development CI; use it only from explicit release
verification workflows or release-tag checks after regenerating publication
artifacts for the intended version.

`versionFromSpec()` and `getCurrentSpecVersion()` currently return the same
SemVer string, but they express different intent. Use `versionFromSpec()` only
when the code specifically needs the low-level action of reading the prose
`**Version:**` header. Use `getCurrentSpecVersion()` when validating the current
repository release surface. That semantic wrapper keeps validator call sites
focused on the domain rule even if the underlying source changes later.

For validators, prefer `getCurrentSpecVersion()`, `getReleaseArchiveRoot()`, and
`getSchemaIdPrefix()` so checks stay anchored to the prose header. For site
publication builders, prefer `resolveSpecVersion(process.argv[2])` so explicit
release builds can still target a supplied version.

## HUMAN REVIEW VS MACHINE VALIDATION

Automated validator inputs must be machine-readable artifacts: JSON fixtures,
JSON Schemas, OpenAPI YAML, or deterministic repository files that are intended
for script consumption. Human review documents such as
`../openapi/PROSE-DRIFT-AUDIT.md` are review evidence and release-freeze
checklists, not validator contracts. Keep their content aligned with the
machine-readable fixtures, but do not make `validate-artifacts.ts` depend on
parsing prose tables from human-review Markdown.

## CONVENTIONS

- Validators must be deterministic and offline; never require network services.
- Fixture checks use stable fixture paths and case names so reports remain diffable.
- New deterministic behavior should add a schema check, fixture case, coverage mapping, or documented prose-boundary exception.
- New automated OpenAPI/API behavior checks should use machine-readable
  fixtures, not human audit tables.
- Prefer small helper functions near related validation blocks; `validate-artifacts/` is the hotspot.

## ANTI-PATTERNS

- Do **not** silently ignore a fixture in `conformance/fixtures/`; every JSON fixture must be connected to validation.
- Do **not** encode registry-local policy as a portable baseline check.
- Do **not** update validation logic without running the artifact validator.

## COMMANDS

```bash
# Validate all artifacts (schemas, fixtures, OpenAPI)
bun run validate:artifacts

# Changelog helpers
bun run changelog:check
bun run changelog:print
bun run changelog:update

# Release helpers
bun run release:changelog
bun run release:tag

# Build site publication artifacts
bun run build:site:openapi -- <version>
bun run build:site:schemas -- <version>
```
