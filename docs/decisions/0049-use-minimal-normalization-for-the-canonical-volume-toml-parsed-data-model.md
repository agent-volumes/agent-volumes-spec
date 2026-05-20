---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use minimal normalization for the canonical `volume.toml` parsed data model in v0.1

## Context and Problem Statement

ADR-0048 establishes that the machine-readable schema for `volume.toml` should validate a canonical parsed data model rather than raw TOML syntax directly.

That creates an important follow-up design question: **how much normalization or semantic coercion should be allowed before validation against that canonical data model?**

If normalization is too permissive, different implementations may coerce the same authored TOML into different structural meanings. If it is too strict, authoring becomes less forgiving. The specification needs a clear interoperability-first boundary.

## Decision Drivers

- Preserve consistent parsed-model interpretation across implementations
- Avoid semantic coercion that weakens schema clarity
- Keep the validation contract strict enough to be predictable and testable
- Distinguish clearly between authoring syntax and structural meaning

## Considered Options

- A — Minimal normalization and no semantic coercion
- B — More permissive normalization before validation
- C — Defer the normalization boundary to later work

## Decision Outcome

Chosen option: **A — Minimal normalization and no semantic coercion**, because it gives the strongest and least ambiguous baseline for interoperable validation.

Under this decision:

- the typed output of the TOML parser is the baseline input to the canonical parsed data model
- key ordering is not semantically significant
- ambiguous shapes are treated as invalid rather than being semantically coerced into another form
- semantic coercions such as singleton-to-list conversion are not part of the baseline model
- specification-defined defaults, when relevant, are handled in interpretation/validation semantics rather than through silent structural coercion of authored input

### Consequences

- Good, because the parsed-model contract becomes more predictable across implementations
- Good, because validation logic stays clearer and easier to test
- Good, because the spec avoids schema ambiguity caused by convenience coercions
- Neutral, because some authoring workflows may still add editor-side assistance outside the normative model
- Bad, because authors get less forgiving behavior from the baseline validation model

### Confirmation

- Verify that independent implementations derive the same canonical parsed model from the same valid TOML input
- Verify that invalid or ambiguous input shapes are rejected consistently rather than coerced differently by different implementations
- Verify that specification-defined defaults can be applied without weakening the parsed-model validation boundary

## Pros and Cons of the Options

### A — Minimal normalization and no semantic coercion

- Good, because it provides the clearest interoperability boundary
- Good, because it makes validation and conformance testing more deterministic
- Good, because it avoids hidden semantic meaning changes during parsing/normalization
- Neutral, because non-normative tooling can still provide authoring assistance outside the core model
- Bad, because it is less forgiving for authors than a more convenience-oriented approach

### B — More permissive normalization before validation

- Good, because it could make authoring more forgiving in some cases
- Good, because some implementers may find convenience coercions attractive for user experience reasons
- Neutral, because a future profile might decide to define more authoring-assistance behavior separately
- Bad, because different implementations may normalize the same input differently
- Bad, because the parsed-model contract becomes less strict and less predictable

### C — Defer the normalization boundary to later work

- Good, because it reduces immediate schema-governance specification effort
- Good, because later work could use more real implementation evidence to refine the boundary
- Neutral, because some ecosystems do postpone this distinction until toolchains mature
- Bad, because the canonical parsed data model remains under-specified in an important area
- Bad, because implementation-ready manifest validation would still have avoidable ambiguity
