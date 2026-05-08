---
status: accepted
date: 12026-05-09
decision-makers: Yunseo Kim
---

# Adopt a Cargo-style version index row model without standardizing physical index storage

## Context and Problem Statement

ADR-0019 establishes a minimal interoperability resolver contract while excluding registry priority policy and lockfile format from the v0.1 core. ADR-0093 further keeps prerelease-selection policy client-local, and ADR-0094 keeps meta packages lightweight rather than assigning closure-level bundle semantics.

The draft registry API currently provides catalog search and exact release metadata fetches, but it does not define a first-class way for clients to enumerate eligible versions of a package before selecting one for resolution. Relying on search results for resolver input is too weak because search ranking and ordering are bibliotheca-local. Relying only on exact release fetches requires clients to already know candidate versions.

That leaves a version discovery question: **should v0.1 define a package-scoped version index, and if so, how much resolver-facing metadata should each version entry contain?**

Comparable package ecosystems provide several models:

- npm-style package documents include rich per-version metadata in a package-level document
- PyPI Simple-style indexes expose installable files and hashes, with richer metadata available through side channels
- Cargo-style registry indexes expose one resolver-friendly row per published version, including dependencies, checksum, and yanked status
- OCI-style registries expose tags, manifests, and referrers rather than a package-version catalog
- Go module proxy endpoints expose version lists and exact per-version metadata/files through separate paths

Agent Volumes needs stronger resolver efficiency and conformance fixture ergonomics than a thin link index provides, but it should not standardize a physical index storage protocol such as Cargo's concrete file sharding or Git/sparse-index layout.

## Decision Drivers

- Provide a first-class machine-facing version discovery surface distinct from search
- Improve resolver efficiency by letting clients inspect version-level dependency and status metadata before fetching every exact release document
- Support package-level index caching and incremental fetch strategies without requiring one physical storage layout
- Keep exact release metadata and normalized-file-tree integrity as the authoritative release validation surfaces
- Avoid standardizing Cargo's concrete index path sharding, Git index storage, sparse HTTP layout, or replication protocol in the v0.1 core
- Preserve existing deferrals for lockfile format, registry-priority policy, prerelease-selection policy, and meta-package closure semantics

## Considered Options

- Adopt a Cargo-style version index row model while leaving physical index layout/storage local
- Adopt a thin PyPI Simple-style file/link index
- Adopt a minimal package metadata endpoint containing only version and release pointers
- Adopt an npm-style rich package document
- Adopt an OCI-style descriptor/tag graph as the primary version discovery model

## Decision Outcome

Chosen option: **Adopt a Cargo-style version index row model while leaving physical index layout/storage local**, because it provides the strongest resolver-facing version discovery surface without forcing the standard to inherit Cargo's physical index implementation details.

Under this decision:

- the v0.1 core SHOULD define a package-scoped version index read surface for each volume identity
- the version index is a machine-facing resolver input, not a catalog search or ranking surface
- each version index entry represents one published version row
- each version row SHOULD include at least:
  - the SemVer version string
  - the release's normalized-file-tree `integrity` value when available
  - the version's volume-level dependency declarations needed for candidate pruning
  - lifecycle/status information needed to exclude unavailable versions from ordinary resolution, such as yanked, tombstoned, blocked, or unavailable states when such states are represented by the bibliotheca
  - a pointer to the authoritative exact release metadata endpoint
- clients MAY use the version index to choose candidate versions before fetching exact release metadata
- clients MUST still fetch exact release metadata before installation or trust evaluation
- exact release metadata and normalized-file-tree integrity remain authoritative for release validation
- if version index data conflicts with exact release metadata, clients and bibliothecas MUST treat that as an inconsistent registry state rather than silently preferring the index
- bibliothecas are expected to update the version index promptly when publish, unpublish, yank, tombstone, blocking, or equivalent version-state changes occur
- the v0.1 core MUST NOT require Cargo's physical index layout, path sharding algorithm, Git-backed index storage, sparse-index URL layout, append-only file format, or replication protocol
- bibliothecas MAY implement the version index using database queries, generated JSON documents, static files, CDN-backed sparse indexes, Git-backed indexes, or other local storage mechanisms as long as the normative API contract and conformance behavior are preserved

This decision does not define one universal version-selection algorithm. It provides the version discovery data surface needed by the resolver baseline and later SemVer range grammar work.

## Consequences

- Good, because clients can resolve with fewer round trips than a release-pointer-only index would require
- Good, because dependency-resolution fixtures can use version rows as concrete resolver inputs
- Good, because package-level indexes can be cached or incrementally refreshed by implementations that need scale
- Good, because status metadata such as yanked or unavailable can be represented near the version candidates that depend on it
- Good, because the standard avoids overcommitting to Cargo's physical index storage and delivery mechanics
- Neutral, because exact release metadata remains necessary before installation, so the index is not a complete substitute for release fetches
- Neutral, because bibliothecas must keep index rows and exact release metadata synchronized after lifecycle changes
- Bad, because the index duplicates a subset of release metadata and therefore introduces an inconsistency surface
- Bad, because adding dependency metadata to the index increases the version discovery contract compared with a minimal pointer-only endpoint

## Confirmation

- Verify that the specification distinguishes catalog search from resolver-facing version indexes
- Verify that the OpenAPI contract exposes a package-scoped version index read surface without requiring one physical index storage layout
- Verify that exact release metadata remains the authoritative release validation surface
- Verify that conformance fixtures include version-index rows as resolver inputs
- Verify that lockfile format remains out of scope
- Verify that prerelease-selection policy remains client-local unless a later decision changes it
- Verify that meta packages remain lightweight and do not gain closure-level bundle semantics through this index model

## Pros and Cons of the Options

### Adopt a Cargo-style version index row model while leaving physical index layout/storage local

- Good, because version rows can contain the dependency, status, and integrity data needed for efficient candidate pruning
- Good, because it enables package-level caching and incremental update strategies without freezing one storage protocol
- Good, because it gives conformance fixtures a concrete resolver input shape
- Good, because it can support both hosted archive and Git-backed delivery by pointing back to exact release metadata
- Neutral, because the standard must define enough row fields to be useful without defining a full solver
- Bad, because it duplicates some release metadata and requires explicit inconsistency handling

### Adopt a thin PyPI Simple-style file/link index

- Good, because it is simple and static-hosting friendly
- Good, because file hashes and artifact links are easy for clients to consume
- Neutral, because it can work well for file-centric distribution ecosystems
- Bad, because Agent Volumes uses normalized-file-tree release subjects rather than treating transport files as the canonical trust subject
- Bad, because it provides too little dependency/status metadata for efficient resolver input
- Bad, because it risks encouraging clients to bypass exact release metadata

### Adopt a minimal package metadata endpoint containing only version and release pointers

- Good, because it is the smallest possible version discovery addition
- Good, because it keeps exact release metadata clearly authoritative
- Good, because it minimizes duplicated metadata
- Neutral, because it can be extended later with additional row fields
- Bad, because clients may need many extra release metadata fetches before resolving dependencies
- Bad, because resolver conformance fixtures remain less direct unless they separately provide candidate metadata

### Adopt an npm-style rich package document

- Good, because a single package document can contain most data needed by clients
- Good, because it is familiar to many package-manager implementers
- Neutral, because abbreviated variants could reduce payload size
- Bad, because full package documents can become large and cache-unfriendly
- Bad, because it risks importing npm-like dist-tag, resolver, and package-manager semantics into a runtime-neutral v0.1 core prematurely
- Bad, because it increases the risk that the index becomes treated as the canonical release metadata surface

### Adopt an OCI-style descriptor/tag graph as the primary version discovery model

- Good, because OCI descriptors and referrers are strong for content-addressed artifact graphs and attached metadata
- Good, because it aligns naturally with digest-oriented storage systems
- Neutral, because OCI-style approaches may remain useful as an implementation strategy or future profile
- Bad, because tag listing is a weak package-version catalog for Agent Volumes
- Bad, because it overfits artifact registry mechanics and does not align cleanly with Git-backed delivery
- Bad, because it would pull the v0.1 registry API toward OCI semantics that are not otherwise required by the current standard
