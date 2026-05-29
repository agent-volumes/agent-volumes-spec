# ARTIFACT VALIDATOR MODULES

Modular Bun/TypeScript smoke runner for schemas, conformance fixtures, OpenAPI,
and publication drift. Deterministic repository maintenance code only; not a
runtime validator API.

## VALIDATION SCOPE

The runner intentionally combines two related but distinct check classes:

- **Portable conformance fixture checks**: schema validation, deterministic
  `expected` outcomes, warning/problem categories, lifecycle states, digest
  vectors, subject binding, and algorithmic fixture evaluators that independent
  runners can reproduce offline.
- **Repository artifact hygiene checks**: generated publication drift, schema `$id`
  release alignment, OpenAPI matrix parity, problem-registry synchronization,
  fixture coverage connectivity, and other freeze-readiness checks that prove this
  repository's companion artifacts agree with each other.

Keep new assertions in the first class when they describe portable baseline
behavior. Keep publication, generated-site, ordering, coverage, and release-freeze
guards in the second class, and do not present them as product conformance rules.

## STRUCTURE

```text
validate-artifacts/
├── core/        # Shared context, filesystem readers, AJV schema loading, purl/TOML helpers
├── phases/      # Ordered validation phase modules, each exporting run(ctx)
└── assertions/  # Cross-phase assertion families used by phase modules or final guards
```

## WHERE TO LOOK

| Task                                 | Location                             | Notes                                     |
| ------------------------------------ | ------------------------------------ | ----------------------------------------- |
| Add schema to AJV context            | `core/schema-context.ts`             | Add to `schemas` map, not ad hoc compiles |
| Add shared parsed-artifact type      | `core/types.ts`                      | `JsonValue` is the parser-boundary type   |
| Add fixture family validation        | `phases/*.ts`                        | Choose the closest domain phase           |
| Add reusable cross-fixture assertion | `assertions/*.ts`                    | Keep specific assertion families grouped  |
| Check uncovered fixture guard        | `assertions/conformance-coverage.ts` | `readJsonPaths` powers final connectivity |
| Change phase ordering                | `../validate-artifacts.ts`           | Earlier phases feed later cross-checks    |

## PHASE MAP

| Phase file                           | Role                                     |
| ------------------------------------ | ---------------------------------------- |
| `advisory.ts`                        | Advisory schemas and list/search cases   |
| `trust.ts`                           | Trust summary/detail fixtures            |
| `capability-and-bridge.ts`           | Capability metadata and bridge metadata  |
| `problems-and-lifecycle.ts`          | Problem registry, lifecycle mutation     |
| `upload-lifecycle.ts`                | Release/trust upload intent/finalize     |
| `manifest-permissions-resolution.ts` | Manifest, permissions, resolver basics   |
| `integrity-and-archives.ts`          | Digest, archive, trust artifact vectors  |
| `dependencies.ts`                    | Dependencies, purl, VERS, semantic cases |
| `conformance-and-mapping.ts`         | Coverage IDs, BOM/provenance mappings    |
| `openapi.ts`                         | OpenAPI path/problem/schema-ref checks   |

## CONVENTIONS

- Every phase exports `run(ctx: ValidationContext): void`; keep side effects limited to assertions and fixture reads.
- Use `ctx.readJson(...)` / `ctx.readText(...)` so `readJsonPaths` can prove fixture coverage.
- Use `ctx.validate(schemaName, value, label)` and `ctx.validateExpectedFailure(...)`; do not compile one-off AJV validators.
- Validator phases may read human-facing Markdown only when checking publication
  presence or explicitly non-contractual references. Contract assertions must be
  driven by machine-readable artifacts such as JSON fixtures, schemas, or the
  OpenAPI document itself.
- Keep `assert(...)` messages stable and specific enough to identify the fixture, case, or API operation.
- Keep JSON inputs typed as `JsonValue` until narrowed; avoid `any`, unsafe assertions, and `null` internal sentinels.
- Domain constants belong in `core/numeric-constants.ts` or `core/patterns.ts` when reused across phases.

## ANTI-PATTERNS

- Do **not** read conformance JSON fixtures outside `ctx.readJson` unless intentionally bypassing the coverage guard.
- Do **not** parse `openapi/PROSE-DRIFT-AUDIT.md` or other human-review Markdown
  tables as validator source data; add a machine-readable fixture instead.
- Do **not** add network access, live registry checks, or environment-dependent behavior.
- Do **not** encode registry-local policy as portable baseline validation.
- Do **not** split a phase just by file length; split when there is a real artifact-family boundary.
- Do **not** add a schema-backed artifact without connecting schema, fixture, OpenAPI/prose evidence, and coverage where applicable.

## COMMANDS

```bash
bun run validate:artifacts
bun run lint:oxlint
bun run format:oxfmt:check
```
