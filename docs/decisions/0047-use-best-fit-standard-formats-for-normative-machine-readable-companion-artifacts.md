---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use best-fit standard formats for normative machine-readable companion artifacts in v0.1

## Context and Problem Statement

ADR-0046 establishes that v0.1 should publish normative machine-readable artifacts for structured contracts only. That leaves a practical artifact-design question: **should those machine-readable companions all use one dominant schema format, or should the specification use the most appropriate standard format for each artifact type?**

Different structured contracts in Agent Volumes have different natural representation needs. Manifests, API payloads, endpoint topology, and conformance-fixture shapes are related, but not identical, schema problems.

## Decision Drivers

- Use schema technologies that fit each structured contract well
- Preserve strong tooling support without forcing awkward schema translations
- Keep the machine-readable companion strategy practical for implementers
- Avoid over-optimizing for uniformity at the expense of expressiveness or maintainability

## Considered Options

- A — Use the best-fit standard format for each artifact type
- B — Use JSON Schema as the primary format across most artifact types
- C — Use OpenAPI as the primary format across most artifact types

## Decision Outcome

Chosen option: **A — Use the best-fit standard format for each artifact type**, because it provides the most practical and maintainable path for machine-readable normative companions in v0.1.

Under this decision:

- machine-readable companions may use different standard schema families depending on artifact type
- structural payload and fixture-shape cases may use JSON Schema or equivalent structural schema formats
- HTTP API endpoint and payload contracts may use OpenAPI together with appropriate schema components where useful
- the project does not force artificial one-format uniformity where it would reduce clarity or tooling fit

### Consequences

- Good, because each artifact type can use the most natural and well-supported representation technology
- Good, because implementers can rely on familiar tooling per structured contract type
- Good, because the schema publication strategy stays practical rather than ideologically uniform
- Neutral, because the project must still document clearly which artifact uses which format family
- Bad, because the companion artifact ecosystem is somewhat more varied than a one-format-only strategy

### Confirmation

- Verify that each structured companion artifact uses a format that fits its actual shape and tooling needs well
- Verify that implementers can discover and apply the right schema technology for each artifact type without confusion
- Verify that the mixed-format strategy improves practical usability more than a forced one-format approach would

## Pros and Cons of the Options

### A — Use the best-fit standard format for each artifact type

- Good, because it optimizes for practical fit and tooling support
- Good, because it avoids distorting one artifact type to fit the needs of another
- Good, because it keeps the machine-readable publication strategy more realistic for v0.1
- Neutral, because it requires slightly clearer documentation of which format applies where
- Bad, because it is less visually uniform than a single-format strategy

### B — Use JSON Schema as the primary format across most artifact types

- Good, because it provides a stronger sense of uniformity across artifacts
- Good, because many structured payloads and fixture shapes fit JSON Schema naturally
- Neutral, because some teams may prefer minimizing the number of schema technologies involved
- Bad, because HTTP endpoint topology and some API-contract concerns fit OpenAPI-oriented tooling better
- Bad, because forcing JSON Schema everywhere can weaken expressiveness or tooling ergonomics for some surfaces

### C — Use OpenAPI as the primary format across most artifact types

- Good, because it is strong for HTTP API surface definition
- Good, because it can unify endpoint and payload documentation for API-related artifacts
- Neutral, because some API-heavy implementers may prefer centering the machine-readable strategy around OpenAPI
- Bad, because non-API structured artifacts such as manifests or conformance-fixture shapes fit less naturally
- Bad, because over-centering OpenAPI would make some machine-readable companions more awkward than necessary
