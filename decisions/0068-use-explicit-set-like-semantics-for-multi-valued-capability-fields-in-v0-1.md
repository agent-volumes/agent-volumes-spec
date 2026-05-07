---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use explicit set-like semantics for multi-valued capability fields in v0.1

## Context and Problem Statement

ADR-0067 establishes that core capability semantics should use booleans where sufficient and enums where needed. Some capability fields, however, naturally support multiple values—for example, a registry may support more than one delivery mode.

That creates a schema-semantics question: **should the baseline model define explicit semantics for multi-valued capability lists, or should list ordering and duplication behavior remain looser?**

Without explicit semantics, different clients may interpret the same capability arrays differently.

## Decision Drivers

- Keep multi-valued capability interpretation consistent across implementations
- Avoid ambiguity around ordering and duplicate entries
- Preserve simple machine-readable semantics for fields that naturally represent a set of supported modes or options
- Complete the capability-schema model coherently rather than leaving list behavior underspecified

## Considered Options

- A — Use explicit set-like semantics for multi-valued capability fields
- B — Use looser list semantics
- C — Defer list semantics to later work

## Decision Outcome

Chosen option: **A — Use explicit set-like semantics for multi-valued capability fields**, because it gives the most predictable and interoperable baseline behavior.

Under this decision:

- multi-valued capability fields are modeled as set-like lists
- list ordering is not semantically significant unless a field explicitly states otherwise
- duplicate entries are invalid in the baseline model

### Consequences

- Good, because multi-valued capability interpretation becomes more predictable
- Good, because clients do not need to guess whether ordering or duplication carries meaning
- Good, because the capability schema becomes more internally coherent
- Neutral, because a future field could still explicitly define ordered semantics if a compelling need arises
- Bad, because some implementers may need extra validation logic to enforce duplicate-free semantics

### Confirmation

- Verify that clients and validators treat multi-valued capability fields as unordered duplicate-free sets by default
- Verify that the schema and conformance fixtures represent multi-valued capabilities consistently under the chosen rule
- Verify that the set-like rule improves interoperability without making the capability model unnecessarily complex

## Pros and Cons of the Options

### A — Use explicit set-like semantics for multi-valued capability fields

- Good, because it gives the clearest and most interoperable interpretation
- Good, because it avoids ambiguity about duplicates and ordering
- Good, because it fits the operational meaning of many capability collections naturally
- Neutral, because some future fields might still justify an explicitly ordered model if stated clearly
- Bad, because it imposes a slightly stricter validation burden than a looser array model

### B — Use looser list semantics

- Good, because it keeps the schema somewhat lighter and more permissive
- Good, because implementations would have fewer validation constraints initially
- Neutral, because some simple cases may not visibly suffer from looser list semantics
- Bad, because duplicate or ordering ambiguity remains in the model
- Bad, because clients may interpret the same capability arrays differently

### C — Defer list semantics to later work

- Good, because it reduces immediate schema-definition effort
- Good, because later versions could revisit list behavior with more implementation evidence
- Neutral, because some ecosystems do postpone these semantics until more fields exist
- Bad, because an important part of the capability-schema model remains under-specified in v0.1
- Bad, because multi-valued capability behavior would still be less interoperable than the rest of the structured model now supports
