---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use slug-like identifier rules for capability extension namespace keys in v0.1

## Context and Problem Statement

ADR-0070 establishes that the reserved capability extension container should be partitioned by first-level namespace keys. That leaves an identifier-discipline question unresolved: **what naming policy should apply to those namespace keys?**

If namespace keys are too loosely defined, the extension model loses some of the hygiene and predictability that the rest of the specification is trying to preserve.

## Decision Drivers

- Keep extension namespace keys simple and interoperable
- Reuse the specification's broader identifier-discipline patterns where practical
- Avoid overcomplicating namespace keys with heavier ownership-linked semantics in v0.1
- Preserve good tooling and human readability for extension names

## Considered Options

- A — Use slug-like identifier rules for extension namespace keys
- B — Allow arbitrary strings for extension namespace keys
- C — Tie extension namespace keys more strongly to ownership concepts

## Decision Outcome

Chosen option: **A — Use slug-like identifier rules for extension namespace keys**, because it preserves identifier hygiene while keeping the extension model lightweight and practical.

Under this decision:

- first-level extension namespace keys use a simple slug-like identifier policy
- the naming discipline should remain consistent with the broader spirit of the specification's identifier rules where practical
- the v0.1 core does not require stronger ownership-linked proof semantics for extension namespace keys themselves

### Consequences

- Good, because extension namespace keys remain easy to parse and reason about
- Good, because the extension model stays aligned with the spec's broader identifier discipline
- Good, because tooling can validate and display namespace keys more easily than arbitrary free-form strings
- Neutral, because future versions could still revisit whether stronger ownership-linked namespace semantics are worthwhile
- Bad, because the model gives up some of the theoretical identity strength a heavier ownership-bound namespace system might provide

### Confirmation

- Verify that extension namespace keys can be validated consistently using the chosen slug-like rules
- Verify that the namespace-key discipline remains simple enough for practical authoring and tooling
- Verify that the resulting namespace model still provides enough hygiene for extension partitioning in v0.1

## Pros and Cons of the Options

### A — Use slug-like identifier rules for extension namespace keys

- Good, because it balances simplicity and hygiene well
- Good, because it aligns with the broader naming discipline already used across the specification
- Good, because it supports practical tooling and readability better than arbitrary strings
- Neutral, because stronger ownership-linked semantics may still be considered later if the ecosystem demands them
- Bad, because it is not as strong a provenance signal as a more ownership-tied namespace model could be

### B — Allow arbitrary strings for extension namespace keys

- Good, because it maximizes immediate flexibility for extension authors
- Good, because it avoids one more identifier validation rule in the short term
- Neutral, because some very small ecosystems may tolerate looser namespace keys for a while
- Bad, because it weakens namespace hygiene and predictability
- Bad, because it makes tooling, validation, and consistency harder than necessary

### C — Tie extension namespace keys more strongly to ownership concepts

- Good, because it could provide a stronger provenance or accountability story for extension namespaces
- Good, because some future large-scale ecosystems may prefer tighter coupling between namespace and ownership
- Neutral, because a later mature version might revisit this if extension ecosystems become much more complex
- Bad, because it adds heavier governance semantics than the v0.1 extension model needs
- Bad, because it makes simple extension authoring and validation more cumbersome than necessary in the first baseline
