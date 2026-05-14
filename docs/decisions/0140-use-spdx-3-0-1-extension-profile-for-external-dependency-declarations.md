---
status: accepted
date: 12026-05-15
decision-makers: Yunseo Kim
---

# Use an SPDX 3.0.1 extension profile for external dependency declarations

## Context and Problem Statement

ADR-0131 defines exported external dependencies as declaration-only relationships.
ADR-0132 chooses target-specific carriers and leaves exact SPDX carrier details to
follow-up work. ADR-0139 narrows the CycloneDX carrier decision, but explicitly
does not choose SPDX 3.x, SLSA, or in-toto carriers.

The SPDX baseline for Agent Volumes is now SPDX 3.0.1. SPDX 2.x compatibility is
out of scope. Existing SPDX 2.3 fixture patterns such as `Package.comment`,
`SPDXRef-*`, and SPDX 2.3-style `ExternalRef` rows are legacy sample assumptions,
not the target design for SPDX 3.0.1.

The remaining SPDX-specific question is: **which SPDX 3.0.1 carrier should
preserve Agent Volumes external dependency declarations without turning them into
resolved package inventory?**

## Decision Drivers

- External dependency exports must remain declaration-only relationships.
- SPDX export must not imply resolution, installation, bundling, execution,
  verification, vulnerability confirmation, provenance material evidence, or
  runtime presence.
- A lossless SPDX export should preserve the declaration key, PURL, VERS
  constraint, purpose, scope, declaration-only status, and absence of resolved
  evidence.
- SPDX 3.0.1 provides `Element.extension` and an Extension Profile for structured
  non-core metadata.
- SPDX `ExternalRef` and `Annotation` are useful but too shallow to carry the full
  Agent Volumes declaration payload as the primary carrier.
- SPDX `Package` or other software inventory elements should remain reserved for
  concrete package or resolved-evidence claims.
- Future resolved-evidence profiles should be able to link stronger facts back to
  the declaration through a stable declaration key.

## Considered Options

- A — Use an SPDX 3.0.1 Extension Profile attached through `Element.extension`.
- B — Use an extension declaration object plus an optional SPDX relationship edge.
- C — Use SPDX external references as the primary carrier.
- D — Use SPDX annotations as the primary carrier.
- E — Model declarations as SPDX packages or software artifacts.
- F — Use SPDX relationships only.
- G — Omit external dependency declarations from SPDX or export them lossily.

## Decision Outcome

Chosen option: **A — Use an SPDX 3.0.1 Extension Profile attached through
`Element.extension`**, because it is the only SPDX 3.0.1 carrier that can
round-trip Agent Volumes declaration metadata without modeling declaration-only
records as resolved package inventory.

This decision refines ADR-0132 for SPDX 3.0.1 exports. ADR-0132 remains in force
for the general no-false-resolved-inventory rule and for target formats not
covered by later carrier-specific decisions.

Under this decision, an SPDX 3.0.1 export should represent each Agent Volumes
`[[external-dependencies]]` record as an Agent Volumes SPDX extension declaration
object attached through `Element.extension` to the SPDX element that represents
the declaring volume, document, or scoped component collection.

The extension declaration object should carry at least:

- `declarationKey`
- `purl`
- `constraint`
- `purpose`
- `scope`
- `declarationOnly`
- `resolvedEvidence`

For the v0.1 declaration-only profile, `declarationOnly` must be `true` and
`resolvedEvidence` must be `false`.

## Optional Relationship Support

SPDX relationships may be used as secondary graph support when they connect the
declaring SPDX element to the Agent Volumes extension declaration object. The
extension declaration object remains the primary carrier.

Relationship-only export is not sufficient because relationship edges do not
preserve declaration key, PURL, VERS constraint, purpose, scope, declaration-only
status, or resolved-evidence absence by themselves.

If a relationship is used, the target should be the Agent Volumes extension
declaration object, not an SPDX `Package` or other resolved software inventory
element. Relationship naming is left to follow-up SPDX mapping work; standard SPDX
relationship types may improve generic graph visibility, while an Agent
Volumes-defined relationship type may preserve declaration semantics more
precisely.

## Consequences

- Good, because SPDX 3.0.1 exports can preserve Agent Volumes declaration metadata
  without falling back to SPDX 2.x-style comments.
- Good, because extension declarations keep declaration-plane facts separate from
  resolved package inventory.
- Good, because declaration keys remain available for future resolved evidence,
  diagnostics, advisory matches, and policy results.
- Good, because SPDX relationship edges can still be added as secondary traversal
  aids without becoming the primary data carrier.
- Neutral, because generic SPDX consumers may ignore the Agent Volumes extension
  profile unless they are extension-aware.
- Neutral, because extension profile consumers need the Agent Volumes namespace and
  schema documentation.
- Bad, because this is more work than annotations, comments, or external
  references.
- Bad, because SPDX 2.x-style fixtures must be revised before they can represent
  the SPDX 3.0.1 baseline accurately.

## Confirmation

- Verify that draft 6 SPDX mapping prose identifies SPDX 3.0.1 Extension Profile
  / `Element.extension` as the primary external dependency declaration carrier.
- Verify that SPDX 3.0.1 exports do not project declaration-only external
  dependencies as SPDX `Package` or software inventory elements unless a resolved
  evidence profile supports that stronger claim.
- Verify that each extension declaration preserves declaration key, PURL, VERS
  constraint, purpose, scope, declaration-only status, and resolved-evidence
  absence.
- Verify that any SPDX relationship edge is secondary to the extension declaration
  object and does not replace the structured carrier.
- Verify that `ExternalRef` and `Annotation` uses, if present, are marked as
  discovery or human-readable fallback rather than canonical structured carriers.
- Verify that mapping fixtures no longer treat SPDX 2.3 `Package.comment` as the
  SPDX 3.0.1 preservation mechanism.

## Pros and Cons of the Options

### A — Use an SPDX 3.0.1 Extension Profile attached through `Element.extension`

- Good, because it is the native SPDX 3 mechanism for structured custom metadata.
- Good, because it can preserve all Agent Volumes declaration fields losslessly.
- Good, because it avoids false package inventory claims.
- Neutral, because consumers must understand the Agent Volumes extension profile.
- Bad, because the project must define and maintain the extension schema and
  serialization examples.

### B — Use an extension declaration object plus an optional SPDX relationship edge

- Good, because it combines structured metadata with SPDX graph traversal.
- Good, because relationships can make the declaration easier to discover in graph
  tooling.
- Neutral, because this is an adjunct to option A rather than a replacement.
- Bad, because relationship type selection can imply stronger dependency semantics
  than Agent Volumes intends if the profile is not explicit.

### C — Use SPDX external references as the primary carrier

- Good, because external references are appropriate for external identifiers and
  pointers such as PURLs or documentation URLs.
- Bad, because they cannot carry VERS constraint, purpose, scope, declaration key,
  and declaration-only status as a structured payload.
- Bad, because they do not by themselves communicate dependency relationship
  intent.

### D — Use SPDX annotations as the primary carrier

- Good, because annotations are easy to emit and can explain declaration-only
  semantics to humans.
- Bad, because annotations are freeform statements rather than structured metadata.
- Bad, because JSON-in-annotation patterns are fragile and weakly validated.

### E — Model declarations as SPDX packages or software artifacts

- Good, because generic SPDX and SBOM consumers would see familiar software nodes.
- Bad, because declaration-only records can be mistaken for resolved or concrete
  package inventory.
- Bad, because exact versions, digests, licenses, and other resolved facts are not
  available in the declaration-only baseline.

This option may be reconsidered only for a future resolved-evidence profile that
defines exact versions, digests, lockfile observations, provenance observations,
or runtime inventory evidence separately from the declaration item.

### F — Use SPDX relationships only

- Good, because relationships can express dependency-like graph intent.
- Bad, because relationship edges require a target and do not carry the full Agent
  Volumes declaration payload.
- Bad, because a relationship to a package-like target risks recreating the false
  inventory problem.

### G — Omit external dependency declarations from SPDX or export them lossily

- Good, because it avoids false inventory claims and minimizes implementation
  effort.
- Bad, because SPDX export would lose fields required for Agent Volumes
  round-tripping.
- Bad, because SPDX 3.0.1 has an extension mechanism that can preserve the data
  without requiring lossy fallback.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- SPDX standardizes a native declared-but-unresolved dependency carrier that
  preserves PURL, version range, purpose, scope, declaration key, and
  declaration-only status without an Agent Volumes extension.
- SPDX extension tooling proves unable to preserve Agent Volumes declaration
  objects across supported serializations.
- Generic SPDX consumers consistently misinterpret extension declaration objects as
  resolved package inventory.
- Agent Volumes adopts a resolved-evidence profile that requires separate SPDX
  package or software artifact modeling.

## More Information

ADR-0141 records the canonical namespace and compact JSON-LD alias direction for
the SPDX Agent Volumes extension terms.
