---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use append-only mutability for release-scoped trust attachments

## Context and Problem Statement

Agent Volumes now has a much more concrete release trust model: the published release subject is digest-bound, trust metadata discovery is concrete, and BOM/provenance/signature artifacts are part of the v0.1 core baseline.

That leaves an important lifecycle question unresolved: **after a release is published, can new trust attachments be added to that release later, or must the full trust-attachment set be frozen at publication time?**

This matters for later-generated attestations, additional signatures, independent audit artifacts, and evolving trust evidence that still binds to the same immutable release subject.

## Decision Drivers

- Preserve immutable release content identity while supporting realistic trust-artifact lifecycle needs
- Allow additional evidence to be attached later without weakening the release subject model
- Prevent silent replacement or reinterpretation of previously published trust artifacts
- Keep trust discovery semantics stable enough for clients and bibliothecas

## Considered Options

- A — Append-only trust-attachment mutability
- B — Fully fixed trust-attachment snapshot at release time
- C — Leave attachment mutability to bibliotheca policy

## Decision Outcome

Chosen option: **A — Append-only trust-attachment mutability**, because it best balances immutable release identity with realistic operational trust-artifact growth.

Under this decision:

- the published release content identity remains immutable
- the set of trust attachments associated with that release MAY grow over time
- newly added trust attachments MUST remain traceably bound to the same release subject
- previously published trust attachments MUST NOT be silently replaced, rewritten, or reinterpreted as if they were the original artifacts

### Consequences

- Good, because additional valid trust evidence can be attached after release without mutating the release subject
- Good, because later-generated provenance, signatures, or third-party attestations remain compatible with the trust model
- Good, because append-only semantics preserve history better than replacement-oriented models
- Neutral, because clients may need a notion of trust-metadata observation time or snapshot view in addition to current-state discovery
- Bad, because the trust-metadata lifecycle becomes more complex than a fully frozen snapshot model

### Confirmation

- Verify that later-added trust attachments can be discovered without changing the release's immutable content identity
- Verify that the API and conformance language can distinguish between adding a new attachment and mutating an existing one
- Verify that clients can consume append-only trust metadata without ambiguity about release identity

## Pros and Cons of the Options

### A — Append-only trust-attachment mutability

- Good, because it supports realistic operational growth of release-bound trust evidence
- Good, because it preserves immutable release identity while allowing later attestations and signatures
- Good, because it supports traceable accumulation of trust artifacts better than replacement models
- Neutral, because clients may need clearer guidance on snapshot vs current-state views
- Bad, because it introduces more lifecycle complexity than a fully fixed snapshot

### B — Fully fixed trust-attachment snapshot at release time

- Good, because it provides the simplest mental model for auditing and caching
- Good, because the complete trust set is frozen from the start
- Neutral, because it may suit highly controlled publication pipelines where all trust material exists up front
- Bad, because it makes later valid attestations or third-party audit artifacts hard to accommodate
- Bad, because it is less flexible than many real-world trust workflows require

### C — Leave attachment mutability to bibliotheca policy

- Good, because it maximizes implementation freedom for early registries
- Good, because different bibliothecas could experiment with different lifecycle models
- Neutral, because some ecosystems do rely on repository-local policy rather than standardizing lifecycle semantics
- Bad, because trust discovery semantics would vary too much across implementations
- Bad, because it conflicts with the broader decision to make the trust layer more concretely interoperable in v0.1
