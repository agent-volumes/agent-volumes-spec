---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Key bridge removal targets to spec version with optional phase or profile context in v0.1+

## Context and Problem Statement

ADR-0078 establishes that bridge metadata must include explicit end-state and removal-target semantics. That still leaves a modeling question unresolved: **what should the removal target be keyed to?**

If the target is too human-oriented, tooling support weakens. If it is too narrow and machine-oriented, some governance context useful to human readers may be lost.

## Decision Drivers

- Preserve a machine-readable and automatable removal target for tooling
- Support human-readable migration context where it adds value
- Keep bridge end-state metadata aligned with spec release governance
- Avoid making removal targeting too vague for interoperability-aware tooling

## Considered Options

- A — Key removal targets to spec version with optional phase/profile context
- B — Key removal targets to spec version only
- C — Key removal targets mainly to phase/profile labels

## Decision Outcome

Chosen option: **A — Key removal targets to spec version with optional phase/profile context**, because it best balances machine-readability and human governance context.

Under this decision:

- the primary machine-readable removal target in bridge metadata is an Agent Volumes specification version reference
- an additional optional phase or profile label may be included when it helps communicate migration context to humans or policy layers
- tooling can rely on the spec-version target while still benefiting from richer contextual signaling when present

### Consequences

- Good, because tooling gets a clear primary target reference
- Good, because human-facing migration context can still be expressed without replacing the machine-readable anchor
- Good, because bridge metadata stays aligned with the spec's release-oriented governance model
- Neutral, because some bridges may not need a meaningful phase/profile label beyond the version target
- Bad, because the metadata model is slightly richer than a spec-version-only design

### Confirmation

- Verify that bridge metadata can express a primary spec-version removal target consistently
- Verify that optional phase/profile context improves human comprehension without weakening the version anchor
- Verify that tooling can ignore optional contextual labels and still act correctly on the version target alone

## Pros and Cons of the Options

### A — Key removal targets to spec version with optional phase/profile context

- Good, because it gives tooling a strong primary target while preserving useful human context
- Good, because it avoids making migration metadata either too vague or too narrowly machine-only
- Good, because it aligns naturally with release governance and profile layering decisions already made
- Neutral, because not every bridge will necessarily need the optional contextual label
- Bad, because the metadata model is a bit richer than the absolute minimum

### B — Key removal targets to spec version only

- Good, because it is extremely clear and machine-friendly
- Good, because it minimizes metadata complexity
- Neutral, because some bridges may be perfectly understandable with a version target alone
- Bad, because it loses some human-facing migration context that may be helpful
- Bad, because it leaves less room to connect bridge timing to profile or phase-oriented narratives when those matter

### C — Key removal targets mainly to phase/profile labels

- Good, because it can fit governance narratives that think more in terms of transition stages than exact releases
- Good, because some humans may find phase/profile wording more intuitive than raw version references
- Neutral, because later governance documents may still use these labels for explanatory context
- Bad, because tooling gets a weaker machine-readable anchor
- Bad, because phase/profile labels are less precise and more interpretation-heavy for operational migration logic
