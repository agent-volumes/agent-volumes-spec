---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Require normative conformance fixtures and vectors in v0.1

## Context and Problem Statement

The recent v0.1 decisions make Agent Volumes substantially more concrete: the release digest subject, normalization scope, trust baseline, trust/advisory API contract, mapping matrix requirements, threat model, and minimal resolver contract are now all expected to be implementation-grade.

That creates a new conformance question: **should the draft require normative fixtures and test vectors, or rely only on textual conformance language?**

Without fixtures and vectors, many of the newly chosen contracts would still be vulnerable to divergent interpretation by independent implementations.

## Decision Drivers

- Independent implementations should be able to prove interoperability against shared artifacts
- Recently chosen contracts need executable confirmation, not just prose interpretation
- The conformance section should support reproducible black-box verification
- The first implementation-ready draft should minimize ambiguity where deterministic behavior is expected

## Considered Options

- A — Require normative test fixtures and vectors
- B — Keep requirements normative, but make fixtures informative
- C — Defer fixture work to a later version or separate test suite

## Decision Outcome

Chosen option: **A — Require normative test fixtures and vectors**, because the current v0.1 direction is explicitly targeting independent interoperable implementation rather than only conceptual alignment.

Under this decision, v0.1 MUST include normative conformance artifacts for at least:

- normalized file tree digest golden vectors
- trust metadata summary/detail payload fixtures
- advisory payload fixtures
- BOM/provenance mapping sample fixtures
- dependency-resolution accept/reject test cases

These fixtures MAY be housed in the main specification, a normative appendix, or a normatively referenced conformance artifact set, but they are part of the required interoperability contract rather than merely illustrative examples.

### Consequences

- Good, because conformance becomes executable rather than purely interpretive
- Good, because independent implementations gain a stable target for digesting, trust discovery, advisory handling, mapping, and dependency behavior
- Good, because the draft's stronger implementation claims are backed by concrete verification material
- Neutral, because the project may still choose different packaging for the fixtures so long as they remain normative
- Bad, because the project must now maintain a larger set of versioned conformance artifacts

### Confirmation

- Produce normative fixtures and vectors for each required conformance area
- Verify that two independent implementations can pass the same fixture suite without project-private coordination
- Verify that fixture updates are treated as normative interoperability changes when relevant

## Pros and Cons of the Options

### A — Require normative test fixtures and vectors

- Good, because interoperability claims can be tested directly against shared artifacts
- Good, because ambiguity in deterministic areas is reduced substantially
- Good, because the conformance model becomes much stronger for independent implementers
- Neutral, because the exact packaging location of the fixtures may still vary
- Bad, because authoring and maintaining fixtures increases specification overhead

### B — Keep requirements normative, but make fixtures informative

- Good, because the specification text remains somewhat lighter
- Good, because examples can still help implementers understand intent
- Neutral, because this may be acceptable in a less implementation-focused draft
- Bad, because informative fixtures do not resolve disagreements when prose is interpreted differently
- Bad, because conformance suites would still need extra judgment outside the normative contract

### C — Defer fixture work to a later version or separate test suite

- Good, because it reduces immediate drafting burden
- Good, because a later ecosystem could add fixtures with more implementation experience
- Neutral, because some projects do postpone executable conformance artifacts until after an initial draft
- Bad, because the current v0.1 decisions would remain weaker in practice than they appear on paper
- Bad, because independent implementation would still depend too heavily on interpretation and private coordination
