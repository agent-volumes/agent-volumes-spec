---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use a core warning-category set with extension hooks in v0.1

## Context and Problem Statement

ADR-0055 establishes that the v0.1 warning model should use a narrow core warning-category set. That leaves a value-model question unresolved: **should those warning categories be closed and fixed, or should the baseline allow extension categories for future growth?**

The answer affects forward evolution, warning interoperability, and how rigidly the first warning taxonomy is bounded.

## Decision Drivers

- Preserve interoperability for the baseline warning-category set
- Leave room for future warning growth without forcing a breaking redesign
- Keep the warning taxonomy consistent with other vocabulary decisions in the specification
- Avoid overcommitting to a permanently closed category universe too early

## Considered Options

- A — Use a core warning-category set with extension hooks
- B — Use a pure fixed warning-category set only
- C — Allow free implementation-defined extra warning strings

## Decision Outcome

Chosen option: **A — Use a core warning-category set with extension hooks**, because it best balances baseline interoperability with future extensibility.

Under this decision:

- the warning model includes a small fixed baseline category set
- the model also allows extension categories for future growth or specialized use cases
- baseline clients can rely on the core categories while still tolerating extension categories beyond the initial set

### Consequences

- Good, because the baseline category set remains portable and predictable
- Good, because future warning growth does not require redesigning the taxonomy from scratch
- Good, because the warning model stays consistent with other small-core-plus-extension decisions already made in the spec
- Neutral, because extension-handling guidance may still vary somewhat outside the core baseline
- Bad, because the model is slightly more complex than a fully closed fixed-set design

### Confirmation

- Verify that baseline implementations can handle the fixed core categories consistently
- Verify that extension categories can be introduced later without destabilizing the core taxonomy
- Verify that the warning model remains coherent and interoperable even with extension hooks present

## Pros and Cons of the Options

### A — Use a core warning-category set with extension hooks

- Good, because it preserves a stable baseline while still allowing growth
- Good, because it aligns well with the broader vocabulary strategy used elsewhere in the specification
- Good, because it avoids forcing future warning needs into a redesign of the baseline model
- Neutral, because some implementation guidance for extension handling may still be useful later
- Bad, because it is somewhat more complex than a pure fixed vocabulary

### B — Use a pure fixed warning-category set only

- Good, because it is the simplest possible baseline taxonomy
- Good, because it removes ambiguity about what category values are allowed initially
- Neutral, because a very small and stable ecosystem might be satisfied with a closed set for a long time
- Bad, because it makes future growth harder and more brittle
- Bad, because it is less consistent with the specification's broader pattern of core vocabularies plus extension space

### C — Allow free implementation-defined extra warning strings

- Good, because implementations gain maximum flexibility immediately
- Good, because new warning classes can appear without any coordination overhead
- Neutral, because some ecosystems do tolerate more free-form diagnostic taxonomies
- Bad, because warning interoperability becomes weaker
- Bad, because clients and tooling would need more local interpretation than the baseline model should require
