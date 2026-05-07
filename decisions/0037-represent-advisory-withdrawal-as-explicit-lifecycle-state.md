---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Represent advisory withdrawal as explicit lifecycle state in v0.1

## Context and Problem Statement

ADR-0036 establishes that the advisory schema in v0.1 should include core publication and update lifecycle fields. That leaves a related lifecycle question unresolved: **if an advisory is later withdrawn, should it remain part of the public advisory model with explicit lifecycle state, or should it be hidden, removed, or deferred as an unspecified case?**

This decision affects auditability, user interpretation, and consistency with the broader trust lifecycle direction of the specification.

## Decision Drivers

- Preserve advisory history rather than relying on disappearance or deletion
- Support client understanding of advisory lifecycle state explicitly
- Keep the advisory model aligned with the broader append-only and lifecycle-state direction chosen elsewhere in the trust model
- Avoid ambiguous behavior for withdrawn advisories in the baseline contract

## Considered Options

- A — Represent withdrawal as explicit lifecycle state
- B — Hide withdrawn advisories from ordinary public views
- C — Defer withdrawal semantics to later work

## Decision Outcome

Chosen option: **A — Represent withdrawal as explicit lifecycle state**, because it best preserves transparency and lifecycle clarity in the advisory model.

Under this decision:

- withdrawn advisories remain part of the advisory model rather than disappearing from it entirely
- withdrawal is expressed through explicit lifecycle metadata, such as a withdrawal timestamp and, when useful, related status or reason information
- clients and registries are expected to distinguish between advisory existence and current lifecycle state

### Consequences

- Good, because advisory history remains auditable and transparent
- Good, because clients can reason explicitly about whether an advisory exists and whether it is still active
- Good, because the advisory model stays aligned with the broader lifecycle-oriented trust direction of the draft
- Neutral, because public listing or presentation strategies may still vary somewhat so long as lifecycle state is preserved clearly
- Bad, because clients must handle more lifecycle nuance than in a hide-or-delete model

### Confirmation

- Verify that advisory payloads can represent withdrawal explicitly without deleting the advisory from the model
- Verify that clients can distinguish active advisories from withdrawn advisories reliably
- Verify that the advisory lifecycle contract remains consistent with the broader trust-lifecycle direction of the spec

## Pros and Cons of the Options

### A — Represent withdrawal as explicit lifecycle state

- Good, because it preserves advisory history and auditability
- Good, because it lets clients interpret advisory lifecycle state explicitly instead of inferring from disappearance
- Good, because it is consistent with the spec's broader preference for lifecycle-state transparency
- Neutral, because user-facing presentations may still vary even when the lifecycle semantics are fixed
- Bad, because clients and APIs must carry more lifecycle-state handling logic

### B — Hide withdrawn advisories from ordinary public views

- Good, because common public views may appear simpler or cleaner
- Good, because end users may be less distracted by no-longer-active advisories in ordinary listings
- Neutral, because some systems do distinguish primary views from history views
- Bad, because transparency and auditability become weaker
- Bad, because disappearance is a less reliable and less explicit lifecycle signal than explicit withdrawal state

### C — Defer withdrawal semantics to later work

- Good, because it reduces immediate schema and lifecycle specification burden
- Good, because later versions could refine the model with more implementation evidence
- Neutral, because some ecosystems postpone withdrawal behavior until later maturity
- Bad, because the advisory lifecycle model remains incomplete in an important operational area
- Bad, because clients would still lack a shared baseline for interpreting withdrawn advisories in v0.1
