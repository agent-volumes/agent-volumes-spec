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
| Build site OpenAPI artifact | `build-site-openapi.ts` | Generates `site/spec/<version>/api-reference/bibliotheca.openapi.json` |
| Build site schema artifacts | `build-site-schemas.ts` | Copies schemas into `site/spec/<version>/schemas/`                     |
| Check commands              | `../package.json`       | Scripts are exposed through Bun/npm                                    |

## VALIDATOR MAP

`validate-artifacts.ts` is now the orchestration shim: it builds the shared validation context, runs phase modules in order, then calls the fixture-connectivity guard. Detailed validator rules live in `validate-artifacts/AGENTS.md`.

## CONVENTIONS

- Validators must be deterministic and offline; never require network services.
- Fixture checks use stable fixture paths and case names so reports remain diffable.
- New deterministic behavior should add a schema check, fixture case, coverage mapping, or documented prose-boundary exception.
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
