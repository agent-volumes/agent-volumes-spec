---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Allow informational component-impact metadata in advisories in v0.1

## Context and Problem Statement

ADR-0021 establishes that the normative advisory targeting model in v0.1 remains volume-level rather than component-level. However, many advisories still benefit from identifying which component within a volume is most directly implicated.

This creates a schema design question: **should the advisory model allow structured component-impact information for explanation and future migration value, even though the normative affected target remains the volume?**

The answer affects advisory clarity, client interpretation, and the future path toward any later re-examination of component-targeting semantics.

## Decision Drivers

- Preserve the simplicity of volume-level normative advisory targeting in v0.1
- Improve advisory clarity by allowing structured identification of likely impacted components
- Support future re-evaluation of component-level targeting without committing to it now
- Avoid forcing clients to extract all component-impact information from free-text descriptions alone

## Considered Options

- A — Allow structured informational component-impact metadata
- B — Do not add structured component-impact fields
- C — Defer even informational component-impact structure to later work

## Decision Outcome

Chosen option: **A — Allow structured informational component-impact metadata**, because it improves the usefulness of advisories without changing the normative targeting model.

Under this decision:

- the normative advisory target remains volume-level in v0.1
- the advisory schema may include structured informational metadata that identifies likely affected components, component names, or component references for explanatory purposes
- clients and bibliothecas must not confuse this informational component-impact metadata with a change to the normative affected-targeting model

### Consequences

- Good, because advisories can describe likely impacted components more clearly than free text alone
- Good, because the model stays compatible with the volume-level normative targeting decision
- Good, because future review of component-targeting semantics gains more structured evidence and migration value
- Neutral, because some clients may choose to display component-impact metadata more prominently than others
- Bad, because the schema must be clear enough to avoid confusion between informational impact metadata and normative targeting

### Confirmation

- Verify that advisories can include component-impact information without changing the normative target semantics
- Verify that clients can distinguish informational component metadata from actual affected-target determination
- Verify that the advisory schema wording prevents component-impact metadata from being misread as component-level targeting in v0.1

## Pros and Cons of the Options

### A — Allow structured informational component-impact metadata

- Good, because it improves advisory clarity and structured explanation
- Good, because it supports later component-targeting re-evaluation without requiring immediate normative complexity
- Good, because it is more useful than relying on free-text descriptions alone
- Neutral, because user-facing clients may still vary in how much they emphasize the information
- Bad, because the distinction between informational and normative semantics must be stated very clearly

### B — Do not add structured component-impact fields

- Good, because it keeps the advisory schema simpler
- Good, because it avoids any risk of confusion between component-impact information and normative targeting semantics
- Neutral, because free-text descriptions could still mention implicated components informally
- Bad, because it reduces structured explanatory value in advisories
- Bad, because it weakens the future migration path if component-level targeting is later revisited

### C — Defer even informational component-impact structure to later work

- Good, because it reduces immediate schema surface area further
- Good, because later work could revisit the field design with more experience
- Neutral, because some ecosystems may choose to stay fully package-level for a long time
- Bad, because advisories lose useful structured explanatory detail in the meantime
- Bad, because it misses an opportunity to capture component-impact information without increasing normative targeting complexity
