---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Require a field-by-field normative mapping matrix for BOM and provenance exports in v0.1

## Context and Problem Statement

ADR-0005 and ADR-0006 define the strategic direction for BOM and provenance interoperability, but they explicitly leave open the need for a concrete mapping/profile document.

Without a field-by-field mapping contract, the spec still lacks the detail needed for independent exporters/importers to agree on how Agent Volumes semantics map into CycloneDX, SPDX, and SLSA structures.

## Decision Drivers

- The v0.1 trust baseline needs an actionable mapping contract, not just strategic direction
- Exporters and importers need a shared interpretation of native, extension-based, and lossy mappings
- The project should avoid leaving BOM/provenance interoperability to ad hoc implementation conventions

## Considered Options

- A — Include a field-by-field normative mapping matrix
- B — Keep only mapping principles in the core spec and defer the detailed matrix
- C — Provide examples only

## Decision Outcome

Chosen option: **A — Include a field-by-field normative mapping matrix**, because the prior ADRs are not sufficient by themselves to make v0.1 implementable in an interoperable way.

Under this decision, v0.1 MUST include a normative mapping matrix or equivalent appendix that identifies, at minimum:

- how core `volume.toml` fields map to CycloneDX
- how core `volume.toml` fields map to SPDX
- how release-subject and build/provenance fields map to SLSA provenance
- which mappings are native
- which mappings require controlled extensions
- which mappings are intentionally lossy

## Consequences

- Good, because exporters/importers gain a shared mapping contract
- Good, because the CycloneDX/SPDX/SLSA baseline becomes operational rather than aspirational
- Good, because later extension work can build from a documented mapping boundary
- Neutral, because some future standards evolution may require revisiting mappings in later versions
- Bad, because the project must maintain a more detailed interoperability appendix or profile

## Confirmation

- Produce a field-by-field mapping matrix covering the minimum trust baseline artifacts
- Verify that a valid Agent Volumes package can be exported consistently according to the matrix
- Verify that extension-based and intentionally lossy mappings are clearly distinguished

## Pros and Cons of the Options

### A — Include a field-by-field normative mapping matrix

- Good, because exporters and importers gain a shared mapping contract
- Good, because the CycloneDX/SPDX/SLSA baseline becomes operational rather than merely directional
- Good, because extension-based and lossy mappings can be governed explicitly
- Neutral, because future standard evolution may still require updates to the matrix
- Bad, because the project must maintain a more detailed interoperability appendix or profile section

### B — Keep only mapping principles in the core spec and defer the detailed matrix

- Good, because the core draft remains shorter and conceptually lighter
- Good, because detailed mapping work could evolve in a more focused follow-up document
- Neutral, because it may suit a project that is not yet aiming for independent implementation
- Bad, because too much exporter/importer behavior would remain open to interpretation
- Bad, because the chosen trust baseline would still lack the detail needed for reliable interop

### C — Provide examples only

- Good, because it minimizes immediate authoring burden
- Good, because examples can still help readers understand intended directions
- Neutral, because examples may still be useful alongside a future normative profile
- Bad, because examples alone do not define a complete mapping contract
- Bad, because different implementations would likely fill gaps in incompatible ways
