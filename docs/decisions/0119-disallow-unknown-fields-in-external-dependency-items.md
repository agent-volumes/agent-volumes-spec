---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Disallow unknown fields in external dependency items

## Context and Problem Statement

ADR-0109 establishes `[[external-dependencies]]` as declaration-plane audit
metadata for external non-volume package dependencies. ADR-0110 through ADR-0118
define the array-of-tables shape, required fields, purpose vocabulary, VERS
constraint model, uniqueness key, component scoping, declaration-plane mapping,
schema/semantic validation split, and shallow schema-pattern boundary.

ADR-0051 and ADR-0052 allow unknown `volume.toml` fields and tables in the v0.1
baseline when surfaced as warnings. Capability metadata decisions also define
forward-compatible extension behavior for a different artifact family.

That leaves a narrower question for external dependency records: **should each
`[[external-dependencies]]` item allow unknown fields for local or future metadata,
or should v0.1 keep each item limited to the portable declaration fields already
standardized?**

This matters because external dependency records intentionally separate declared
audit requirements from resolved package evidence. Unknown item fields could easily
start carrying native lockfile references, resolved versions, digests, provenance
observations, scanner hints, or policy outputs before those concepts have a stable
profile boundary.

## Decision Drivers

- v0.1 should keep the portable external dependency declaration baseline small and
  unambiguous.
- Future resolved evidence, native manifest references, lockfile references,
  digests, provenance links, advisory hints, and policy outputs should not be
  mixed into declaration-plane records accidentally.
- Typographical mistakes in dependency item fields should fail early rather than
  becoming tolerated unknown metadata.
- Extension space should be deliberate and namespaced when it is needed, not an
  accidental side effect of permissive item schemas.
- The general unknown-manifest-field tolerance remains useful at broader manifest
  boundaries, but external dependency item semantics need a tighter portable core.

## Considered Options

- A — Disallow unknown fields in each external dependency item.
- B — Allow unknown fields in each item and recommend warning-level diagnostics.
- C — Disallow ordinary unknown fields but allow a dedicated namespaced extension
  object.
- D — Disallow ordinary unknown fields but allow fields with a reserved extension
  prefix.
- E — Disallow unknown fields in v0.1 and explicitly reopen extension-space design
  when future profile needs are concrete.

## Decision Outcome

Chosen option: **E — Disallow unknown fields in v0.1 and reopen extension-space
design only when future profile needs are concrete**, because it preserves the
declaration-plane boundary while leaving an explicit path to add disciplined
extension space later.

Under this decision, each `[[external-dependencies]]` item in the v0.1 schema
should allow only the standardized item fields:

- `purl`
- `constraint`
- `purpose`
- `components`

The item schema should reject all other item-level fields. In JSON Schema terms,
the item object should use `additionalProperties: false` unless a future ADR
reopens this decision and defines a replacement extension model.

This decision does not remove the broader v0.1 rule that unknown manifest fields
and tables can be tolerated with warnings at appropriate manifest boundaries. It
instead defines a stricter sub-boundary for the standardized external dependency
item shape.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- A resolved-evidence profile is adopted that needs to attach exact versions,
  digests, native lockfile evidence, provenance observations, or installer
  observations to external dependency declarations.
- A native-manifest or native-lockfile reference profile is adopted and needs to
  associate source-file evidence with individual external dependency records.
- Multiple independent implementations converge on the same non-core item-level
  metadata and demonstrate that it improves portability rather than only local
  policy behavior.
- Agent Volumes adopts a general extension namespace policy for manifest subobjects
  that can prevent field collisions and distinguish deliberate extensions from
  typos.
- CycloneDX, SPDX, Package URL, VERS, or another adopted upstream standard adds a
  stable declaration metadata field that Agent Volumes should preserve directly in
  external dependency records.
- Conformance fixtures need to represent local extension behavior without treating
  it as resolved evidence, policy output, or mapping-only metadata.

If the decision is reopened, the follow-up ADR should evaluate at least a
dedicated `extensions` container, reserved-prefix fields, profile-specific fields,
and separate resolved-evidence artifacts before permitting ordinary unknown item
fields.

## Consequences

- Good, because v0.1 external dependency item semantics stay precise and portable.
- Good, because typo fields are rejected early instead of silently accepted.
- Good, because future resolved evidence and native lockfile references cannot
  accidentally appear as unofficial declaration-plane fields.
- Good, because extension design is deferred until concrete interoperability needs
  exist.
- Good, because schema and conformance fixtures can describe a compact item shape.
- Neutral, because this creates a stricter sub-boundary than the broader unknown
  manifest field tolerance.
- Neutral, because local tools may still keep implementation-specific metadata
  outside the portable manifest or in future profile artifacts.
- Bad, because early implementers cannot experiment with item-local metadata inside
  the standardized item object.
- Bad, because adding future fields will require an explicit schema/spec decision
  rather than being forward-compatible by default.

## Confirmation

- Verify that `volume.schema.json` rejects unknown fields inside each
  `external-dependencies` item.
- Verify that valid item fields are limited to `purl`, `constraint`, `purpose`, and
  `components` until a future ADR changes the item shape.
- Verify that prose distinguishes this strict item boundary from broader unknown
  manifest field tolerance.
- Verify that future resolved-evidence, native-lockfile, and extension-space work
  does not reuse unknown item fields without reopening this decision.
- Verify that conformance fixtures include an unknown external dependency item field
  as a schema-level invalid case.

## Pros and Cons of the Options

### A — Disallow unknown fields in each external dependency item

- Good, because the v0.1 item contract is simple and explicit.
- Good, because typo fields are schema errors.
- Good, because future fields require deliberate standardization.
- Bad, because local metadata cannot be carried in the item.
- Bad, because experimental extensions need another location or future profile.

### B — Allow unknown fields in each item and recommend warning-level diagnostics

- Good, because it aligns with the broad unknown `volume.toml` tolerance direction.
- Good, because future or local metadata can be added without schema changes.
- Good, because early implementations can experiment quickly.
- Bad, because typo fields may be mistaken for meaningful metadata.
- Bad, because declaration-plane records can become a dumping ground for resolved
  evidence, scanner hints, or local policy outputs.
- Bad, because field collisions become likely without a namespace discipline.

### C — Disallow ordinary unknown fields but allow a dedicated namespaced extension object

- Good, because the portable baseline remains strict while extensions are visibly
  separated.
- Good, because namespacing reduces collision risk.
- Good, because deliberate extensions are easier to distinguish from typos.
- Neutral, because this is a plausible future extension-space design.
- Bad, because it adds schema and TOML complexity before concrete extension needs
  are known.
- Bad, because extension namespace governance would need to be specified now.

### D — Disallow ordinary unknown fields but allow fields with a reserved extension prefix

- Good, because it is lighter than an extension object.
- Good, because it allows experimentation while rejecting ordinary typos.
- Neutral, because some ecosystems use reserved prefixes successfully.
- Bad, because flat prefixed fields can become messy over time.
- Bad, because prefix collision and authority rules are weaker than a namespaced
  container.
- Bad, because it still creates an extension policy surface in v0.1.

### E — Disallow unknown fields in v0.1 and explicitly reopen extension-space design when future profile needs are concrete

- Good, because it keeps the current declaration-only model clean.
- Good, because it avoids premature extension policy design.
- Good, because future profiles can choose between item fields, extension
  containers, reserved prefixes, or separate resolved-evidence artifacts with more
  evidence.
- Good, because this aligns field addition with explicit ADR/schema/spec review.
- Neutral, because it is strict now but not permanently closed.
- Bad, because implementers must wait for a future profile to carry item-local
  extension metadata portably.

## More Information

Follow-up work should decide:

- exact `volume.schema.json` object shape for `external-dependencies` items using
  `additionalProperties: false`
- schema-level fixtures for unknown item fields
- whether future resolved-evidence data belongs in item fields, a namespaced
  extension container, a separate profile artifact, or mapping-only metadata
- whether Agent Volumes should define a general manifest subobject extension policy
  before adding any item-level extension space
