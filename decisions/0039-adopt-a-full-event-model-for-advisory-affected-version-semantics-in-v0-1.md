---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Adopt a full event model for advisory affected-version semantics in v0.1

## Context and Problem Statement

The current Agent Volumes draft shows a simple advisory example based on an affected version-range string and a `fixed-in` style field. That is easy to read, but it leaves important ambiguity around version-history interpretation, multiple affected segments, and interoperability with richer advisory ecosystems.

The specification therefore needs to decide whether the v0.1 advisory baseline should remain simple, move to a moderately structured range model, or adopt a full event-based model for affected-version semantics.

## Decision Drivers

- Reduce ambiguity in how affected version history is represented and interpreted
- Improve compatibility with richer vulnerability and advisory ecosystems
- Support more than one affected/fixed segment cleanly when needed
- Provide clients with a more explicit and future-proof basis for vulnerability applicability decisions

## Considered Options

- A — Structured range model
- B — Simple range string model
- C — Full event model

## Decision Outcome

Chosen option: **C — Full event model**, because it provides the clearest and most extensible baseline for affected-version semantics and aligns best with the increasingly interoperable direction of the advisory model.

Under this decision:

- the v0.1 advisory schema should support an event-style affected-version model rather than relying only on a simple range string
- the model should be able to express version-history transitions such as introduction, remediation, and last-affected boundaries in a structured way
- clients and bibliothecas should be able to interpret affected-version evolution without depending on registry-specific conventions or lossy reduction to one simple range string

### Consequences

- Good, because affected-version history becomes more explicit and less ambiguous
- Good, because interoperability with richer external advisory ecosystems improves
- Good, because multiple affected/fixed segments can be modeled more cleanly when necessary
- Neutral, because simpler advisories may still be representable as a trivial subset of the event model
- Bad, because the v0.1 advisory schema becomes more complex than a simple range-based baseline

### Confirmation

- Verify that the advisory schema can represent introduction, remediation, and related version-history transitions consistently
- Verify that clients can evaluate advisory applicability from the event model without registry-specific interpretation rules
- Verify that the chosen event model remains practical for baseline v0.1 advisory use while supporting more complex cases when needed

## Pros and Cons of the Options

### A — Structured range model

- Good, because it improves on a single range string without requiring the full weight of an event-sequencing model
- Good, because it can make fix guidance more explicit than the current simple draft example
- Neutral, because some ecosystems may find this to be a workable middle ground
- Bad, because it still leaves less expressive power than a full event model
- Bad, because later migration to richer event semantics could require another schema transition

### B — Simple range string model

- Good, because it is easy to read and simple to implement initially
- Good, because it keeps the advisory schema lightweight
- Neutral, because some straightforward advisories may not need more than a simple affected range
- Bad, because it leaves more interpretation ambiguity for clients
- Bad, because it aligns less well with richer external advisory ecosystems and more complex version histories

### C — Full event model

- Good, because it provides the most explicit and extensible representation of affected-version semantics
- Good, because it supports stronger interoperability with richer vulnerability/advisory ecosystems
- Good, because it gives clients a more future-proof basis for determining applicability and remediation boundaries
- Neutral, because simple advisory cases can still be represented as a small subset of the model
- Bad, because it increases the baseline schema and implementation complexity for v0.1
