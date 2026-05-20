---
status: accepted
date: 12026-05-05
decision-makers: Yunseo Kim
---

# Defer common judgment vocabulary standardization to a later profile or RFC

## Context and Problem Statement

ADR-0010 established that the summary view of the trust metadata API is fact-first, while allowing bibliothecas to expose optional derived judgments.

That left one further question: should Agent Volumes define a common standardized vocabulary for those optional derived judgments now, during the current draft phase?

Examples of such judgment fields include:

- `verificationStatus`
- `publisherTrustLevel`
- `policyResult`
- `attestationStatus`

Standardizing them early could improve future portability across bibliothecas, CLIs, and UIs. However, Agent Volumes is still a draft specification without a working public implementation ecosystem. There is not yet enough implementation evidence to know:

- which judgment fields are actually useful across clients and registries
- which values should be standardized
- how registry-local policy differences should or should not be normalized
- which distinctions matter in practice for users, operators, and security tooling

The decision therefore concerns whether the draft should define a common judgment vocabulary now, or postpone that work until concrete implementation experience exists.

## Decision Drivers

- Keep the draft lightweight and focused on the most stable normative layers
- Avoid standardizing speculative judgment semantics before real implementation feedback exists
- Preserve room for registry, CLI, and UI experimentation
- Prevent premature overfitting of policy-oriented fields whose real-world meaning is not yet validated
- Maintain consistency with ADR-0010, where canonical truth remains in the fact layer
- Allow future judgment vocabulary work to be grounded in implementation evidence rather than anticipation

## Considered Options

- A — Leave judgments entirely implementation-defined
- B — Standardize a small common judgment vocabulary now
- C — Standardize a rich judgment model now
- D — Defer common judgment vocabulary to a later profile or RFC

## Decision Outcome

Chosen option: "D", because Agent Volumes is still pre-implementation and should avoid fixing a common judgment vocabulary before there is enough real-world evidence to justify it.

Under this approach:

- The draft standard does **not** define a common baseline vocabulary for optional derived judgments at this time.
- Bibliothecas MAY expose derived judgment fields, but their names and meanings remain implementation-defined during the draft phase.
- Canonical interoperability continues to rely on the fact layer defined by ADR-0010, not on optional judgment semantics.
- Common judgment vocabulary, if needed, should be specified later in a dedicated profile, extension, or RFC once there is sufficient implementation and operational experience.

### Consequences

- Good, because the current draft stays lighter and more focused on stable normative foundations
- Good, because early implementers retain freedom to experiment with summary judgments in CLI, UI, and registry surfaces
- Good, because later standardization can be based on observed implementation patterns rather than speculation
- Good, because this avoids prematurely constraining registry-local trust and policy semantics
- Neutral, because short-term ecosystem portability for optional judgment fields remains limited
- Bad, because different implementations may diverge in optional judgment naming and semantics during the draft period
- Bad, because later convergence work may require consolidating a field ecosystem that has already started to fragment

### Confirmation

- Verify that the draft remains fully usable and interoperable based on canonical facts alone
- Verify that early implementations can experiment with derived judgments without conflicting with the core standard
- Verify that future profile or RFC work can standardize judgment vocabulary without needing to revise the canonical fact model
- Verify that clients can treat optional judgments as non-normative without loss of baseline interoperability

## Pros and Cons of the Options

### A

- Good, because it maximizes implementation freedom
- Good, because it keeps the standard minimal
- Bad, because it gives no planned path toward eventual convergence
- Bad, because it may implicitly normalize permanent fragmentation

### B

- Good, because it could provide useful early portability for common UI/CLI trust indicators
- Good, because it would give implementers a small shared starting point
- Bad, because even a small vocabulary may still be premature before implementation evidence exists
- Bad, because it risks standardizing the wrong fields or semantics too early

### C

- Good, because it would create a rich cross-implementation trust-judgment model from the start
- Good, because it could help future ecosystem tooling converge quickly
- Bad, because it is much too heavy and speculative for the current maturity level of the project
- Bad, because it would likely encode assumptions that have not yet been tested in working implementations

### D

- Good, because it explicitly defers the work until real implementations and operational experience exist
- Good, because it matches the project's current draft maturity and experimentation needs
- Good, because it keeps the canonical fact model and optional judgment model clearly separated
- Bad, because portability for derived judgments is postponed rather than solved now
