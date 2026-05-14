---
status: accepted
date: 12026-05-07
decision-makers: Yunseo Kim
---

# Add runtime compatibility profiles, including a Claude Code compatibility profile

## Context and Problem Statement

The draft already includes runtime identifiers, protocol compatibility, and environment requirements. That gives Agent Volumes a runtime-neutral compatibility baseline, but it does not yet provide a focused place to document higher-friction migration details for real runtime ecosystems.

As compatibility work has become more implementation-oriented, one gap has become more obvious: some ecosystems need profile-level guidance around filenames, event vocabularies, component discovery expectations, and related portability details that are too specific for the neutral core but too important to leave entirely out of the spec.

The specification therefore needs to decide whether to stay purely core-only, to add compatibility profiles in general, or to treat such guidance as external documentation only.

## Decision Drivers

- Preserve a runtime-neutral core while still helping real implementers migrate and interoperate
- Give high-friction runtime ecosystems a structured, non-ad hoc place in the specification
- Avoid scattering compatibility guidance across unrelated examples and notes
- Keep the main specification implementation-ready rather than relying entirely on external adapter documentation

## Considered Options

- Keep only the runtime-neutral core and leave runtime-specific compatibility guidance to external documents
- Add runtime compatibility profiles as an explicit specification layer
- Inline all runtime-specific compatibility details directly into the core semantics

## Decision Outcome

Chosen option: **Add runtime compatibility profiles as an explicit specification layer**, because it best preserves the neutral core while giving important interoperability guidance a visible and structured home.

Under this decision:

- the specification may define runtime compatibility profiles in addition to the runtime-neutral core baseline
- those profiles are additive compatibility guidance rather than replacements for the core model
- a Claude Code compatibility profile is included as the first concrete profile because its migration surface is important and already well understood
- additional profiles may be added later for other runtimes without making any one runtime the conceptual center of Agent Volumes

### Consequences

- Good, because the spec gains a clean place to document practical interoperability details that do not belong in the core abstraction layer
- Good, because the runtime-neutral baseline remains intact instead of becoming overloaded with product-specific behavior
- Good, because future runtime profiles can be added using the same structural pattern
- Neutral, because some readers may need a clearer explanation of the difference between core semantics and profile guidance at first
- Bad, because the specification grows in editorial scope and must keep profile boundaries disciplined
- Bad, because a first concrete profile can create perception risk unless the spec clearly explains why profiles exist and how they generalize

### Confirmation

- Verify that the specification clearly distinguishes core semantics from profile-level compatibility guidance
- Verify that a Claude Code compatibility profile can be written without making the rest of the standard read as vendor-centered
- Verify that the profile structure appears reusable for future runtime ecosystems rather than bespoke to one tool

## Pros and Cons of the Options

### Keep only the runtime-neutral core and leave runtime-specific compatibility guidance to external documents

- Good, because the main specification stays smaller and more abstract
- Good, because runtime-specific details could evolve independently in adapter documentation
- Neutral, because some standards do keep migration guidance out of their main normative text
- Bad, because implementers lose an important source of structured, first-party compatibility guidance
- Bad, because high-friction migration details become harder to discover and reason about consistently

### Add runtime compatibility profiles as an explicit specification layer

- Good, because it creates a principled home for practical interop guidance
- Good, because it protects the core from unnecessary vendor-specific detail while still serving implementers
- Good, because it offers a repeatable structure for future ecosystems
- Neutral, because profile scope will need editorial discipline over time
- Bad, because the spec becomes somewhat larger and more layered

### Inline all runtime-specific compatibility details directly into the core semantics

- Good, because everything would live in one place
- Good, because some implementation details might become easier to find initially
- Neutral, because a small single-runtime ecosystem might tolerate this approach for a while
- Bad, because it would blur the line between neutral standard semantics and product-facing migration detail
- Bad, because the core would become harder to generalize across multiple runtimes

## More Information

The role of a compatibility profile is to document packaging and interoperability affordances, not to redefine the underlying standard around any one runtime.
