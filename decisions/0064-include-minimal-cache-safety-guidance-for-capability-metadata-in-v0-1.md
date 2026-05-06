---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Include minimal cache-safety guidance for capability metadata in v0.1

## Context and Problem Statement

ADR-0062 establishes a dedicated registry-level endpoint for bibliotheca capability metadata, and ADR-0063 makes that document self-describing with explicit version fields.

That leaves an operational question unresolved: **should the core spec say anything about capability-metadata caching, or should caching behavior be left entirely unspecified?**

Clients will often want to cache registry-wide metadata for efficiency, but capability policy can still evolve over time.

## Decision Drivers

- Support practical client implementations that want to cache registry-wide metadata
- Avoid forcing an unnecessarily heavy caching contract into the first baseline
- Preserve awareness that capability metadata can evolve over time
- Keep the dedicated capability endpoint operationally useful without over-specifying HTTP behavior

## Considered Options

- A — Include minimal cache-safety guidance
- B — Define a stronger caching contract in the core spec
- C — Leave caching semantics entirely out of scope

## Decision Outcome

Chosen option: **A — Include minimal cache-safety guidance**, because it gives implementers useful operational guidance without making the v0.1 core too heavy.

Under this decision:

- capability metadata may be treated as a cacheable resource
- clients should still be prepared for capability and policy evolution over time
- standard HTTP freshness or validation mechanisms may be used where applicable
- the v0.1 core does not attempt to define a highly prescriptive caching contract for the capability endpoint

### Consequences

- Good, because client implementations gain practical guidance for capability-metadata reuse
- Good, because the dedicated endpoint remains efficient to consume without being treated as immutable forever
- Good, because the spec acknowledges policy evolution without requiring a heavy protocol contract
- Neutral, because richer caching expectations may still be added later if operational evidence justifies them
- Bad, because some client/server behaviors around cache freshness remain less tightly standardized than they would under a stronger contract

### Confirmation

- Verify that clients can cache capability metadata safely enough for normal use while still tolerating evolution over time
- Verify that the guidance remains consistent with ordinary HTTP validation or freshness mechanisms where available
- Verify that the capability endpoint remains practical to consume without stronger required caching semantics

## Pros and Cons of the Options

### A — Include minimal cache-safety guidance

- Good, because it supports practical caching behavior without overcommitting the baseline spec
- Good, because it acknowledges that capability metadata is useful to reuse but not permanently frozen
- Good, because it aligns with the broader implementation-ready but disciplined scope of v0.1
- Neutral, because implementations may still differ in how aggressively they cache within the broad guidance
- Bad, because some finer-grained caching behavior remains outside the stricter core contract

### B — Define a stronger caching contract in the core spec

- Good, because it could make client/server cache behavior more predictable
- Good, because some large-scale ecosystems may benefit from stronger freshness or validation guarantees
- Neutral, because a later mature version may eventually decide to standardize stronger caching behavior
- Bad, because it adds operational protocol weight that may be unnecessary for the first baseline
- Bad, because it risks over-specifying HTTP behavior before enough implementation evidence exists

### C — Leave caching semantics entirely out of scope

- Good, because it keeps the core spec simpler
- Good, because implementations can choose any local caching behavior they prefer
- Neutral, because some very small ecosystems may tolerate underspecified cache behavior initially
- Bad, because the dedicated capability endpoint becomes less operationally well-defined
- Bad, because clients lose useful baseline guidance about safe reuse of capability metadata
