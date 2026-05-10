# Agent Volumes v0.1 Implementers Guide

This guide maps the v0.1.0-draft.5 specification artifacts to concrete work for experimental clients and bibliothecas. The prose specification remains the final normative authority; this document is a practical entry point for implementers.

## Status and scope

Agent Volumes v0.1.0-draft.5 is suitable for coordinated experimental implementations. It is not yet a stable certification target, and the repository does not define a product certification program.

Use this guide to build:

- a baseline client that can validate, resolve, download, verify, and inspect volumes
- a baseline bibliotheca that can publish, index, serve, and expose trust/advisory/capability metadata
- a deterministic smoke conformance path using the repository fixtures

Do not treat this guide as a request to standardize topics that the v0.1 core intentionally keeps local, such as lockfile format, registry priority, prerelease selection, token issuance, advisory writes, scanner interchange, multipart upload protocols, or universal trust-root policy.

## Canonical artifacts

| Area                 | Primary files                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Prose requirements   | `agent-volumes-spec.md`                                                                    |
| Manifest model       | `schemas/volume.schema.json`                                                               |
| Bibliotheca API      | `openapi/bibliotheca.openapi.yaml`                                                         |
| Release metadata     | `schemas/release-metadata.schema.json`, `schemas/exact-release-metadata-case.schema.json`  |
| Version index        | `schemas/version-index-row.schema.json`                                                    |
| Trust discovery      | `schemas/trust-summary.schema.json`, `schemas/trust-detail.schema.json`                    |
| Release upload       | `schemas/release-upload-intent.schema.json`, `schemas/release-upload-finalize.schema.json` |
| Trust upload         | `schemas/trust-upload-intent.schema.json`, `schemas/trust-upload-finalize.schema.json`     |
| Trust verification   | `schemas/trust-artifact-verification-case.schema.json`                                     |
| Mapping samples      | `schemas/mapping-matrix.schema.json`, `schemas/mapping-sample.schema.json`                 |
| Advisories           | `schemas/advisory.schema.json`, `schemas/advisory-validation-case.schema.json`             |
| Capability discovery | `schemas/capability-metadata.schema.json`                                                  |
| Errors and warnings  | `schemas/problem-details.schema.json`, `schemas/warning.schema.json`                       |
| Manifest parsing     | `schemas/manifest-parse-case.schema.json`                                                  |
| Fixtures and vectors | `conformance/fixtures/`                                                                    |
| Conformance reports  | `schemas/conformance-report.schema.json`                                                   |

## Minimum viable conforming client

A baseline client implementation should support the following before claiming v0.1 draft compatibility:

1. Parse `volume.toml` using TOML v1.1.0 semantics and validate the canonical parsed data model against `schemas/volume.schema.json` plus prose-only semantic checks.
2. Validate package and component identity, including scoped names, canonical purl serialization, and component purl shorthand rules.
3. Parse the portable dependency range grammar and enforce single-version resolution.
4. Consume package-scoped version indexes and exact release metadata before installation or trust evaluation.
5. Apply lifecycle semantics: ordinary resolution selects only `available`; exact `yanked` installs warn; `blocked`, `tombstoned`, and `unavailable` fail in the portable baseline.
6. Resolve `dist` metadata, retrieve release bytes or source material, construct the normalized file tree, and verify `integrity`.
7. Reject digest mismatch, subject-binding mismatch, inconsistent registry state, and component permission escalation.
8. Validate entrypoint existence and type-specific portable load boundaries before handing components to runtime adapters.
9. Preserve and expose runtime/protocol compatibility version expressions, compare them only for known schemes, and avoid rejecting solely because an expression uses an unknown runtime or protocol scheme.
10. Consume trust summary/detail metadata and distinguish objective trust facts from optional derived judgments.
11. Treat revoked or invalid trust attachments as failures by default, and treat superseded trust attachments as stale evidence that does not satisfy current-state trust requirements.
12. Validate objective trust artifact facts for formats the implementation claims to support, and never report unsupported artifact formats as verified.
13. Consume capability metadata without failing solely on unknown capability fields or values, while interpreting `compatibleSpecVersions` as exact version sets and `apiVersion` as the HTTP API major family.
14. Surface structured warnings for accepted unknown manifest fields, bridge migrations, yanked exact installs, and non-canonical entrypoint conventions.

## Minimum viable conforming bibliotheca

A baseline bibliotheca implementation should support the following before claiming v0.1 draft compatibility:

1. Serve `GET /api/v1/capabilities` with the capability metadata contract.
2. Support scoped and scopeless volume identities according to the advertised capability policy.
3. Create release upload intents, support the `http-put` portable upload profile for release uploads, and finalize uploaded `.tar.gz` release bytes.
4. Verify uploaded-byte digest and size when declared, validate archive profile rules, validate manifest identity against the route identity, compute normalized-file-tree `integrity`, and publish only after finalize succeeds.
5. Preserve version immutability: a lifecycle-marked version number must not be reused for different content.
6. Serve exact release metadata with lifecycle status and distribution metadata only when the release state permits portable exact fetch semantics.
7. Serve package-scoped version index rows synchronized with publish, yank, tombstone, block, and unavailable state changes.
8. Expose catalog search as discovery only; search results must not substitute for version indexes or exact metadata during resolution.
9. Expose trust summary/detail views and preserve append-only trust attachment status/revision semantics.
10. Support trust attachment upload intent/finalize and the `http-put` portable upload profile when the bibliotheca is write-capable for trust artifacts.
11. Expose advisory read/discovery endpoints for the v0.1 advisory schema.
12. Use RFC 7807 Problem Details for portable API errors.
13. Block continued distribution of artifacts with discovered permission escalation.

## Prototype-local choices

The v0.1 core intentionally leaves several operational choices local. Prototype projects should document their choices explicitly rather than treating them as standard behavior.

| Choice               | Prototype documentation needed                                                                                                                  |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth token issuance  | How bearer tokens are created, stored, revoked, and mapped to publisher resources                                                               |
| Upload byte transfer | Which non-core upload instruction shapes are returned beyond the required `http-put` portable baseline and how bytes are staged before finalize |
| Download transport   | Whether `dist.source = "cdn"`, `dist.source = "git"`, or both are supported                                                                     |
| Lockfile behavior    | File format, update workflow, and frozen-install UX                                                                                             |
| Registry priority    | Ordering and source selection when multiple bibliothecas are configured                                                                         |
| Prerelease selection | Whether prerelease candidates are considered by default                                                                                         |
| Trust roots          | Accepted Sigstore/SLSA roots, offline test keys, and policy overrides                                                                           |
| Advisory authority   | Who can create/update/withdraw advisories in the implementation                                                                                 |
| Scanner results      | Local scanner ingestion and policy mapping, if any                                                                                              |
| Runtime adapters     | How valid components are mapped into each target runtime's local execution model, including any known-scheme compatibility comparison support   |

## Smoke conformance path

Run the repository artifact checks before comparing implementation behavior against the artifact-first/offline fixture harness:

```bash
npm run validate:artifacts
npm run lint:openapi
```

The fixture runner contract and portable report shape are documented in
`conformance/README.md` and `schemas/conformance-report.schema.json`.

Then map implementation tests to fixture families:

| Implementation area              | Fixture files                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| Manifest validation              | `manifest-*.json`, `manifest-parse-cases.json`, `semantic-validation-cases.json`     |
| Dependency and resolver behavior | `semver-range-cases.json`, `resolver-cases.json`, `version-index-row-cases.json`     |
| Purl handling                    | `purl-canonicalization-cases.json`                                                   |
| Archive and integrity            | `tar-archive-profile-cases.json`, `digest-vectors.json`, `digest-invalid-cases.json` |
| Permissions                      | `permission-escalation.json`, `permission-sibling-escalation.json`                   |
| Release metadata and upload      | `exact-release-metadata-cases.json`, `release-upload-lifecycle.json`                 |
| Trust upload and discovery       | `trust-upload-lifecycle.json`, `trust-summary*.json`, `trust-detail*.json`           |
| Trust artifact verification      | `trust-artifact-verification-cases.json`                                             |
| Advisories                       | `advisory.json`, `advisory-withdrawn.json`, `advisory-validation-cases.json`         |
| Capability and extensions        | `capability-metadata*.json`, `bridge-metadata*.json`                                 |
| BOM/provenance export mapping    | `mapping-matrix.json`, `mapping-sample.json`                                         |
| Errors and warnings              | `problem-details-cases.json`, `warning.schema.json`                                  |

Fixture updates that materially change expected behavior are normative draft changes and should be versioned with the prose release.

Trust artifact verification fixtures exercise portable, objective artifact facts and lifecycle behavior. Prototype projects should add implementation-local cryptographic test roots or offline Sigstore/SLSA samples when validating real signatures, but those local trust-root policies are not part of the v0.1 portable fixture contract. Unsupported trust artifact formats remain unverified rather than successfully verified.

## Implementation order

For the first client/bibliotheca pair, implement in this order:

1. Manifest parsing and semantic validation.
2. Archive profile and normalized-file-tree digest verification.
3. Release upload intent/finalize and exact metadata fetch.
4. Version index consumption and resolver behavior.
5. Lifecycle/status semantics for exact and ordinary resolution.
6. Trust summary/detail read paths.
7. Advisory read paths.
8. Trust attachment upload.
9. Runtime adapter loading.
10. Local policy features such as auth UX, lockfiles, scanner ingestion, and trust-root policy.

This order keeps the immutable release subject and deterministic validation behavior stable before adding policy-heavy surfaces.
