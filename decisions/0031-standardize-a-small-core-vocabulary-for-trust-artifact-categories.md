---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Standardize a small core vocabulary for trust artifact categories in v0.1

## Context and Problem Statement

The trust-discovery API in Agent Volumes is now becoming concrete enough that clients need a stable way to understand what kinds of trust artifacts are present.

Without a shared vocabulary, different bibliothecas could expose similar trust artifacts under incompatible names such as `sbom`, `bom`, `cyclonedx-bom`, `provenance`, `slsa`, `signature`, or `sigstore-bundle`, even when the underlying semantics are equivalent.

The specification therefore needs to decide whether the v0.1 trust-discovery API should standardize a small category vocabulary, a detailed artifact vocabulary, or leave naming implementation-defined.

## Decision Drivers

- Make trust summary and filtering behavior portable across bibliothecas
- Avoid making v0.1 too rigid around format-specific labels that may evolve
- Preserve room for multiple concrete artifact formats within a shared semantic category
- Keep the trust API easy for clients to interpret without registry-specific string mapping

## Considered Options

- A — Standardize a small core vocabulary for top-level categories
- B — Standardize a fully detailed format-specific core vocabulary
- C — Leave category naming implementation-defined

## Decision Outcome

Chosen option: **A — Standardize a small core vocabulary for top-level categories**, because it gives clients a portable semantic layer while still leaving room for concrete format and subtype fields.

Under this decision:

- the v0.1 trust-discovery API should define a small shared category vocabulary for top-level trust artifact kinds
- concrete formats such as CycloneDX, SPDX, SLSA provenance, DSSE, or Sigstore bundles should be carried through separate format, subtype, or equivalent fields rather than by exploding the top-level category vocabulary
- this category vocabulary is intended to stabilize trust summary, filtering, and baseline interpretation across bibliothecas

### Consequences

- Good, because clients gain a portable semantic layer for trust artifact discovery
- Good, because format-specific evolution can happen without destabilizing top-level categories
- Good, because summary views and filtering become easier to implement consistently
- Neutral, because the exact field names for format/subtype still need to be integrated into the concrete API contract
- Bad, because some highly specific workflows may still want richer vocabulary detail than the core category layer provides

### Confirmation

- Verify that trust summary views can describe available artifact classes consistently using the shared category vocabulary
- Verify that clients can distinguish top-level category semantics from concrete artifact format details
- Verify that multiple concrete artifact formats can coexist cleanly under the same top-level category when appropriate

## Pros and Cons of the Options

### A — Standardize a small core vocabulary for top-level categories

- Good, because it provides a portable trust-artifact semantic layer across registries
- Good, because it avoids overcommitting the core vocabulary to specific format names
- Good, because it keeps room for future formats and subtypes without breaking the category layer
- Neutral, because richer subtype conventions may still be needed for some advanced workflows
- Bad, because clients needing very fine-grained distinctions must still inspect additional fields

### B — Standardize a fully detailed format-specific core vocabulary

- Good, because it gives clients very explicit artifact labeling from the start
- Good, because some advanced workflows may prefer immediate format-specific naming in the top-level vocabulary
- Neutral, because a later mature ecosystem might eventually want more specific standard labels
- Bad, because it makes the v0.1 vocabulary heavier and more brittle
- Bad, because format evolution or multiple equivalent representations would be harder to manage cleanly

### C — Leave category naming implementation-defined

- Good, because bibliothecas retain maximum naming flexibility
- Good, because the spec would avoid one more standardized vocabulary commitment
- Neutral, because some implementations might still converge informally on similar labels
- Bad, because clients would need registry-specific string interpretation for basic trust summary behavior
- Bad, because filtering and interoperability would be weaker than the current trust API direction requires
