---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Require explicit surfacing of unknown manifest-structure warnings in v0.1

## Context and Problem Statement

ADR-0051 establishes that unknown fields or tables in `volume.toml` are allowed in the baseline model with warning rather than being automatically invalid.

That leaves an operational question unresolved: **how visible must those warnings be?** If warning semantics are left too implicit, some implementations may effectively ignore unknown structure silently, weakening the practical value of the decision.

The specification therefore needs to decide whether warning visibility is itself part of the baseline contract.

## Decision Drivers

- Ensure that allowed unknown structure is not silently hidden from users or tooling
- Make the warning-oriented baseline meaningful in practice rather than only in theory
- Support operator awareness while still preserving forward-evolution flexibility
- Keep baseline validation behavior visible enough to be testable

## Considered Options

- A — Require explicit surfacing of unknown-structure warnings
- B — Leave visibility behavior largely to implementation choice
- C — Defer warning-visibility semantics to later work

## Decision Outcome

Chosen option: **A — Require explicit surfacing of unknown-structure warnings**, because the warning-based baseline should remain operationally meaningful and not degrade into silent ignore behavior.

Under this decision:

- when unknown manifest structure is encountered, the implementation must surface that warning explicitly through an appropriate caller, user, or reporting channel
- the exact UI or channel may still vary by implementation context, but the warning must not remain a purely internal silent diagnostic
- this requirement applies to preserve operator awareness while keeping unknown structure non-fatal in the baseline model

### Consequences

- Good, because unknown manifest structure becomes visible rather than silently disappearing into internal diagnostics
- Good, because the warning-based baseline remains meaningful for users and tooling
- Good, because the rule supports both forward evolution and operator awareness simultaneously
- Neutral, because implementations may still choose different presentation channels depending on context
- Bad, because some implementations may need additional reporting or UX work to satisfy explicit surfacing requirements

### Confirmation

- Verify that implementations surface unknown-structure warnings through a visible caller/user/reporting path
- Verify that unknown fields/tables are not treated as hard failures in the baseline mode while still being made visible
- Verify that the surfacing rule is testable across CLI, API, and automated validation contexts

## Pros and Cons of the Options

### A — Require explicit surfacing of unknown-structure warnings

- Good, because it prevents the warning model from collapsing into silent ignore behavior
- Good, because it improves operator awareness and debugging visibility
- Good, because it makes the unknown-structure rule more concrete and testable
- Neutral, because the exact surfacing channel can still vary by implementation context
- Bad, because implementations must do more than merely record an internal diagnostic

### B — Leave visibility behavior largely to implementation choice

- Good, because implementations retain more freedom in how they handle warnings
- Good, because it can reduce immediate UX/reporting requirements for some tools
- Neutral, because some implementations may still choose to surface warnings clearly on their own
- Bad, because some implementations may effectively hide unknown-structure warnings in practice
- Bad, because the baseline warning model becomes weaker and less consistent

### C — Defer warning-visibility semantics to later work

- Good, because it reduces immediate operational-detail specification effort
- Good, because later versions could refine visibility guidance with more tooling experience
- Neutral, because some ecosystems do postpone user-surfacing rules until later maturity
- Bad, because the current warning baseline remains too underspecified in practice
- Bad, because unknown structure could be treated inconsistently across implementations in v0.1
