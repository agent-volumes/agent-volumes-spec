---
status: accepted
date: 12026-05-14
decision-makers: Yunseo Kim
---

# Use shared external dependency schema definition

## Context and Problem Statement

ADR-0109 through ADR-0120 define the portable declaration model for external
non-volume package dependencies. ADR-0117 splits validation into a structural JSON
Schema layer and a semantic validation layer. ADR-0118 chooses shallow schema
patterns for `purl`, `constraint`, `purpose`, and `components`. ADR-0119 rejects
unknown fields inside each external dependency item for v0.1.

Those decisions leave an implementation-facing schema organization question:
**should the `external-dependencies` item object be defined inline at each use site,
kept intentionally loose, or factored into a shared JSON Schema definition that both
manifest validation and conformance fixture schemas can reference?**

This decision covers schema organization and reusable structural contract only. It
does not change the earlier schema/semantic validation split or add new external
dependency item fields.

## Decision Drivers

- The schema contract for `[[external-dependencies]]` should be explicit enough for
  independent implementers to reuse.
- Manifest schema validation and conformance fixture validation should not drift.
- v0.1 should preserve the ADR-0117 and ADR-0118 boundary: schema validates
  structure and shallow patterns; semantic validators handle Package URL, VERS,
  canonicalization, reference existence, and duplicate-key behavior.
- The schema should continue to reject unknown item fields as decided in ADR-0119.
- Future fixture schemas should be able to reference the same candidate item shape
  without copying field definitions.

## Considered Options

- A — Define the external dependency item shape inline only in `volume.schema.json`.
- B — Define a shared `$defs.externalDependency` schema and reference it from the
  manifest schema and related fixture schemas.
- C — Keep only a loose object schema and rely mostly on semantic validation.
- D — Define a separate standalone external dependency item schema file.

## Decision Outcome

Chosen option: **B — Define a shared `$defs.externalDependency` schema and reference
it from the manifest schema and related fixture schemas**, because it gives v0.1 one
structural source of truth without overbuilding a separate schema artifact.

Under this decision, `volume.schema.json` should add `external-dependencies` as an
array whose items reference a shared definition such as:

```json
{
  "external-dependencies": {
    "type": "array",
    "items": { "$ref": "#/$defs/externalDependency" }
  }
}
```

The shared `$defs.externalDependency` definition should encode the portable item
contract decided by ADR-0111, ADR-0115, ADR-0118, ADR-0119, and ADR-0120:

- required `purl`, `constraint`, and `purpose`
- optional `components`
- no unknown item fields
- `purl` as a string with a shallow Package URL prefix pattern such as `^pkg:`
- `constraint` as a string with a shallow VERS shape pattern such as
  `^vers:[^/]+/.+`
- `purpose` as either a core purpose enum value or a reverse-DNS purpose extension
  value
- `components` as a non-empty, structurally unique array whose entries reuse the
  existing component-name definition

Future conformance fixture schemas that need to represent candidate external
dependency declarations should reference the same definition when practical rather
than duplicating the item contract. Fixture schemas may wrap that definition in
case-specific structures such as `declaredComponents`, `external-dependencies`, and
`expected`, but they should not redefine the external dependency item fields unless a
later ADR changes the item contract.

The shared definition remains a structural and shallow-pattern contract only. It
does not perform Package URL parsing, Package URL canonicalization, VERS parsing,
VERS/PURL compatibility checks, component-reference checks, `pkg:volume/...`
rejection, or duplicate/conflict classification.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- external dependency declarations become reusable across multiple independently
  published schema artifacts outside `volume.schema.json`
- conformance fixture schemas need a meaningfully different candidate item shape
  than the manifest schema
- Agent Volumes adopts a general schema modularization policy that prefers
  standalone schema files for reusable subobjects
- future resolved-evidence, native-lockfile, or extension-space profiles add item
  fields that make the shared v0.1 definition misleading
- implementation experience shows that `$defs` reuse creates tooling compatibility
  problems for common JSON Schema validators

If reopened, the follow-up ADR should evaluate a standalone
`external-dependency.schema.json`, profile-specific subobject schemas, or separate
candidate-vs-manifest item definitions.

## Consequences

- Good, because manifest validation and conformance fixture validation can share one
  structural item contract.
- Good, because the schema remains compact while avoiding inline duplication.
- Good, because the `$defs` boundary mirrors the already decided schema/semantic
  validation split.
- Good, because future implementation work can add `external-dependencies` to
  `volume.schema.json` without reopening field-shape decisions.
- Neutral, because fixture schemas still need their own surrounding case structure.
- Neutral, because `$defs` reuse is a schema organization choice, not a semantic
  validation shortcut.
- Bad, because `volume.schema.json` becomes slightly larger and more coupled to
  fixture schema design.
- Bad, because a future standalone schema may require migrating references if the
  external dependency item becomes reusable beyond the manifest schema family.

## Confirmation

- Verify that `volume.schema.json` defines `external-dependencies` item objects via
  a shared `$defs.externalDependency` definition.
- Verify that the shared definition requires `purl`, `constraint`, and `purpose`;
  allows optional `components`; and rejects unknown item fields.
- Verify that schema patterns remain shallow and do not replace semantic Package URL
  or VERS validation.
- Verify that `components` entries reuse the existing component-name definition and
  remain structurally unique.
- Verify that external dependency conformance fixture schemas reference the shared
  definition when they represent candidate manifest items.

## Pros and Cons of the Options

### A — Define the external dependency item shape inline only in `volume.schema.json`

- Good, because it is straightforward for the manifest schema alone.
- Good, because it avoids exposing a reusable definition before fixtures exist.
- Neutral, because it can be refactored later.
- Bad, because conformance fixture schemas would likely duplicate the same field
  definitions.
- Bad, because duplicated shallow patterns and required-field lists can drift.

### B — Define a shared `$defs.externalDependency` schema and reference it from the manifest schema and related fixture schemas

- Good, because there is one in-repository structural contract for external
  dependency items.
- Good, because it aligns manifest and fixture validation without creating another
  top-level schema file.
- Good, because JSON Schema `$defs` is already the natural location for reusable
  subobject definitions inside a schema artifact.
- Good, because the contract remains narrow and follows ADR-0118's shallow-pattern
  boundary.
- Neutral, because the definition still depends on semantic validators for full
  correctness.
- Bad, because it couples fixture schemas to a definition hosted in
  `volume.schema.json`.

### C — Keep only a loose object schema and rely mostly on semantic validation

- Good, because it minimizes schema complexity.
- Good, because semantic validators can produce domain-specific diagnostics.
- Bad, because it weakens the schema-level contract already chosen by ADR-0118 and
  ADR-0119.
- Bad, because typo fields, missing fields, and obvious shallow-pattern errors would
  be caught later or inconsistently.
- Bad, because conformance fixtures would need to restate constraints outside the
  manifest schema.

### D — Define a separate standalone external dependency item schema file

- Good, because it gives reusable artifacts a clean import target.
- Good, because candidate fixture schemas would not need to reference definitions
  inside `volume.schema.json`.
- Neutral, because it may become appropriate if more artifacts reuse the item shape.
- Bad, because it adds another schema artifact before the reuse surface is large
  enough to justify it.
- Bad, because standalone item schemas can obscure that `[[external-dependencies]]`
  is currently a manifest subobject, not an independently published artifact.

## More Information

Follow-up work should decide:

- exact regex text for reverse-DNS `purpose` extension values
- whether duplicate/conflicting constraint comparison uses byte-identical VERS
  strings or parser-normalized VERS strings
- exact `external-dependency-validation-case.schema.json` structure
- schema-level fixture names for missing fields, unknown fields, bad shallow
  patterns, empty `components`, and duplicate component strings
