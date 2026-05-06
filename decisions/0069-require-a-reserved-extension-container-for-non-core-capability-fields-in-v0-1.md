---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Require a reserved extension container for non-core capability fields in v0.1

## Context and Problem Statement

ADR-0065 establishes that baseline clients ignore unknown capability fields and values, and ADR-0068 gives multi-valued capability fields explicit semantics. That makes capability extensibility more important, because future non-core fields must be able to coexist with a stable core capability surface.

This raises a naming-discipline question: **if non-core capability fields are added, should they be visibly marked as extensions rather than appearing as ordinary unknown fields?**

Without a naming discipline, unknown-field tolerance may drift into extension chaos, making it harder for clients and humans to distinguish true extensions from accidental or future core-looking fields.

## Decision Drivers

- Preserve clarity between core capability fields and non-core extensions
- Keep unknown-field tolerance compatible with structured extensibility
- Reduce naming collisions and ambiguity in future capability evolution
- Reuse an extension-style pattern that is already familiar from related agent-component ecosystems where possible

## Considered Options

- A — Require a reserved extension naming pattern for non-core capability fields
- B — Allow non-core fields to appear as ordinary unknown fields
- C — Defer capability-extension naming discipline to later work

## Decision Outcome

Chosen option: **A — Require a reserved extension naming pattern for non-core capability fields**, specifically using a **reserved extension container**, because it provides the clearest separation between core and non-core metadata while aligning with familiar patterns from related Agent Skills usage.

Under this decision:

- non-core capability fields must be placed under a reserved extension container rather than appearing as ordinary peer fields to the core model
- clients can distinguish core capability metadata from extension metadata structurally rather than only heuristically
- the extension-container approach is preferred over ad hoc free-form unknown fields for future capability evolution

### Consequences

- Good, because the core capability surface remains cleaner and easier to interpret
- Good, because extension metadata becomes structurally identifiable rather than merely unknown
- Good, because the model reduces collision risk between future core fields and vendor or local capability extensions
- Neutral, because the exact container shape still needs to be integrated into the concrete capability schema
- Bad, because extension authors must follow a more disciplined shape than simply adding arbitrary fields

### Confirmation

- Verify that capability documents can cleanly separate core fields from extension fields using the reserved extension container
- Verify that clients can ignore extensions safely while still interpreting the core capability surface consistently
- Verify that the reserved container approach reduces ambiguity compared with ordinary unknown-field extension behavior

## Pros and Cons of the Options

### A — Require a reserved extension naming pattern for non-core capability fields

- Good, because it provides a clear and machine-detectable boundary between core and extension metadata
- Good, because it makes extension growth safer in a model that also tolerates unknown fields
- Good, because it aligns with familiar extension-container patterns from related ecosystems
- Neutral, because later versions may still refine the exact extension-container conventions further
- Bad, because it imposes more structure on extension authors than a free-form field model would

### B — Allow non-core fields to appear as ordinary unknown fields

- Good, because it gives extension authors maximum short-term freedom
- Good, because implementations can add experimental fields with minimal ceremony
- Neutral, because some small ecosystems may tolerate this approach for a while
- Bad, because it makes unknown-field tolerance much harder to distinguish from intentional extension design
- Bad, because it increases the risk of naming collisions and interpretive ambiguity over time

### C — Defer capability-extension naming discipline to later work

- Good, because it reduces immediate schema-governance work
- Good, because later revisions could design the extension mechanism with more implementation evidence
- Neutral, because some ecosystems postpone extension-discipline design until after the core model stabilizes further
- Bad, because the capability extension story remains weaker and more ambiguous in the meantime
- Bad, because the current unknown-field-tolerance model would lack a clear structure for disciplined extension growth
