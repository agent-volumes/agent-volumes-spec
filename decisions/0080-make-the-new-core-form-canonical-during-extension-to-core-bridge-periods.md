---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Make the new core form canonical during extension-to-core bridge periods in v0.1+

## Context and Problem Statement

ADR-0075 through ADR-0079 establish that extension-to-core promotions require a compatibility bridge, that bridge metadata must be structured and colocated, and that bridge end-state/removal targets are explicitly versioned.

That leaves one semantic migration question unresolved: **during the bridge period, are the old extension form and the new core form equally canonical, or does the bridge already establish the new core form as the primary semantic center?**

Without a clear answer, tooling and documentation may struggle to know which form is the real target of the migration.

## Decision Drivers

- Make migration direction clear during bridge periods
- Avoid ambiguity about which form should be treated as the long-term semantic target
- Support warnings, guidance, and normalization around one clear canonical center
- Preserve bridge compatibility without making the final destination unclear

## Considered Options

- A — Make the new core form canonical and treat the old extension form as a compatibility alias
- B — Treat the old and new forms as equally canonical during the bridge
- C — Leave equivalence to be decided separately for each promoted field

## Decision Outcome

Chosen option: **A — Make the new core form canonical and treat the old extension form as a compatibility alias**, because it preserves compatibility while keeping migration direction explicit.

Under this decision:

- both old and new forms may remain accepted during the bridge period
- the new core form is the canonical semantic center during that period
- the old extension form is treated as a compatibility alias rather than as an equally canonical long-term representation

### Consequences

- Good, because migration guidance has a clear target state even before the bridge ends
- Good, because tooling can privilege the new form for display, warnings, and emitted output where appropriate
- Good, because bridge compatibility does not blur the semantic destination of the migration
- Neutral, because some field-specific migration details may still require tailored handling beyond the baseline semantic rule
- Bad, because the bridge is slightly less symmetric than a model where both forms are treated as equally canonical for the whole period

### Confirmation

- Verify that tooling and documentation can identify the new core form as the preferred canonical representation during the bridge
- Verify that the old extension form remains accepted compatibly without being mistaken for the long-term canonical target
- Verify that bridge metadata and warning behavior can use this distinction clearly and consistently

## Pros and Cons of the Options

### A — Make the new core form canonical and treat the old extension form as a compatibility alias

- Good, because it provides a clear semantic migration direction
- Good, because it supports stronger warning and normalization behavior around one preferred form
- Good, because it keeps bridge compatibility while still pointing clearly toward the final steady state
- Neutral, because implementation-specific migration mechanics may still vary somewhat by field
- Bad, because it reduces the symmetry of the bridge compared with a fully co-canonical model

### B — Treat the old and new forms as equally canonical during the bridge

- Good, because it makes the coexistence period feel maximally balanced
- Good, because it may reduce some short-term friction for users still emitting the old form
- Neutral, because some ecosystems might prefer a softer migration posture during coexistence
- Bad, because it weakens clarity about which form is the actual target of the migration
- Bad, because tooling has a harder time choosing one preferred representation for warnings and output

### C — Leave equivalence to be decided separately for each promoted field

- Good, because it maximizes local flexibility for unusual field-specific cases
- Good, because some future promotions might genuinely need different semantics
- Neutral, because a mature ecosystem may eventually identify narrow exceptions where a custom relationship is justified
- Bad, because it weakens baseline clarity and tooling predictability
- Bad, because migration semantics become less consistent across extension-to-core promotions
