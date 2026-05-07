---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use small fixed vocabularies and booleans for core capability fields in v0.1

## Context and Problem Statement

ADR-0061 through ADR-0065 establish a bounded but structured capability-metadata model for bibliothecas. That leaves a field-design question unresolved: **should the values of core capability fields themselves use small fixed vocabularies and booleans where practical, or remain more open-ended?**

The answer affects how portable, automatable, and easy to validate the capability document becomes in the first interoperable baseline.

## Decision Drivers

- Keep capability parsing and client behavior simple and portable
- Use stronger structure where the capability domain is naturally small and stable
- Avoid unnecessary open-ended strings for core operational facts
- Stay consistent with the broader pattern of small shared vocabularies adopted elsewhere in the specification

## Considered Options

- A — Use small fixed vocabularies and booleans for core capability fields
- B — Use mostly free strings for capability values
- C — Defer concrete capability value vocabularies to later work

## Decision Outcome

Chosen option: **A — Use small fixed vocabularies and booleans for core capability fields**, because it produces the most practical and interoperable baseline capability document.

Under this decision:

- core capability fields should use small fixed enums where the capability domain is naturally small and stable
- booleans should be used where a simple yes/no capability distinction is sufficient
- the baseline capability model avoids unnecessary reliance on open-ended strings for its most important operational fields

### Consequences

- Good, because capability parsing and automation become more reliable across clients
- Good, because conformance and validation of capability metadata are easier to implement
- Good, because the capability surface stays consistent with the spec's broader small-core-vocabulary strategy
- Neutral, because some later or richer capability fields may still need extension mechanisms beyond booleans and small enums
- Bad, because the model is less free-form than registries that prefer open text-like values might want

### Confirmation

- Verify that the chosen core capability fields can be represented well with booleans or small stable vocabularies
- Verify that clients can use the resulting values for automation without registry-specific interpretation rules
- Verify that the capability schema remains simple enough to implement widely in v0.1

## Pros and Cons of the Options

### A — Use small fixed vocabularies and booleans for core capability fields

- Good, because it makes the capability document more interoperable and machine-friendly
- Good, because it strengthens validation and conformance behavior
- Good, because it aligns well with the broader vocabulary discipline already adopted in the specification
- Neutral, because future expansion may still require additional extension points for richer capability signaling
- Bad, because it constrains registries that might otherwise prefer looser free-form value expression

### B — Use mostly free strings for capability values

- Good, because it gives registries more expressive freedom immediately
- Good, because new capability states can appear without additional shared vocabulary design
- Neutral, because some ecosystems may tolerate more stringly-typed capability models for a while
- Bad, because client automation becomes weaker and more interpretation-heavy
- Bad, because interoperability and validation quality are reduced for the core capability surface

### C — Defer concrete capability value vocabularies to later work

- Good, because it reduces immediate vocabulary-definition work
- Good, because later versions could shape the values with more implementation evidence
- Neutral, because some ecosystems do postpone concrete value modeling until after first implementation waves
- Bad, because the capability metadata remains less operationally useful in the meantime
- Bad, because a key part of the capability document would remain more abstract than the rest of the structured model now suggests
