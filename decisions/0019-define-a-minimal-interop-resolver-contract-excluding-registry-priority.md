---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Define a minimal interoperability resolver contract in v0.1, excluding registry priority and source selection behavior

## Context and Problem Statement

The current draft intentionally does not standardize a full dependency-resolution algorithm or lockfile file format. However, it already standardizes some resolver-adjacent behavior, including lockfile precedence, dependency declarations, and single-version enforcement.

That leaves an important boundary question: **what minimum resolution behavior must still be standardized in v0.1 so that independent clients make consistent accept/reject decisions, without turning the draft into a full solver specification?**

## Decision Drivers

- Independent clients should not diverge on core accept/reject outcomes for the same dependency graph
- The standard should avoid overcommitting to a full solver contract before more implementation experience exists
- Single-version enforcement needs a more precise behavioral boundary to be interoperable
- The boundary between core spec and companion-doc behavior should be explicit

## Considered Options

- A — Minimal interoperability resolver contract
- B — Principles only
- C — Full solver behavior in the core spec

## Decision Outcome

Chosen option: **A — Minimal interoperability resolver contract**, because it best balances interoperation needs with the draft's intended scope.

Under this decision, the v0.1 core spec SHOULD normatively define the minimum behaviors needed for consistent resolver interpretation and accept/reject outcomes, including at least:

- version constraint interpretation
- prerelease resolution policy
- lockfile precedence semantics
- irreconcilable constraint failure rules
- component dependency existence-check timing
- meta-package resolution behavior

Under this decision, **registry priority and source selection behavior are explicitly excluded from the minimal interoperability resolver contract** and remain outside this decision's standardization scope.

Under this decision, the following also remain outside the minimal resolver contract:

- full solving/backtracking algorithm behavior
- lockfile file format
- upgrade workflow UX
- deduplication heuristics beyond the single-version rule

## Consequences

- Good, because independent clients gain a clearer shared boundary for core resolution behavior
- Good, because the draft can improve install-time interoperability without becoming a full package-manager specification
- Good, because single-version enforcement becomes more practically implementable
- Neutral, because registry/source selection behavior is still left for other specification work or companion guidance
- Bad, because some install-result differences may still remain in areas intentionally left outside the minimal contract

## Confirmation

- Verify that the spec can define deterministic accept/reject behavior for core dependency conflicts without defining a full solver
- Verify that excluded areas such as registry priority/source selection do not appear to be accidentally standardized by implication
- Verify that the minimal contract is still sufficient to support conformance fixtures for dependency interpretation and failure behavior

## Pros and Cons of the Options

### A — Minimal interoperability resolver contract

- Good, because independent clients gain a clearer shared boundary for core resolution behavior
- Good, because the draft can improve install-time interoperability without becoming a full package-manager specification
- Good, because single-version enforcement becomes more practically implementable
- Neutral, because some resolver-adjacent areas such as registry/source selection remain intentionally outside the contract
- Bad, because some install-result differences may still remain in areas intentionally left outside the minimal contract

### B — Principles only

- Good, because it keeps the core spec lighter and avoids early over-commitment
- Good, because more behavior can evolve through companion guidance later
- Neutral, because it may suit a single-implementation or tightly coordinated ecosystem
- Bad, because independent implementations are more likely to diverge on core accept/reject behavior
- Bad, because the current single-version model would remain too underspecified for strong interop

### C — Full solver behavior in the core spec

- Good, because it would maximize deterministic install behavior across implementations
- Good, because it could reduce ambiguity for advanced dependency cases
- Neutral, because a mature ecosystem might eventually want this level of rigor
- Bad, because it would make v0.1 much heavier than necessary
- Bad, because it risks locking in premature solver decisions before enough implementation experience exists
