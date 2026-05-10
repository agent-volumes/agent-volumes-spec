# Agent Volumes v0.1 Schema Artifacts

This directory contains normative machine-readable companion artifacts for Agent
Volumes `0.1.0-draft.5`. The prose specification remains the final normative
authority, but these schemas define the structured contracts used by clients,
bibliothecas, validators, exporters, and conformance runners.

## Primary schemas

| Area                        | Schemas                                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Manifest model              | `volume.schema.json`                                                                                                          |
| Release metadata            | `release-metadata.schema.json`, `exact-release-metadata-case.schema.json`                                                     |
| Version index               | `version-index.schema.json`, `version-index-row.schema.json`                                                                  |
| Release upload              | `release-upload-intent.schema.json`, `release-upload-finalize.schema.json`                                                    |
| Trust discovery             | `trust-summary.schema.json`, `trust-detail.schema.json`                                                                       |
| Trust upload                | `trust-upload-intent.schema.json`, `trust-upload-finalize.schema.json`                                                        |
| Trust verification fixtures | `trust-artifact-verification-case.schema.json`                                                                                |
| Advisories                  | `advisory.schema.json`, `advisory-list.schema.json`, `advisory-validation-case.schema.json`                                   |
| Capability metadata         | `capability-metadata.schema.json`, `bridge-metadata.schema.json`, `reserved-extension-namespaces.json`                        |
| Errors and warnings         | `problem-details.schema.json`, `problem-registry.schema.json`, `warning.schema.json`                                          |
| Conformance                 | `conformance-report.schema.json`, `conformance-coverage.schema.json`                                                          |
| Manifest and semantic cases | `manifest-parse-case.schema.json`, `semantic-validation-case.schema.json`, `component-dependency-validation-case.schema.json` |
| BOM/provenance mapping      | `mapping-matrix.schema.json`, `mapping-sample.schema.json`                                                                    |
| Search                      | `search-results.schema.json`                                                                                                  |

## Versioning rules

- Schema `$id` values include the Agent Volumes spec release.
- Schema artifacts are version-aligned with `agent-volumes-spec.md`.
- A material schema change is a normative draft change and is reviewed
  together with the prose and conformance fixtures it affects.

## Validation

Run the repository artifact validator after changing any schema or schema-backed
fixture:

```bash
npm run validate:artifacts
```

Run the OpenAPI linter after changing schemas referenced by the API contract:

```bash
npm run lint:openapi
```

## Maintenance checklist

When adding or changing a schema:

1. Update the relevant prose section in `agent-volumes-spec.md`.
2. Update or add conformance fixtures under `conformance/fixtures/`.
3. Update `conformance/fixtures/conformance-coverage.json` when the schema
   affects a role-scoped `AV-*` requirement.
4. Update this README if the artifact belongs to a new schema family.
5. Re-run `npm run validate:artifacts` and `npm run lint:openapi` when relevant.
