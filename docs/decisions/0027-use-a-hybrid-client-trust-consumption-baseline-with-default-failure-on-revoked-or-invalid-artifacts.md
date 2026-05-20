---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use a hybrid client trust-consumption baseline with default failure on revoked or invalid artifacts

## Context and Problem Statement

The Agent Volumes trust model now defines a digest-bound release subject, a concrete trust metadata API, append-only trust attachments, revision-aware discovery, and metadata-layer revocation semantics.

That still leaves an important client-policy question unresolved: **when a client consumes trust metadata in v0.1, which trust conditions must cause hard failure by default, and which should remain warning-level or policy-evaluable conditions?**

The answer affects interoperability, adoption friction, and how strongly the baseline client posture should enforce trust lifecycle information.

## Decision Drivers

- Require hard failure for true integrity and subject-binding violations
- Preserve a practical baseline that does not make trust-artifact coverage completeness mandatory for every install
- Treat explicit revocation or invalidation more seriously than simple absence of trust evidence
- Leave room for implementation-defined opt-out behavior without weakening the baseline default

## Considered Options

- A — Strict on integrity only, soft on presence and revocation state
- B — Strict on baseline artifact presence and on revoked/invalid artifacts
- C — Mostly local policy beyond core integrity mismatch
- D — Hybrid: strict on integrity mismatch, soft on missing artifacts, strict by default on revoked/invalid artifacts with optional implementation-defined override

## Decision Outcome

Chosen option: **D — Hybrid: strict on integrity mismatch, soft on missing artifacts, strict by default on revoked/invalid artifacts with optional implementation-defined override**, because it best balances baseline security posture with practical adoption needs.

Under this decision:

- digest mismatch, subject mismatch, and inconsistent trust binding MUST cause failure
- simple absence of a required baseline trust artifact is reported or warned by default, but does not automatically require install failure in the baseline mode
- presence of a revoked or invalid trust artifact causes failure by default
- an implementation MAY provide an explicit override option that allows installation to continue despite revoked or invalid trust artifacts, but such continuation must be accompanied by warning/reporting behavior and remains implementation-defined

### Consequences

- Good, because hard failures remain mandatory for the strongest integrity and subject-binding violations
- Good, because missing trust coverage does not automatically block adoption in every baseline workflow
- Good, because explicit revocation or invalidation is treated more seriously than mere absence of evidence
- Neutral, because implementations may still differentiate themselves through stricter optional profiles or override handling
- Bad, because baseline client behavior becomes somewhat more nuanced than a single fail-or-warn rule

### Confirmation

- Verify that clients always fail on digest mismatch, subject mismatch, and inconsistent trust binding
- Verify that missing baseline trust artifacts are surfaced clearly without mandatory baseline install failure
- Verify that revoked or invalid trust artifacts cause default failure unless an explicit implementation-defined override is used

## Pros and Cons of the Options

### A — Strict on integrity only, soft on presence and revocation state

- Good, because it minimizes adoption friction for early ecosystems
- Good, because it keeps the baseline client behavior relatively simple
- Neutral, because stricter profiles could still be added later
- Bad, because it treats explicit revocation or invalidation too weakly for the chosen trust model
- Bad, because clients may proceed too easily in situations where known-invalid trust evidence exists

### B — Strict on baseline artifact presence and on revoked/invalid artifacts

- Good, because it yields a stronger security posture by default
- Good, because it makes trust coverage completeness a first-class baseline requirement
- Neutral, because some high-assurance environments may eventually want this mode as a profile
- Bad, because it raises adoption barriers in the first interoperable draft
- Bad, because it is stricter than necessary for baseline workflows where trust coverage is still maturing

### C — Mostly local policy beyond core integrity mismatch

- Good, because implementations retain maximum flexibility
- Good, because different environments can tune policy aggressively or conservatively
- Neutral, because some ecosystems do intentionally defer most trust-policy behavior to local configuration
- Bad, because baseline client behavior becomes too weakly standardized
- Bad, because revoked or invalid trust artifacts would not receive a strong enough shared baseline treatment

### D — Hybrid: strict on integrity mismatch, soft on missing artifacts, strict by default on revoked/invalid artifacts with optional implementation-defined override

- Good, because it keeps the strongest failures reserved for true integrity and lifecycle invalidation problems
- Good, because it distinguishes clearly between absence of evidence and known-bad evidence
- Good, because it allows implementations to offer escape hatches without weakening the default baseline
- Neutral, because override UX and naming remain implementation-defined
- Bad, because the baseline model is more complex than a purely uniform strictness rule
