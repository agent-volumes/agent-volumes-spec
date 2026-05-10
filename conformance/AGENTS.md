# CONFORMANCE FIXTURES

Normative offline conformance fixture set for Agent Volumes v0.1. Artifact-first, deterministic, no deployed bibliotheca or network access needed.

## STRUCTURE

```text
conformance/
├── README.md              # This file — runner contract, claim labels, fixture mapping
├── REQUIREMENTS.md        # Role-scoped requirement inventory + deferred topics
└── fixtures/              # ~50 JSON fixture files
```

## WHERE TO LOOK

| Task                           | Location                                                           | Notes                                                |
| ------------------------------ | ------------------------------------------------------------------ | ---------------------------------------------------- |
| Add manifest validation case   | `fixtures/manifest-*.json`                                         | `valid`, `invalid`, `unknown-field-warning` variants |
| Add resolver/dependency case   | `fixtures/resolver-cases.json`, `fixtures/semver-range-cases.json` | Algorithmic vectors, not schema-only                 |
| Add trust lifecycle case       | `fixtures/trust-upload-lifecycle.json`                             | Case payload schema per `schema` field               |
| Add advisory case              | `fixtures/advisory*.json`                                          | Whole-file or case payload                           |
| Check requirement traceability | `fixtures/conformance-coverage.json`                               | Maps `AV-BIB-*` / `AV-CLI-*` to fixture families     |
| Check deferred topics          | `REQUIREMENTS.md` §Deferred                                        | Don't count as readiness gaps                        |

## CONVENTIONS

- **Three validation units**: whole-file schema, case payload schema, algorithmic vector.
- **Fixture names encode scenario/status**: `manifest-valid-*`, `manifest-invalid-*`, `*-cases`, `*-lifecycle`, `*-empty`, `*-matrix`.
- **Offline vectors**: fake domains (`example.test`), embedded `bytesBase64` blobs, no live services.
- **Stable IDs**: `results[].id` is a lowercase slug derived from fixture path + case name; keep it stable across runs.

## ANTI-PATTERNS

- **Never** treat conformance labels (`artifact-fixture-pass`, `client-role`, etc.) as certification badges or live-interoperability claims.
- **Never** count deferred topics as v0.1 readiness gaps unless the corresponding ADR trigger is met.
- Do **not** change expected fixture behavior without treating it as a normative draft change.
- Do **not** use live URLs or network-dependent data in fixtures.

## COMMANDS

```bash
# Run repository smoke runner
bun run validate:artifacts
```

## NOTES

- Independent implementations can use the same fixture families to produce their own conformance reports.
- Report output SHOULD use `../schemas/conformance-report.schema.json`.
- See `REQUIREMENTS.md` for the boundary between fixture-covered behavior, prose-boundary behavior, and deferred behavior.
