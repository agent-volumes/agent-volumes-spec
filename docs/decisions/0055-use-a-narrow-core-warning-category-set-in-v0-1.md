---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use a narrow core warning-category set in v0.1

## Context and Problem Statement

ADR-0053 establishes that the baseline warning model should include a small structured category set, and ADR-0054 defers a richer structured deprecation metadata model.

That leaves a vocabulary-scope question unresolved: **how broad should the baseline warning-category set actually be in v0.1?**

If the category set is too broad, the first warning taxonomy may become heavier than necessary. If it is too vague, the warning model loses much of its practical value.

## Decision Drivers

- Keep the first warning taxonomy small, stable, and easy to implement
- Preserve enough category structure to support practical interoperability and tooling
- Avoid over-expanding the warning model into a large operational taxonomy too early
- Support obvious warning cases already implied by the current draft direction

## Considered Options

- A — Use a narrow core warning-category set
- B — Use a broader operational warning-category set
- C — Defer the actual minimum category set to later work

## Decision Outcome

Chosen option: **A — Use a narrow core warning-category set**, because it best balances practical interoperability with taxonomy discipline in the first baseline.

Under this decision, the v0.1 warning model should start from a small, stable baseline category set, centered on cases such as:

- unknown structure
- forward-compatibility issues
- deprecation as a warning category, even though richer structured deprecation metadata remains deferred

This baseline is intentionally narrow rather than trying to cover a broad operational warning universe in the first draft.

### Consequences

- Good, because the warning-category model remains compact and easier to stabilize
- Good, because the most obvious baseline warning classes still receive structured support
- Good, because the warning taxonomy avoids premature operational sprawl
- Neutral, because later versions or profiles may still add more warning classes when justified
- Bad, because some potentially useful operational warning categories remain outside the initial core set

### Confirmation

- Verify that the chosen narrow category set covers the most important baseline warning cases in v0.1
- Verify that implementations can support the warning taxonomy without needing a much larger operational model
- Verify that the taxonomy remains extensible enough for later growth if needed

## Pros and Cons of the Options

### A — Use a narrow core warning-category set

- Good, because it keeps the warning model focused and manageable
- Good, because it still supports structured handling for the most obvious baseline warning scenarios
- Good, because it aligns well with the decision to defer richer deprecation semantics for later work
- Neutral, because future versions may still decide to broaden the taxonomy once more experience exists
- Bad, because some operational warning classes will remain outside the first core set

### B — Use a broader operational warning-category set

- Good, because it would give tooling more structured signal for a wider range of warning situations
- Good, because some implementers may appreciate richer warning semantics early
- Neutral, because a later mature ecosystem may eventually prefer a more operationally expressive warning taxonomy
- Bad, because it risks making the v0.1 warning model larger than necessary
- Bad, because it may standardize warning distinctions before enough implementation evidence exists

### C — Defer the actual minimum category set to later work

- Good, because it reduces immediate vocabulary-definition work
- Good, because later versions could refine the set with more ecosystem experience
- Neutral, because some ecosystems do initially define only the idea of categories before stabilizing the exact set
- Bad, because the structured warning model becomes much less concrete in practice
- Bad, because ADR-0053 would lose a large part of its operational usefulness without an actual baseline category set
