---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Use minimal schema with optional digests for upstream baselines

## Context and Problem Statement

ADR-0124 decides that Agent Volumes should cite pinned upstream Package URL and VERS
artifacts without vendoring their full fixture suites. ADR-0126 decides to record
those pinned references in a small machine-readable manifest such as
`conformance/upstream-baselines.json`.

That leaves a schema and integrity-policy question: **how strict should the
`conformance/upstream-baselines.json` schema be, and should digest fields be
required, optional, or deferred?**

External reference ecosystems use different integrity models. OCI and in-toto
require digests for content-addressed or attestation subject artifacts. SPDX and
CycloneDX support checksums and hashes for external references, but often treat them
as optional metadata. Package lockfiles commonly require integrity for registry
archives, while VCS dependencies can be pinned by commit SHA. The upstream baseline
manifest is currently a reference inventory, not a vendored lockfile or attestation.

## Decision Drivers

- The upstream baseline manifest should be schema-validated and machine-readable.
- v0.1 should keep the manifest small and focused on pinned references.
- The schema should leave room for digest verification without requiring byte-level
  integrity metadata before it is needed.
- Existing Agent Volumes schemas use `sha256:<64 hex>` for digest-shaped values.
- Digest requirements should not force Agent Volumes to mirror or vendor upstream
  Package URL and VERS artifacts.
- Future conformance evidence, downloadable archive references, or mirror/cache
  workflows may need stronger digest requirements.

## Considered Options

- A — Define the manifest shape only in prose and add no schema.
- B — Add a minimal schema with required baseline fields and optional digest fields.
- C — Add a schema with artifact-kind-specific conditional digest requirements.
- D — Require digests for every listed artifact.
- E — Defer digest fields entirely and record only revisions, paths, and URLs.
- F — Split reference metadata and integrity metadata into separate manifests.

## Decision Outcome

Chosen option: **B — Add a minimal schema with required baseline fields and optional
digest fields**, because it makes the manifest validateable while preserving the
small reference-inventory role chosen by ADR-0126.

Under this decision, Agent Volumes should add a companion schema for
`conformance/upstream-baselines.json`, such as:

```text
schemas/upstream-baseline.schema.json
```

The manifest should be included in artifact validation once the schema and fixture
are added.

The manifest shape should include:

- `specVersion`, fixed to the current Agent Volumes spec version
- `baselines`, a non-empty array of upstream baseline entries

Each baseline entry should require:

- `name`
- `upstream`
- `revision`
- `purpose`
- `artifacts`
- `lastReviewed`

Each artifact entry should require:

- `kind`
- either `path` or `url`, but not both

Each artifact entry may include:

- `digest`, using the existing Agent Volumes digest format `sha256:<64 lowercase
hex characters>` when present
- additional small descriptive fields such as `notes`, `license`, or
  `retrievalUrl` only if later schema work finds them necessary

The v0.1 schema should not require `digest` for every artifact. Repository paths
under a pinned upstream revision, such as a full commit SHA, may be referenced
without byte-level digest metadata. Downloadable byte artifacts may include a digest
now, but digest-required behavior is deferred until concrete needs arise.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- baseline artifacts are referenced as downloadable byte objects such as archives,
  tarballs, zip files, raw JSON files, or mirrored blobs
- upstream references use mutable identifiers, mutable URLs, or release tags whose
  immutability policy is unclear
- conformance reports add upstream compatibility evidence metadata
- Agent Volumes standardizes mirror or cache verification for upstream baseline
  artifacts
- implementation experience shows that optional digests are insufficient for
  reproducible review

If reopened, the follow-up ADR should evaluate artifact-kind-specific digest
requirements, all-artifact digest requirements, content-addressed retrieval URLs,
and optional conformance report evidence fields.

## Consequences

- Good, because the upstream baseline manifest becomes schema-validated without
  overbuilding an integrity lockfile.
- Good, because digest fields can be used immediately where practical.
- Good, because the schema aligns with the repository's existing `sha256:<hex>`
  digest convention.
- Good, because the manifest remains lightweight enough for v0.1.
- Neutral, because digest-required behavior is intentionally deferred.
- Neutral, because tooling must understand that a missing digest does not imply
  byte-level verification.
- Bad, because optional digests provide weaker integrity guarantees for downloadable
  URLs.
- Bad, because future strengthening may require migration of existing manifest
  entries.

## Confirmation

- Verify that `conformance/upstream-baselines.json` has a companion schema.
- Verify that the schema requires baseline identity, revision, purpose, artifact
  references, and last-reviewed date.
- Verify that each artifact has exactly one of `path` or `url`.
- Verify that `digest`, when present, uses `sha256:<64 lowercase hex characters>`.
- Verify that `digest` is optional in the v0.1 baseline.
- Verify that `validate:artifacts` covers the upstream baseline manifest once the
  schema and fixture are added.

## Pros and Cons of the Options

### A — Define the manifest shape only in prose and add no schema

- Good, because it is the lightest approach.
- Good, because the field set can evolve freely during early drafting.
- Bad, because a machine-readable manifest without schema validation is fragile.
- Bad, because typos and missing fields are harder to catch.
- Bad, because `validate:artifacts` cannot enforce the baseline shape.

### B — Add a minimal schema with required baseline fields and optional digest fields

- Good, because it provides structured validation while keeping the manifest small.
- Good, because optional digests match SPDX and CycloneDX-style external reference
  flexibility.
- Good, because it avoids premature OCI/in-toto-style evidence requirements.
- Good, because digest strengthening can be revisited when concrete needs appear.
- Neutral, because digest guidance still needs prose around when to include hashes.
- Bad, because optional digest fields do not guarantee byte-level integrity.

### C — Add a schema with artifact-kind-specific conditional digest requirements

- Good, because downloadable byte artifacts can require stronger integrity while
  repository paths under commit pins remain lightweight.
- Good, because it follows lockfile patterns that distinguish registry archives from
  VCS commit references.
- Neutral, because this may become appropriate once artifact kinds are stable.
- Bad, because conditional schema logic adds complexity now.
- Bad, because deciding whether a URL is immutable or content-addressed can be
  ambiguous.

### D — Require digests for every listed artifact

- Good, because it gives the strongest byte-level reproducibility.
- Good, because it aligns with content-addressed artifact and attestation models.
- Bad, because it turns a reference inventory into a lockfile-like artifact.
- Bad, because repository paths under pinned commits would need extra digest
  maintenance.
- Bad, because it increases update friction for upstream baseline revisions.

### E — Defer digest fields entirely and record only revisions, paths, and URLs

- Good, because the manifest stays extremely simple.
- Good, because it focuses on upstream revision pinning.
- Bad, because there is no field for integrity metadata even when useful.
- Bad, because later adding digest fields requires a schema change.
- Bad, because it ignores the repository's existing digest convention.

### F — Split reference metadata and integrity metadata into separate manifests

- Good, because it cleanly separates reference identity from byte integrity.
- Good, because future mirror/cache workflows could manage integrity separately.
- Bad, because two synchronized manifests are unnecessary in v0.1.
- Bad, because it adds tooling and review overhead.
- Bad, because the simpler optional digest field solves the immediate need.

## More Information

Follow-up work should decide:

- exact enum values for artifact `kind`
- exact field names for `retrievalUrl`, `license`, or `notes` if included
- the initial Package URL and VERS baseline entries
- whether digest guidance should recommend hashes for raw/download URLs even before
  they become required
