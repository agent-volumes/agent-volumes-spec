# Bibliotheca OpenAPI / Prose Drift Audit

This checklist is for Agent Volumes `0.1.0-draft.6` release-freeze review. It
keeps `openapi/bibliotheca.openapi.yaml` aligned with the normative Registry API
prose in `agent-volumes-spec.md` §9 and the conformance requirements in §11.

## How to use this checklist

For each endpoint family:

1. Confirm the route topology matches the prose examples.
2. Confirm every OpenAPI `path` / method / `operationId` maps to exactly one row
   in the operation coverage matrix.
3. Confirm scoped and scopeless route variants have equivalent semantics where
   both variants exist.
4. Confirm request contracts match prose: path/query/header parameters, request
   body required fields, accepted media types, defaults, bounds, enum values,
   and `Idempotency-Key` header/body equivalence where applicable.
5. Confirm success responses match prose: status code, response media type,
   schema `$ref`, required/optional fields, empty-list or empty-collection
   semantics, cache headers, and examples when present.
6. Confirm protected operations declare bearer authentication and public read
   operations remain intentionally unauthenticated.
7. Confirm documented errors use the closed RFC 9457 problem type set and the
   expected `application/problem+json` response media type.
8. Confirm conformance fixtures exercise the happy path and at least one relevant
   failure path when behavior is deterministic offline.
9. Record evidence for each row: reviewer/date, command output or CI link,
   related PR, fixture link, or documented prose-boundary exception.

## Common release-freeze invariants

These invariants apply before an endpoint-family row can be treated as reviewed:

- **Operation coverage**: every OpenAPI operation is present in exactly one row
  in the operation coverage matrix. Adding or removing a path, method, or
  `operationId` requires updating this audit.
- **Schema lockstep**: OpenAPI `$ref` targets match the companion schemas named
  by prose and the fixture mapping in `conformance/README.md`.
- **Request contract parity**: path/query/header parameters, request body shape,
  media types, `Idempotency-Key`, upload constraint fields, and default/bounds
  semantics match §9 prose.
- **Error contract parity**: each endpoint family exposes the expected closed
  problem slugs, status codes, and `application/problem+json` examples.
- **Auth boundary parity**: protected writes declare `bearerAuth`, public read
  surfaces do not require bearer auth, `401` vs `403` semantics remain distinct,
  and token issuance, revocation, ownership proof, and authorization policy stay
  registry-local.
- **Version lockstep**: OpenAPI `info.version`, `/api/v1` route family,
  `agent-volumes-spec.md` draft version, schema `$id` draft versions, capability
  `schemaVersion`, `specVersion`, `compatibleSpecVersions`, and `apiVersion`
  remain mutually consistent.
- **Fixture parity**: deterministic behavior is covered by a named fixture or a
  documented prose-boundary exception in `conformance/REQUIREMENTS.md`.
- **Policy boundary parity**: local topics such as lockfiles, registry priority,
  prerelease selection, token issuance, advisory writes, scanner interchange,
  multipart upload, and universal trust roots are not implied as portable
  requirements.

## Operation coverage matrix

| Endpoint family                | Status       | Prose anchor | AV requirements                                                      | Expected auth | OpenAPI operation IDs                                                  | Evidence |
| ------------------------------ | ------------ | ------------ | -------------------------------------------------------------------- | ------------- | ---------------------------------------------------------------------- | -------- |
| Catalog search                 | needs-update | §9.3         | `AV-BIB-007`                                                         | Public        | `searchVolumes`                                                        | TBD      |
| Release upload intent          | checked      | §9.2.1       | `AV-BIB-003`, `AV-BIB-004`, `AV-BIB-012`                             | Bearer        | `createVolumeUploadIntent`, `createScopedVolumeUploadIntent`           | TBD      |
| Release upload finalize        | needs-update | §9.2.1       | `AV-BIB-002`, `AV-BIB-003`, `AV-BIB-004`, `AV-BIB-005`, `AV-BIB-012` | Bearer        | `finalizeVolumeUpload`, `finalizeScopedVolumeUpload`                   | TBD      |
| Exact release metadata         | needs-update | §9.2.2       | `AV-BIB-003`, `AV-BIB-009`, `AV-BIB-010`, `AV-BIB-017`               | Public        | `getVolumeRelease`, `getScopedVolumeRelease`                           | TBD      |
| Unpublish / lifecycle mutation | needs-update | §9.2.3       | `AV-BIB-003`, `AV-BIB-004`, `AV-BIB-008`                             | Bearer        | `unpublishVolumeRelease`, `unpublishScopedVolumeRelease`               | TBD      |
| Version index                  | checked      | §9.2.4       | `AV-BIB-008`, `AV-BIB-010`, `AV-BIB-018`                             | Public        | `getVolumeVersionIndex`, `getScopedVolumeVersionIndex`                 | TBD      |
| Trust summary                  | needs-update | §9.4.1       | `AV-BIB-011`, `AV-BIB-010`                                           | Public        | `getVolumeTrustSummary`, `getScopedVolumeTrustSummary`                 | TBD      |
| Trust detail                   | needs-update | §9.4.2       | `AV-BIB-011`, `AV-BIB-010`, `AV-BIB-015`                             | Public        | `getVolumeTrustDetail`, `getScopedVolumeTrustDetail`                   | TBD      |
| Trust upload intent            | checked      | §9.4.3       | `AV-BIB-012`                                                         | Bearer        | `createVolumeTrustUploadIntent`, `createScopedVolumeTrustUploadIntent` | TBD      |
| Trust upload finalize          | needs-update | §9.4.3       | `AV-BIB-012`, `AV-BIB-015`                                           | Bearer        | `finalizeVolumeTrustUpload`, `finalizeScopedVolumeTrustUpload`         | TBD      |
| Advisory search                | checked      | §9.5         | `AV-BIB-013`                                                         | Public        | `searchAdvisories`                                                     | TBD      |
| Advisory detail                | checked      | §9.5         | `AV-BIB-013`                                                         | Public        | `getAdvisory`                                                          | TBD      |
| Capability metadata            | checked      | §9.6-§9.7    | `AV-BIB-014`, `AV-BIB-016`                                           | Public        | `getCapabilityMetadata`                                                | TBD      |

Status values:

- `pending` — not yet reviewed for this release-freeze pass.
- `checked` — route, schema, error, auth, and deterministic fixture anchors were
  reviewed and no update is needed. Release-freeze signoff still requires
  concrete evidence in the evidence column, PR, or release notes.
- `needs-update` — prose, OpenAPI, schema, fixture, or evidence alignment work
  remains before release freeze.

## Endpoint-family drift checks

| Endpoint family                | Expected problem slugs                                                                                                                                                                                                                                                                                                            | Schema / fixture anchors                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Audit focus                                                                                                                                                                         | Prose-boundary notes                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Catalog search                 | `validation-failed`, `rate-limited`                                                                                                                                                                                                                                                                                               | `schemas/search-results.schema.json`, `conformance/fixtures/search-results.json`, `conformance/fixtures/catalog-search-failure-cases.json`                                                                                                                                                                                                                                                                                                                                                                     | Query parameters, component-type enum, `limit`/`offset` bounds/defaults, discovery-only semantics, unknown compatibility expression handling                                        | Ranking, relevance, and stable global ordering are bibliotheca-local.                                      |
| Release upload intent          | `authentication-required`, `authorization-failed`, `validation-failed`, `version-conflict`, `idempotency-conflict`, `rate-limited`                                                                                                                                                                                                | `schemas/release-upload-intent.schema.json`, `conformance/fixtures/release-upload-lifecycle.json`                                                                                                                                                                                                                                                                                                                                                                                                              | Route-derived identity, request `version`, `mediaType`, `declaredDigest`, `declaredSize`, bearer auth, idempotency key behavior, `http-put` upload profile advertisement            | Upload target storage and byte-transfer URL semantics are implementation-local behind upload instructions. |
| Release upload finalize        | `authentication-required`, `authorization-failed`, `not-found`, `invalid-manifest`, `invalid-archive`, `digest-mismatch`, `identity-mismatch`, `missing-uploaded-bytes`, `invalid-upload-state`, `idempotency-conflict`, `upload-expired`, `payload-too-large`, `unsupported-media-type`, `permission-escalation`, `rate-limited` | `schemas/release-upload-finalize.schema.json`, `conformance/fixtures/release-upload-lifecycle.json`, `conformance/fixtures/digest-vectors.json`, `conformance/fixtures/digest-invalid-cases.json`, `conformance/fixtures/tar-archive-profile-cases.json`, `conformance/fixtures/permission-escalation.json`                                                                                                                                                                                                    | Uploaded-byte digest/size checks, archive validation, route/manifest/release identity, version conflict, expired upload, invalid upload state, permission model, computed integrity | Mandatory direct permission-escalation validation on every publish attempt is not required by v0.1.        |
| Exact release metadata         | `authorization-failed`, `not-found`, `inconsistent-registry-state`, `rate-limited`                                                                                                                                                                                                                                                | `schemas/release-metadata.schema.json`, `conformance/fixtures/exact-release-metadata-cases.json`                                                                                                                                                                                                                                                                                                                                                                                                               | `name`/`purl` consistency, lifecycle states, installable `dist` restrictions, CDN/Git delivery metadata, declaration-only external dependency exposure                              | Registry priority, prerelease policy, scanner findings, VEX status, and lockfiles remain local.            |
| Unpublish / lifecycle mutation | `authentication-required`, `authorization-failed`, `not-found`, `inconsistent-registry-state`, `rate-limited`                                                                                                                                                                                                                     | `conformance/fixtures/lifecycle-mutation-failure-cases.json`, `conformance/fixtures/version-index.json`, `conformance/fixtures/exact-release-metadata-cases.json`                                                                                                                                                                                                                                                                                                                                              | Bearer auth, tombstone/non-reuse behavior, lifecycle-state consistency with exact metadata, version index rows, trust/advisory discovery surfaces                                   | Grace windows and who may unpublish are local policy.                                                      |
| Version index                  | `not-found`, `inconsistent-registry-state`, `rate-limited`                                                                                                                                                                                                                                                                        | `schemas/version-index.schema.json`, `schemas/version-index-row.schema.json`, `conformance/fixtures/version-index.json`, `conformance/fixtures/version-index-row-cases.json`, `conformance/fixtures/resolver-cases.json`                                                                                                                                                                                                                                                                                       | Row shape, lifecycle state semantics, exact metadata pointer, conflict with exact metadata, exclusion of external dependency declaration carriers                                   | Physical index storage, replication, sharding, and sparse/Git layout are local implementation choices.     |
| Trust summary                  | `not-found`, `inconsistent-registry-state`, `rate-limited`                                                                                                                                                                                                                                                                        | `schemas/trust-summary.schema.json`, `conformance/fixtures/trust-summary.json`, `conformance/fixtures/trust-summary-empty.json`, `conformance/fixtures/trust-summary-failure-cases.json`                                                                                                                                                                                                                                                                                                                       | Fact-first semantics, empty artifact set as `200 OK`, derived judgments are non-canonical                                                                                           | Verification labels and broader trust policy outcomes are non-mandatory derived judgments.                 |
| Trust detail                   | `not-found`, `inconsistent-registry-state`, `rate-limited`                                                                                                                                                                                                                                                                        | `schemas/trust-detail.schema.json`, `conformance/fixtures/trust-detail.json`, `conformance/fixtures/trust-detail-empty.json`, `conformance/fixtures/trust-detail-status-variants.json`, `conformance/fixtures/trust-detail-failure-cases.json`                                                                                                                                                                                                                                                                 | Artifact locators, byte identity, release-subject binding, empty attachments as `200 OK`, status/revision metadata, superseded evidence                                             | Universal trust-root policy and live transparency-log policy remain local.                                 |
| Trust upload intent            | `authentication-required`, `authorization-failed`, `not-found`, `subject-binding-mismatch`, `idempotency-conflict`, `payload-too-large`, `unsupported-media-type`, `rate-limited`                                                                                                                                                 | `schemas/trust-upload-intent.schema.json`, `conformance/fixtures/trust-upload-lifecycle.json`                                                                                                                                                                                                                                                                                                                                                                                                                  | Bearer auth, release-subject binding, category/format metadata, declared digest/size, `http-put` upload profile, idempotency                                                        | Accepted trust attachment size limits are bibliotheca-local, but `413` semantics are portable.             |
| Trust upload finalize          | `authentication-required`, `authorization-failed`, `not-found`, `missing-uploaded-bytes`, `invalid-upload-state`, `digest-mismatch`, `subject-binding-mismatch`, `idempotency-conflict`, `upload-expired`, `payload-too-large`, `unsupported-media-type`, `rate-limited`                                                          | `schemas/trust-upload-finalize.schema.json`, `conformance/fixtures/trust-upload-lifecycle.json`, `conformance/fixtures/trust-artifact-verification-cases.json`                                                                                                                                                                                                                                                                                                                                                 | Uploaded-byte digest, missing bytes, invalid state, idempotency conflict, activation rules, trust attachment status/revision                                                        | Direct byte-transfer mechanics remain behind opaque upload instructions.                                   |
| Advisory search                | `validation-failed`, `rate-limited`                                                                                                                                                                                                                                                                                               | `schemas/advisory-list.schema.json`, `conformance/fixtures/advisory-list.json`, `conformance/fixtures/advisory-validation-cases.json`                                                                                                                                                                                                                                                                                                                                                                          | Read/discovery only, advisory list `items` envelope, empty list success semantics, volume-level query targeting                                                                     | Advisory search ranking, scanner ingestion, and advisory write authority remain local.                     |
| Advisory detail                | `not-found`, `rate-limited`                                                                                                                                                                                                                                                                                                       | `schemas/advisory.schema.json`, `conformance/fixtures/advisory.json`, `conformance/fixtures/advisory-withdrawn.json`, `conformance/fixtures/advisory-validation-cases.json`                                                                                                                                                                                                                                                                                                                                    | Read/discovery only, local advisory ID lookup, withdrawal lifecycle, affected-version events, volume-level targeting                                                                | Advisory create/update/withdraw authority and moderation workflows remain local.                           |
| Capability metadata            | `rate-limited`                                                                                                                                                                                                                                                                                                                    | `schemas/capability-metadata.schema.json`, `schemas/bridge-metadata.schema.json`, `schemas/reserved-extension-namespaces.json`, `conformance/fixtures/capability-metadata.json`, `conformance/fixtures/capability-metadata-unknown-tolerance.json`, `conformance/fixtures/capability-metadata-reserved-extension-rejection.json`, `conformance/fixtures/capability-invalid-compatibility-cases.json`, `conformance/fixtures/bridge-metadata.json`, `conformance/fixtures/bridge-metadata-status-variants.json` | Scope/scopeless policy, delivery modes, exact `compatibleSpecVersions`, API family, upload-profile advertisement, unknown tolerance, extension container, bridge warnings           | Rich trust-profile, scanner-profile, and upload-mode negotiation are outside v0.1 core.                    |

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
7. The endpoint-family problem slug column above

For every endpoint family, confirm:

- the OpenAPI response status exists for each expected problem slug;
- shared response components are traced to the operation-specific problem slugs
  above rather than treated as sufficient evidence by themselves;
- each problem response uses `application/problem+json`;
- examples validate against the closed problem-details schema;
- `401` is used only for missing or invalid bearer authentication;
- `403` is used for authorization or public-resource refusal semantics;
- `429` is available where rate limiting is part of the portable surface; and
- deterministic failure fixtures exist, or the absence is documented as a
  prose-boundary behavior.

## Evidence format

Use this evidence shape in the matrix, a PR comment, or release notes:

```text
Reviewer/date: <name or handle>, <YYYY-MM-DD>
Commands/CI: bun run lint:openapi <link or output>; bun run validate:artifacts <link or output>
Rows reviewed: <endpoint families>
Related changes: <PRs or commits>
Fixture evidence: <fixture paths or prose-boundary note>
Remaining drift: none | <explicit checked exception>
```

## Release-freeze signoff

Before freezing a draft release, record the following checks here, in the PR, or
in release notes:

- [ ] `bun run lint:openapi` passes.
- [ ] `bun run validate:artifacts` passes.
- [ ] Every OpenAPI path/method/`operationId` appears in exactly one endpoint
      family row.
- [ ] Every endpoint family above is marked `checked` before freeze, or any
      remaining `needs-update` row is explicitly documented as a release-blocking
      exception with an owner.
- [ ] No release-blocking exception remains unresolved at freeze time.
- [ ] Every deterministic endpoint behavior has at least one conformance fixture
      or an explicit prose-boundary explanation in `conformance/REQUIREMENTS.md`.
- [ ] Every expected problem slug/status/media type is aligned across prose,
      OpenAPI, schemas, and fixtures.
- [ ] Request contracts, response contracts, auth boundaries, and version
      lockstep invariants above have evidence.
- [ ] All intentionally local policy choices are documented as local choices
      rather than implied portable requirements.
- [ ] Remaining drift is `none`, except explicitly documented deferred or
      prose-boundary items that do not block v0.1 release readiness.

| Check                            | Result  | Reviewer/date | Evidence / notes                                                                                 |
| -------------------------------- | ------- | ------------- | ------------------------------------------------------------------------------------------------ |
| OpenAPI lint                     | pending | TBD           | Record command output or CI link.                                                                |
| Artifact validation              | pending | TBD           | Record command output or CI link.                                                                |
| Operation coverage               | pending | TBD           | Confirm every OpenAPI operation maps to exactly one matrix row.                                  |
| Endpoint family review           | pending | TBD           | Mark all endpoint-family rows above before freeze.                                               |
| Request/response contract parity | pending | TBD           | Link prose/OpenAPI/schema review evidence.                                                       |
| Error contract parity            | pending | TBD           | Link problem mapping, schema, fixture, or validator evidence.                                    |
| Auth/security boundary review    | pending | TBD           | Confirm protected/public operation boundaries and local-policy limits.                           |
| Version lockstep                 | pending | TBD           | Confirm spec, OpenAPI, schemas, and capability metadata version fields.                          |
| Deterministic behavior coverage  | pending | TBD           | Link fixture updates or prose-boundary notes.                                                    |
| Local policy boundary review     | pending | TBD           | Confirm no implementation-local policy is implied as portable baseline.                          |
| Freeze gate                      | pending | TBD           | Must be `none` for unresolved drift; release-blocking exceptions must be resolved before freeze. |
