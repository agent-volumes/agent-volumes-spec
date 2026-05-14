---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Keep maximum practical symmetry across scope, volume, and component name policies in v0.1

## Context and Problem Statement

Agent Volumes already uses related but not entirely identical identifier rules across scopes, volume names, and component names. As more of the specification becomes implementation-oriented, it is worth deciding explicitly whether those character policies should stay as symmetrical as practical or diverge more by identifier kind.

The answer affects human understanding of the naming model, tooling complexity, and the overall hygiene of the identifier system.

## Decision Drivers

- Keep the identifier mental model easy for implementers and users to understand
- Reduce unnecessary divergence in parsing and validation logic across identifier kinds
- Preserve strong identifier hygiene in the first interoperable baseline
- Avoid introducing domain-specific rule differences unless there is a compelling reason

## Considered Options

- A — Keep maximum practical symmetry across identifier kinds
- B — Allow more separate rule sets per identifier kind
- C — Treat symmetry as only a soft goal

## Decision Outcome

Chosen option: **A — Keep maximum practical symmetry across identifier kinds**, because a more symmetrical character-policy model is simpler, cleaner, and better aligned with the baseline interoperability goals.

Under this decision:

- scope, volume, and component naming policies should remain as similar as practical
- any divergence between identifier kinds should require a clear justification rather than being introduced casually
- the v0.1 baseline favors a coherent identifier family over more fragmented per-kind optimization

### Consequences

- Good, because the identifier model becomes easier to explain and implement
- Good, because validation and tooling logic can stay more consistent across identifier kinds
- Good, because overall identifier hygiene and predictability remain stronger
- Neutral, because some justified divergence may still remain possible where the specification has a real need
- Bad, because the model may sacrifice some identifier-kind-specific flexibility in favor of consistency

### Confirmation

- Verify that scope, volume, and component naming rules remain aligned wherever no strong reason for divergence exists
- Verify that tooling can benefit from the resulting consistency in parsing and validation logic
- Verify that any existing or future divergence is explicitly motivated rather than accidental drift

## Pros and Cons of the Options

### A — Keep maximum practical symmetry across identifier kinds

- Good, because it improves conceptual coherence across the identifier system
- Good, because it reduces tooling and validation complexity
- Good, because it supports a cleaner and more predictable baseline naming model
- Neutral, because some carefully justified exceptions may still be possible
- Bad, because it can limit flexibility for identifier-kind-specific tuning

### B — Allow more separate rule sets per identifier kind

- Good, because it allows each identifier kind to be optimized for its own domain pressures
- Good, because it could accommodate more specialized future naming needs in some areas
- Neutral, because some ecosystems do accept a more heterogeneous naming-rule landscape
- Bad, because it makes the overall identifier model harder to learn and implement
- Bad, because it increases the risk of unnecessary validation and parsing divergence

### C — Treat symmetry as only a soft goal

- Good, because it keeps options open without requiring immediate rule changes
- Good, because it allows future evolution to drift where needed without formally violating a strong design rule
- Neutral, because some specifications are comfortable leaving identifier coherence more emergent than enforced
- Bad, because it weakens the stabilizing role that symmetry can provide in the baseline model
- Bad, because it makes accidental long-term drift more likely
