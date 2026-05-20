---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Treat spec-defined defaults as semantic assumptions, not normalized mutation, in v0.1

## Context and Problem Statement

ADR-0049 establishes a strict canonical parsed-data-model boundary for `volume.toml`, with minimal normalization and no semantic coercion.

That leaves an adjacent semantic question unresolved: **when the specification defines default meaning for omitted fields, should parsers/validators materialize those defaults into normalized output, or should defaults remain interpretive semantics applied without mutating the parsed model?**

The answer affects purity of the parsed model, validator behavior, and how machine-readable companion schemas express omission semantics.

## Decision Drivers

- Preserve the strictness and clarity of the canonical parsed-data-model boundary
- Avoid silent mutation of authored manifest content during validation
- Keep omission semantics explicit at the interpretation level rather than the structural normalization level
- Let machine-readable companions express defaults without forcing normalized output injection

## Considered Options

- A — Treat defaults as semantic assumptions only
- B — Inject defaults into normalized output
- C — Defer default handling to later work

## Decision Outcome

Chosen option: **A — Treat defaults as semantic assumptions only**, because it preserves the integrity of the canonical parsed-data-model boundary and avoids mixing interpretation with structural mutation.

Under this decision:

- omitted fields may carry specification-defined default meaning
- parsers and validators are not required to silently rewrite or inject those defaults into normalized output
- machine-readable schema artifacts may express default meaning as annotations or references, but that does not change the baseline rule that defaults are interpretive semantics rather than required materialized fields

### Consequences

- Good, because the canonical parsed model remains closer to the authored source
- Good, because validation semantics stay aligned with the minimal-normalization decision
- Good, because omission meaning can still be defined clearly without forcing structural mutation
- Neutral, because some non-normative tooling may still choose to present fully materialized views to users if clearly distinguished from the normative parsed model
- Bad, because downstream consumers that prefer fully populated objects may need an explicit secondary interpretation step

### Confirmation

- Verify that independent validators can apply default semantics consistently without mutating normalized output
- Verify that machine-readable companion artifacts do not imply that omitted fields must be materialized silently in the canonical parsed model
- Verify that omission semantics remain clear to implementers even when defaults are not injected structurally

## Pros and Cons of the Options

### A — Treat defaults as semantic assumptions only

- Good, because it preserves a cleaner separation between authored structure and interpreted meaning
- Good, because it fits naturally with the strict parsed-data-model boundary already chosen
- Good, because it avoids silent rewriting of manifests during validation
- Neutral, because some helper tooling may still offer non-normative materialized views if clearly distinguished
- Bad, because some consumers may need extra interpretation logic to see fully populated effective values

### B — Inject defaults into normalized output

- Good, because downstream consumers may find fully populated data easier to process directly
- Good, because some tooling pipelines prefer receiving effective values without a separate interpretation step
- Neutral, because this approach can be attractive in systems that treat normalization and effective configuration as closely linked
- Bad, because it blurs the line between authored source and interpreted meaning
- Bad, because it conflicts with the strict minimal-normalization direction of the canonical parsed model

### C — Defer default handling to later work

- Good, because it reduces immediate schema and semantics specification work
- Good, because later versions could refine the model with more implementation feedback
- Neutral, because some ecosystems do postpone exact default-handling semantics until tooling matures
- Bad, because omission semantics remain under-specified in an important operational area
- Bad, because the parsed-model and validation model would still lack a clear shared baseline for default meaning in v0.1
