---
status: accepted
date: 12026-05-07
decision-makers: Yunseo Kim
---

# Defer prerelease resolution policy to client-local behavior in v0.1

## Context and Problem Statement

ADR-0019 establishes a minimal interoperability resolver contract for v0.1 and identifies prerelease resolution policy as one of the areas that could be standardized. Since then, the implementation-readiness review has clarified that resolver determinism matters most where independent clients would otherwise disagree on fundamental success/failure outcomes.

That still leaves a narrower question unresolved: **does v0.1 need one portable prerelease-selection policy for all conforming clients, or can prerelease-selection behavior remain client-local so long as the broader resolver baseline remains stable?**

## Decision Drivers

- Preserve a useful interoperable resolver baseline without over-specifying behavior too early
- Avoid forcing one prerelease policy across diverse client ecosystems before more implementation evidence exists
- Keep core resolver conformance focused on the strongest accept/reject boundaries first
- Prevent the first interoperable draft from locking in a prerelease rule that may later prove too rigid or too surprising

## Considered Options

- Define one portable prerelease-selection rule in the v0.1 core
- Allow prerelease selection to remain client-local in v0.1
- Remove prerelease discussion entirely from the resolver baseline

## Decision Outcome

Chosen option: **Allow prerelease selection to remain client-local in v0.1**, because the broader resolver baseline can still be made materially more interoperable without freezing one prerelease-selection rule prematurely.

Under this decision:

- the v0.1 core does not require one universal prerelease-selection policy across all conforming clients
- clients MAY apply their own local prerelease-selection behavior or UX policy
- the specification SHOULD remain clear that prerelease-selection behavior is outside the portable v0.1 resolver baseline
- this decision **partially supersedes ADR-0019** only with respect to the expectation that prerelease resolution policy itself must be fixed normatively in the v0.1 core

## Consequences

- Good, because v0.1 can strengthen resolver interoperability where it matters most without prematurely overcommitting on prerelease policy
- Good, because different client ecosystems can preserve locally familiar prerelease behavior
- Good, because future implementation evidence can inform a better prerelease policy later if needed
- Neutral, because some installation-result differences may still occur when prereleases are involved
- Bad, because prerelease behavior remains less portable than other parts of the resolver baseline
- Bad, because some readers may expect a stronger universal package-manager-like policy once the resolver contract is made more explicit elsewhere

## Confirmation

- Verify that resolver prose and fixtures do not imply one hidden prerelease-selection policy after this decision
- Verify that the remaining resolver baseline still defines strong accept/reject behavior for non-prerelease ambiguity cases
- Verify that ADR-0019 is not otherwise weakened beyond this narrow prerelease-policy point

## Pros and Cons of the Options

### Define one portable prerelease-selection rule in the v0.1 core

- Good, because it would maximize deterministic install behavior for prerelease cases
- Good, because clients would gain one clearer shared rule
- Neutral, because mature ecosystems sometimes prefer this degree of solver determinism
- Bad, because the evidence base for choosing one global prerelease rule is still limited
- Bad, because the wrong early choice could create avoidable migration friction later

### Allow prerelease selection to remain client-local in v0.1

- Good, because it preserves flexibility where strong ecosystem consensus is not yet established
- Good, because it keeps the core resolver baseline lighter and more realistic for the first interoperable draft
- Good, because it narrows the supersession of ADR-0019 to one specific point rather than reopening the whole resolver direction
- Neutral, because future revisions may still choose to standardize prerelease policy once implementation evidence improves
- Bad, because prerelease behavior remains less uniform across clients

### Remove prerelease discussion entirely from the resolver baseline

- Good, because it would minimize draft surface area
- Good, because it avoids any near-term policy argument over prereleases
- Neutral, because some ecosystems may document prerelease behavior outside the core standard anyway
- Bad, because silence is more ambiguous than an explicit client-local deferral
- Bad, because implementers and reviewers would still repeatedly ask whether the omission was intentional
