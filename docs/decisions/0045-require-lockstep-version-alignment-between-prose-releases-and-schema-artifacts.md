---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Require lockstep version alignment between prose releases and schema artifacts in v0.1

## Context and Problem Statement

ADR-0043 establishes that Agent Volumes v0.1 should publish normative machine-readable schema artifacts, and ADR-0044 establishes that those artifacts are derived normative companions whose final interpretive authority remains with the prose specification.

That creates a release-governance question: **how should version alignment work between a prose specification release and its corresponding machine-readable schema artifacts?**

Without a clear alignment rule, implementers may struggle to determine which schema artifact corresponds to which prose release, especially across draft and later stabilized versions.

## Decision Drivers

- Keep prose/schema correspondence explicit and easy to reason about
- Support conformance tooling and release management with minimal ambiguity
- Avoid introducing unnecessary governance complexity into the first dual-source normative model
- Make it easy for implementers to know which schema artifacts apply to which prose release

## Considered Options

- A — Require lockstep version alignment between prose releases and schema artifacts
- B — Allow schema artifacts to evolve with subordinate independent versioning
- C — Defer version-alignment rules to a later phase

## Decision Outcome

Chosen option: **A — Require lockstep version alignment between prose releases and schema artifacts**, because it gives the first normative prose+schema model the clearest and least ambiguous release discipline.

Under this decision:

- each prose specification release has a corresponding machine-readable schema-artifact release aligned with it in lockstep
- implementers should be able to identify the matching prose and schema artifacts for a given release unambiguously
- the release discipline for schema artifacts is intentionally tied closely to prose release governance rather than being independently versioned in the baseline model

### Consequences

- Good, because prose/schema correspondence becomes very clear
- Good, because conformance tooling and release selection become easier to automate and explain
- Good, because the first normative dual-source model stays simpler than a partially independent versioning scheme
- Neutral, because future versions may still revisit whether more flexible schema versioning is worth the added complexity
- Bad, because even small schema-only adjustments may need to follow prose release discipline more closely than some maintainers would prefer

### Confirmation

- Verify that every prose release can be paired unambiguously with its corresponding schema artifacts
- Verify that conformance tooling can identify the correct artifact set for a given release without extra heuristics
- Verify that the release process can maintain lockstep schema/prose alignment consistently

## Pros and Cons of the Options

### A — Require lockstep version alignment between prose releases and schema artifacts

- Good, because it gives implementers a simple and explicit pairing model
- Good, because it reduces ambiguity in release selection and conformance validation
- Good, because it keeps the first dual-source normative model operationally simple
- Neutral, because some future ecosystems may later decide they want more schema-versioning flexibility
- Bad, because it constrains schema-only maintenance to a stricter release discipline

### B — Allow schema artifacts to evolve with subordinate independent versioning

- Good, because schema maintenance could be more flexible and incremental
- Good, because small artifact improvements might be releasable without a full prose release
- Neutral, because a more mature standards process might eventually want this kind of flexibility
- Bad, because prose/schema correspondence becomes harder to reason about
- Bad, because the first normative dual-source model would become more complex than necessary

### C — Defer version-alignment rules to a later phase

- Good, because it reduces immediate release-governance specification work
- Good, because later experience could inform a more sophisticated alignment model
- Neutral, because some draft ecosystems delay this kind of release discipline choice until later maturity
- Bad, because the prose+schema normative model would lack an important operational rule
- Bad, because implementers would face avoidable ambiguity about which artifacts apply to which release
