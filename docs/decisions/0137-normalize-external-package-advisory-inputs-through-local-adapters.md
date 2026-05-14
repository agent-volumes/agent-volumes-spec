---
status: accepted
date: 12026-05-15
decision-makers: Yunseo Kim
---

# Normalize external package advisory inputs through local adapters

## Context and Problem Statement

ADR-0021 limits v0.1 security advisory targeting to volume identity and affected
volume version ranges. ADR-0040 allows informational component impact metadata,
but component impact does not change the normative volume-level advisory target.

ADR-0109 establishes external non-volume package dependencies as machine-readable
audit metadata rather than install requirements or resolver inputs. ADR-0116
places `[[external-dependencies]]` records in the declaration plane. ADR-0135
then defines intersections between declaration-plane external dependencies and
external package advisories as declaration-only potential exposure diagnostics,
not confirmed vulnerable installed-component findings. ADR-0136 makes exact
release metadata the portable registry/API exposure boundary for those
declarations.

Those decisions leave an input-model question: **what shape should advisory
tooling use when comparing external package advisories with declaration-only
external dependency records?**

## Decision Drivers

- v0.1 advisories must remain volume-targeted unless ADR-0021 is reopened.
- External package advisory matching should use the declaration-plane facts that
  v0.1 already standardizes: external dependency package identity and VERS
  compatibility constraints.
- Advisory matching should support OSV, GitHub Security Advisory records, npm
  audit advisories, PyPA advisories, RustSec advisories, private feeds, and local
  policy data without making any one feed schema the Agent Volumes native format.
- Agent Volumes should not become an external package advisory authority, scanner
  result interchange format, package-manager resolver, lockfile format, or
  vulnerability-feed governance layer in v0.1.
- Potential exposure diagnostics need enough source identity to explain where a
  match came from, but feed ingestion, trust ranking, deduplication, severity
  normalization, and withdrawal policy remain local.
- Future resolved-evidence, SBOM, VEX, or scanner profiles should be able to
  refine declaration-only matches without redefining the v0.1 input boundary.

## Considered Options

- A — Leave external package advisory input entirely to local policy.
- B — Adopt OSV records as the native Agent Volumes external advisory input.
- C — Standardize several source-native advisory input formats directly.
- D — Use local feed adapters that normalize external package advisories into a
  minimal PURL+VERS advisory-match input.
- E — Extend the Agent Volumes advisory schema to target external packages.
- F — Use only SBOM, VEX, VDR, or SPDX security documents as external advisory
  inputs.

## Decision Outcome

Chosen option: **D — Use local feed adapters that normalize external package
advisories into a minimal PURL+VERS advisory-match input**, because it defines
the smallest portable matching boundary while keeping source-native advisory
feeds, scanner semantics, and resolved evidence outside the v0.1 core.

Under this decision:

- Agent Volumes v0.1 does not standardize OSV, GitHub Security Advisory records,
  npm audit responses, PyPA advisory records, RustSec records, private advisories,
  SBOMs, VEX documents, VDR documents, or SPDX security references as native
  Agent Volumes advisory inputs.
- Implementations may ingest those sources through local adapters.
- The portable baseline is the adapter output: a normalized external package
  advisory-match input containing source identity, affected package identity, and
  an affected version range.
- The affected package identity should be expressed as a canonical package URL
  (PURL) when the source provides enough information to construct one.
- The affected version range should be expressed as a VERS-compatible range or a
  locally normalized range that can be compared with the external dependency's
  declared VERS constraint.
- The normalized input may carry source metadata such as advisory identifier,
  aliases, source kind, source URL, summary, severity, published timestamp,
  modified timestamp, withdrawn timestamp, or opaque source-specific metadata.
- Source metadata is explanatory and provenance-oriented. It does not make the
  normalized input a scanner finding, resolved package fact, VEX status assertion,
  or Agent Volumes advisory publication.
- A declaration-only potential exposure may be produced when a declared external
  dependency's canonical PURL matches the normalized advisory affected PURL and
  the declared VERS constraint intersects the normalized advisory affected VERS
  range.
- If a source cannot be conservatively normalized to package identity plus an
  affected range, implementations should treat it as supplemental advisory
  context rather than a portable declaration-plane match input.
- Feed ingestion, source trust, alias deduplication, severity ordering,
  withdrawal handling, exploitability analysis, remediation policy, and blocking
  behavior remain local policy unless a future profile standardizes them.

This combines the previously separated ideas of a normalized PURL+VERS input
shape and multi-feed adapters into one decision: the **standardized boundary is
the normalized advisory-match input**, while the **source-native adapters remain
implementation-local**.

## Minimal Normalized Input Semantics

The normalized input is a matching primitive, not a complete advisory
interchange format. Conceptually, it contains:

```text
externalAdvisoryMatchInput:
  source:
    kind
    id
    aliases optional
    url optional
  affected:
    packagePurl
    versionRangeVers
  metadata:
    summary optional
    severity optional
    published optional
    modified optional
    withdrawn optional
    sourceSpecific optional
```

The exact field names may be finalized during draft 6 schema work, but the
portable semantics are fixed by this decision:

- `source` identifies the advisory or policy source that produced the normalized
  match input.
- `affected.packagePurl` identifies the external package being matched.
- `affected.versionRangeVers` identifies the affected version range used for
  declaration-plane range intersection.
- `metadata` provides explanatory context and does not alter the declaration-only
  nature of the match.

## Source-Native Adapters Versus Source-Native Inputs

This decision distinguishes local adapters from standardized source-native
inputs:

- A **source-native input** would make an upstream feed shape, such as an OSV
  object or npm audit advisory response, part of the Agent Volumes portable input
  surface.
- A **local adapter** reads a source-native feed outside the portable baseline and
  emits the normalized PURL+VERS advisory-match input when conservative
  normalization is possible.

Only the normalized adapter output is portable in v0.1. The adapter itself is not
portable, and Agent Volumes conformance should not require clients to ingest any
specific external feed format.

## Consequences

- Good, because OSV can be supported as an important practical source without
  becoming the Agent Volumes native advisory model.
- Good, because GitHub Security Advisory records, npm audit advisories, PyPA
  advisories, RustSec records, private feeds, and local policy data can all feed
  the same normalized matching primitive.
- Good, because the existing Agent Volumes advisory schema remains volume-targeted.
- Good, because declaration-only potential exposure remains separate from
  confirmed resolved external dependency evidence.
- Good, because conformance can test normalized PURL equality, VERS intersection,
  non-intersection, and diagnostic labeling without testing every upstream feed
  format.
- Good, because future resolved-evidence, VEX, scanner, or SBOM profiles can
  refine or override potential exposure without redefining the declaration-plane
  match input.
- Neutral, because implementations need adapters for their preferred advisory
  sources.
- Neutral, because feed-specific metadata may be lost unless implementations
  preserve it as opaque source-specific metadata.
- Bad, because conservative normalization may miss advisories whose source format
  cannot be expressed as package identity plus affected range.
- Bad, because different local policies may still disagree about source trust,
  alias deduplication, severity, withdrawal, or enforcement outcomes.

## Confirmation

- Verify that draft 6 prose describes external package advisory matching as an
  adapter-fed normalized PURL+VERS match input, not as native OSV, GHSA, npm,
  PyPA, RustSec, SBOM, VEX, VDR, or SPDX input.
- Verify that the existing Agent Volumes advisory schema remains volume-targeted.
- Verify that schema work for external advisory match input requires affected
  external package PURL and affected VERS-compatible range, plus source identity.
- Verify that matching prose compares normalized advisory affected PURL and range
  against declaration-plane `[[external-dependencies]]` PURL and VERS constraint.
- Verify that potential exposure diagnostics are labeled as declaration-only and
  are not described as resolved, installed, reachable, exploitable, or confirmed
  vulnerable findings.
- Verify that conformance fixtures cover PURL match, PURL mismatch, VERS
  intersection, VERS non-intersection, malformed normalized input, and source
  metadata preservation.
- Verify that source-native feed ingestion remains local policy unless a future
  profile standardizes an adapter.

## Pros and Cons of the Options

### A — Leave external package advisory input entirely to local policy

- Good, because it keeps the v0.1 specification smallest.
- Good, because implementations can choose any external advisory source or policy
  engine.
- Good, because it avoids over-standardizing source trust, deduplication, severity,
  and withdrawal policy.
- Bad, because it provides no portable matching input for declaration-only
  potential exposure.
- Bad, because the same external dependency declaration could produce inconsistent
  warning semantics across clients.
- Bad, because conformance cannot test common advisory-match behavior.

### B — Adopt OSV records as the native Agent Volumes external advisory input

- Good, because OSV is machine-readable, package-aware, and widely used.
- Good, because OSV already models affected packages, aliases, references,
  versions, and range events.
- Good, because GitHub Advisory Database records are distributed in OSV shape.
- Neutral, because OSV can remain a recommended or common adapter source.
- Bad, because it over-couples Agent Volumes to one advisory ecosystem.
- Bad, because OSV affected-package records are not Agent Volumes volume-targeted
  advisories.
- Bad, because OSV range events and source metadata still need conservative
  mapping to Agent Volumes VERS matching semantics.
- Bad, because non-OSV sources would still need translation.

### C — Standardize several source-native advisory input formats directly

- Good, because it preserves source-specific details from OSV, GitHub Security
  Advisories, npm audit, PyPA, RustSec, private feeds, and other sources.
- Good, because implementations that already consume a native feed may need less
  local translation.
- Bad, because it turns Agent Volumes toward an external advisory feed interchange
  standard.
- Bad, because conformance would need to track multiple evolving upstream formats.
- Bad, because feed-specific severity, withdrawn, alias, range, and lifecycle
  semantics would leak into the v0.1 core.
- Bad, because adding new ecosystems would require ongoing specification changes.

### D — Use local feed adapters that normalize external package advisories into a minimal PURL+VERS advisory-match input

- Good, because it standardizes only the portable matching primitive needed for
  declaration-only potential exposure.
- Good, because it aligns directly with external dependency declarations that use
  package identity and compatibility constraints.
- Good, because source-native feed ingestion remains local while the match result
  can be portable.
- Good, because it avoids OSV-only lock-in while allowing OSV-first
  implementations.
- Good, because it keeps scanner results, resolved evidence, advisory write
  authority, and package-manager behavior out of v0.1.
- Neutral, because implementations need adapter logic.
- Bad, because conservative normalization can lose feed-specific details.
- Bad, because source trust and enforcement behavior remain local and may vary.

### E — Extend the Agent Volumes advisory schema to target external packages

- Good, because one schema could appear to cover both volume advisories and
  external package advisories.
- Good, because registry advisory discovery might appear more uniform.
- Bad, because it conflicts with ADR-0021's volume-level advisory targeting.
- Bad, because it implies Agent Volumes advisory authority over packages owned by
  external ecosystems.
- Bad, because it collapses volume advisory targeting, external package advisory
  targeting, and declaration-only potential exposure.
- Bad, because it risks turning potential exposure into a confirmed component or
  package vulnerability finding.

### F — Use only SBOM, VEX, VDR, or SPDX security documents as external advisory inputs

- Good, because those documents are established supply-chain carriers.
- Good, because VEX and VDR can express analyzed applicability, exploitability,
  response, or disclosure status.
- Good, because SPDX security references can point to advisories, fixes, and
  vulnerability disclosures.
- Neutral, because these carriers may be useful supplemental or future
  resolved-evidence inputs.
- Bad, because SBOMs generally describe inventory or components rather than
  declaration-only dependency intent.
- Bad, because VEX and VDR often imply analyzed product or component status, which
  is stronger than declaration-only potential exposure.
- Bad, because using these carriers as the only input would be too heavy for
  minimal PURL+VERS declaration-plane matching.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- Multiple independent implementations converge on one external advisory feed
  schema as the only practical input for Agent Volumes external dependency
  matching.
- OSV or another ecosystem-neutral advisory schema gains enough cross-ecosystem
  adoption and VERS/PURL alignment to justify direct native support.
- Implementers demonstrate a need for portable source-native adapter conformance,
  such as a standardized OSV-to-Agent-Volumes normalization profile.
- Agent Volumes defines a resolved-evidence profile that can represent exact
  external package versions, lockfile facts, SBOM components, scanner findings, or
  runtime inventory.
- Agent Volumes intentionally reopens component-level advisory targeting or
  external package advisory mirroring governance.
- Declaration-only normalized matching produces unacceptable false positives or
  false negatives in real deployments despite clear potential-exposure labeling.

## More Information

Follow-up work should decide:

- exact schema field names for normalized external advisory-match input
- whether normalized input appears as a standalone schema, conformance fixture
  shape, registry-local diagnostic carrier, or client-side policy input
- exact VERS comparison behavior for normalized affected ranges
- how withdrawn, disputed, and severity metadata should be preserved without
  becoming portable enforcement policy
- conformance fixtures for normalized matching and non-confirmed potential
  exposure diagnostics
