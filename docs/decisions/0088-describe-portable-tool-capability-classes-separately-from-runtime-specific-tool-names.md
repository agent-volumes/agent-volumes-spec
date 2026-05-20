---
status: accepted
date: 12026-05-07
decision-makers: Yunseo Kim
---

# Describe portable tool capability classes separately from runtime-specific tool names

## Context and Problem Statement

Tooling ecosystems increasingly publish recognizable built-in tool names, but those names vary significantly across runtimes in style, granularity, and policy coupling.

Some runtimes expose PascalCase tool names, some use snake_case or lowercase names, and some document capabilities more strongly than stable internal identifiers. That creates a specification design question: should Agent Volumes standardize a tool taxonomy directly in vendor-style tool names, stay entirely abstract, or separate portable capability classes from runtime-specific naming examples?

## Decision Drivers

- Preserve runtime neutrality in the core specification
- Make the standard useful to implementers comparing real runtime ecosystems
- Avoid accidentally canonizing one runtime's tool naming scheme as if it were the conceptual standard
- Provide enough structure for permissions, documentation, and compatibility profiles to reason about tool surfaces portably

## Considered Options

- Standardize around concrete runtime-style tool names
- Stay purely abstract and avoid discussing runtime tool inventories altogether
- Define portable capability classes and treat runtime-specific tool names as examples or profile material

## Decision Outcome

Chosen option: **Define portable capability classes and treat runtime-specific tool names as examples or profile material**, because it best preserves neutrality while still giving implementers useful real-world reference points.

Under this decision:

- the specification may describe portable capability classes such as shell execution, file read, file write/edit, search, web fetch/search, MCP bridge, delegation, planning, and code intelligence
- runtime-specific tool names remain examples, profile material, or implementation notes rather than core taxonomy terms
- permission and compatibility reasoning can target stable capability classes even when runtimes expose different concrete names

### Consequences

- Good, because the core remains portable across runtimes with different naming styles
- Good, because implementers still get concrete examples without mistaking them for mandatory canonical names
- Good, because future profiles can map local tool names into a shared capability vocabulary more cleanly
- Neutral, because some capability boundaries will still require judgment calls where runtimes bundle or split behavior differently
- Bad, because the spec cannot rely solely on one visible list of concrete tool names for every purpose
- Bad, because examples and profiles must be curated carefully to avoid accidental drift back toward vendor-first framing

### Confirmation

- Verify that the specification can discuss permissions and runtime interoperability using portable capability classes without depending on one runtime's exact tool names
- Verify that example runtimes can be mapped into the capability model without major ambiguity
- Verify that compatibility profiles can use local tool names while still referring back to the shared capability vocabulary

## Pros and Cons of the Options

### Standardize around concrete runtime-style tool names

- Good, because examples become immediately concrete and recognizable
- Good, because one canonical visible list can appear simpler at first glance
- Neutral, because a single-runtime ecosystem might tolerate this for some time
- Bad, because it risks turning one runtime's naming style into the apparent conceptual center of the spec
- Bad, because other runtimes with different tool models become awkward fits or second-class examples

### Stay purely abstract and avoid discussing runtime tool inventories altogether

- Good, because the core remains maximally neutral
- Good, because the specification avoids any appearance of runtime favoritism in naming
- Neutral, because some readers may prefer minimalism over comparative runtime guidance
- Bad, because implementers lose useful practical context when comparing real runtimes
- Bad, because permissions and compatibility guidance become harder to connect to concrete ecosystems

### Define portable capability classes and treat runtime-specific tool names as examples or profile material

- Good, because it balances abstraction with practical usefulness
- Good, because it protects the spec from accidental vendor lock-in at the naming layer
- Good, because it creates a better foundation for cross-runtime comparison and policy reasoning
- Neutral, because capability taxonomy design still needs careful editorial discipline
- Bad, because some readers may initially expect a more concrete or exhaustive built-in tool list in the core

## More Information

This decision does not require the specification to define a universal built-in tool set. It only defines how the standard should talk about tool surfaces portably.
