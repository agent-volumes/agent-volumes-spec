---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Treat external dependencies as declared audit relationships

## Context and Problem Statement

ADR-0109 establishes external non-volume package dependencies as machine-readable
audit metadata while leaving installation and resolution to native package-manager
tooling. ADR-0110 through ADR-0115 define the manifest shape, required fields,
purpose vocabulary, VERS constraint grammar, uniqueness key, and component scoping
model for `[[external-dependencies]]` records.

Those decisions make external package requirements visible in `volume.toml`, but a
mapping question remains: **when exporting BOMs, matching advisories, producing
warnings, or applying policy, should an external dependency declaration be treated
as a resolved package component, or as a declared dependency relationship whose
resolution status remains unknown until separate evidence is available?**

The answer must preserve Agent Volumes' supply-chain visibility goals without
claiming that a package was installed, resolved, bundled, executed, or present in a
runtime environment merely because a manifest declared it.

## Decision Drivers

- Agent Volumes should support meaningful policy checks, advisory matching, SBOM
  export, warning behavior, and human review for external package dependencies.
- Native package-manager manifests and lockfiles remain the installer-facing and
  resolver-facing sources for external packages.
- `[[external-dependencies]]` records contain declared audit metadata, not observed
  installation facts.
- CycloneDX remains the normative BOM exchange format, with SPDX as a secondary
  reference export target.
- Existing mapping material distinguishes native, extension, and intentionally
  lossy mappings.
- Advisory targeting in v0.1 remains volume-level, with component impact metadata
  informational only.
- Scanner-finding interchange and broad local policy judgments remain outside the
  portable v0.1 core.
- Resolved package versions, digests, lockfile evidence, and provenance observations
  should remain distinct from declarations.

## Considered Options

- A — Export external dependency declarations as resolved SBOM components.
- B — Keep declarations as declaration-only audit metadata and project them as
  declared dependency relationships where target formats support it.
- C — Adopt a dual-plane model with a declaration plane and a resolved evidence
  plane, while using declaration-only relationship projection for v0.1 manifest
  mappings.
- D — Use external dependency declarations only as policy and advisory precheck
  inputs, excluding them from SBOM mappings unless resolved evidence exists.

## Decision Outcome

Chosen option: **C — Adopt a dual-plane model with declaration-only relationship
projection for v0.1 manifest mappings**, because it preserves the distinction
between declared requirements and observed package facts while still making
external dependencies useful for SBOM, advisory, warning, and policy workflows.

Under this decision:

- `[[external-dependencies]]` records belong to the **declaration plane**.
- Declaration-plane records describe external package requirements declared by the
  volume author for audit, warning, policy, advisory, SBOM, and review purposes.
- Declaration-plane records do not prove that the external package was resolved,
  installed, executed, bundled, vendored, or present at runtime.
- Resolved package purls, exact versions, digests, native lockfile evidence,
  installer observations, and provenance observations belong to a separate
  **resolved evidence plane**.
- v0.1 manifest mappings should project `[[external-dependencies]]` as declared
  dependency relationships, external references, controlled extensions, or lossy
  mappings as appropriate for the target format.
- v0.1 manifest mappings must not export declaration-plane records as confirmed
  resolved SBOM components unless separate resolved evidence supports that claim.
- Advisory matching against declaration-plane records produces potential exposure
  information, not confirmed vulnerable installed-component findings.
- Warning and policy outputs must distinguish declaration-only exposure from
  confirmed resolved evidence.
- Local policy may choose to block, warn, ignore, or escalate based on declaration
  matches, but such local policy outcomes are derived judgments rather than
  canonical trust facts.

This decision does not define a resolved evidence profile. Future profiles may add
native manifest references, lockfile evidence, resolved purls, exact versions,
digests, provenance links, graph-first export artifacts, or reconciliation checks
without changing the declaration-plane meaning of `[[external-dependencies]]`.

## Consequences

- Good, because external dependencies remain visible to machines without overstating
  installation or runtime presence.
- Good, because SBOM exporters can include declared external dependency information
  while identifying it as declaration metadata rather than resolved inventory.
- Good, because advisory matching can produce potential-exposure diagnostics before
  installation or execution.
- Good, because future resolved-facts profiles can strengthen evidence without
  redefining manifest declarations.
- Good, because the model aligns with the existing distinction between objective
  artifact facts and local policy judgments.
- Neutral, because target formats differ in how naturally they represent declared
  but unresolved dependencies.
- Neutral, because mapping matrix entries must explicitly mark native, extension,
  and lossy representations.
- Bad, because some SBOM consumers may have limited support for declaration-only
  dependency relationships.
- Bad, because implementers must explain potential exposure separately from
  confirmed installed vulnerability findings.
- Bad, because useful policy behavior may require local rules until stricter
  profiles define resolved evidence and reconciliation semantics.

## Confirmation

- Verify that future prose describes `[[external-dependencies]]` as declaration-plane
  audit metadata.
- Verify that BOM mappings do not present declaration-plane records as resolved
  installed components without separate evidence.
- Verify that mapping matrix entries for external dependencies classify each target
  representation as native, extension, or lossy.
- Verify that advisory matching language uses potential-exposure wording for
  declaration-only matches.
- Verify that warning and policy outputs distinguish declaration-only matches from
  resolved evidence matches.
- Verify that future resolved evidence profiles can add exact versions, digests,
  native lockfile evidence, and provenance links without changing this baseline.

## Pros and Cons of the Options

### A — Export external dependency declarations as resolved SBOM components

- Good, because external dependencies become immediately visible in ordinary SBOM
  component inventories.
- Good, because existing scanner and advisory tooling may process the exported
  entries without special declaration handling.
- Bad, because it can falsely imply that a package was installed, resolved, bundled,
  executed, or present at runtime.
- Bad, because VERS constraints are ranges, not resolved exact versions.
- Bad, because it conflicts with ADR-0109's and ADR-0113's declaration-only
  boundary.

### B — Keep declarations as declaration-only audit metadata and project them as declared dependency relationships

- Good, because it preserves the distinction between declarations and resolved
  package inventory.
- Good, because `purl`, VERS `constraint`, `purpose`, and `components` scope remain
  available to mapping, warning, advisory, and policy logic.
- Good, because it can use native relationships where target formats support them
  and controlled extensions where they do not.
- Neutral, because target-format support varies.
- Bad, because the broader ecosystem may not uniformly understand declaration-only
  dependency relationships.

### C — Adopt a dual-plane model with declaration-only relationship projection for v0.1 manifest mappings

- Good, because it defines the long-term architecture while keeping the v0.1
  manifest mapping bounded.
- Good, because declaration-plane and resolved-evidence-plane facts cannot be
  accidentally conflated.
- Good, because future native-lockfile, resolved-purl, digest, and provenance
  profiles have a clear place to attach.
- Good, because potential advisory exposure and confirmed vulnerability evidence can
  be reported separately.
- Neutral, because implementers must understand two evidence levels.
- Bad, because it adds terminology and mapping discipline beyond a single SBOM
  component export rule.

### D — Use external dependency declarations only as policy and advisory precheck inputs

- Good, because SBOM component inventory remains conservative and evidence-based.
- Good, because declarations can still support install-time warnings and policy
  screening.
- Neutral, because some organizations may prefer this local policy posture.
- Bad, because it weakens Agent Volumes' machine-readable SBOM visibility goal for
  declared external requirements.
- Bad, because declaration metadata would not benefit from the existing mapping
  matrix and BOM exchange infrastructure.
- Bad, because advisory precheck results would need a separate exchange path.

## More Information

Follow-up work should decide:

- exact CycloneDX and SPDX mapping entries for declaration-plane external
  dependency records
- whether a dedicated controlled extension namespace is needed for declared
  external dependency relationships
- warning categories or diagnostic identifiers for declaration-only advisory hits
  and unsupported mapping targets
- policy wording for potential exposure versus confirmed resolved evidence
- resolved evidence profile fields for native manifests, lockfiles, resolved purls,
  versions, digests, and provenance links
- conformance fixtures for declaration-only mapping, potential-exposure advisory
  matching, and resolved-evidence separation
