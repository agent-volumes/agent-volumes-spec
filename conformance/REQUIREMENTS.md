# Agent Volumes v0.1 Requirement Inventory

This inventory supports readiness review for Agent Volumes `0.1.0-rc.1`.
It does not replace the prose specification. The prose remains the final
normative authority, while this file explains how implementers are expected to read the
role-scoped conformance IDs, fixture coverage, and deliberately local policy
boundaries.

## Scope

The inventory has four categories:

1. **Role-scoped requirements** — stable IDs in `agent-volumes-spec.md` §11.
2. **Fixture-covered behavior** — deterministic vectors or schemas in
   `conformance/fixtures/` and `schemas/`.
3. **Prose-boundary behavior** — normative prose that requires implementation
   judgment, local policy, or manual review rather than a single offline vector.
4. **Deferred behavior** — topics intentionally excluded from the portable v0.1
   baseline by existing decisions.

## Role-scoped requirements

The stable role-scoped requirement IDs are the primary conformance anchors for
v0.1:

- `AV-BIB-001` through `AV-BIB-018` define conforming bibliotheca behavior.
- `AV-CLI-001` through `AV-CLI-018` define conforming client behavior.

The machine-readable traceability artifact is
[`fixtures/conformance-coverage.json`](fixtures/conformance-coverage.json). It
maps those IDs to fixture families and schemas. That mapping is intentionally
role-scoped: one `AV-*` ID can correspond to several lower-level BCP 14
sentences in the prose.

## Fixture-covered behavior

The v0.1 fixture corpus covers these readiness-critical areas:

| Area                                       | Representative coverage                                                                                                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manifest parsing and semantic validation   | `manifest-parse-cases.json`, `semantic-validation-cases.json`, `volume.schema.json`                                                                                    |
| Permission narrowing and escalation        | `permission-escalation.json`, `permission-sibling-escalation.json`                                                                                                     |
| Package identity and component references  | `purl-canonicalization-cases.json`, `component-dependency-validation-cases.json`                                                                                       |
| Dependency resolution and lifecycle states | `semver-range-cases.json`, `resolver-cases.json`, `version-index-row-cases.json`, `version-index.json`                                                                 |
| External dependency declarations           | `external-dependency-validation-cases.json`, `external-dependency-potential-exposure-cases.json`, `upstream-baselines.json`, `purl-vers-compatibility-exceptions.json` |
| Archive and integrity behavior             | `tar-archive-profile-cases.json`, `digest-vectors.json`, `digest-invalid-cases.json`                                                                                   |
| Release metadata and upload                | `exact-release-metadata-cases.json`, `release-upload-lifecycle.json`, `lifecycle-mutation-cases.json`                                                                  |
| Trust discovery and upload                 | `trust-summary*.json`, `trust-detail*.json`, `trust-summary-failure-cases.json`, `trust-detail-failure-cases.json`, `trust-upload-lifecycle.json`                      |
| Trust artifact verification                | `trust-artifact-verification-cases.json`                                                                                                                               |
| Advisory read/discovery payloads           | `advisory*.json`, `advisory-search-failure-cases.json`, `advisory-validation-cases.json`                                                                               |
| Capability metadata and bridge behavior    | `capability-metadata*.json`, `capability-invalid-compatibility-cases.json`, `bridge-metadata*.json`                                                                    |
| Problem details and warning behavior       | `problem-details-cases.json`, `problem-registry.json`, `warning.schema.json`                                                                                           |
| Mapping exports                            | `mapping-matrix.json`, `mapping-sample.json`                                                                                                                           |
| Search and catalog                         | `search-results.json`, `catalog-search-failure-cases.json`                                                                                                             |

## Prose-boundary behavior

Some BCP 14 statements are intentionally not represented as standalone offline
vectors. Implementers and reviewers evaluate these through prose review,
OpenAPI/schema alignment, implementation tests, or local policy documentation:

- **Live registry behavior**: deployed service behavior, storage replication,
  CDN behavior, and operational consistency cannot be fully proven by the
  offline fixture corpus.
- **Local authorization policy**: token issuance, token revocation, publisher
  ownership proofs, and resource authorization are registry-local even though
  protected endpoints use the shared bearer-token error surface.
- **Runtime adapter behavior**: portable validation stops at the load boundary;
  runtime-specific execution, launch, sandboxing, allowlists, and UX are profile
  or implementation-local.
- **Cryptographic trust roots**: objective trust artifact facts are covered by
  fixtures, but one universal trust-root store, live transparency-log policy, and
  organization-specific acceptance policy remain local.
- **Search ranking and catalog ordering**: pagination shape is portable, but
  relevance ranking and global ordering are bibliotheca-local.
- **External dependency discovery surfaces**: exact release metadata exposes
  declaration-only external dependency records, but external dependency search,
  filtering, registry-side potential-exposure APIs, package-manager resolution,
  and scanner/VEX interchange remain local unless a future profile defines them.

These boundaries are not readiness gaps by themselves. They are explicit limits
on what a v0.1 conformance claim can mean.

## Deferred behavior

The following topics remain outside the portable v0.1 baseline unless their
decision records are explicitly reopened:

- lockfile file format (`ADR-0019`, `ADR-0097`, `ADR-0100`)
- registry-priority policy across multiple configured bibliothecas (`ADR-0019`)
- universal prerelease-selection policy (`ADR-0093`)
- advisory write authority and moderation workflows (`ADR-0092`)
- scanner-finding interchange and scanner severity normalization (`ADR-0015`)
- common vocabulary for non-mandatory derived judgments (`ADR-0011`)
- universal trust-root policy (`ADR-0103`)
- component-level advisory targeting (`ADR-0021`)
- transitive closure semantics for `role = "meta"` (`ADR-0094`)
- upload profiles beyond the mandatory `http-put` portable minimum (`ADR-0106`)
- AI-specific BOM profile guarantees beyond the generic CycloneDX baseline
  (`ADR-0096`)
- structured deprecation metadata (`ADR-0054`)
- broader MCP configuration formats such as YAML (`ADR-0084`)
- finer permission granularity beyond the read/write baseline (`ADR-0089`)
- future strict, enterprise, or other profiles beyond the v0.1 core (`ADR-0028`)

Reviewers do not count those items as v0.1 readiness gaps unless the
corresponding ADR says its reconsideration trigger has been met.

## Readiness use

Before claiming implementation readiness for a draft release:

1. Validate the artifact corpus with `npm run validate:artifacts`.
2. Validate the Bibliotheca API with `npm run lint:openapi`.
3. Confirm every role-scoped `AV-*` requirement has fixture, schema, OpenAPI, or
   documented prose-boundary coverage.
4. Confirm deferred topics are documented as local policy choices rather than
   accidental omissions.
5. For release freeze, perform the endpoint-level prose/OpenAPI drift audit in
   [`../openapi/PROSE-DRIFT-AUDIT.md`](../openapi/PROSE-DRIFT-AUDIT.md).

## Coverage sufficiency review

`fixtures/conformance-coverage.json` is mechanically checked for ID parity,
anchor validity, fixture existence, and case-name connectivity. Reviewers still
evaluate whether each mapping is sufficient for the requirement it cites.

For each new or changed coverage entry, reviewers confirm:

- the entry identifies the right evidence class: schema-only structure,
  deterministic fixture behavior, algorithmic vector, OpenAPI/API matrix
  evidence, human-review release evidence, or prose/local-policy boundary;
- case-level references point to stable case names whose expected outcome tests
  the cited requirement rather than merely exercising the file format;
- both positive and negative paths are represented when the requirement includes
  accept/reject behavior, warning categories, problem categories, or lifecycle
  failure states;
- repository artifact hygiene evidence is not counted as product conformance
  unless the portable behavior also has fixture, schema, or vector coverage; and
- any intentionally uncovered behavior is explicitly categorized above as
  prose-boundary behavior or deferred behavior.
