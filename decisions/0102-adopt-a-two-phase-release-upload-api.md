---
status: accepted
date: 12026-05-09
decision-makers: Yunseo Kim
---

# Adopt a two-phase release upload API for hosted archive publishing in v0.1

## Context and Problem Statement

ADR-0013 establishes that `integrity` is the digest of a normalized file tree,
not arbitrary transport bytes. ADR-0014 defines the normalization rule set needed
for independent implementations to compute the same digest, and ADR-0090
standardizes `.tar.gz` as the canonical packaged release transport format for
hosted archive workflows while preserving the normalized file tree as the
canonical release subject.

The current registry API prose and OpenAPI contract describe publish as a direct
`POST` of `application/gzip` bytes. ADR-0099, however, already adopts a two-phase
intent/finalize model for release-scoped trust attachment uploads. That creates
an asymmetry: relatively small proof artifacts get a robust staged write
lifecycle, while release artifacts, which are more likely to be large and to need
archive validation, manifest validation, permission checks, malware scanning,
digest computation, and CDN/object-storage staging, are uploaded directly.

That leaves a write architecture question: **should hosted release upload remain
a direct binary publish endpoint, or should v0.1 use the same two-phase
intent/finalize shape for release artifacts that it uses for trust attachments?**

## Decision Drivers

- Preserve one portable hosted release publishing flow for independent clients and
  bibliothecas.
- Keep `.tar.gz` as the canonical hosted archive transport while preserving the
  normalized file tree as the release integrity subject.
- Let bibliothecas stage large release bytes without forcing API servers to be the
  byte sink.
- Support object storage, presigned upload URLs, internal staging, direct upload,
  and other backend implementations behind one API shape.
- Make finalize-time validation explicit for archive profile validity, manifest
  identity, package/version conflicts, permission escalation, and normalized-file
  tree digest computation.
- Avoid making release upload less robust than trust attachment upload.
- Avoid expanding v0.1 into a broad upload-mode negotiation framework.

## Considered Options

- Keep direct release upload/download with canonical tree-digest validation.
- Adopt a two-phase release upload intent/finalize API.
- Use exact transport-byte digest as the release identity.
- Adopt a backend-neutral transfer profile with multiple negotiated modes.

## Decision Outcome

Chosen option: **Adopt a two-phase release upload intent/finalize API**, because
it removes the asymmetry with trust attachment uploads and gives hosted release
publishing a robust lifecycle for staging, validation, conflict handling, and
activation without standardizing any particular storage backend.

Under this decision, a write-capable v0.1 bibliotheca exposes one standard hosted
release upload lifecycle:

1. create a release upload intent for a target volume identity and version
2. upload the `.tar.gz` release bytes using the instructions returned by the
   bibliotheca
3. finalize the upload so the bibliotheca can validate the archive, manifest
   identity, authorization, version conflict state, permission model, and
   normalized-file-tree integrity
4. expose the resulting release metadata and distribution metadata only after the
   release is accepted

The portable API contract should standardize at least:

- the release upload intent request and response shape
- target identity binding to a scopeless or scoped volume name and SemVer version
- expected hosted archive media type, `application/gzip`, for the portable
  `.tar.gz` release transport
- declared uploaded-byte digest and declared size when supplied by the client
- upload expiration semantics
- finalize/commit semantics
- idempotency and package-version conflict semantics
- standard terminal and retryable failure states
- the rule that the bibliotheca computes the authoritative normalized-file-tree
  `integrity` value during finalize before the release becomes available
- minimum authorization semantics: the caller must be authorized to publish the
  target volume identity or namespace under ADR-0101

The upload instructions returned by the bibliotheca may point to an internal API
endpoint, a presigned object-storage URL, a backend-specific staging area, a
direct upload target, or another implementation-local upload target. Those
storage details are not the interoperability boundary. The interoperability
boundary is the two-phase intent and finalize contract plus the resulting exact
release metadata.

The bibliotheca MUST NOT make a release available until finalize succeeds. During
finalize, the bibliotheca MUST verify at least that:

- uploaded bytes are present and match any declared uploaded-byte digest and size
  constraints
- the uploaded bytes are a valid gzip-compressed tar archive under the v0.1 hosted
  archive transport profile
- the archive contains valid release files and a valid manifest
- the manifest identity is consistent with the target upload path
- the target package version is not already published, tombstoned, blocked, or
  otherwise unavailable for reuse under the version lifecycle rules
- the caller remains authorized to publish the target identity
- the release does not contain permission escalation under the client-side publish
  validation rule, when the bibliotheca performs publish-time validation
- the authoritative release `integrity` value can be computed from the normalized
  file tree

Digest mismatch, expired upload, authorization failure, unsupported media type,
payload too large, invalid archive, invalid manifest, missing uploaded bytes,
invalid upload state, idempotency conflict, subject or identity mismatch, and
package-version conflict should be represented through standard API error
semantics.

This decision does not standardize object-storage protocols, multipart upload
protocols, resumable upload chunk formats, CDN cache policy, byte-range download
requirements, artifact quarantine or malware-scanning policy, publisher review
workflows, or a broad upload-mode negotiation framework.

Direct release upload remains possible as an implementation strategy behind the
returned upload instructions, but direct binary `POST` of release bytes is no
longer the portable hosted release publishing boundary.

## Reconsidering a backend-neutral multi-mode transfer profile

The broader backend-neutral transfer profile with multiple negotiated upload or
download modes may be reconsidered in a later version if one or more of the
following conditions hold:

- multiple independent bibliotheca implementations demonstrate that one portable
  two-phase release upload flow is too restrictive for common production storage
  backends
- large release artifacts, resumable uploads, multipart uploads, range-aware
  downloads, CDN/object-storage requirements, or offline mirroring become common
  enough that a single opaque upload-instruction mechanism is no longer adequate
- OCI-backed or other artifact-registry-backed bibliothecas become common enough
  to justify a standardized native release upload/download profile rather than
  treating those systems as backend implementations
- clients need first-class transfer-mode negotiation because a meaningful
  ecosystem of optional upload or download optimizations emerges
- capability metadata has matured enough to carry transfer-mode negotiation
  without undermining v0.1's narrow operational core
- conformance experience shows that the two-phase contract prevents valid release
  publishing workflows that cannot be modeled as intent, upload, and finalize
- security or compliance requirements make it necessary to standardize stronger
  staging, quarantine, scanning, or transparency semantics before release
  activation

Until those conditions are met, the v0.1 core favors one portable release upload
lifecycle over a broader transfer-mode negotiation surface.

## Consequences

- Good, because hosted release publishing now has the same robust lifecycle shape
  as trust attachment upload.
- Good, because large release artifacts can be staged outside the API server while
  keeping one portable finalize contract.
- Good, because finalize cleanly separates byte arrival from release activation.
- Good, because archive validation, manifest identity checks, version conflicts,
  permission checks, and integrity computation have one explicit commit point.
- Good, because direct upload, presigned URL upload, object-storage staging, and
  backend-specific staging can be hidden behind the same intent/finalize contract.
- Good, because release identity remains the normalized-file-tree digest rather
  than transport bytes.
- Neutral, because bibliothecas must manage pending release upload state,
  expiration, cleanup, and finalize failures.
- Neutral, because simple implementations may still use direct upload internally,
  but not as the portable API shape.
- Bad, because release publishing becomes more complex than one binary `POST`.
- Bad, because clients must implement upload-intent and finalize behavior even for
  small releases.

## Confirmation

- Verify that the OpenAPI contract defines a release upload intent and finalize
  flow for hosted archive publishing.
- Verify that the portable hosted release upload flow still uses `.tar.gz` /
  `application/gzip` as the baseline release transport.
- Verify that release activation cannot occur before finalize succeeds.
- Verify that the bibliotheca computes normalized-file-tree `integrity` during
  finalize and that transport-byte digests remain non-authoritative hints.
- Verify that failed, expired, conflicting, or invalid uploads cannot silently
  create published releases.
- Verify that direct, presigned, object-storage, and backend-specific staging can
  be hidden behind the standard two-phase contract.
- Verify that this decision does not define multipart upload protocols, CDN cache
  policy, byte-range download behavior, or a broad transfer-mode negotiation
  matrix for the v0.1 baseline.
- Verify that future reconsideration triggers for a broader backend-neutral
  transfer profile remain documented.

## Pros and Cons of the Options

### Keep direct release upload/download with canonical tree-digest validation

- Good, because it is the smallest API surface and matches the earlier direct
  publish sketch.
- Good, because server and client validation can still rely on normalized-file-tree
  integrity.
- Good, because small releases and simple bibliothecas are easy to support.
- Neutral, because direct upload can still be used internally under the chosen
  two-phase model.
- Bad, because release upload remains less robust than trust upload even though
  release artifacts are often larger and more operationally sensitive.
- Bad, because object-storage staging, retry behavior, expiration, and finalize
  diagnostics fit less naturally.

### Adopt a two-phase release upload intent/finalize API

- Good, because it aligns release upload with the trust upload lifecycle.
- Good, because it supports large artifacts, object storage, presigned URLs,
  backend staging, and explicit commit semantics without standardizing backend
  protocols.
- Good, because finalize gives the bibliotheca one point to validate archive
  structure, manifest identity, conflicts, permissions, and normalized-tree
  integrity.
- Good, because it avoids a broad transfer-mode negotiation matrix in v0.1.
- Neutral, because the API is more complex than direct upload.
- Bad, because implementations must track pending release upload state and cleanup
  expired intents.

### Use exact transport-byte digest as the release identity

- Good, because byte-for-byte artifact verification is simple and cache-friendly.
- Good, because it aligns with some blob-store and OCI-style mental models.
- Neutral, because a transport-byte digest may still be useful as an optional
  staging or diagnostic hint.
- Bad, because it conflicts with ADR-0013 and ADR-0090 by making archive bytes the
  trust subject.
- Bad, because harmless gzip or tar serialization differences would change release
  identity even when the normalized file tree is unchanged.
- Bad, because Git-backed and CDN-hosted releases become harder to reconcile under
  one immutable content identity.

### Adopt a backend-neutral transfer profile with multiple negotiated modes

- Good, because it maximizes flexibility for direct, presigned, multipart,
  resumable, OCI-backed, CDN-backed, and mirrored storage designs.
- Good, because it could eventually cover both upload and download optimizations
  explicitly.
- Neutral, because it may become attractive once multiple mature implementation
  profiles exist.
- Bad, because it expands capability metadata, client behavior, and conformance
  substantially.
- Bad, because write interoperability becomes weaker unless one mandatory transfer
  mode remains required.
- Bad, because it risks making v0.1 appear storage-neutral by becoming protocol
  ambiguous.
