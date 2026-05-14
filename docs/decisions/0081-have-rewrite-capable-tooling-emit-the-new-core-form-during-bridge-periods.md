---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Have rewrite-capable tooling emit the new core form during bridge periods in v0.1+

## Context and Problem Statement

ADR-0080 establishes that during an extension-to-core bridge period, the new core form is the canonical semantic center and the old extension form is a compatibility alias.

That leaves one tooling-behavior question unresolved: **when a tool rewrites, normalizes, or re-emits data during the bridge period, should it preserve the old input form or prefer the new canonical form in its output?**

Without a baseline rule, migration-aware tooling may behave inconsistently even when the canonical semantic target is already known.

## Decision Drivers

- Align emitted output with the canonical semantic center of the bridge period
- Encourage gradual migration through ordinary tooling workflows rather than only through explicit manual action
- Reduce inconsistent behavior across rewrite-capable tooling
- Preserve compatibility on input while still making output converge toward the long-term form

## Considered Options

- A — Prefer the new core form in emitted or rewritten output
- B — Preserve the input form unless the user opts in to migration
- C — Leave emitted output preference implementation-defined

## Decision Outcome

Chosen option: **A — Prefer the new core form in emitted or rewritten output**, because it best aligns tooling behavior with the canonical migration target while preserving backward-compatible input handling.

Under this decision:

- tooling may continue to accept the old extension form during the bridge period
- when tooling rewrites, normalizes, or re-emits data, it should prefer the new core form as output
- the output rule is intended to move ecosystems toward the canonical form naturally through ordinary tooling activity

### Consequences

- Good, because migration progresses more naturally over time through routine tooling use
- Good, because emitted output stays aligned with the canonical semantic center already established for the bridge period
- Good, because rewrite-capable tools become more consistent in migration behavior
- Neutral, because some specialized tools may still need carefully documented exceptions in rare cases
- Bad, because users expecting strict preservation of legacy form may see automatic migration in rewritten output sooner than they prefer

### Confirmation

- Verify that rewrite-capable tools can accept old forms while still emitting the new canonical form when they rewrite data
- Verify that emitted output behavior reinforces, rather than undermines, the bridge migration model
- Verify that tooling guidance stays clear enough that users understand why rewritten output changes form during the bridge period

## Pros and Cons of the Options

### A — Prefer the new core form in emitted or rewritten output

- Good, because it drives migration in the same direction as the canonical semantic model
- Good, because it reduces long-term coexistence clutter once tools begin rewriting data
- Good, because it gives tooling a clear and consistent default output preference
- Neutral, because some tools may still need explicit user messaging around migration-aware rewrites
- Bad, because it is less conservative than a strict preserve-input strategy

### B — Preserve the input form unless the user opts in to migration

- Good, because it is safer and less surprising for users who want minimal output change
- Good, because it avoids automatic migration in rewrite-capable tooling unless explicitly requested
- Neutral, because some ecosystems may prefer a more conservative output-preservation philosophy
- Bad, because it slows migration and weakens the practical force of the canonical new-form decision
- Bad, because tooling output behavior becomes less aligned with the bridge's long-term target state

### C — Leave emitted output preference implementation-defined

- Good, because tools retain maximum behavior freedom
- Good, because different contexts could choose different migration philosophies
- Neutral, because some ecosystems do accept more variation in rewrite behavior across tools
- Bad, because migration-tooling behavior becomes less predictable and less interoperable
- Bad, because the canonical bridge model loses one of its most practical enforcement paths
