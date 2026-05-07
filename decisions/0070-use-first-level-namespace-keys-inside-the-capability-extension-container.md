---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use first-level namespace keys inside the capability extension container in v0.1

## Context and Problem Statement

ADR-0069 establishes that non-core capability fields must live under a reserved extension container rather than appearing as ordinary peer fields. That still leaves a structural question unresolved: **how should namespacing work inside that reserved extension container?**

Without an internal namespacing rule, the extension container itself may still become a collision-prone flat space.

## Decision Drivers

- Keep extension metadata collision-resistant and structurally understandable
- Preserve a practical extension model that does not overcomplicate v0.1
- Make extension ownership or origin more visible to clients and humans
- Stay compatible with the broader goal of disciplined yet lightweight extensibility

## Considered Options

- A — Use first-level namespace keys inside the extension container
- B — Use a flat key space inside the extension container
- C — Require URI-like namespace identifiers inside the extension container

## Decision Outcome

Chosen option: **A — Use first-level namespace keys inside the extension container**, because it provides a practical and sufficiently strong namespacing boundary without making the v0.1 extension model unnecessarily heavy.

Under this decision:

- the reserved extension container is partitioned by first-level namespace keys
- extension authors group their extension fields under their own namespace key rather than mixing directly in one flat extension object
- the first-level namespace model is preferred over both flat-key and URI-heavy alternatives in v0.1

### Consequences

- Good, because extension metadata becomes easier to partition and reason about
- Good, because collision risk is reduced substantially without heavy namespace machinery
- Good, because extension ownership or origin becomes more visible structurally
- Neutral, because the exact naming policy for the namespace keys themselves may still need basic discipline guidance
- Bad, because extension authors must adopt one more layer of nesting rather than writing totally flat extension data

### Confirmation

- Verify that extension data can be partitioned cleanly by first-level namespace key without ambiguity
- Verify that clients can ignore unknown namespaces while still understanding the extension-container structure
- Verify that the chosen model reduces collision and naming chaos better than a flat extension space would

## Pros and Cons of the Options

### A — Use first-level namespace keys inside the extension container

- Good, because it strikes a practical balance between structure and simplicity
- Good, because it reduces naming collisions without a heavyweight namespace scheme
- Good, because it gives extensions a clearer ownership boundary
- Neutral, because some future ecosystem may still decide to add stronger namespace discipline later if needed
- Bad, because it requires nested structure rather than the flattest possible extension shape

### B — Use a flat key space inside the extension container

- Good, because it is slightly simpler to author at first glance
- Good, because some implementations may find a flatter object model easier to serialize directly
- Neutral, because flat extension keys can still adopt informal naming conventions if authors are disciplined
- Bad, because collision and ambiguity risk remain higher
- Bad, because the extension model loses some of the structural clarity gained by introducing a reserved extension container at all

### C — Require URI-like namespace identifiers inside the extension container

- Good, because it offers a very strong global uniqueness story in theory
- Good, because large cross-organizational ecosystems sometimes benefit from strongly namespaced extension identity
- Neutral, because a future more mature ecosystem may eventually decide that URI-like namespacing is worthwhile
- Bad, because it is too heavy and awkward for the v0.1 baseline
- Bad, because it raises authoring complexity more than needed for the initial extension model
