---
status: accepted
date: 12026-05-05
decision-makers: Yunseo Kim
---

# Use a dual-layer trust discovery model, with canonical attachment binding and bibliotheca API projection

## Context and Problem Statement

ADR-0007 established that a published Agent Volume release is identified by a dual subject:

- a logical package identity (`pkg:shelf/...@version`)
- a resolved immutable content identity (digest)

However, a second question remained open: once trust metadata such as BOMs, provenance attestations, signatures, and similar artifacts are bound to a published release, **how should clients discover and consume them?**

Several pressures must be balanced:

- The trust model should remain rigorous and preserve an explicit canonical binding between trust metadata and the published release subject.
- The user-facing and client-facing discovery model should remain simple and package-oriented.
- Agent Volumes is expected to prioritize **git-backed/community-hosted volumes** over a purely OCI-centric deployment model.
- Even so, the specification should remain compatible with OCI-style attachment and referrer-based ecosystems where appropriate.

This means the standard cannot simply copy an OCI-native referrers model as-is, because Agent Volumes is not primarily an OCI registry specification. At the same time, it should not collapse trust semantics into a registry-only API view that obscures what was actually signed, attested, or verified.

The decision therefore concerns the relationship between:

- the **canonical trust binding layer**
- and the **bibliotheca discovery API layer** exposed to clients and users

## Decision Drivers

- Preserve an explicit canonical trust model rooted in the published release subject
- Keep client workflows package-oriented and easy to consume
- Support git-backed/community volume delivery as a first-class and primary design target
- Avoid overfitting the standard to OCI-specific storage/discovery assumptions
- Retain compatibility with OCI-style attachment ecosystems where useful
- Provide a clean foundation for later rules on verification timing, advisory linkage, scanner integration, and conformance
- Ensure bibliothecas can normalize heterogeneous backend/storage models without changing trust semantics

## Considered Options

- A — Attachment-first canonical model, with the API acting as a thin projection of stored trust artifacts
- B — API-first canonical model, with attachment structures treated as backend implementation details
- C — Dual-layer model: canonical trust binding at the attachment layer, with bibliotheca APIs projecting that binding into a package-oriented discovery surface
- D — Path-dependent model: OCI-backed releases use one trust discovery model while git-backed/community releases use another

## Decision Outcome

Chosen option: "C", because it preserves a strong canonical trust-binding model while allowing bibliothecas to provide a package-oriented discovery surface that works well for git-backed/community volumes and remains compatible with OCI-style attachment ecosystems.

Under this approach:

- The **canonical trust semantics** remain defined at the attachment/binding layer.
- Trust metadata is normatively about the published release subject established by ADR-0007.
- A bibliotheca exposes a **package-facing discovery API** derived from that canonical binding.
- The discovery API MAY normalize differences in storage or transport models, but it MUST NOT alter the meaning of the underlying subject binding.
- Git-backed/community-hosted volumes are treated as a primary design target for the discovery surface, meaning clients should not need OCI-native knowledge to consume trust metadata correctly.
- OCI-style attachment/discovery patterns remain compatible implementation strategies, but they do not define the standard's primary user-facing interaction model.

### Consequences

- Good, because the standard preserves a rigorous answer to "what exactly was signed/attested?"
- Good, because clients can consume trust metadata through a package-oriented bibliotheca API rather than through backend-specific storage conventions
- Good, because git-backed/community volumes can participate fully in the trust model without requiring an OCI-native registry abstraction
- Good, because bibliothecas can support OCI-style attachment models internally where useful without forcing them on all clients
- Good, because later specification work can define discovery, verification, scanner, and advisory behavior against a stable two-layer architecture
- Neutral, because the specification must carefully distinguish canonical binding semantics from projected API views
- Bad, because bibliothecas must implement normalization logic across heterogeneous backend/storage models
- Bad, because conformance language must ensure that API projection remains faithful to the canonical binding layer rather than drifting into registry-specific reinterpretation

### Confirmation

- Verify that a conforming bibliotheca can expose the same trust semantics for both git-backed and OCI-backed releases
- Verify that a client can discover trust metadata through the bibliotheca API without needing backend-specific knowledge
- Verify that the projected API view remains losslessly traceable to the canonical release subject binding
- Verify that later verification and advisory workflows can rely on the API projection without ambiguity about the underlying release subject

## Pros and Cons of the Options

### A

- Good, because it keeps the trust model very close to the stored attachment artifacts
- Good, because it aligns well with OCI-native attachment/referrer ecosystems
- Bad, because it makes the client-facing model too dependent on backend storage conventions
- Bad, because it is a weaker fit for a git-backed/community-first ecosystem

### B

- Good, because it gives bibliothecas maximum freedom to design a clean user-facing API
- Good, because it can simplify client implementations in the short term
- Bad, because it risks obscuring or weakening the underlying trust semantics
- Bad, because it makes registry behavior, rather than canonical binding, the practical source of truth

### C

- Good, because it separates canonical trust meaning from client-facing discovery ergonomics
- Good, because it accommodates git-backed/community-first design without abandoning compatibility with OCI-style attachment patterns
- Good, because it provides a stable architectural basis for future trust-related specification work
- Neutral, because it requires disciplined specification wording about binding vs projection
- Bad, because bibliothecas must translate backend/storage diversity into a coherent projected discovery view

### D

- Good, because it can optimize separately for OCI-backed and git-backed paths
- Good, because it may reduce implementation friction for specific deployment models
- Bad, because it introduces avoidable conceptual fragmentation into the standard
- Bad, because it would make client and conformance behavior depend too heavily on the delivery path
