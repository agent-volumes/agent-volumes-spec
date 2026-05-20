# SCHEMA ARTIFACTS

Normative JSON Schema companion artifacts for Agent Volumes v0.1. Prose specification remains final authority; schemas define structured contracts for clients, bibliothecas, validators, and conformance runners.

## STRUCTURE

| Family                  | Files                                                                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manifest model          | `volume.schema.json`                                                                                                                                                                                       |
| Release metadata        | `release-metadata.schema.json`, `exact-release-metadata-case.schema.json`                                                                                                                                  |
| Version index           | `version-index.schema.json`, `version-index-row.schema.json`                                                                                                                                               |
| Release upload          | `release-upload-intent.schema.json`, `release-upload-finalize.schema.json`                                                                                                                                 |
| Trust discovery         | `trust-summary.schema.json`, `trust-detail.schema.json`                                                                                                                                                    |
| Trust upload            | `trust-upload-intent.schema.json`, `trust-upload-finalize.schema.json`                                                                                                                                     |
| Trust verification      | `trust-artifact-verification-case.schema.json`                                                                                                                                                             |
| Advisories              | `advisory.schema.json`, `advisory-list.schema.json`, `advisory-validation-case.schema.json`                                                                                                                |
| Capability metadata     | `capability-metadata.schema.json`, `bridge-metadata.schema.json`, `reserved-extension-namespaces.json`                                                                                                     |
| Errors/warnings         | `problem-details.schema.json`, `problem-registry.schema.json`, `warning.schema.json`                                                                                                                       |
| Conformance             | `conformance-report.schema.json`, `conformance-coverage.schema.json`                                                                                                                                       |
| Manifest/semantic cases | `manifest-parse-case.schema.json`, `semantic-validation-case.schema.json`, `component-dependency-validation-case.schema.json`                                                                              |
| External dependencies   | `external-dependency-validation-case.schema.json`, `upstream-baseline.schema.json`, `purl-vers-compatibility-exceptions.schema.json`, `external-dependency-potential-exposure-warning-context.schema.json` |
| BOM/provenance mapping  | `mapping-matrix.schema.json`, `mapping-sample.schema.json`, `external-dependency-declarations-predicate.schema.json`                                                                                       |
| Search                  | `search-results.schema.json`                                                                                                                                                                               |

## WHERE TO LOOK

| Task                       | File                              | Notes                                                           |
| -------------------------- | --------------------------------- | --------------------------------------------------------------- |
| Change manifest schema     | `volume.schema.json`              | Also update `manifest-valid-*` / `manifest-invalid-*` fixtures  |
| Change advisory format     | `advisory.schema.json`            | Also update `advisory.json`, `advisory-withdrawn.json` fixtures |
| Change capability metadata | `capability-metadata.schema.json` | Also update `capability-metadata*.json` fixtures                |
| Add new schema family      | Add schema + update `README.md`   | Follow existing naming convention                               |
| Check version alignment    | `$id` field in schema             | Must match current spec release                                 |

## CONVENTIONS

- Schema `$id` values include the Agent Volumes spec release.
- Artifacts are version-aligned with `agent-volumes-spec.md`.
- Material schema changes are normative draft changes.
- Most artifacts are Draft 2020-12 `*.schema.json`; `reserved-extension-namespaces.json` is the notable non-schema exception.

## ANTI-PATTERNS

- Do **not** change a schema without updating the relevant prose section in `agent-volumes-spec.md`.
- Do **not** change a schema without updating or adding conformance fixtures under `../conformance/fixtures/`.
- Do **not** forget to update `../conformance/fixtures/conformance-coverage.json` when the schema affects a role-scoped `AV-*` requirement.

## COMMANDS

```bash
# Validate schemas and all fixture companions
bun run validate:artifacts

# Lint OpenAPI (when schemas referenced by API contract change)
bun run lint:openapi
```
