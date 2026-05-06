---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Keep prose as the final normative authority over derived schema artifacts in v0.1

## Context and Problem Statement

ADR-0043 establishes that Agent Volumes v0.1 should publish normative machine-readable schema artifacts alongside the prose specification.

That creates an immediate governance question: **if the prose and a machine-readable schema artifact ever diverge or appear to conflict, which one has final interpretive authority?**

Without a clear answer, the dual-source normative model could create more ambiguity rather than reducing it.

## Decision Drivers

- Preserve a clear final interpretive authority for the standard
- Keep machine-readable artifacts strong enough to be operationally valuable without making governance unmanageable
- Avoid ambiguity when prose and schemas are not perfectly aligned
- Support the role of schemas as practical normative companions rather than independent competing authorities

## Considered Options

- A — Keep prose as the final authority and treat schemas as derived normative companions
- B — Treat prose and schemas as co-equal normative sources
- C — Give machine-readable schema artifacts precedence over prose

## Decision Outcome

Chosen option: **A — Keep prose as the final authority and treat schemas as derived normative companions**, because it preserves a stable standards-governance model while still making schemas normatively valuable.

Under this decision:

- machine-readable schema artifacts are normative companions to the prose specification
- those artifacts are derived from, and subordinate in final interpretive authority to, the prose specification
- when ambiguity or conflict arises, the prose specification is the final normative authority for interpretation

### Consequences

- Good, because the standard retains a clear final interpretive authority
- Good, because schemas can still be used normatively for tooling and validation without becoming a competing governance center
- Good, because conflict resolution becomes easier than in a co-equal model
- Neutral, because schema-first implementers may still need to consult prose in edge cases
- Bad, because it does not fully eliminate the maintenance burden of keeping prose and schemas aligned

### Confirmation

- Verify that the prose specification explicitly states the interpretive precedence rule
- Verify that machine-readable artifacts can still be relied upon normatively for normal validation and implementation workflows
- Verify that conflict resolution between prose and schemas is unambiguous under the chosen model

## Pros and Cons of the Options

### A — Keep prose as the final authority and treat schemas as derived normative companions

- Good, because it preserves a clear and familiar standards-governance model
- Good, because it lets machine-readable artifacts remain useful and normative without making them co-equal arbiters
- Good, because it gives implementers a straightforward escalation path when ambiguities appear
- Neutral, because some schema-first workflows may still prefer stronger schema authority
- Bad, because prose/schema alignment still requires disciplined maintenance

### B — Treat prose and schemas as co-equal normative sources

- Good, because it gives machine-readable artifacts strong formal status
- Good, because some implementers may appreciate equal authority for human-readable and machine-readable forms
- Neutral, because a very mature specification process might be able to manage dual co-equal sources carefully
- Bad, because conflict resolution becomes significantly harder
- Bad, because governance complexity rises without a clear final authority

### C — Give machine-readable schema artifacts precedence over prose

- Good, because it is attractive for strongly tooling-centric implementation workflows
- Good, because it may simplify some schema-driven validation flows in the short term
- Neutral, because some highly machine-centric ecosystems may eventually prefer this stance
- Bad, because it weakens the role of the prose standard as the primary interpretive source
- Bad, because it makes standard governance and non-schema nuances harder to manage reliably
