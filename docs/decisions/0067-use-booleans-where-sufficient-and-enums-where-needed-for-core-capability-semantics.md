---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use booleans where sufficient and enums where needed for core capability semantics in v0.1

## Context and Problem Statement

ADR-0066 establishes that core capability fields should use small fixed vocabularies and booleans where practical. That leaves a more specific modeling question unresolved: **should capability support semantics be forced into a mostly boolean model, or should fields be allowed to use small enumerated states when interoperability needs more nuance than simple presence/absence?**

Some capabilities are naturally binary. Others have a few meaningful states that clients may need to distinguish. The baseline model needs to decide how much semantic nuance to preserve.

## Decision Drivers

- Keep the capability model practical and easy to consume
- Preserve useful semantic distinctions where a capability cannot be reduced cleanly to yes/no
- Avoid overcomplicating the baseline with unnecessarily rich state models
- Stay consistent with the broader small-vocabulary and machine-readable capability direction

## Considered Options

- A — Use booleans where sufficient and enums where needed
- B — Prefer mostly booleans
- C — Prefer mostly enums

## Decision Outcome

Chosen option: **A — Use booleans where sufficient and enums where needed**, because it best preserves practical simplicity without flattening important capability distinctions.

Under this decision:

- core capability fields use booleans where the capability is naturally binary
- fields may use small enumerated states where interoperability depends on distinguishing more than two meaningful support states
- the baseline model does not force one primitive representation across all capability semantics when that would reduce clarity

### Consequences

- Good, because simple capabilities remain easy to represent and consume
- Good, because more nuanced capabilities can still express the distinctions clients actually need
- Good, because the capability model remains pragmatic rather than doctrinaire about one value shape
- Neutral, because schema authors still need discipline in deciding when an enum is truly warranted
- Bad, because the capability document is slightly less uniform than a pure all-boolean model

### Confirmation

- Verify that binary capabilities can remain simple booleans without losing needed meaning
- Verify that multi-state capabilities can express their important distinctions through small enums where appropriate
- Verify that the mixed boolean/enum strategy remains understandable and predictable for implementers

## Pros and Cons of the Options

### A — Use booleans where sufficient and enums where needed

- Good, because it balances simplicity and expressiveness well
- Good, because it avoids collapsing important capability differences into overly simple booleans
- Good, because it aligns naturally with the broader structured capability direction already chosen
- Neutral, because some implementation guidance may still be useful when deciding whether a new capability should be boolean or enum-based
- Bad, because the capability model is less visually uniform than a pure one-type approach

### B — Prefer mostly booleans

- Good, because it keeps the capability document very simple and uniform
- Good, because binary values are easy for clients to parse and reason about
- Neutral, because some ecosystems may prioritize simplicity over nuance in early capability models
- Bad, because it can flatten distinctions that matter to interoperability
- Bad, because it may force awkward secondary conventions when a field really has more than two meaningful states

### C — Prefer mostly enums

- Good, because it captures more nuance in the core capability model
- Good, because some future capabilities may naturally fit small state machines better than booleans
- Neutral, because a later mature ecosystem may choose to represent more capability detail explicitly
- Bad, because it increases baseline complexity more than necessary for simple capabilities
- Bad, because it makes the capability model heavier and less approachable without always adding proportional value
