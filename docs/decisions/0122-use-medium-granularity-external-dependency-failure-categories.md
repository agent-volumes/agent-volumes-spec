---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Use medium-granularity external dependency failure categories

## Context and Problem Statement

ADR-0121 defines `external-dependency-validation-cases.json` as a compact,
domain-specific semantic fixture family. Each case contains `declaredComponents`,
`external-dependencies`, and `expected`. The structure leaves the exact
`expected.failureCategory` vocabulary for a follow-up decision.

That vocabulary must be specific enough for deterministic conformance results, but
not so detailed that Agent Volumes has to mirror Package URL or VERS parser error
taxonomies.

The decision question is: **how granular should external dependency validation
failure categories be in v0.1 conformance fixtures?**

## Decision Drivers

- Failure categories should identify the major Agent Volumes semantic validation
  boundary that failed.
- Categories should be stable enough for conformance reports and fixture diffs.
- Categories should avoid reclassifying every Package URL or VERS parser-specific
  error.
- Duplicate declarations and conflicting declarations need clear, actionable
  treatment.
- The vocabulary should remain small enough for v0.1 implementers.

## Considered Options

- A — Use a minimal consolidated category set.
- B — Use medium-granularity categories for the core validation axes.
- C — Use highly detailed parser and validation categories.
- D — Use medium-granularity categories plus optional detail codes.
- E — Avoid failure categories and rely only on `expected.valid` plus prose case
  names.

## Decision Outcome

Chosen option: **B — Use medium-granularity categories for the core validation
axes**, with duplicate declarations split from conflicting declarations.

The v0.1 `external-dependency-validation-cases.json` failure category vocabulary is:

- `invalid-external-dependency-purl`
- `external-dependency-volume-purl`
- `invalid-external-dependency-constraint`
- `external-dependency-constraint-type-mismatch`
- `invalid-external-dependency-purpose`
- `unknown-external-dependency-component`
- `duplicate-external-dependency`
- `conflicting-external-dependency`

The categories mean:

- `invalid-external-dependency-purl` — the `purl` value cannot be parsed,
  canonicalized, or accepted as a valid non-volume Package URL candidate before the
  more specific `external-dependency-volume-purl` category applies.
- `external-dependency-volume-purl` — the declaration uses an Agent Volumes
  `pkg:volume/...` identity where an external non-volume dependency is required.
- `invalid-external-dependency-constraint` — the `constraint` value cannot be parsed
  or accepted as a valid VERS expression.
- `external-dependency-constraint-type-mismatch` — the Package URL type and VERS
  scheme are incompatible for the declaration.
- `invalid-external-dependency-purpose` — the `purpose` value is neither a core
  purpose enum value nor a syntactically valid reverse-DNS extension value.
- `unknown-external-dependency-component` — a `components` entry does not reference
  a declared component name in the case context.
- `duplicate-external-dependency` — two or more declarations have the same semantic
  key `(canonical purl, purpose, scope)` and equivalent constraints.
- `conflicting-external-dependency` — two or more declarations have the same
  semantic key `(canonical purl, purpose, scope)` but incompatible or different
  constraints.

Package URL and VERS parser-specific sub-errors should not become portable v0.1
failure categories unless a future ADR expands the vocabulary. Implementations may
surface richer local details, but conformance fixtures should compare the portable
category above.

## Consequences

- Good, because PURL, VERS, purpose, component-scope, duplicate, and conflict
  failures are distinguishable.
- Good, because fixture reports become more actionable than a single generic
  invalid category.
- Good, because the vocabulary does not force Agent Volumes to standardize upstream
  parser error details.
- Good, because exact duplicates and conflicting duplicates receive distinct
  treatment.
- Neutral, because implementations may still expose richer local diagnostic details
  outside the portable fixture category.
- Bad, because some detailed parser failures collapse into broader categories.
- Bad, because future fixture needs may require adding categories through another
  normative decision.

## Confirmation

- Verify that `external-dependency-validation-case.schema.json` enumerates the eight
  failure categories in this decision.
- Verify that fixtures use `duplicate-external-dependency` for equivalent duplicate
  declarations and `conflicting-external-dependency` for same-key declarations with
  different constraints.
- Verify that Package URL parser-specific errors map to
  `invalid-external-dependency-purl` unless the volume-purl category applies.
- Verify that VERS parser-specific errors map to
  `invalid-external-dependency-constraint` unless the type-mismatch category
  applies.
- Verify that implementations may report richer local detail without changing the
  portable fixture category.

## Pros and Cons of the Options

### A — Use a minimal consolidated category set

- Good, because the vocabulary is small and easy to maintain.
- Good, because fixture authors have fewer categories to choose from.
- Bad, because Package URL, VERS, component reference, and duplicate failures become
  hard to distinguish in conformance reports.
- Bad, because the fixture family would document less semantic behavior.

### B — Use medium-granularity categories for the core validation axes

- Good, because each major validation boundary has a portable category.
- Good, because the category set remains small enough for v0.1.
- Good, because it mirrors the style of existing validation fixtures without
  becoming a parser error taxonomy.
- Good, because duplicate and conflicting duplicate cases are distinct.
- Neutral, because some implementation-specific details remain outside the portable
  category.
- Bad, because future profiles may need more categories.

### C — Use highly detailed parser and validation categories

- Good, because diagnostics can be very precise.
- Good, because fixture failures can identify exact parser or authoring problems.
- Bad, because Package URL and VERS upstream parser behavior may not expose the same
  taxonomy in every language.
- Bad, because Agent Volumes would effectively maintain a shadow error taxonomy for
  upstream standards.
- Bad, because v0.1 conformance would become larger and more brittle.

### D — Use medium-granularity categories plus optional detail codes

- Good, because the portable category remains stable while richer details can be
  represented.
- Good, because implementations could preserve upstream parser-specific error
  information.
- Neutral, because it may be useful in a future diagnostic profile.
- Bad, because optional detail codes add schema complexity before there is a clear
  interoperability need.
- Bad, because non-portable detail values may create false expectations in
  conformance reports.

### E — Avoid failure categories and rely only on `expected.valid` plus prose case names

- Good, because it avoids taxonomy design.
- Good, because implementations can choose their own diagnostics.
- Bad, because conformance results become less machine-readable.
- Bad, because it diverges from existing validation fixture patterns that use
  `failureCategory`.
- Bad, because fixture case names become the only portable failure explanation.

## More Information

Follow-up work should decide:

- exact fixture cases covering each category
- whether successful cases should include expected canonical Package URLs or
  normalized semantic keys
- whether a future diagnostic profile should add optional local detail fields
