---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Publish the reserved extension-namespace list in machine-readable companion artifacts in v0.1

## Context and Problem Statement

ADR-0072 establishes that a small set of spec-owned-looking extension namespace keys should be reserved and unavailable for ordinary extension use.

That leaves a publication-form question unresolved: **should the reserved-name list live only in prose, or should it also be carried into the relevant machine-readable companion artifacts?**

If it remains prose-only, validators and tooling will have weaker direct enforcement support for a rule that is otherwise structurally important to extension hygiene.

## Decision Drivers

- Make reserved-name enforcement more practical for validators and tooling
- Keep prose and machine-readable companions aligned on naming-governance rules
- Reduce the gap between conceptual reserved-name policy and enforceable schema behavior
- Preserve implementation-ready value for the reserved-name decision

## Considered Options

- A — Publish the reserved-name list in machine-readable companion artifacts as well as prose
- B — Keep the reserved-name list only in prose
- C — Defer machine-readable publication of the reserved-name list

## Decision Outcome

Chosen option: **A — Publish the reserved-name list in machine-readable companion artifacts as well as prose**, because it best supports practical enforcement and keeps the reserved-name rule aligned with the broader machine-readable companion strategy.

Under this decision:

- the reserved extension-namespace list remains defined in prose
- the same reserved-name policy should also be represented in the relevant machine-readable companion artifacts where validation tooling can use it
- the prose remains the final interpretive authority, but machine-readable companions should carry the enforceable shape of the reserved-name constraint as well

### Consequences

- Good, because validators and tooling can enforce reserved-name rules more directly
- Good, because prose and companion artifacts remain better aligned on an important hygiene constraint
- Good, because the reserved-name policy becomes more operationally useful in implementation workflows
- Neutral, because the exact machine-readable encoding of the reserved-name set still needs concrete artifact design work
- Bad, because the project must now maintain the reserved-name list consistently in more than one form

### Confirmation

- Verify that machine-readable companions can encode the reserved-name constraint clearly enough for validation tooling
- Verify that the prose and machine-readable forms remain synchronized across releases
- Verify that the reserved-name policy becomes easier to enforce automatically without losing prose-level clarity

## Pros and Cons of the Options

### A — Publish the reserved-name list in machine-readable companion artifacts as well as prose

- Good, because it makes the rule enforceable by tooling rather than only by human reading
- Good, because it fits the broader decision to publish normative machine-readable artifacts for structured constraints
- Good, because it strengthens the practical value of the reserved-name policy
- Neutral, because implementation details still need to choose an appropriate schema encoding
- Bad, because it increases the burden of keeping prose and companion artifacts aligned

### B — Keep the reserved-name list only in prose

- Good, because it keeps the rule simpler to document and maintain in one place
- Good, because prose can explain rationale and nuance directly
- Neutral, because some implementations could still choose to encode the list locally even without a normative companion representation
- Bad, because validation tooling would have weaker direct support for enforcement
- Bad, because the rule's practical implementation value would be lower than it could be

### C — Defer machine-readable publication of the reserved-name list

- Good, because it reduces immediate companion-artifact maintenance work
- Good, because later versions could refine the exact encoding with more schema experience
- Neutral, because some ecosystems do initially keep governance rules prose-only
- Bad, because the reserved-name rule becomes less operationally enforceable in the meantime
- Bad, because the current machine-readable companion strategy would remain incomplete in an avoidable way for this constraint
