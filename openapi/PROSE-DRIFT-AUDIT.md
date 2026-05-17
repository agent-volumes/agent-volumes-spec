# Bibliotheca OpenAPI / Prose Drift Audit

This checklist is for Agent Volumes `0.1.0-draft.6` release-freeze review. It
keeps `openapi/bibliotheca.openapi.yaml` aligned with the normative Registry API
prose in `agent-volumes-spec.md` §9 and the conformance requirements in §11.

## How to use this checklist

For each endpoint family:

1. Confirm the route topology matches the prose examples.
2. Confirm scoped and scopeless route variants have equivalent semantics where
   both variants exist.
3. Confirm request and response schemas reference the same companion artifacts
   named by the prose.
4. Confirm protected operations declare bearer authentication.
5. Confirm documented errors use the closed RFC 9457 problem type set.
6. Confirm conformance fixtures exercise the happy path and at least one relevant
   failure path when behavior is deterministic offline.

## Endpoint matrix

| Endpoint family                | Status       | Prose anchor | OpenAPI operation IDs                                                  | Schema / fixture anchors                                                                                                                                                 | Audit focus                                                                                                                                            |
| ------------------------------ | ------------ | ------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Catalog search                 | needs-update | §9.3         | `searchVolumes`                                                        | `schemas/search-results.schema.json`, `conformance/fixtures/search-results.json`                                                                                         | Query parameters, `limit`/`offset`, discovery-only semantics, unknown compatibility expression handling                                                |
| Release upload intent          | checked      | §9.2.1       | `createVolumeUploadIntent`, `createScopedVolumeUploadIntent`           | `schemas/release-upload-intent.schema.json`, `conformance/fixtures/release-upload-lifecycle.json`                                                                        | Route-derived identity, auth, idempotency key behavior, `http-put` upload profile advertisement                                                        |
| Release upload finalize        | needs-update | §9.2.1       | `finalizeVolumeUpload`, `finalizeScopedVolumeUpload`                   | `schemas/release-upload-finalize.schema.json`, `conformance/fixtures/release-upload-lifecycle.json`                                                                      | digest/size checks, archive validation, identity mismatch, version conflict, expired upload, invalid upload state                                      |
| Exact release metadata         | needs-update | §9.2.2       | `getVolumeRelease`, `getScopedVolumeRelease`                           | `schemas/release-metadata.schema.json`, `conformance/fixtures/exact-release-metadata-cases.json`                                                                         | `name`/`purl` consistency, lifecycle states, installable `dist` restrictions, CDN/Git delivery metadata, declaration-only external dependency exposure |
| Unpublish / lifecycle mutation | needs-update | §9.2.3       | `unpublishVolumeRelease`, `unpublishScopedVolumeRelease`               | `conformance/fixtures/release-upload-lifecycle.json`, `conformance/fixtures/version-index.json`                                                                          | auth, tombstone/non-reuse behavior, consistency with exact metadata and version index rows                                                             |
| Version index                  | checked      | §9.2.4       | `getVolumeVersionIndex`, `getScopedVolumeVersionIndex`                 | `schemas/version-index.schema.json`, `schemas/version-index-row.schema.json`, `conformance/fixtures/version-index-row-cases.json`                                        | row shape, lifecycle state semantics, exact metadata pointer, conflict with exact metadata, exclusion of external dependency declaration carriers      |
| Trust summary                  | needs-update | §9.4.1       | `getVolumeTrustSummary`, `getScopedVolumeTrustSummary`                 | `schemas/trust-summary.schema.json`, `conformance/fixtures/trust-summary*.json`                                                                                          | fact-first semantics, empty artifact set as `200 OK`, derived judgments are non-canonical                                                              |
| Trust detail                   | needs-update | §9.4.2       | `getVolumeTrustDetail`, `getScopedVolumeTrustDetail`                   | `schemas/trust-detail.schema.json`, `conformance/fixtures/trust-detail*.json`                                                                                            | artifact locators, byte identity, release-subject binding, status/revision metadata, superseded evidence                                               |
| Trust upload intent            | checked      | §9.4.3       | `createVolumeTrustUploadIntent`, `createScopedVolumeTrustUploadIntent` | `schemas/trust-upload-intent.schema.json`, `conformance/fixtures/trust-upload-lifecycle.json`                                                                            | auth, subject binding, declared digest/size, `http-put` upload profile, idempotency                                                                    |
| Trust upload finalize          | needs-update | §9.4.3       | `finalizeVolumeTrustUpload`, `finalizeScopedVolumeTrustUpload`         | `schemas/trust-upload-finalize.schema.json`, `conformance/fixtures/trust-upload-lifecycle.json`                                                                          | uploaded-byte digest, missing bytes, invalid state, idempotency conflict, activation rules                                                             |
| Advisory discovery             | checked      | §9.5         | `searchAdvisories`, `getAdvisory`                                      | `schemas/advisory.schema.json`, `schemas/advisory-list.schema.json`, `conformance/fixtures/advisory*.json`                                                               | read/discovery only, volume-level targeting, withdrawal lifecycle, affected-version events                                                             |
| Capability metadata            | checked      | §9.6-§9.7    | `getCapabilityMetadata`                                                | `schemas/capability-metadata.schema.json`, `schemas/bridge-metadata.schema.json`, `conformance/fixtures/capability-*.json`, `conformance/fixtures/bridge-metadata*.json` | exact `compatibleSpecVersions`, API family, upload-profile advertisement, unknown tolerance, extension container and bridge warnings                   |

Status values:

- `pending` — not yet reviewed for this release-freeze pass.
- `checked` — route, schema, error, auth, and deterministic fixture anchors were reviewed and no update is needed.
- `needs-update` — prose, OpenAPI, schema, or fixture alignment work remains before release freeze.

## Error contract audit

The OpenAPI document and prose MUST stay aligned with the closed v0.1 problem
set:

- `authentication-required` → `401`
- `authorization-failed` → `403`
- `not-found` → `404`
- `validation-failed` → `400`
- `invalid-manifest` → `400`
- `invalid-archive` → `400`
- `identity-mismatch` → `409`
- `version-conflict` → `409`
- `digest-mismatch` → `400`
- `subject-binding-mismatch` → `400`
- `inconsistent-registry-state` → `409`
- `upload-expired` → `410`
- `missing-uploaded-bytes` → `400`
- `invalid-upload-state` → `409`
- `idempotency-conflict` → `409`
- `payload-too-large` → `413`
- `unsupported-media-type` → `415`
- `permission-escalation` → `400`
- `rate-limited` → `429`

When adding or removing a problem type, update all of these together:

1. `agent-volumes-spec.md` §9.10
2. `schemas/problem-details.schema.json`
3. `schemas/problem-registry.schema.json`
4. `conformance/fixtures/problem-details-cases.json`
5. `conformance/fixtures/problem-registry.json`
6. `openapi/bibliotheca.openapi.yaml`

## Release-freeze signoff

Before freezing a draft release, record the following checks here, in the PR, or
in release notes:

- [x] `bun run lint:openapi` passes.
- [x] `bun run validate:artifacts` passes.
- [x] Every endpoint family above is marked `checked` or `needs-update`.
- [x] Every deterministic endpoint behavior has at least one conformance fixture
      or an explicit prose-boundary explanation in `conformance/REQUIREMENTS.md`.
- [x] All intentionally local policy choices are documented as local choices
      rather than implied portable requirements.

| Check                           | Result  | Evidence / notes                                                        |
| ------------------------------- | ------- | ----------------------------------------------------------------------- |
| OpenAPI lint                    | checked | Record command output or CI link.                                       |
| Artifact validation             | checked | Record command output or CI link.                                       |
| Endpoint family review          | pending | Mark all endpoint-family rows above before freeze.                      |
| Deterministic behavior coverage | checked | Link fixture updates or prose-boundary notes.                           |
| Local policy boundary review    | checked | Confirm no implementation-local policy is implied as portable baseline. |
