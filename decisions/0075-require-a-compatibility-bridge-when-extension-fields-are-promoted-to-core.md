---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Require a compatibility bridge when extension fields are promoted to core in v0.1+

## Context and Problem Statement

The Agent Volumes extension model now includes a reserved extension container, namespace discipline, reserved-name protection, and a breaking-change rule for new reserved names. That makes one further governance question especially important: **if a widely used extension field is later promoted into the core model, how should migration be handled?**

Without a migration rule, extension-to-core promotion could undermine trust in the extension model by forcing abrupt breakage on early adopters.

## Decision Drivers

- Protect extension users from abrupt breakage when successful extensions are promoted into the core model
- Encourage extension experimentation without making later standardization hostile to early adopters
- Preserve an orderly evolution path from local extension practice to shared standard behavior
- Keep extension governance credible and adoption-friendly

## Considered Options

- A — Require a compatibility bridge period for extension-to-core promotion
- B — Allow immediate core-only transition
- C — Defer extension-to-core migration policy to later governance work

## Decision Outcome

Chosen option: **A — Require a compatibility bridge period for extension-to-core promotion**, because it provides the fairest and most stable evolution path for a specification that explicitly allows extensions to incubate future core ideas.

Under this decision:

- when an extension field is promoted into the core model, the migration path must include a compatibility bridge period
- during that bridge period, the old extension form and the new core form can coexist under explicit migration guidance
- warning and deprecation signaling should be used rather than an abrupt hard cut-over where possible

### Consequences

- Good, because early extension adopters are less likely to be punished for successful experimentation
- Good, because extension-to-core evolution becomes more orderly and trustworthy
- Good, because the standard gains a clearer incubation-to-standardization path
- Neutral, because future versions still need to define the exact duration and mechanics of specific bridge periods case by case
- Bad, because promotions from extension to core may take longer to complete cleanly

### Confirmation

- Verify that future extension-to-core promotions can be designed with an explicit coexistence and deprecation period
- Verify that migration guidance can distinguish clearly between old extension form, bridge period, and eventual steady-state core usage
- Verify that the extension model remains attractive to early experimentation because promotion does not imply abrupt breakage

## Pros and Cons of the Options

### A — Require a compatibility bridge period for extension-to-core promotion

- Good, because it provides a predictable and fair migration path
- Good, because it strengthens trust in the extension mechanism as an incubation path
- Good, because it reduces avoidable breakage during standardization of successful extensions
- Neutral, because different promoted fields may still require different concrete bridge mechanics
- Bad, because it can prolong the period in which both extension and core forms need to be understood

### B — Allow immediate core-only transition

- Good, because it simplifies the resulting core model more quickly
- Good, because governance can move faster once a decision to standardize is made
- Neutral, because some tightly controlled ecosystems might tolerate faster break-oriented transitions
- Bad, because it makes extension adoption riskier for early implementers
- Bad, because it weakens the extension mechanism as a trusted incubation path

### C — Defer extension-to-core migration policy to later governance work

- Good, because it reduces immediate governance complexity
- Good, because later versions could refine migration policy with more implementation evidence
- Neutral, because some ecosystems do postpone formal migration policy until extension pressure becomes real
- Bad, because an important piece of the extension governance story remains under-specified
- Bad, because early extension adopters lack clarity about what later standardization will mean for them
