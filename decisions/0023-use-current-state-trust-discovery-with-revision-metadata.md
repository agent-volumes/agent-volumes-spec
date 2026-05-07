---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use current-state trust discovery with revision metadata in v0.1

## Context and Problem Statement

ADR-0022 establishes that release-scoped trust attachments are append-only: the immutable release subject does not change, but new trust attachments may be added later.

That creates a discovery question for the trust metadata API: **when a client queries trust metadata for a release, should the API expose only the current attachment set, should it expose current state plus revision-style metadata, or should it support fully snapshot-addressable retrieval in v0.1?**

The answer affects how clients reason about append-only growth, auditing, and observation context.

## Decision Drivers

- Keep the v0.1 trust discovery API practical and implementable
- Ensure clients can tell what trust-metadata state they are observing
- Preserve compatibility with append-only trust attachment growth
- Avoid forcing full historical snapshot retrieval into the first interoperable draft unless necessary

## Considered Options

- A — Current-state view only
- B — Current-state view plus revision/observation metadata
- C — Fully snapshot-capable trust discovery API

## Decision Outcome

Chosen option: **B — Current-state view plus revision/observation metadata**, because it preserves a practical API while still giving clients enough information to interpret append-only trust growth meaningfully.

Under this decision:

- the trust metadata discovery API returns the current known attachment set for a release
- the API MUST also provide metadata sufficient to indicate what state is being observed, such as an observation timestamp, revision identifier, snapshot token, or equivalent standardized metadata
- v0.1 does not require full historical or time-addressable trust-set retrieval as a core capability

### Consequences

- Good, because clients can distinguish current-state trust discovery from an unspecified historical snapshot
- Good, because append-only trust growth remains intelligible without requiring a full snapshot API
- Good, because the v0.1 API stays lighter than a full revision-addressable model
- Neutral, because later versions may still add stronger historical retrieval semantics
- Bad, because some audit and reproducibility workflows may still need future expansion beyond current-state plus revision metadata

### Confirmation

- Verify that the trust metadata API can expose the current attachment set together with standardized observation/revision metadata
- Verify that clients can tell what state they are seeing without needing full historical retrieval
- Verify that append-only attachment growth does not create ambiguity about current-state discovery responses

## Pros and Cons of the Options

### A — Current-state view only

- Good, because the API remains very simple
- Good, because the most common client case can retrieve the latest trust state easily
- Neutral, because it may be acceptable in ecosystems where historical trust-state interpretation is not important
- Bad, because clients cannot tell much about the observation context of the returned trust set
- Bad, because append-only growth becomes harder to interpret rigorously without revision-style metadata

### B — Current-state view plus revision/observation metadata

- Good, because the API stays practical while still exposing state context
- Good, because it complements the append-only trust-attachment model well
- Good, because it gives clients a clearer basis for audit and comparison workflows without demanding full historical retrieval
- Neutral, because the exact standardized metadata field set still needs concrete API definition work
- Bad, because it is somewhat more complex than a pure current-state-only API

### C — Fully snapshot-capable trust discovery API

- Good, because it provides the strongest support for auditing and reproducibility workflows
- Good, because clients could retrieve specific historical trust states directly
- Neutral, because a later mature ecosystem may eventually want this capability
- Bad, because it would make the v0.1 trust API significantly heavier
- Bad, because it imposes more bibliotheca complexity than is necessary for the first interoperable draft
