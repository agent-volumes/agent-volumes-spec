---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Defer structured deprecation metadata from the v0.1 core

## Context and Problem Statement

ADR-0053 establishes that the warning model in v0.1 should include a small structured warning-category set. That naturally raises a follow-up design question: **should deprecation itself also receive a structured core metadata model, or should richer deprecation metadata be deferred?**

Deprecation is an important evolution tool, but adding a structured deprecation model too early may expand the baseline more than necessary if migration semantics are not yet mature enough to standardize cleanly.

## Decision Drivers

- Keep the v0.1 baseline focused on the most immediately necessary interoperability surfaces
- Avoid prematurely standardizing deprecation structures before more migration experience exists
- Preserve room for later richer evolution and migration metadata
- Maintain warning-level visibility for deprecation concerns without forcing a deeper deprecation contract immediately

## Considered Options

- A — Include minimal structured deprecation metadata in the core model
- B — Represent deprecation only through warnings/text
- C — Defer structured deprecation metadata to later work

## Decision Outcome

Chosen option: **C — Defer structured deprecation metadata to later work**, because deprecation guidance is useful but does not yet need to become part of the v0.1 core structured contract.

Under this decision:

- the v0.1 core does not standardize a dedicated structured deprecation metadata model
- deprecation concerns may still be surfaced through warnings or textual guidance where appropriate
- richer machine-readable deprecation metadata is intentionally deferred to future profiles, RFCs, or later versions

### Consequences

- Good, because the baseline remains smaller and more focused on immediately necessary interoperability contracts
- Good, because later deprecation modeling can be informed by more real migration experience
- Good, because warning-level treatment remains available without forcing a larger core schema now
- Neutral, because some implementations may still experiment with richer deprecation metadata non-normatively
- Bad, because machine-readable migration guidance for deprecations remains weaker in v0.1

### Confirmation

- Verify that the v0.1 core remains usable without a dedicated deprecation metadata model
- Verify that deprecation concerns can still be surfaced at warning/text level where necessary
- Verify that later profiles or versions can add structured deprecation metadata without conflicting with the current baseline

## Pros and Cons of the Options

### A — Include minimal structured deprecation metadata in the core model

- Good, because it would provide more machine-readable migration guidance from the start
- Good, because it would connect naturally to the warning-category model already chosen
- Neutral, because some ecosystems may eventually want this kind of metadata as standard baseline behavior
- Bad, because it expands the baseline schema further in an area not yet proven essential for v0.1 interop
- Bad, because it risks premature standardization of migration semantics before enough implementation experience exists

### B — Represent deprecation only through warnings/text

- Good, because it keeps the model simple and avoids new structured fields
- Good, because human-readable migration guidance can still be expressed without additional schema work
- Neutral, because some ecosystems are comfortable treating deprecation as mostly textual guidance for a while
- Bad, because clients cannot reason about deprecation machine-readably beyond general warning semantics
- Bad, because migration tooling support remains weaker than it could be

### C — Defer structured deprecation metadata to later work

- Good, because it keeps the v0.1 baseline more focused and disciplined
- Good, because later deprecation modeling can be designed with more real-world evidence
- Good, because it avoids overcommitting the core to a migration model too early
- Neutral, because warnings and prose guidance still provide a temporary path for communicating deprecation
- Bad, because structured deprecation-driven tooling remains outside the baseline for now
