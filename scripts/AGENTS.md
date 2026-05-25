# VALIDATION SCRIPTS

Repository-maintenance scripts for specification artifacts. This is tooling, not runtime code for Agent Volumes implementations.

## STRUCTURE

```text
scripts/
├── validate-artifacts.mts  # AJV + bespoke schema/fixture/OpenAPI smoke runner
├── update-changelog.sh     # Changelog check/update/print/tag helper
└── create-release-tag.sh   # Release tag helper
```

## WHERE TO LOOK

| Task                         | File                     | Notes                                        |
| ---------------------------- | ------------------------ | -------------------------------------------- |
| Add schema/fixture invariant | `validate-artifacts.mts` | Keep deterministic and offline               |
| Add changelog rule           | `update-changelog.sh`    | Preserve Keep a Changelog + HE date handling |
| Tag release                  | `create-release-tag.sh`  | Pair with curated `CHANGELOG.md` section     |
| Check commands               | `../package.json`        | Scripts are exposed through Bun/npm          |

## VALIDATOR MAP

`validate-artifacts.mts` is large (~3k lines). Main clusters:

- AJV schema loading/compilation for `schemas/*.json`.
- Manifest, release metadata, warning, and Problem Details assertions.
- Fixture family checks for conformance coverage, lifecycle cases, trust/advisory/capability metadata, digest vectors, and resolver vectors.
- OpenAPI path/problem/schema-ref checks.
- Mapping exports and trust artifact serialization checks.

## CONVENTIONS

- Validators must be deterministic and offline; never require network services.
- Fixture checks use stable fixture paths and case names so reports remain diffable.
- New deterministic behavior should add a schema check, fixture case, coverage mapping, or documented prose-boundary exception.
- Prefer small helper functions near related validation blocks; this file is already a hotspot.

## ANTI-PATTERNS

- Do **not** silently ignore a fixture in `conformance/fixtures/`; every JSON fixture must be connected to validation.
- Do **not** encode registry-local policy as a portable baseline check.
- Do **not** update validation logic without running the artifact validator.

## COMMANDS

```bash
bun run validate:artifacts
bun run changelog:check
```
