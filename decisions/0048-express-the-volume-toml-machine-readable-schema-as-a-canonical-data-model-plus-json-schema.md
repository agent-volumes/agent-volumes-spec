---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Express the `volume.toml` machine-readable schema as a canonical data model plus JSON Schema in v0.1

## Context and Problem Statement

Agent Volumes uses `volume.toml` as its human-authored manifest format. ADR-0047 establishes that machine-readable companion artifacts should use the best-fit standard format for each artifact type.

That creates a manifest-schema design question: **should the normative machine-readable schema for `volume.toml` operate directly on TOML document structure, or should it operate on a canonical parsed data model using a structural schema format such as JSON Schema?**

The answer affects tooling practicality, validation workflows, and how naturally the manifest schema integrates with existing parser ecosystems.

## Decision Drivers

- Keep manifest validation practical for real parser/tooling ecosystems
- Avoid creating unnecessary dependence on weak or uneven TOML-native schema tooling
- Preserve the role of TOML as the human authoring and serialization form
- Give implementations a clear, structural validation target after parsing

## Considered Options

- A — Use a canonical parsed data model plus JSON Schema
- B — Use a TOML-native schema approach
- C — Defer the manifest schema artifact to a later phase

## Decision Outcome

Chosen option: **A — Use a canonical parsed data model plus JSON Schema**, because it best matches the practical structure of TOML tooling and validation workflows without weakening TOML's role as the manifest authoring format.

Under this decision:

- `volume.toml` remains the normative human authoring and serialization form for the manifest
- the normative machine-readable schema artifact is defined against a canonical parsed data model rather than against raw TOML syntax directly
- JSON Schema or an equivalent structural schema format is used to express that canonical data-model validation contract

### Consequences

- Good, because manifest validation aligns well with the reality of existing parser and tooling ecosystems
- Good, because the schema contract becomes easier to automate and integrate in common validation workflows
- Good, because TOML remains the author-facing format without requiring a separate TOML-native validation ecosystem to mature first
- Neutral, because the project must still define the canonical parsed data model clearly enough for schema validation to be unambiguous
- Bad, because implementers who hoped for a more document-form-native schema approach may find the parsed-model step less direct

### Confirmation

- Verify that the canonical parsed data model is defined clearly enough that independent implementations validate the same manifest content consistently
- Verify that JSON Schema or equivalent structural tooling can express the needed manifest constraints accurately
- Verify that the manifest authoring experience remains centered on TOML even though the machine-readable schema targets the parsed model

## Pros and Cons of the Options

### A — Use a canonical parsed data model plus JSON Schema

- Good, because it aligns with the strongest existing structural-schema tooling ecosystem
- Good, because it makes validation automation practical and familiar
- Good, because it separates authoring syntax concerns from structural validation concerns cleanly
- Neutral, because it requires a clearly documented parsed-model contract in addition to the TOML document form
- Bad, because it is one step less direct than a hypothetical strong TOML-native schema system

### B — Use a TOML-native schema approach

- Good, because it feels more directly aligned with the human-authored document form
- Good, because it may appeal to readers who want one format family for both authoring and validation
- Neutral, because a stronger TOML-native schema ecosystem could become more attractive in the future
- Bad, because the current tooling ecosystem is less mature and less standard for this use case
- Bad, because it risks adding avoidable implementation friction for the first interoperable baseline

### C — Defer the manifest schema artifact to a later phase

- Good, because it reduces immediate companion-artifact scope and maintenance burden
- Good, because later work could refine the approach with more implementation feedback
- Neutral, because some ecosystems do wait before formalizing machine-readable manifest validation
- Bad, because it conflicts with the decision to publish normative machine-readable companions for structured contracts
- Bad, because one of the most important structured artifacts in the spec would remain harder to validate automatically than necessary
