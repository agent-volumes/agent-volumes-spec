---
status: accepted
date: 12026-05-09
decision-makers: Yunseo Kim
---

# Adopt a two-phase trust attachment upload API for v0.1

## Context and Problem Statement

ADR-0022 establishes append-only mutability for release-scoped trust
attachments. ADR-0023 establishes current-state trust discovery with revision
metadata, ADR-0026 represents revocation through status metadata, and ADR-0030
defines a canonical trust-discovery endpoint family. The current specification
therefore has a concrete read/discovery model for trust attachments, but it does
not yet define a portable write/upload API.

Trust attachments such as BOMs, provenance statements, signatures, and related
proof artifacts must be bound to an immutable release subject without silently
rewriting earlier trust evidence. A write API must also work across bibliothecas
with different storage backends without forcing the v0.1 core to standardize S3,
OCI, Git, local filesystem, or any other storage protocol.

That leaves a write architecture question: **should v0.1 define one portable
trust attachment upload flow, or should it standardize a broader control plane
that negotiates multiple upload modes?**

## Decision Drivers

- Preserve interoperability for independent write-capable clients and
  bibliothecas
- Bind trust attachments to the exact release subject and observed trust
  revision state
- Verify uploaded bytes against declared digest metadata before making an
  attachment available
- Preserve append-only attachment lifecycle and status-based revocation
- Avoid forcing one storage backend, object store, OCI registry model, or upload
  transport implementation
- Avoid expanding the v0.1 capability metadata surface into a complex upload-mode
  negotiation framework
- Keep governance policy, publisher trust tiers, and authorization policy details
  bibliotheca-local except for the minimum authorization boundary needed by the
  API

## Considered Options

- Adopt a mandatory two-phase trust attachment upload API
- Adopt a direct upload-only API
- Adopt a broad control-plane API with multiple negotiated upload modes
- Adopt an OCI-referrer-native trust attachment write model
- Keep trust attachment writes bibliotheca-local in v0.1

## Decision Outcome

Chosen option: **Adopt a mandatory two-phase trust attachment upload API**,
because it gives write-capable clients one portable flow while still allowing
bibliothecas to use direct storage, object storage, presigned URLs, OCI-backed
storage, or other backend implementations behind that flow.

Under this decision, a write-capable v0.1 bibliotheca exposes one standard
trust attachment upload lifecycle:

1. create an upload intent for a release-scoped trust attachment
2. upload the attachment bytes using the instructions returned by the
   bibliotheca
3. finalize the upload so the bibliotheca can verify digest, size, subject
   binding, and metadata consistency
4. expose the resulting attachment through the existing trust discovery model
   once it becomes available

The portable API contract should standardize at least:

- the upload intent request and response shape
- required subject binding to the volume version and release integrity or
  equivalent immutable release subject
- attachment category and format metadata consistent with the existing trust
  detail schema
- declared digest algorithm and digest value for the uploaded bytes
- declared size when available
- upload expiration semantics
- finalize/commit semantics
- standard terminal and retryable failure states
- idempotency and conflict semantics
- status transition into the existing `active`, `revoked`, `superseded`, and
  `invalid` trust attachment lifecycle
- minimum authorization semantics: the caller must be authorized to add trust
  attachments for the target release

The upload instructions returned by the bibliotheca may point to an internal API
endpoint, a presigned object-storage URL, a backend-specific staging area, or
another implementation-local upload target. Those storage details are not the
interoperability boundary. The interoperability boundary is the two-phase intent
and finalize contract plus the resulting standard trust attachment record.

The bibliotheca MUST NOT mark an attachment as available until it verifies that
the uploaded bytes match the declared digest and the attachment metadata binds to
the intended release subject. Digest mismatch, expired upload, authorization
failure, unsupported media type, payload too large, invalid state, and
idempotency conflict should be represented through standard API error semantics.

This decision does not standardize publisher governance workflows, review
processes, trust-tier assignment, transparency-log requirements, object-storage
protocols, OCI referrer protocols, multipart upload protocols, or a full
historical trust snapshot API.

## Reconsidering a broader control-plane model

The broader control-plane model with multiple negotiated upload modes may be
reconsidered in a later version if one or more of the following conditions hold:

- multiple independent bibliotheca implementations demonstrate that the
  mandatory two-phase flow is too restrictive for common production storage
  backends
- large trust artifacts, resumable uploads, multipart uploads, or CDN/object
  storage requirements become common enough that one portable two-phase flow is
  no longer sufficient
- OCI-backed or other artifact-registry-backed bibliothecas become common enough
  to justify a standardized native upload profile rather than treating those
  systems as backend implementations
- clients need first-class mode negotiation because a meaningful ecosystem of
  optional upload optimizations emerges
- capability metadata has matured enough to carry upload-mode negotiation without
  undermining v0.1's narrow operational core
- conformance experience shows that the two-phase contract prevents valid trust
  workflows that cannot be modeled as intent, upload, and finalize

Until those conditions are met, the v0.1 core favors one portable write flow over
a broader upload-mode negotiation surface.

## Consequences

- Good, because a write-capable client has one portable flow to implement
- Good, because the flow naturally supports digest declaration before
  availability
- Good, because direct upload, presigned URL upload, and backend-specific staging
  can be hidden behind the same intent/finalize contract
- Good, because the capability metadata surface stays smaller than a multi-mode
  negotiation model
- Good, because append-only lifecycle and status-based revocation remain aligned
  with prior trust decisions
- Neutral, because bibliothecas still need to manage pending uploads,
  expiration, and finalize failure states
- Neutral, because direct upload remains possible as an implementation strategy,
  but not as the only portable API shape
- Bad, because very simple bibliothecas must implement upload intent and finalize
  concepts even if their internal storage is direct
- Bad, because OCI-native or object-storage-native clients cannot rely on those
  native protocols as the core Agent Volumes write contract

## Confirmation

- Verify that the OpenAPI contract defines an upload intent and finalize flow for
  release-scoped trust attachments
- Verify that trust attachment writes require subject binding to the immutable
  release subject
- Verify that uploaded bytes are digest-checked before attachments become
  available in discovery
- Verify that failed, expired, or conflicting uploads cannot silently create
  active trust attachments
- Verify that revocation and supersession continue to use status metadata rather
  than deletion or replacement
- Verify that direct, presigned, object-storage, and OCI-backed implementations
  can be hidden behind the standard two-phase contract
- Verify that capability metadata does not need a broad upload-mode negotiation
  matrix for the v0.1 baseline
- Verify that future reconsideration triggers for a broader control-plane model
  remain documented

## Pros and Cons of the Options

### Adopt a mandatory two-phase trust attachment upload API

- Good, because it provides the strongest generic write interoperability among
  the realistic options
- Good, because intent and finalize phases make digest verification and failure
  handling explicit
- Good, because storage backends remain implementation details behind the
  portable contract
- Good, because it avoids a complex upload-mode negotiation matrix in v0.1
- Neutral, because the API is more complex than a single direct upload endpoint
- Bad, because implementations must track pending upload state and cleanup
  expired intents

### Adopt a direct upload-only API

- Good, because it is the simplest endpoint shape for small artifacts and simple
  bibliothecas
- Good, because clients can upload metadata and bytes in one request
- Neutral, because a direct endpoint can still perform digest validation before
  activation
- Bad, because it couples the API server more tightly to payload handling and
  storage implementation details
- Bad, because it fits presigned object storage, resumable upload, CDN, and
  backend-staging workflows less naturally

### Adopt a broad control-plane API with multiple negotiated upload modes

- Good, because it maximizes storage and transport flexibility
- Good, because it can expose direct upload, presigned upload, OCI-backed upload,
  multipart upload, and other modes explicitly
- Neutral, because it may become attractive once multiple mature implementation
  profiles exist
- Bad, because it expands capability discovery and conformance substantially
- Bad, because write interoperability becomes weaker unless one mandatory upload
  mode is still required
- Bad, because it risks making v0.1 look storage-neutral by becoming protocol
  ambiguous

### Adopt an OCI-referrer-native trust attachment write model

- Good, because OCI referrer semantics strongly align with digest-bound trust
  artifacts
- Good, because it fits existing SBOM, provenance, signature, and artifact
  registry ecosystems
- Neutral, because OCI-backed bibliothecas may use this internally
- Bad, because it would bind the v0.1 core too closely to one registry substrate
- Bad, because Git-backed, database-backed, static-file, or custom bibliothecas
  would need unnecessary OCI-specific machinery

### Keep trust attachment writes bibliotheca-local in v0.1

- Good, because it minimizes immediate specification work
- Good, because bibliothecas could experiment with authoring flows before the
  standard commits to one
- Neutral, because read/discovery interoperability would still exist
- Bad, because write-capable clients would need registry-specific adapters
- Bad, because digest verification, idempotency, and lifecycle failure semantics
  would diverge at the point where trust metadata enters the system
