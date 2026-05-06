---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Standardize a small fixed advisory severity vocabulary in v0.1

## Context and Problem Statement

The advisory model in Agent Volumes is becoming more concrete, and advisory payloads now need a stable enough shape for client filtering, display, and future policy behavior.

That creates a vocabulary question: **should advisory severity values be standardized in the v0.1 core, left implementation-defined, or replaced by a score-first model?**

Without a stable baseline vocabulary, severity-aware client behavior and advisory interoperability would remain weaker than the increasingly concrete API and conformance direction of the draft.

## Decision Drivers

- Make advisory severity portable across bibliothecas and clients
- Keep the first interoperable severity model simple and familiar
- Support filtering, display, and future policy behavior consistently
- Avoid introducing an unnecessarily heavy scoring model into the first advisory baseline

## Considered Options

- A — Standardize a small fixed advisory severity vocabulary
- B — Leave severity values implementation-defined
- C — Use a score-first severity model

## Decision Outcome

Chosen option: **A — Standardize a small fixed advisory severity vocabulary**, because it gives the advisory API a stable and familiar baseline without making v0.1 significantly heavier.

Under this decision, the v0.1 advisory model should use a small fixed severity vocabulary, such as:

- `critical`
- `high`
- `medium`
- `low`
- `none` or `unknown`

The exact final vocabulary and any normalization details should be made explicit in the advisory schema, but the baseline model is intentionally small and fixed.

### Consequences

- Good, because advisory severity becomes portable across registries and clients
- Good, because filtering and user-facing interpretation become easier to standardize
- Good, because future severity-aware policy behavior gains a stable baseline to build on
- Neutral, because later profiles may still add richer scoring or mapping behavior
- Bad, because a small vocabulary is less expressive than a richer score-based system

### Confirmation

- Verify that advisory payloads can use the fixed severity vocabulary consistently across bibliothecas
- Verify that clients can filter and display advisory severity without registry-specific normalization logic
- Verify that the chosen vocabulary is sufficient for the baseline v0.1 advisory use cases

## Pros and Cons of the Options

### A — Standardize a small fixed advisory severity vocabulary

- Good, because it gives the advisory model a portable and familiar baseline
- Good, because it supports client filtering, display, and future policy behavior consistently
- Good, because it keeps the first interoperable severity model lightweight
- Neutral, because some ecosystems may later want richer scoring or mapping layers on top
- Bad, because it is less fine-grained than a score-based representation

### B — Leave severity values implementation-defined

- Good, because bibliothecas retain more freedom in representing local severity semantics
- Good, because the core spec avoids one more controlled vocabulary commitment
- Neutral, because some registries could still converge informally on common labels
- Bad, because clients would need registry-specific normalization for severity-aware behavior
- Bad, because advisory interoperability would remain weaker than the rest of the concrete API direction

### C — Use a score-first severity model

- Good, because it can support more precise severity modeling in principle
- Good, because later advanced policy engines may benefit from more granular scoring data
- Neutral, because a mature future ecosystem may eventually prefer stronger score-oriented semantics
- Bad, because it makes the first advisory baseline unnecessarily heavy
- Bad, because it introduces more complexity than is needed for the v0.1 interoperability target
