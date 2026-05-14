---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use a narrow operational core for bibliotheca capability metadata in v0.1

## Context and Problem Statement

ADR-0060 establishes that bibliothecas should expose structured capability metadata for scope/scopeless policy. That naturally raises a broader registry-design question: **how much capability metadata should be part of the v0.1 core surface?**

If the capability model is too small, client automation loses value. If it is too broad, the first interoperable capability surface risks becoming policy-heavy and overdesigned.

## Decision Drivers

- Keep the v0.1 capability surface immediately useful for clients
- Avoid turning the first capability model into an overly large negotiation framework
- Standardize the most operationally important registry-discovery facts first
- Preserve room to expand capability discovery later if the ecosystem proves it necessary

## Considered Options

- A — Use a narrow operational core for capability metadata
- B — Use a broader capability-negotiation model in the core
- C — Limit capability metadata to scope/scopeless policy only

## Decision Outcome

Chosen option: **A — Use a narrow operational core for capability metadata**, because it provides the most practical balance between immediate client value and baseline simplicity.

Under this decision, the v0.1 core capability-metadata model should cover a small operational baseline such as:

- scope/scopeless policy characteristics
- supported content-delivery modes
- trust-discovery availability
- advisory API availability

This decision intentionally does **not** pull a broader negotiation framework into the v0.1 core.

### Consequences

- Good, because clients gain structured discovery for the most operationally important registry capabilities
- Good, because the capability surface remains small enough to stabilize in v0.1
- Good, because registry-discovery value extends beyond only scope policy without becoming overly broad
- Neutral, because richer capability negotiation can still be added later if clearly justified
- Bad, because more advanced capability introspection remains outside the initial core

### Confirmation

- Verify that clients can use the narrow capability set to make the most important baseline interoperability decisions
- Verify that the capability surface remains compact and stable enough for v0.1
- Verify that registries can expose the chosen capability set without needing a much larger negotiation framework

## Pros and Cons of the Options

### A — Use a narrow operational core for capability metadata

- Good, because it gives clients practical structured discovery without making the surface too large
- Good, because it aligns well with the implementation-ready but still disciplined scope of v0.1
- Good, because it creates a clean base for later capability expansion if needed
- Neutral, because some richer negotiation needs remain intentionally outside the initial core
- Bad, because clients needing deeper capability introspection will still need later profile or version support

### B — Use a broader capability-negotiation model in the core

- Good, because it could support more powerful client adaptation and negotiation from the start
- Good, because areas such as trust-profile support or schema/artifact format support may eventually benefit from structured discovery
- Neutral, because a later, more mature ecosystem may well want this broader model
- Bad, because it makes the first capability surface heavier and more policy-rich than necessary
- Bad, because it risks standardizing negotiation dimensions before enough implementation evidence exists

### C — Limit capability metadata to scope/scopeless policy only

- Good, because it keeps the capability model very small
- Good, because it solves the immediately identified scopeless-policy discoverability problem directly
- Neutral, because some minimal ecosystems may not need much more at first
- Bad, because it leaves obvious adjacent discovery needs, such as delivery mode or trust/advisory availability, out of the structured capability surface
- Bad, because it reduces the overall practical value of capability metadata more than necessary

## More Information

This decision should be **revisited** if one or more of the following conditions becomes true:

- clients repeatedly need structured discovery of trust-profile support, stricter client-policy expectations, or schema/artifact format support to interoperate reliably
- multiple bibliothecas expose similar richer capability metadata informally and convergence pressure appears
- profile-based or enterprise-oriented workflows require more explicit machine-readable negotiation than the narrow operational core provides

If those triggers occur, a follow-up ADR or RFC should evaluate whether to expand the core capability model or introduce a richer profile-based capability layer.
