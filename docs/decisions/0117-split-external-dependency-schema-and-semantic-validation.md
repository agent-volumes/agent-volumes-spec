---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Split external dependency schema and semantic validation

## Context and Problem Statement

ADR-0109 establishes a minimal declaration baseline for external non-volume
package dependencies. ADR-0110 through ADR-0116 define the manifest shape, required
fields, purpose vocabulary, VERS constraint grammar, uniqueness key, component
scoping model, and declaration-plane mapping semantics for
`[[external-dependencies]]` records.

Those decisions leave a validation boundary question: **which requirements should
the JSON Schema enforce directly, and which requirements should be enforced by
semantic validation using Package URL and VERS-aware tooling?**

This boundary matters because JSON Schema can validate structural shape, primitive
types, enums, shallow string patterns, and structural array uniqueness. It cannot
reliably implement Package URL canonicalization, type-specific Package URL rules,
VERS grammar and scheme behavior, cross-field compatibility, component reference
existence, or semantic-key uniqueness over `(canonical purl, purpose, scope)`.

## Decision Drivers

- The machine-readable manifest schema should catch obvious structural errors early.
- Agent Volumes should avoid reimplementing Package URL and VERS grammars in its
  own schema or bespoke validators.
- Package URL is standardized by ECMA-427 and maintained through the Package URL
  project's specification, type registry, schemas, tests, and parser libraries.
- VERS is maintained by the Package URL project with specification text, schemas,
  and test fixtures, even though it is not yet an Ecma standard.
- Implementations should prefer official Package URL and VERS artifacts where they
  exist and fixture-compatible implementation libraries where official libraries do
  not exist.
- Existing Agent Volumes artifacts already separate structural schema validation
  from semantic validation for constraints such as SPDX expression validation,
  canonical purl serialization, and component dependency checks.
- Conformance fixtures should make the boundary testable without forcing all
  semantic checks into `volume.schema.json`.

## Considered Options

- A — Keep JSON Schema minimal and validate almost everything semantically.
- B — Use JSON Schema for structure and shallow patterns, then use semantic
  validation for Package URL, VERS, references, and uniqueness.
- C — Encode as much Package URL and VERS validation as possible in JSON Schema
  regular expressions.
- D — Treat JSON Schema as permissive transport shape only and require semantic
  validation for all meaningful checks.
- E — Add a dedicated external dependency semantic fixture family alongside the
  schema boundary.

## Decision Outcome

Chosen option: **B + E — Use JSON Schema for structure and shallow patterns, and
add a dedicated external dependency semantic fixture family**, because it provides
useful early validation without duplicating Package URL or VERS semantics inside
Agent Volumes.

Under this decision, `volume.schema.json` should validate:

- `external-dependencies` as an array of objects
- required `purl`, `constraint`, and `purpose` fields
- optional `components` as a non-empty array of component-name-shaped strings with
  structural uniqueness
- primitive types, required fields, and object shape
- basic `purl` shape such as a Package URL string beginning with `pkg:`
- basic `constraint` shape such as a VERS string beginning with `vers:` and carrying
  a scheme and expression body
- `purpose` as either a core enum value or a syntactically namespaced extension
  value

Semantic validation should enforce:

- Package URL parseability according to ECMA-427 and the Package URL project
  specification
- Package URL canonicalization using Package URL project rules and type definitions
- rejection of Agent Volumes `pkg:volume/...` identities in
  `external-dependencies`
- VERS parseability and grammar according to the Package URL project's VERS
  specification
- compatibility between the VERS scheme and the Package URL type where the
  specification or project artifacts define that relationship
- component scope references to existing `[[components]].name` values
- semantic duplicate detection by `(canonical purl, purpose, scope)`
- declaration-only versus resolved-evidence interpretation where validation output
  or mappings depend on that distinction

Validators should prefer official or project-maintained artifacts before custom
implementation:

- ECMA-427 Package URL and the Package URL project specification are the canonical
  Package URL syntax and type-definition sources.
- The Package URL project's type registry, type-definition schemas, index schemas,
  and test fixtures are preferred compatibility inputs for Package URL validation.
- Official or project-maintained Package URL parser libraries should be preferred
  in implementation languages where they exist.
- The Package URL project's VERS specification, schemas, and test fixtures are the
  preferred compatibility baseline for VERS validation.
- Third-party VERS or Package URL libraries may be used as implementation aids, but
  should be validated against the official or project-maintained fixtures before
  being treated as conformant.

Agent Volumes should not maintain a forked Package URL grammar, forked VERS
grammar, or schema regex that attempts to fully replace the Package URL or VERS
project artifacts.

## Consequences

- Good, because obvious manifest shape errors can be rejected by ordinary JSON
  Schema validators.
- Good, because Package URL and VERS semantics remain delegated to their owning
  projects and artifacts.
- Good, because Agent Volumes avoids creating a stale shadow implementation of
  Package URL type rules or VERS range grammar.
- Good, because semantic conformance fixtures can test canonicalization, reference
  existence, cross-field compatibility, and duplicate detection directly.
- Good, because lightweight tooling can still provide useful feedback without a
  full semantic engine.
- Neutral, because validators must implement both a schema pass and a semantic pass
  for complete conformance.
- Neutral, because VERS currently has project-official artifacts but not the same
  formal standards status as ECMA-427 Package URL.
- Bad, because implementers must understand that JSON Schema success is necessary
  but not sufficient for external dependency validity.
- Bad, because conformance runners need a new external dependency validation fixture
  family.
- Bad, because some environments may lack mature official VERS parser libraries and
  will need to use fixture-compatible implementation aids.

## Confirmation

- Verify that `volume.schema.json` contains `external-dependencies` structural and
  shallow-pattern validation without attempting full Package URL or VERS grammar.
- Verify that semantic validation covers Package URL parseability,
  canonicalization, non-volume identity enforcement, VERS parseability, VERS/PURL
  compatibility, component reference existence, and semantic duplicate detection.
- Verify that external dependency semantic fixtures are represented separately from
  generic manifest schema fixtures.
- Verify that implementation guidance tells validators to prefer official or
  project-maintained Package URL and VERS artifacts where available.
- Verify that schema comments or prose warn that JSON Schema success does not prove
  semantic validity of an external dependency declaration.

## Pros and Cons of the Options

### A — Keep JSON Schema minimal and validate almost everything semantically

- Good, because it keeps `volume.schema.json` small and stable.
- Good, because all Package URL and VERS behavior can be parser-driven.
- Good, because future Package URL or VERS evolution is less likely to require
  schema churn.
- Bad, because basic typos and obvious shape errors are caught later.
- Bad, because the manifest schema communicates less of the declared contract.
- Bad, because schema-level conformance fixtures would provide little coverage for
  the new field.

### B — Use JSON Schema for structure and shallow patterns, then semantic validation for Package URL, VERS, references, and uniqueness

- Good, because it matches JSON Schema's strengths and limitations.
- Good, because schema validation can catch missing fields, wrong primitive types,
  empty `components`, duplicate component strings, and clearly wrong prefixes.
- Good, because Package URL parsing, Package URL canonicalization, VERS parsing,
  cross-field compatibility, and semantic-key uniqueness remain in specialized
  validators.
- Good, because this aligns with existing Agent Volumes treatment of SPDX
  expression validation and purl canonicalization as semantic checks.
- Neutral, because two validation layers must be documented clearly.
- Bad, because implementers cannot rely on schema validation alone.

### C — Encode as much Package URL and VERS validation as possible in JSON Schema regular expressions

- Good, because schema-only validators could catch more invalid declarations.
- Good, because some invalid cases would not require a semantic validation engine.
- Bad, because Package URL type rules and VERS grammar are too rich for maintainable
  JSON Schema regular expressions.
- Bad, because it would duplicate logic owned by the Package URL and VERS projects.
- Bad, because schema expressions could become stale or incorrectly reject valid
  future forms.
- Bad, because semantic-key uniqueness and component reference existence would still
  remain outside JSON Schema.

### D — Treat JSON Schema as permissive transport shape only and require semantic validation for all meaningful checks

- Good, because semantic validators become the single source of validation truth.
- Good, because Package URL and VERS handling can be entirely library-driven.
- Neutral, because it is compatible with strict conformance runners.
- Bad, because ordinary schema tooling becomes much less useful.
- Bad, because user feedback for obvious field-level mistakes becomes weaker.
- Bad, because schema artifacts would underrepresent a normative manifest feature.

### E — Add a dedicated external dependency semantic fixture family alongside the schema boundary

- Good, because external dependency checks have enough specialized behavior to merit
  their own conformance target.
- Good, because fixtures can directly cover Package URL canonicalization, VERS
  parsing, VERS/PURL compatibility, component reference existence, and semantic
  duplicate detection.
- Good, because the generic `semantic-validation-cases.json` fixture does not need
  to grow into an overloaded catch-all.
- Neutral, because fixture family design still needs follow-up schema work.
- Bad, because it adds another schema and fixture file for conformance runners to
  support.

## More Information

Follow-up work should decide:

- exact `volume.schema.json` representation for `external-dependencies`
- exact schema pattern strength for `purl`, `constraint`, and namespaced `purpose`
  extension values
- the structure of `external-dependency-validation-case.schema.json`
- diagnostic identifiers or failure categories for invalid purl, invalid VERS,
  volume purl rejection, incompatible VERS scheme, unknown component scope, and
  duplicate semantic keys
- how conformance runners cite or consume Package URL and VERS upstream fixtures
- whether Agent Volumes publishes an implementation note listing preferred Package
  URL and VERS libraries by language
