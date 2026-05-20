---
status: accepted
date: 12026-05-07
decision-makers: Yunseo Kim
---

# Adopt a canonical hook event vocabulary aligned with established runtime conventions

## Context and Problem Statement

The draft already defines Hook as a first-class component type, but its lifecycle event names remain an older generic vocabulary such as `BeforeTool` and `AfterTool`.

That leaves a practical interoperability problem: runtimes and plugin ecosystems increasingly expose richer and more widely recognized hook event names, and migration tooling benefits from shared surface identifiers even when deeper runtime semantics remain runtime-neutral.

The specification needs to decide whether to keep a generic internal-only event vocabulary or adopt a more interoperable canonical naming layer.

## Decision Drivers

- Reduce migration friction from existing runtime ecosystems that already expose recognizable hook event names
- Preserve runtime-neutral semantics while improving surface-level interoperability
- Avoid forcing adapters to translate every common hook event into an idiosyncratic Agent Volumes name
- Keep the hook model concrete enough for future examples, validation guidance, and profiles

## Considered Options

- Keep the current generic hook event vocabulary
- Add compatibility aliases while keeping the current generic names canonical
- Adopt a canonical hook event vocabulary aligned with established runtime conventions

## Decision Outcome

Chosen option: **Adopt a canonical hook event vocabulary aligned with established runtime conventions**, because it provides the strongest interoperability benefit while still allowing Agent Volumes to define the underlying semantics itself.

Under this decision:

- the specification's canonical hook event names are updated to match a more widely recognized runtime-facing vocabulary
- these event identifiers are treated as interoperability-facing surface names, not as evidence that Agent Volumes is conceptually dependent on any single vendor runtime
- the semantics, guarantees, and conformance expectations remain defined by Agent Volumes prose rather than inherited from another product's behavior
- compatibility profiles may document closer runtime-specific mappings where needed

### Consequences

- Good, because migration and adapter tooling can align more directly with existing runtime expectations
- Good, because the hook model becomes easier for implementers to recognize and apply
- Good, because surface-level compatibility improves without giving up semantic ownership
- Neutral, because runtimes may still differ in payload details and behavioral nuances beyond the shared event names
- Bad, because readers may misread familiar names as hidden vendor alignment unless the spec frames them carefully
- Bad, because some existing draft wording and examples must be updated to reflect the new canonical vocabulary

### Confirmation

- Verify that the specification uses the new canonical hook event names consistently wherever hook lifecycle events are listed
- Verify that compatibility-oriented prose clearly states that semantics remain defined by Agent Volumes
- Verify that at least one runtime compatibility profile can map the canonical vocabulary cleanly to a real runtime ecosystem

## Pros and Cons of the Options

### Keep the current generic hook event vocabulary

- Good, because it preserves the draft's older naming without churn
- Good, because the names appear more obviously internal and neutral at first glance
- Neutral, because implementers could still translate names locally if necessary
- Bad, because the interoperability surface remains less familiar than it could be
- Bad, because migration tooling must keep paying a translation cost for a problem that mostly concerns naming rather than semantics

### Add compatibility aliases while keeping the current generic names canonical

- Good, because it preserves backward continuity for the older draft terminology
- Good, because runtimes could still recognize familiar names through the aliases
- Neutral, because this approach could soften migration pressure in the short term
- Bad, because it creates two competing naming layers where one should suffice
- Bad, because it weakens clarity about which event names are actually canonical

### Adopt a canonical hook event vocabulary aligned with established runtime conventions

- Good, because it gives the spec one clear interoperability-facing event layer
- Good, because it minimizes naming friction for adapters and profiles
- Good, because it preserves semantic neutrality while improving recognizability
- Neutral, because compatibility notes may still be needed for runtime-specific details
- Bad, because careful editorial framing is required to avoid over-signaling vendor bias

## More Information

This decision is specifically about event identifiers, not about copying another runtime's full execution semantics, payload shape, permission model, or failure behavior.
