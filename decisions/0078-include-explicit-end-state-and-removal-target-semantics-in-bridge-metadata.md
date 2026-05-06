---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Include explicit end-state and removal-target semantics in extension-to-core bridge metadata in v0.1+

## Context and Problem Statement

ADR-0075 requires a compatibility bridge period when extension fields are promoted to core, ADR-0076 requires bridge signaling through structured metadata and warnings, and ADR-0077 requires that metadata to be colocated with the affected artifact.

That still leaves one key migration-governance question unresolved: **should the bridge metadata also state when the bridge is expected to end, or should it only indicate that a bridge exists?**

Without explicit end-state semantics, tooling and users may know that a bridge is active but still lack clarity about when the legacy form will stop being accepted.

## Decision Drivers

- Make migration timelines and end-state expectations visible to tooling and users
- Prevent bridge periods from becoming ambiguous or effectively indefinite
- Support stronger migration planning and validation behavior
- Complete the bridge-signaling model with actionable removal intent

## Considered Options

- A — Include explicit end-state and removal-target semantics in bridge metadata
- B — Signal only that a bridge is active
- C — Defer bridge end-state semantics to later work

## Decision Outcome

Chosen option: **A — Include explicit end-state and removal-target semantics in bridge metadata**, because active-bridge signaling alone is not enough for predictable migration behavior.

Under this decision:

- bridge metadata should include explicit status and removal-target or end-state signaling
- tooling and users should be able to determine not only that a bridge is active, but also the intended migration horizon for the old form
- the bridge model should communicate enough information to distinguish active coexistence from approaching or completed retirement

### Consequences

- Good, because migration-aware tooling gains clearer decision support
- Good, because bridge periods are less likely to drift into indefinite ambiguity
- Good, because users can plan transitions with better visibility into the intended end state
- Neutral, because the exact field shape for status/removal-target still needs concrete schema integration work
- Bad, because the migration metadata model becomes somewhat more detailed than a simple active-bridge flag

### Confirmation

- Verify that bridge metadata can express both active coexistence and intended end-state timing clearly
- Verify that tooling can distinguish an active bridge from one that is ending or has ended
- Verify that the bridge model provides enough information for predictable migration behavior without relying only on prose guidance

## Pros and Cons of the Options

### A — Include explicit end-state and removal-target semantics in bridge metadata

- Good, because it makes migration behavior much more actionable for tooling and users
- Good, because it prevents active bridges from being under-specified about their future state
- Good, because it strengthens the practical value of the bridge-compatibility rule significantly
- Neutral, because exact schema details still need to be designed carefully
- Bad, because it adds another layer of structured migration metadata

### B — Signal only that a bridge is active

- Good, because it keeps the metadata model simpler
- Good, because clients at least know coexistence is currently allowed
- Neutral, because some very small ecosystems may tolerate prose-only end-state guidance for a time
- Bad, because tooling cannot reliably infer when to stop accepting the old form
- Bad, because bridge metadata remains incomplete for stronger migration planning

### C — Defer bridge end-state semantics to later work

- Good, because it reduces immediate migration-metadata design effort
- Good, because later versions could refine the model with more experience
- Neutral, because some ecosystems do start with simpler coexistence signaling before formalizing retirement details
- Bad, because the bridge model remains less actionable than it should be
- Bad, because migration planning still depends too heavily on prose and out-of-band guidance
