---
status: accepted
date: 12026-05-14
decision-makers: Yunseo Kim
---

# Link external dependency declarations to resolved evidence by stable keys

## Context and Problem Statement

ADR-0116 adopts a dual-plane model for external dependencies. In that model,
`[[external-dependencies]]` records belong to the declaration plane, while exact
resolved package versions, digests, native lockfile evidence, installer
observations, SBOM inventory facts, and provenance observations belong to a
separate resolved evidence plane.

ADR-0114 defines `(canonical purl, purpose, scope)` as the semantic key for
external dependency declarations. ADR-0123 requires successful conformance cases
to expose those semantic keys. ADR-0119 also disallows unknown fields inside
external dependency items, which prevents resolved-evidence details from being
added as ad hoc item-local extensions.

Those decisions establish the boundary, but they leave a follow-up architecture
question: **when future profiles add resolved external package evidence, how
should that evidence connect back to declaration-plane records without merging
the two planes or breaking existing manifests?**

## Decision Drivers

- Declaration-plane records should remain stable audit metadata and should not
  become resolved package inventory by implication.
- Future resolved-evidence profiles should be able to strengthen trust,
  advisory, SBOM, provenance, and policy workflows without redefining
  `[[external-dependencies]]`.
- ADR-0119 should continue to prevent unresolved tool-specific evidence fields
  from accumulating inside external dependency items.
- Evidence links should survive manifest reordering and should not rely on array
  positions or presentation details.
- Agent Volumes should be explicit about lossy, partial, ambiguous, stale, and
  unmatched declaration-to-evidence relationships.
- Conformance should remain incremental: v0.1 declaration validation should not
  require future resolved-evidence artifacts.
- SBOM, provenance, advisory, and lockfile concepts should remain connected but
  distinct.

## Considered Options

- A — Add a separate resolved-evidence artifact or profile that references
  declaration-plane records by stable declaration keys.
- B — Add future resolved-evidence fields directly inside each
  `[[external-dependencies]]` item.
- C — Rely only on external SBOM, provenance, advisory, or lockfile documents,
  with no Agent Volumes declaration-to-evidence linking model.
- D — Allow tool-specific extensions first and later promote converged forms to
  core.
- E — Leave declaration-to-evidence linkage entirely implementation-defined.

## Decision Outcome

Chosen option: **A — Add a separate resolved-evidence artifact or profile that
references declaration-plane records by stable declaration keys**, because it
preserves the declaration/evidence boundary chosen by ADR-0116 while giving
future profiles a deterministic way to reconcile declared external dependencies
with observed package facts.

Under this decision:

- `[[external-dependencies]]` remains declaration-plane audit metadata.
- Resolved external package evidence belongs in a separate artifact, section, or
  profile rather than inside `[[external-dependencies]]` items.
- Future resolved-evidence records should reference declarations by a stable
  declaration key derived from the declaration semantic key: canonical purl,
  purpose, and canonical scope.
- Declaration keys must not depend on TOML array position, file ordering,
  comments, authored whitespace, or other presentation-only details.
- If future evidence needs to distinguish multiple declarations with the same
  semantic key, the follow-up profile must first reopen the duplicate/conflict
  model rather than inventing positional identifiers.
- Resolved-evidence records may include exact resolved purls, versions, digests,
  native manifest or lockfile references, resolver observations, SBOM links,
  provenance links, and advisory observations when a future profile defines
  their schema and lifecycle semantics.
- Future resolved-evidence records should include mapping quality or
  reconciliation status where relevant, such as `exact`, `satisfies`, `partial`,
  `ambiguous`, `unmatched`, `stale`, or profile-defined equivalents.
- Declaration-only advisory matches remain potential exposure diagnostics unless
  resolved evidence or separate scanner evidence supports a stronger claim.
- SBOM and provenance mappings must distinguish declaration-plane relationships
  from resolved evidence facts.

This decision does not define the resolved-evidence artifact schema. It only
fixes the connection model: future resolved evidence links to declarations by
stable keys from outside the declaration item, rather than by embedding evidence
inside `[[external-dependencies]]`.

## Consequences

- Good, because declaration-plane records stay portable and remain valid without
  future evidence artifacts.
- Good, because resolved evidence can evolve as a profile without changing the
  meaning of existing `volume.toml` manifests.
- Good, because evidence links are stable across manifest reordering and
  formatting changes.
- Good, because ADR-0119 remains intact: external dependency items do not become
  open-ended containers for tool-specific evidence.
- Good, because SBOM, provenance, advisory, and lockfile mappings can represent
  their own evidence semantics without collapsing into one manifest field.
- Good, because future conformance suites can add reconciliation fixtures without
  making declaration-only validation depend on resolver behavior.
- Neutral, because future profiles must define declaration key serialization,
  evidence lifecycle, and reconciliation failure categories before they can be
  interoperable.
- Neutral, because profile authors must decide whether declaration keys are
  represented as structured fields, serialized strings, or both.
- Bad, because implementers need a join step between declaration records and
  evidence records.
- Bad, because key canonicalization changes could affect evidence links if later
  specifications do not version the key algorithm carefully.

## Confirmation

- Verify that draft 6 prose keeps `[[external-dependencies]]` as
  declaration-plane metadata and does not add resolved versions, digests,
  lockfile references, or provenance observations to the item shape.
- Verify that future resolved-evidence work defines a separate artifact, section,
  or profile before requiring resolved external package facts.
- Verify that any future resolved-evidence profile references declarations by a
  stable key derived from canonical purl, purpose, and canonical scope.
- Verify that declaration-to-evidence links do not use array positions or
  presentation details.
- Verify that mapping matrix entries separate declaration-only relationships from
  resolved evidence facts for CycloneDX, SPDX, SLSA/in-toto, and related export
  targets.
- Verify that advisory language distinguishes potential exposure from confirmed
  resolved vulnerable package evidence.
- Verify that conformance fixtures can test declaration-only manifests without
  resolved evidence artifacts.

## Pros and Cons of the Options

### A — Add a separate resolved-evidence artifact or profile that references declaration-plane records by stable declaration keys

- Good, because it directly follows the declaration-plane and
  resolved-evidence-plane split from ADR-0116.
- Good, because it is non-breaking for declaration-only manifests.
- Good, because it avoids treating constraints as exact resolved package
  identities.
- Good, because it gives SBOM, provenance, advisory, and lockfile evidence a
  clear place to attach without overloading the declaration item.
- Good, because it can model many-to-one, one-to-many, partial, stale, and
  unmatched reconciliation results.
- Neutral, because it requires a stable declaration key algorithm.
- Bad, because implementers must correlate two planes instead of reading one
  object.

### B — Add future resolved-evidence fields directly inside each `[[external-dependencies]]` item

- Good, because it is easy for humans to discover resolved details near the
  declaration.
- Good, because simple tools can read a single object.
- Bad, because it conflicts with ADR-0119 unless that decision is reopened.
- Bad, because declaration intent and observed evidence have different lifecycle,
  freshness, and trust semantics.
- Bad, because multiple resolver outputs, platform-specific lockfiles, and stale
  evidence are awkward to represent inside one declaration row.
- Bad, because readers may misinterpret declaration rows as confirmed resolved
  package facts.

### C — Rely only on external SBOM, provenance, advisory, or lockfile documents, with no Agent Volumes declaration-to-evidence linking model

- Good, because Agent Volumes avoids inventing another evidence format.
- Good, because mature ecosystems already have SBOM, provenance, advisory, and
  lockfile tools.
- Neutral, because this may be sufficient for local implementation experiments.
- Bad, because different implementations would map declarations to evidence in
  incompatible ways.
- Bad, because conformance could not deterministically test reconciliation
  behavior.
- Bad, because external formats do not by themselves identify which Agent Volumes
  declaration a resolved fact satisfies.

### D — Allow tool-specific extensions first and later promote converged forms to core

- Good, because implementation experience can shape the eventual evidence model.
- Good, because ADR-0075 through ADR-0082 already define extension-to-core bridge
  behavior.
- Neutral, because this may be useful for experiments outside the core
  declaration item.
- Bad, because item-local extensions would conflict with ADR-0119.
- Bad, because unconstrained extensions could become incompatible de facto
  standards.
- Bad, because future promotion still needs stable declaration keys and mapping
  quality semantics, so this option does not replace option A.

### E — Leave declaration-to-evidence linkage entirely implementation-defined

- Good, because the core specification remains small.
- Good, because implementers can choose local resolver and evidence models.
- Bad, because declaration-to-evidence reconciliation would not be portable.
- Bad, because SBOM and advisory outputs could make inconsistent claims about
  the same declaration.
- Bad, because conformance fixtures could not distinguish exact, partial,
  ambiguous, unmatched, or stale evidence relationships.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- Implementation experience shows that stable declaration keys are insufficient
  to link resolved evidence to declarations.
- External dependency duplicate/conflict semantics change in a way that requires
  non-key declaration identifiers.
- Multiple independent implementations converge on an item-local evidence model
  that is demonstrably simpler and does not confuse declaration facts with
  resolved evidence facts.
- A future SBOM, provenance, or package-manager standard provides a native,
  portable declaration-to-evidence linking model that Agent Volumes should adopt.
- Resolved-evidence profiles need to support multiple same-key declarations
  without treating them as invalid duplicates or conflicts.

## More Information

Follow-up work should decide:

- the exact declaration key serialization, if any, used by future evidence
  artifacts
- whether future resolved-evidence records are modeled as a companion artifact, a
  manifest-adjacent section, a trust attachment category, or a named profile
- lifecycle states for current, stale, superseded, revoked, and historical
  resolved evidence
- reconciliation status vocabulary and failure categories
- conformance fixture families for declaration-only manifests, resolved evidence,
  partial matches, ambiguous matches, stale evidence, and unmatched evidence
- mapping matrix rows for declaration-plane relationships versus resolved
  evidence facts in CycloneDX, SPDX, SLSA/in-toto, and related export targets
