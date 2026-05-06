---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Require migration warnings when tooling accepts old extension forms during bridge periods in v0.1+

## Context and Problem Statement

ADR-0080 establishes that the new core form is canonical during an extension-to-core bridge, and ADR-0081 establishes that rewrite-capable tooling should emit the new form when it rewrites or normalizes data.

That still leaves an input-side discoverability question unresolved: **if a tool accepts the old extension form as input during the bridge period, should it quietly accept it or must it surface a migration warning?**

Without a warning requirement, the bridge may remain too invisible to users who continue supplying the legacy form.

## Decision Drivers

- Make bridge-period compatibility visible to users and operators
- Encourage migration away from the legacy form before the bridge ends
- Keep input acceptance behavior aligned with the canonical migration direction
- Avoid letting bridge compatibility become a silent long-term crutch

## Considered Options

- A — Require migration warnings when the old extension form is accepted
- B — Allow tooling to warn optionally
- C — Require no warning when the old extension form is accepted

## Decision Outcome

Chosen option: **A — Require migration warnings when the old extension form is accepted**, because accepting a compatibility alias without surfacing migration context would weaken the practical value of the bridge model.

Under this decision:

- tooling may continue to accept the old extension form during the bridge period
- when it does so, it must surface a migration-oriented warning or notice indicating that the old form is accepted only as a compatibility alias
- this requirement applies even when the tool is only reading or validating input and not rewriting it immediately

### Consequences

- Good, because users become aware that they are relying on a compatibility alias rather than the canonical form
- Good, because migration pressure is present even before rewrite-capable tooling normalizes output
- Good, because bridge semantics are more visible and operationally meaningful
- Neutral, because implementations may still vary in exact presentation style as long as the warning requirement is met
- Bad, because some users may see more migration-related warnings than they would prefer during the coexistence period

### Confirmation

- Verify that tooling accepting the old form surfaces a migration notice rather than silently treating it as ordinary input
- Verify that users can tell the old form is transitional and not the long-term canonical representation
- Verify that the warning requirement works coherently alongside the output-side canonicalization rule

## Pros and Cons of the Options

### A — Require migration warnings when the old extension form is accepted

- Good, because it makes bridge compatibility visible and actionable
- Good, because it reinforces the canonical status of the new core form even before output rewriting occurs
- Good, because it supports earlier migration awareness for users and operators
- Neutral, because implementations can still choose different UX wording or delivery channels for the warning
- Bad, because it introduces more visible migration signaling during the coexistence period

### B — Allow tooling to warn optionally

- Good, because implementations retain more UX flexibility
- Good, because some tools could remain quieter in cases where warning noise is a concern
- Neutral, because some ecosystems may tolerate mixed warning behavior during transitions
- Bad, because migration awareness becomes inconsistent across tools
- Bad, because the bridge model loses a lot of practical visibility and force

### C — Require no warning when the old extension form is accepted

- Good, because users see less warning noise while the bridge remains active
- Good, because tooling can continue compatibility acceptance very quietly
- Neutral, because some migration strategies may prefer to rely mostly on output changes rather than input warnings
- Bad, because the bridge period becomes much easier to ignore indefinitely
- Bad, because users may not realize they are depending on a form that is only temporarily supported
