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

1. validate every structured fixture, fixture case, or fixture payload against
   the companion JSON Schema identified by this document;
2. evaluate deterministic `expected` outcomes, including `valid`,
   `failureCategory`, warning categories, lifecycle states, and exact digest
   vectors;
3. verify canonical package identity and purl serialization before comparing
   logical release subjects;
4. verify normalized-file-tree digest vectors byte-for-byte;
5. validate offline trust artifact material when `artifact.bytesBase64` is
   present, including its declared byte digest and release-subject binding;
6. preserve runtime and protocol compatibility version expressions without
   treating unknown schemes as portable rejection filters;
7. validate capability metadata exact compatible spec version sets, API major
   family, and supported upload-profile advertisements; and
8. keep implementation-local policy decisions separate from portable baseline
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

## Conformance claim labels

Conformance reports describe the offline artifact/vector surface only. Use
precise claim labels rather than broad product claims:

| Claim label                      | Use when                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `artifact-fixture-pass`          | A runner evaluates the v0.1 fixture corpus and produces a report using the report schema.                                   |
| `client-role`                    | An implementation satisfies the client requirements in the prose specification.                                             |
| `bibliotheca-read-role`          | A bibliotheca satisfies read/discovery behavior for search, fetch, version index, trust, advisory, and capability metadata. |
| `bibliotheca-write-capable-role` | A bibliotheca satisfies read behavior plus release upload and trust attachment upload behavior.                             |
| `validator-exporter-role`        | A tool validates manifests, fixtures, mapping exports, or trust artifacts without claiming live registry behavior.          |

These labels are additive. They are not a certification badge and do not imply
live registry interoperability, hosted service approval, or one universal
trust-root policy.

## Report schema

Portable runner output SHOULD use
[`../schemas/conformance-report.schema.json`](../schemas/conformance-report.schema.json).
The report schema records the runner identity, implementation roles, aggregate
pass/fail counts, and one result per fixture case. A report is a statement about
the artifact/vector surface only; it is not a product certification badge and
does not imply live registry interoperability.

Each `results[].id` value is a stable lowercase slug derived from the fixture
path and case name where applicable, for example
`semantic-validation-cases/command-entrypoint-missing-trigger`. Runners MUST keep
IDs stable across repeated runs of the same fixture corpus so reports can be
diffed and compared by tooling.

## Fixture families

| Area                             | Fixture files                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Manifest validation              | `manifest-*.json`, `manifest-parse-cases.json`, `semantic-validation-cases.json`                       |
| Permission validation            | `permission-escalation.json`, `permission-sibling-escalation.json`                                     |
| Dependency and resolver behavior | `semver-range-cases.json`, `resolver-cases.json`, `version-index-row-cases.json`, `version-index.json` |
| Package identity                 | `purl-canonicalization-cases.json`, `component-dependency-validation-cases.json`                       |
| Archive and integrity            | `tar-archive-profile-cases.json`, `digest-vectors.json`, `digest-invalid-cases.json`                   |
| Release metadata and upload      | `exact-release-metadata-cases.json`, `release-upload-lifecycle.json`                                   |
| Trust discovery and upload       | `trust-summary*.json`, `trust-detail*.json`, `trust-upload-lifecycle.json`                             |
| Trust verification               | `trust-artifact-verification-cases.json`                                                               |
| Advisories                       | `advisory.json`, `advisory-withdrawn.json`, `advisory-list.json`, `advisory-validation-cases.json`     |
| Capability and extensions        | `capability-metadata*.json`, `capability-invalid-compatibility-cases.json`, `bridge-metadata*.json`    |
| BOM/provenance export mapping    | `mapping-matrix.json`, `mapping-sample.json`                                                           |
| Errors and warnings              | `problem-details-cases.json`, `problem-registry.json`                                                  |
| Search and catalog               | `search-results.json`                                                                                  |
| Requirement traceability         | `conformance-coverage.json`                                                                            |

## Fixture schema mapping

Fixture files use one of three validation units:

1. **Whole-file schema** — the entire fixture file is validated against a case or
   sample schema.
2. **Case payload schema** — each element under `cases` or `fixtures` carries a
   payload that is validated against the named companion schema.
3. **Algorithmic vector** — the file shape is checked by the artifact runner and
   the expected result is evaluated by deterministic algorithmic logic, such as
   digest construction or resolver selection.

| Fixture file pattern                                                                      | Validation unit     | Companion schema or evaluator                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `manifest-valid-*.json`, `manifest-invalid-*.json`, `manifest-unknown-field-warning.json` | Whole file          | [`../schemas/volume.schema.json`](../schemas/volume.schema.json) plus semantic warning checks                                                                                                               |
| `manifest-parse-cases.json`                                                               | Whole file / cases  | [`../schemas/manifest-parse-case.schema.json`](../schemas/manifest-parse-case.schema.json)                                                                                                                  |
| `semantic-validation-cases.json`                                                          | Whole file / cases  | [`../schemas/semantic-validation-case.schema.json`](../schemas/semantic-validation-case.schema.json)                                                                                                        |
| `component-dependency-validation-cases.json`                                              | Whole file / cases  | [`../schemas/component-dependency-validation-case.schema.json`](../schemas/component-dependency-validation-case.schema.json)                                                                                |
| `semver-range-cases.json`                                                                 | Algorithmic vector  | v0.1 SemVer range grammar evaluator                                                                                                                                                                         |
| `resolver-cases.json`                                                                     | Algorithmic vector  | v0.1 resolver and lifecycle evaluator                                                                                                                                                                       |
| `version-index.json`                                                                      | Whole file          | [`../schemas/version-index.schema.json`](../schemas/version-index.schema.json)                                                                                                                              |
| `version-index-row-cases.json`                                                            | Case payload schema | [`../schemas/version-index-row.schema.json`](../schemas/version-index-row.schema.json)                                                                                                                      |
| `purl-canonicalization-cases.json`                                                        | Algorithmic vector  | v0.1 purl parser and canonical serializer                                                                                                                                                                   |
| `digest-vectors.json`, `digest-invalid-cases.json`                                        | Algorithmic vector  | normalized-file-tree digest evaluator                                                                                                                                                                       |
| `tar-archive-profile-cases.json`                                                          | Algorithmic vector  | hosted archive transport profile evaluator                                                                                                                                                                  |
| `exact-release-metadata-cases.json`                                                       | Whole file / cases  | [`../schemas/exact-release-metadata-case.schema.json`](../schemas/exact-release-metadata-case.schema.json)                                                                                                  |
| `release-upload-lifecycle.json`                                                           | Case payload schema | release upload schemas or Problem Details schema selected by each case's `schema` field; intent cases cover the `http-put` portable upload profile                                                          |
| `trust-summary*.json`                                                                     | Whole file          | [`../schemas/trust-summary.schema.json`](../schemas/trust-summary.schema.json)                                                                                                                              |
| `trust-detail*.json`                                                                      | Whole file          | [`../schemas/trust-detail.schema.json`](../schemas/trust-detail.schema.json)                                                                                                                                |
| `trust-upload-lifecycle.json`                                                             | Case payload schema | trust upload schemas or Problem Details schema selected by each case's `schema` field; intent cases cover the `http-put` portable upload profile                                                            |
| `trust-artifact-verification-cases.json`                                                  | Whole file / cases  | [`../schemas/trust-artifact-verification-case.schema.json`](../schemas/trust-artifact-verification-case.schema.json) plus artifact verification logic, including superseded stale-current-evidence behavior |
| `advisory.json`, `advisory-withdrawn.json`                                                | Whole file          | [`../schemas/advisory.schema.json`](../schemas/advisory.schema.json)                                                                                                                                        |
| `advisory-list.json`                                                                      | Whole file          | [`../schemas/advisory-list.schema.json`](../schemas/advisory-list.schema.json)                                                                                                                              |
| `advisory-validation-cases.json`                                                          | Whole file / cases  | [`../schemas/advisory-validation-case.schema.json`](../schemas/advisory-validation-case.schema.json)                                                                                                        |
| `capability-metadata*.json`                                                               | Whole file          | [`../schemas/capability-metadata.schema.json`](../schemas/capability-metadata.schema.json), including exact compatible spec versions, API major family, upload profiles, and unknown tolerance behavior     |
| `capability-invalid-compatibility-cases.json`                                             | Case payload schema | [`../schemas/capability-metadata.schema.json`](../schemas/capability-metadata.schema.json) negative cases for exact version-set and API family validation                                                   |
| `bridge-metadata*.json`                                                                   | Whole file          | [`../schemas/bridge-metadata.schema.json`](../schemas/bridge-metadata.schema.json)                                                                                                                          |
| `mapping-matrix.json`                                                                     | Whole file          | [`../schemas/mapping-matrix.schema.json`](../schemas/mapping-matrix.schema.json)                                                                                                                            |
| `mapping-sample.json`                                                                     | Whole file          | [`../schemas/mapping-sample.schema.json`](../schemas/mapping-sample.schema.json)                                                                                                                            |
| `search-results.json`                                                                     | Whole file          | [`../schemas/search-results.schema.json`](../schemas/search-results.schema.json)                                                                                                                            |
| `problem-details-cases.json`                                                              | Case payload schema | [`../schemas/problem-details.schema.json`](../schemas/problem-details.schema.json)                                                                                                                          |
| `problem-registry.json`                                                                   | Whole file          | [`../schemas/problem-registry.schema.json`](../schemas/problem-registry.schema.json)                                                                                                                        |
| `conformance-coverage.json`                                                               | Whole file          | [`../schemas/conformance-coverage.schema.json`](../schemas/conformance-coverage.schema.json)                                                                                                                |

When a fixture uses a wrapper object with `cases` or `fixtures`, the wrapper is
part of the deterministic fixture format. The companion schema named above
applies to the whole wrapper only when the mapping says “Whole file”; otherwise
it applies to each case payload selected by the case metadata.

Warning payloads use the companion schema
[`../schemas/warning.schema.json`](../schemas/warning.schema.json).

`mapping-sample.json` is a concrete offline export vector. It binds one source
manifest and release subject to CycloneDX, SPDX, and SLSA output objects so
validators can check round-trip-safe native and extension mappings separately
from intentionally lossy mappings.

Fixture updates that materially change expected behavior are normative draft
changes and MUST remain version-aligned with the prose specification.

`conformance-coverage.json` maps stable prose requirement IDs such as `AV-BIB-*`
and `AV-CLI-*` to fixture families. The coverage artifact is not a product
certification result; it is a traceability aid that helps runners and reviewers
distinguish fixture-checked behavior from prose-only or profile-local behavior.
It maps the role-scoped conformance requirements in the prose specification, not
every individual BCP 14 sentence in the full document. See
[`REQUIREMENTS.md`](REQUIREMENTS.md) for the companion inventory that separates
role-scoped requirements, fixture-covered behavior, prose-boundary behavior, and
intentionally deferred topics.
