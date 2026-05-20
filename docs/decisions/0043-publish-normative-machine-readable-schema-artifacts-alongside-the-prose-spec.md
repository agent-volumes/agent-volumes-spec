---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Publish normative machine-readable schema artifacts alongside the prose spec in v0.1

## Context and Problem Statement

The Agent Volumes v0.1 draft has become increasingly concrete across manifest semantics, trust/advisory API contracts, advisory structure, and conformance fixtures. That raises an implementation-readiness question: **should the specification publish normative machine-readable schema artifacts alongside the prose and tables, or should implementers rely only on prose interpretation?**

Without machine-readable schemas, the stronger wire-level and conformance-oriented decisions in the draft still require more manual interpretation than necessary.

## Decision Drivers

- Improve implementation readiness and validation automation
- Reduce ambiguity between prose interpretation and machine-consumable contract shape
- Support conformance tooling and fixture validation more directly
- Keep the stronger v0.1 contract practically usable by independent implementers

## Considered Options

- A — Publish normative machine-readable schema artifacts alongside the prose spec
- B — Keep prose only as normative and treat machine-readable artifacts as informative
- C — Defer machine-readable schemas to a later phase

## Decision Outcome

Chosen option: **A — Publish normative machine-readable schema artifacts alongside the prose spec**, because the implementation-ready direction of the current draft is strong enough that machine-consumable normative artifacts now provide clear value rather than premature extra machinery.

Under this decision:

- v0.1 should publish normative machine-readable schema artifacts for the main structured contracts
- these artifacts are expected to cover areas such as manifest structure, trust/advisory API payloads, and conformance-fixture shapes where appropriate
- the specification must still be clear about how prose and machine-readable artifacts relate normatively so that implementers can resolve ambiguity consistently

### Consequences

- Good, because implementation and validation automation become much easier
- Good, because stronger wire-level interoperability claims gain a machine-consumable form
- Good, because conformance tooling can validate more of the specification directly
- Neutral, because the exact artifact formats and publication layout still need to be designed carefully
- Bad, because the project must maintain both prose and machine-readable normative artifacts consistently

### Confirmation

- Verify that the published machine-readable artifacts cover the main structured v0.1 contracts faithfully
- Verify that independent implementations can use the artifacts directly for validation and generation workflows
- Verify that the normative relationship between prose and machine-readable artifacts is explicit enough to resolve disagreements consistently

## Pros and Cons of the Options

### A — Publish normative machine-readable schema artifacts alongside the prose spec

- Good, because it supports automation and independent implementation directly
- Good, because it complements the increasingly concrete API and schema decisions already made in v0.1
- Good, because it strengthens conformance and validation workflows materially
- Neutral, because the exact artifact technology choices can still vary as long as the normative intent is preserved
- Bad, because dual maintenance of prose and schemas increases editorial and validation burden

### B — Keep prose only as normative and treat machine-readable artifacts as informative

- Good, because it keeps one obviously primary normative source
- Good, because it reduces some risk of prose/schema divergence becoming a formal standards problem
- Neutral, because informative schemas may still help some implementers substantially
- Bad, because stronger implementation-readiness goals still depend too much on prose interpretation
- Bad, because conformance automation remains weaker than the chosen direction of the draft now supports

### C — Defer machine-readable schemas to a later phase

- Good, because it reduces immediate drafting and maintenance workload
- Good, because later schemas could be built with more implementation evidence
- Neutral, because some specifications do wait longer before publishing normative machine-readable companions
- Bad, because it conflicts with the increasingly implementation-ready posture of the current v0.1 baseline
- Bad, because important structured contracts would remain harder to validate automatically than they need to be
