# Agent Volumes v0.1 Conformance Fixtures

This directory contains the normative offline conformance fixture set for
Agent Volumes `0.1.0-draft.5`. The fixture suite implements ADR-0020 and
ADR-0104: it is artifact-first, deterministic, and does not require a deployed
bibliotheca, a reference client, network access, live Sigstore/Rekor services,
or one universal trust-root policy.

## Runner contract

A v0.1 conformance runner consumes the files in [`fixtures/`](fixtures/) and
applies the schemas in [`../schemas/`](../schemas/). A runner MAY be implemented
by a client, bibliotheca, validator, exporter, or a standalone test harness.

At minimum, a runner MUST:

1. validate every structured fixture against its companion JSON Schema;
2. evaluate deterministic `expected` outcomes, including `valid`,
   `failureCategory`, warning categories, lifecycle states, and exact digest
   vectors;
3. verify canonical package identity and purl serialization before comparing
   logical release subjects;
4. verify normalized-file-tree digest vectors byte-for-byte;
5. validate offline trust artifact material when `artifact.bytesBase64` is
   present, including its declared byte digest and release-subject binding;
6. preserve runtime and protocol compatibility version expressions without
   treating unknown schemes as portable rejection filters; and
7. keep implementation-local policy decisions separate from portable baseline
   fixture outcomes.

The repository smoke runner is:

```bash
npm run validate:artifacts
```

The same script is also runnable through package-manager equivalents such as
`bun run validate:artifacts`.

That command validates the specification artifacts themselves. Independent
implementations can use the same fixture families to produce their own
conformance reports.

## Report schema

Portable runner output SHOULD use
[`../schemas/conformance-report.schema.json`](../schemas/conformance-report.schema.json).
The report schema records the runner identity, implementation roles, aggregate
pass/fail counts, and one result per fixture case. A report is a statement about
the artifact/vector surface only; it is not a product certification badge and
does not imply live registry interoperability.

## Fixture families

| Area                             | Fixture files                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| Manifest validation              | `manifest-*.json`, `manifest-parse-cases.json`, `semantic-validation-cases.json`     |
| Dependency and resolver behavior | `semver-range-cases.json`, `resolver-cases.json`, `version-index-row-cases.json`     |
| Package identity                 | `purl-canonicalization-cases.json`, `component-dependency-validation-cases.json`     |
| Archive and integrity            | `tar-archive-profile-cases.json`, `digest-vectors.json`, `digest-invalid-cases.json` |
| Release metadata and upload      | `exact-release-metadata-cases.json`, `release-upload-lifecycle.json`                 |
| Trust discovery and upload       | `trust-summary*.json`, `trust-detail*.json`, `trust-upload-lifecycle.json`           |
| Trust verification               | `trust-artifact-verification-cases.json`                                             |
| Advisories                       | `advisory.json`, `advisory-withdrawn.json`, `advisory-validation-cases.json`         |
| Capability and extensions        | `capability-metadata*.json`, `bridge-metadata*.json`                                 |
| BOM/provenance export mapping    | `mapping-matrix.json`, `mapping-sample.json`                                         |
| Errors and warnings              | `problem-details-cases.json`                                                         |

Warning payloads use the companion schema
[`../schemas/warning.schema.json`](../schemas/warning.schema.json).

`mapping-sample.json` is a concrete offline export vector. It binds one source
manifest and release subject to CycloneDX, SPDX, and SLSA output objects so
validators can check round-trip-safe native and extension mappings separately
from intentionally lossy mappings.

Fixture updates that materially change expected behavior are normative draft
changes and MUST remain version-aligned with the prose specification.
