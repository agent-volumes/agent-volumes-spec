---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Use shallow schema patterns for external dependencies

## Context and Problem Statement

ADR-0117 splits `[[external-dependencies]]` validation into a structural JSON
Schema layer and a semantic validation layer. The schema layer should catch
obvious shape and shallow-pattern errors, while semantic validation should enforce
Package URL parsing, Package URL canonicalization, VERS parsing, cross-field
compatibility, component reference existence, and semantic duplicate detection.

That split leaves a narrower schema-design question: **how strong should the
`volume.schema.json` string patterns be for `purl`, `constraint`, `purpose`, and
`components` before semantic validation takes over?**

This decision covers structural and shallow-pattern validation only. Whether
unknown fields are allowed inside each external dependency item is intentionally
left to a separate decision.

## Decision Drivers

- The schema should reject obvious authoring mistakes without pretending to be a
  full Package URL or VERS validator.
- Agent Volumes should continue to rely on Package URL and VERS project artifacts
  for grammar, canonicalization, and compatibility behavior.
- Schema constraints should be understandable, stable, and maintainable.
- The schema should reuse existing manifest definitions where possible, especially
  for component names.
- Semantic validation should remain responsible for checks that require parsing,
  canonicalization, cross-field interpretation, or graph/reference awareness.

## Considered Options

- A — Validate only field presence and primitive types.
- B — Validate structure plus shallow prefix and shape patterns.
- C — Validate structure plus shallow patterns and reject `pkg:volume/...` at the
  schema layer.
- D — Encode strong Package URL and VERS regular expressions in JSON Schema.

## Decision Outcome

Chosen option: **B — Validate structure plus shallow prefix and shape patterns**,
because it gives useful schema-level feedback while preserving the ADR-0117
boundary that Package URL and VERS semantics belong to specialized validators and
official project artifacts.

Under this decision, `volume.schema.json` should represent
`external-dependencies` as an array of item objects with:

- required `purl`, `constraint`, and `purpose` fields
- optional `components`
- `purl` as a string with a shallow Package URL prefix pattern such as `^pkg:`
- `constraint` as a string with a shallow VERS shape pattern such as
  `^vers:[^/]+/.+`
- `purpose` as either a core purpose enum value or a syntactically namespaced
  extension value
- `components` as a non-empty array whose entries reuse the existing
  `componentName` definition and are structurally unique

The schema should not attempt to:

- fully validate Package URL syntax
- fully validate Package URL type-specific rules
- canonicalize Package URLs
- reject all semantic forms of Agent Volumes `pkg:volume/...` identities
- fully validate VERS grammar
- evaluate VERS range semantics
- compare VERS schemes against Package URL types
- verify that `components` entries reference declared component names
- detect duplicate declarations by `(canonical purl, purpose, scope)`

Those checks remain semantic validation responsibilities.

## Consequences

- Good, because the schema catches missing fields, wrong primitive types, empty
  component scopes, duplicate component strings, and clearly malformed prefixes.
- Good, because schema validation remains useful without becoming a fork of Package
  URL or VERS.
- Good, because `components` validation stays aligned with existing component name
  rules.
- Good, because semantic conformance fixtures can focus on parser-driven and
  cross-field behavior.
- Neutral, because values such as `pkg:not actually valid` may still pass the
  shallow schema and fail semantic validation later.
- Neutral, because `pkg:volume/...` rejection is handled semantically rather than
  by a simple schema regex.
- Bad, because implementers must clearly communicate that schema-valid external
  dependency declarations are not necessarily semantically valid.
- Bad, because some invalid declarations will require a semantic validator to
  detect.

## Confirmation

- Verify that `volume.schema.json` adds `external-dependencies` with required
  `purl`, `constraint`, and `purpose` fields and optional `components`.
- Verify that schema patterns remain shallow and do not attempt to fully implement
  Package URL or VERS grammar.
- Verify that `components` entries reuse the existing component-name constraints
  and use structural uniqueness.
- Verify that Agent Volumes `pkg:volume/...` rejection remains a semantic
  validation requirement.
- Verify that full Package URL parsing, VERS parsing, VERS/PURL compatibility,
  component reference existence, and duplicate semantic-key checks remain in the
  external dependency semantic fixture family.

## Pros and Cons of the Options

### A — Validate only field presence and primitive types

- Good, because it keeps schema maintenance trivial.
- Good, because it avoids any chance of conflicting with Package URL or VERS
  project grammar.
- Good, because the schema/semantic boundary is simple to explain.
- Bad, because obvious values such as a non-`pkg:` purl or non-`vers:` constraint
  pass schema validation.
- Bad, because the machine-readable schema communicates too little of the intended
  contract.
- Bad, because schema-level fixtures provide weak coverage for the new field.

### B — Validate structure plus shallow prefix and shape patterns

- Good, because it catches common authoring mistakes early.
- Good, because the patterns are simple enough to maintain.
- Good, because full Package URL and VERS semantics still belong to their project
  artifacts and semantic validators.
- Good, because it aligns with the existing Agent Volumes approach of using schema
  for structure and semantic validators for canonicalization and cross-reference
  behavior.
- Neutral, because schema-valid values can still fail semantic validation.
- Bad, because the schema cannot fully describe the valid value space.

### C — Validate structure plus shallow patterns and reject `pkg:volume/...` at the schema layer

- Good, because it surfaces the non-volume boundary earlier.
- Good, because many accidental uses of volume dependencies in
  `external-dependencies` would fail immediately.
- Neutral, because it still requires semantic Package URL parsing for complete
  correctness.
- Bad, because schema regex can miss or mishandle canonicalization and encoding
  edge cases.
- Bad, because it duplicates part of a semantic category decision in a shallow
  string pattern.
- Bad, because the same external dependency may need parser-aware diagnostics that
  a schema rejection cannot provide.

### D — Encode strong Package URL and VERS regular expressions in JSON Schema

- Good, because schema-only validators would catch more invalid declarations.
- Good, because fewer invalid strings would reach semantic validation.
- Bad, because it conflicts with the decision to avoid maintaining an Agent
  Volumes fork of Package URL or VERS grammar.
- Bad, because Package URL type rules and VERS scheme behavior are not maintainable
  as large JSON Schema regular expressions.
- Bad, because the schema can become stale as upstream artifacts evolve.
- Bad, because reference existence, canonical equivalence, and duplicate semantic
  keys still cannot be handled by JSON Schema.

## More Information

Follow-up work should decide:

- whether external dependency item objects allow unknown fields
- exact regex text for namespaced `purpose` extension values
- exact `external-dependency-validation-case.schema.json` structure
- failure categories for semantic validation cases
- schema-level and semantic-level fixture placement for invalid examples
