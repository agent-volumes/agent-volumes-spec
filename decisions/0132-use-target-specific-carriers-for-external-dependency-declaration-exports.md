---
status: accepted
date: 12026-05-14
decision-makers: Yunseo Kim
---

# Use target-specific carriers for external dependency declaration exports

## Context and Problem Statement

ADR-0131 defines the semantic claim made by external dependency exports:
`[[external-dependencies]]` records are projected as declaration-only
relationships, not resolved inventory. ADR-0116 and ADR-0130 require SBOM and
provenance mappings to distinguish declaration-plane relationships from resolved
evidence facts.

The remaining question is target-specific: **how should that declaration-only
relationship be serialized into CycloneDX, SPDX, SLSA, and in-toto export
targets without implying resolved components, packages, materials, subjects, or
resolved dependencies?**

## Decision Drivers

- CycloneDX is the primary normative BOM exchange format for Agent Volumes.
- SPDX is a secondary reference-compatible export target.
- SLSA/in-toto is the provenance baseline and should describe build subjects,
  materials, and resolved build inputs rather than manifest-only declarations.
- Existing mapping artifacts classify mappings as `native`, `extension`, or
  `lossy` and require explicit lossiness descriptions when semantics do not
  round-trip.
- Target-format carriers should preserve as much declaration detail as possible
  while preventing false inventory or provenance claims.
- Declaration-only markers should be explicit wherever a target format might
  otherwise imply resolution or presence.

## Considered Options

- A — Emit declaration-only external dependencies as ordinary CycloneDX
  components, SPDX Packages, SLSA subjects, or in-toto materials.
- B — Use target-native dependency relationship fields wherever safely supported.
- C — Use external references as the primary carrier.
- D — Use controlled Agent Volumes extension metadata as the primary carrier, with
  target-native relationships or external references only where safe.
- E — Use lossy metadata-only projection for targets that cannot preserve the
  declaration semantics safely.
- F — Exclude declaration-only external dependencies from provenance evidence
  slots that imply resolved build inputs.

## Decision Outcome

Chosen option: **D with target-specific B, C, E, and F constraints**. Controlled
Agent Volumes metadata remains the primary carrier for preserving full declaration
semantics, but target-native dependency relationships are recommended as
secondary carriers when the target format can represent the relationship without
turning it into resolved inventory and the export also carries explicit
declaration-only metadata.

Agent Volumes will serialize declaration-only external dependency exports using
target-specific carriers:

- **CycloneDX** is the primary preservation target. Exporters should use
  controlled `agent-volumes:*` extension metadata or properties to preserve the
  declaration key, purl, VERS constraint, purpose, scope, and declaration-only
  status. Target-native dependency relationships should be used as secondary
  carriers when CycloneDX can express the relationship safely and the export also
  preserves the declaration-only status. External references may be used as
  additional discovery carriers when they do not imply resolved inventory.
- **SPDX** is a secondary projection target. Exporters should use annotations,
  external references, or controlled extension metadata where available. Mapping
  rows should be classified as `extension` or `lossy` unless the exact
  declaration-only semantics round-trip natively.
- **SLSA/in-toto provenance** must not place declaration-only external
  dependencies in subjects, materials, `resolvedDependencies`, or equivalent
  evidence fields. If a future export carries declaration context in provenance
  artifacts, it must be clearly marked as non-evidence declaration metadata or be
  classified as lossy.

Under this decision, exporters must not create CycloneDX component inventory
entries, SPDX Package inventory entries, SLSA subjects, in-toto materials, or
resolved dependency entries for declaration-plane external dependencies unless a
separate resolved-evidence artifact supports that stronger claim.

## Consequences

- Good, because CycloneDX can preserve Agent Volumes declaration details without
  pretending they are resolved components.
- Good, because SPDX mappings remain honest about lossy or extension-based
  representation.
- Good, because SLSA/in-toto provenance remains evidence-oriented and does not
  overstate manifest declarations as build inputs.
- Good, because mapping matrix rows can use the existing `native`, `extension`,
  and `lossy` classification model.
- Good, because generic consumers can ignore extension metadata without receiving
  false component or package inventory.
- Neutral, because CycloneDX consumers may need Agent Volumes-specific property
  support to use declaration metadata effectively.
- Neutral, because SPDX exports may lose structure such as VERS constraints,
  purpose, scope, or stable declaration keys.
- Bad, because declaration-only external dependencies may be less visible to
  generic SBOM scanners than ordinary component/package inventory.
- Bad, because implementers must write target-specific mapping rules instead of a
  single universal export rule.

## Confirmation

- Verify that CycloneDX mappings for declaration-only external dependencies use
  controlled Agent Volumes metadata and do not create resolved component inventory
  entries without resolved evidence.
- Verify that CycloneDX mappings include an explicit declaration-only or unresolved
  status marker when relationship or reference carriers are used.
- Verify that SPDX mappings are classified as `extension` or `lossy` unless the
  declaration-only relationship semantics round-trip natively.
- Verify that SLSA/in-toto mappings do not place declaration-only external
  dependencies in subjects, materials, `resolvedDependencies`, or equivalent
  evidence fields.
- Verify that mapping matrix rows include lossiness descriptions for target
  projections that cannot preserve purl, VERS constraint, purpose, scope,
  declaration key, and declaration-only status.
- Verify that conformance fixtures include negative cases showing that
  declaration-only dependencies do not become resolved inventory.

## Pros and Cons of the Options

### A — Emit declaration-only external dependencies as ordinary CycloneDX components, SPDX Packages, SLSA subjects, or in-toto materials

- Good, because generic SBOM and provenance consumers would see the entries using
  familiar fields.
- Bad, because it creates false inventory or provenance claims.
- Bad, because declarations do not provide exact versions, digests, lockfile
  evidence, or build-material evidence.
- Bad, because it conflicts with ADR-0116, ADR-0130, and ADR-0131.

### B — Use target-native dependency relationship fields wherever safely supported

- Good, because native relationships are more visible to generic consumers.
- Good, because dependency-like semantics are preserved where the target format
  has a safe relationship primitive.
- Good, because it improves generic tooling visibility when paired with explicit
  declaration-only metadata.
- Neutral, because this is recommended as a secondary carrier, not as the sole
  representation of Agent Volumes declaration semantics.
- Bad, because native dependency edges may imply resolved components unless paired
  with explicit declaration-only metadata.
- Bad, because target-native relationship vocabularies may not preserve VERS,
  purpose, scope, or declaration key semantics.

### C — Use external references as the primary carrier

- Good, because external references are safer than inventory entries.
- Good, because package coordinates can remain discoverable.
- Neutral, because this is useful as a secondary carrier.
- Bad, because external references alone do not carry dependency relationship
  intent.
- Bad, because external references cannot reliably preserve Agent Volumes-specific
  fields or declaration-only status across targets.

### D — Use controlled Agent Volumes extension metadata as the primary carrier, with target-native relationships recommended where safe and external references allowed where safe

- Good, because it can preserve purl, VERS constraint, purpose, scope,
  declaration key, and declaration-only status.
- Good, because it prevents generic consumers from mistaking declarations for
  ordinary resolved inventory.
- Good, because it aligns with existing mapping matrix extension patterns.
- Neutral, because consumers need Agent Volumes-specific support to interpret the
  metadata.
- Bad, because extension metadata is less portable than native target fields.

### E — Use lossy metadata-only projection for targets that cannot preserve the declaration semantics safely

- Good, because it is honest when target formats cannot preserve the full
  declaration model.
- Good, because it avoids false inventory claims.
- Neutral, because it is especially suitable for secondary exports.
- Bad, because round-trip fidelity and machine interpretation are weaker.

### F — Exclude declaration-only external dependencies from provenance evidence slots that imply resolved build inputs

- Good, because provenance remains tied to actual subjects, materials, and resolved
  build inputs.
- Good, because it prevents manifest declarations from being overstated as build
  evidence.
- Neutral, because declaration context may still be carried outside evidence slots
  if clearly marked.
- Bad, because provenance consumers will not see declaration-only dependency
  intent unless they understand the separate declaration metadata.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- CycloneDX, SPDX, SLSA, or in-toto add native declared-but-unresolved dependency
  carriers that can preserve Agent Volumes semantics without extension metadata.
- Generic SBOM consumers consistently misinterpret the selected extension or
  relationship carriers as resolved inventory.
- Agent Volumes defines a resolved-evidence profile whose exports require stronger
  component, package, material, or resolved dependency mappings.
- Mapping matrix fixtures show that the chosen carriers cannot round-trip the
  declaration key, purl, constraint, purpose, scope, and declaration-only status
  with acceptable lossiness.

## More Information

Follow-up work should decide:

- exact `agent-volumes:*` property or extension names for CycloneDX declaration
  metadata
- exact SPDX annotation, external reference, or extension forms and their
  lossiness descriptions
- whether SLSA/in-toto exports should omit declaration-only external dependencies
  entirely or include clearly marked non-evidence declaration metadata
- mapping matrix rows and export sample fixtures for each target family
- negative conformance cases that reject declaration-only exports as resolved
  inventory
