---
status: accepted
date: 12026-05-14
decision-makers: Yunseo Kim
---

# Project external dependencies as declaration-only relationships

## Context and Problem Statement

ADR-0116 places `[[external-dependencies]]` records in the declaration plane and
explicitly separates them from resolved package facts. ADR-0130 then defines how
future resolved evidence can link back to declaration-plane records by stable
declaration keys without embedding evidence inside the declaration item.

Those decisions leave a narrower mapping question: **when Agent Volumes exports
external dependency declarations to SBOM, provenance, advisory, warning, or policy
surfaces, what semantic claim should the export make?**

This decision answers only the semantic question. It does not choose the exact
CycloneDX, SPDX, SLSA, or in-toto carrier fields. A follow-up decision records
the target-format serialization strategy.

## Decision Drivers

- Exported external dependency information should remain useful for audit,
  review, advisory precheck, SBOM, and policy workflows.
- Exported external dependency information must not imply that the package was
  resolved, fetched, installed, bundled, executed, verified, or incorporated.
- VERS constraints describe accepted version ranges, not exact resolved versions.
- External dependency declarations can be scoped to a volume or component set, but
  that scope is still audit metadata rather than installer behavior.
- Future resolved-evidence profiles should be able to strengthen the claim without
  changing what declaration-only exports mean.
- Target-format serialization choices should be allowed to evolve without
  reopening the core semantic claim.

## Considered Options

- A — Export declaration-plane external dependencies as resolved inventory claims.
- B — Export declaration-plane external dependencies as declaration-only
  relationships.
- C — Export declaration-plane external dependencies only as weak external
  references, without dependency relationship semantics.
- D — Export declaration-plane external dependencies only as opaque metadata.
- E — Do not export declaration-plane external dependencies until resolved evidence
  exists.

## Decision Outcome

Chosen option: **B — Export declaration-plane external dependencies as
declaration-only relationships**, because it preserves the dependency-like intent
of `[[external-dependencies]]` while preventing consumers from treating the record
as resolved package inventory.

Under this decision:

- An exported external dependency declaration means: the manifest producer declares
  that the volume or scoped components have an audit relationship to an external
  package coordinate and VERS constraint for a stated purpose.
- The declaration relationship is **declaration-only** unless separate resolved
  evidence supports a stronger claim.
- Declaration-only exports do not claim that the external package was resolved,
  fetched, installed, bundled, executed, verified, incorporated into the release,
  used as a build input, or present at runtime.
- Declaration-only exports do not provide exact resolved versions, package digests,
  lockfile evidence, provenance materials, or scanner findings.
- Advisory matching against declaration-only exports remains potential exposure
  information, not a confirmed vulnerable installed-component finding.
- Policy engines may use declaration-only exports as local inputs, but local
  block, warn, ignore, or escalate outcomes are derived judgments rather than
  canonical trust facts.
- Future resolved-evidence profiles may link resolved facts to the declaration
  relationship by stable declaration keys defined by ADR-0130.

## Consequences

- Good, because exported declarations remain useful without overstating evidence.
- Good, because the semantic claim is independent of CycloneDX, SPDX, SLSA, or
  in-toto carrier details.
- Good, because future resolved-evidence profiles can strengthen the claim without
  redefining declaration-only exports.
- Good, because advisory and policy tooling can distinguish potential exposure
  from confirmed resolved evidence.
- Neutral, because target formats vary in how naturally they represent
  declaration-only relationships.
- Neutral, because generic SBOM consumers may need Agent Volumes-specific metadata
  to understand the relationship correctly.
- Bad, because consumers expecting only resolved inventory may ignore or
  misunderstand declaration-only relationships.

## Confirmation

- Verify that draft 6 prose defines exported external dependencies as
  declaration-only relationships.
- Verify that export prose uses potential-exposure wording for declaration-only
  advisory matches.
- Verify that no mapping text treats VERS constraints as exact resolved versions.
- Verify that no mapping text claims resolution, installation, build-material, or
  runtime presence without separate resolved evidence.
- Verify that future target-format mapping rows preserve the declaration-only
  status or explicitly classify the mapping as lossy.

## Pros and Cons of the Options

### A — Export declaration-plane external dependencies as resolved inventory claims

- Good, because existing SBOM and scanner consumers may process the entries without
  Agent Volumes-specific declaration handling.
- Bad, because it falsely implies package resolution or presence.
- Bad, because it conflicts with ADR-0116 and ADR-0130.
- Bad, because VERS constraints are ranges, not exact resolved versions.

### B — Export declaration-plane external dependencies as declaration-only relationships

- Good, because it preserves dependency-like intent without creating false
  inventory claims.
- Good, because it can support audit, advisory precheck, SBOM, warning, and policy
  workflows.
- Good, because it creates a stable semantic layer that target-format carriers can
  serialize in different ways.
- Neutral, because some formats need controlled extensions or lossy mappings to
  carry the semantics safely.
- Bad, because some consumers may not understand declaration-only relationships.

### C — Export declaration-plane external dependencies only as weak external references

- Good, because external references are less likely than inventory entries to imply
  resolution.
- Good, because package coordinates remain discoverable.
- Bad, because relationship intent, purpose, scope, and constraint semantics are too
  weak or ambiguous.
- Bad, because external references alone do not explain why the coordinate appears.

### D — Export declaration-plane external dependencies only as opaque metadata

- Good, because Agent Volumes can preserve its fields without forcing target-native
  semantics.
- Good, because metadata can include explicit declaration-only markers.
- Neutral, because this is a useful serialization technique for some targets.
- Bad, because metadata alone may hide the dependency relationship from consumers
  that could safely use declaration semantics.

### E — Do not export declaration-plane external dependencies until resolved evidence exists

- Good, because it fully avoids false inventory claims.
- Good, because SBOM/provenance exports remain strictly evidence-based.
- Bad, because it loses the machine-readable audit visibility introduced by
  ADR-0109 through ADR-0116.
- Bad, because advisory precheck and policy workflows lose useful declaration
  inputs.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- SBOM or provenance ecosystems standardize a native declared-but-unresolved
  dependency relationship with stronger semantics than this decision provides.
- Implementation experience shows that declaration-only relationship exports are
  routinely misread as resolved inventory despite explicit markers.
- External dependency declarations are narrowed so far that they no longer have
  relationship semantics and should become opaque metadata only.
- Future resolved-evidence profiles require a different semantic boundary between
  declaration, resolution, and policy outcomes.

## More Information

Follow-up work should define:

- target-format carrier choices for CycloneDX, SPDX, SLSA, and in-toto
- mapping matrix rows for declaration-only external dependency relationships
- conformance fixtures that assert declaration-only exports are not resolved
  components, packages, subjects, materials, or resolved dependency entries
- diagnostic wording for potential exposure versus confirmed resolved evidence
