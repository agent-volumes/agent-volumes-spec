---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use a small core source vocabulary with extension hooks for advisories in v0.1

## Context and Problem Statement

ADR-0041 establishes that the advisory schema should include a structured source/ecosystem field. That leaves a closely related vocabulary question unresolved: **should the source field use a small fixed baseline vocabulary, a fully extensible namespace/URI model, or implementation-defined strings?**

The answer affects baseline interoperability, client filtering, and the future growth path for additional advisory ecosystems.

## Decision Drivers

- Preserve a stable baseline vocabulary for common advisory ecosystems
- Keep the first interoperable source model easy for clients to consume
- Allow later expansion to additional or specialized ecosystems without breaking the baseline
- Avoid pushing too much complexity into the initial source field design

## Considered Options

- A — Small fixed core vocabulary with extension hooks
- B — Fully extensible namespace/URI model from the start
- C — Implementation-defined string values

## Decision Outcome

Chosen option: **A — Small fixed core vocabulary with extension hooks**, because it balances interoperability and extensibility better than either a purely open-ended or fully namespace-heavy design.

Under this decision:

- the advisory source/ecosystem field should define a small baseline vocabulary for the most common source classes
- the model should also allow extension values for later or specialized ecosystems
- baseline clients can rely on the shared core values while still tolerating extension values they do not recognize fully

### Consequences

- Good, because common advisory ecosystems gain portable baseline labels
- Good, because clients can implement stable source-aware behavior for the most important current ecosystems
- Good, because the model still leaves room for future source expansion without breaking the baseline
- Neutral, because extension-value handling still needs clear schema and client guidance
- Bad, because the value model is slightly more complex than a single totally open string field

### Confirmation

- Verify that the source field can represent the most important current ecosystems consistently using the core vocabulary
- Verify that clients can handle extension values without losing interoperability for the common baseline cases
- Verify that the schema remains extensible without forcing a URI-heavy model into the first draft

## Pros and Cons of the Options

### A — Small fixed core vocabulary with extension hooks

- Good, because it gives clients a stable baseline for the most important source types
- Good, because it preserves a clean path for source-aware filtering and UI behavior
- Good, because it allows future ecosystem growth without destabilizing the baseline values
- Neutral, because extension-processing semantics still need some client guidance
- Bad, because it is somewhat more structured than an unrestricted string model

### B — Fully extensible namespace/URI model from the start

- Good, because it is maximally flexible and theoretically precise
- Good, because it could scale cleanly to a very broad ecosystem set over time
- Neutral, because a later more mature ecosystem may eventually prefer stronger namespacing conventions
- Bad, because it adds more complexity than needed for the first interoperable advisory baseline
- Bad, because it is less friendly for straightforward baseline client UX and filtering

### C — Implementation-defined string values

- Good, because it is the simplest field-shape choice for bibliothecas
- Good, because registries can add whatever values they want without extra schema planning
- Neutral, because some implementations might still converge informally on similar labels
- Bad, because baseline interoperability and source-aware client behavior would be weaker
- Bad, because clients would need more local heuristics and registry-specific handling than the current advisory model now warrants
