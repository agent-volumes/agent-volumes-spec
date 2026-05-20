---
status: accepted
date: 12026-05-14
decision-makers: Yunseo Kim
---

# Use normalized VERS constraint comparison for external dependencies

## Context and Problem Statement

ADR-0114 defines `(canonical purl, purpose, scope)` as the external dependency
semantic key. Declarations with the same semantic key are invalid duplicates, and
declarations with the same semantic key but different constraints are conflicting
duplicates. ADR-0122 then distinguishes `duplicate-external-dependency` from
`conflicting-external-dependency` failure categories.

Those decisions intentionally left one comparison question open: **when two
declarations have the same semantic key, how should validators decide whether their
VERS `constraint` values are equivalent duplicates or conflicting declarations?**

This decision only governs duplicate and conflict classification for already parsed
external dependency declarations. It does not make `constraint` part of the semantic
key, and it does not require successful fixture outputs to expose normalized VERS
strings as part of `expected.semanticKeys`.

## Decision Drivers

- Duplicate and conflict detection should not be bypassed by harmless VERS spelling
  or formatting differences.
- Agent Volumes should rely on upstream Package URL and VERS artifacts instead of
  inventing local range semantics.
- The v0.1 validator should avoid becoming an ecosystem-specific range solver for
  npm, PyPI, Cargo, RubyGems, or other native package ecosystems.
- Failure categories should remain deterministic and portable across conforming
  implementations.
- Constraint comparison should stay separate from the semantic key fields reported
  in successful conformance cases.

## Considered Options

- A — Treat only byte-identical VERS strings as equivalent constraints.
- B — Treat upstream-normalized VERS strings as equivalent constraints.
- C — Evaluate full semantic range equivalence independent of normalized string
  equality.
- D — Treat all same-key repeated declarations as duplicates and never distinguish
  conflicting constraints.
- E — Leave constraint equivalence implementation-defined.

## Decision Outcome

Chosen option: **B — Treat upstream-normalized VERS strings as equivalent
constraints**, because VERS exists to provide a shared version-range grammar across
otherwise fragmented ecosystem-specific range syntaxes. For v0.1 duplicate and
conflict classification, normalized VERS string equality is treated as the portable
semantic-equivalence boundary.

Under this decision, semantic validation should compare constraints for declarations
with the same `(canonical purl, purpose, scope)` as follows:

1. Parse and validate each `constraint` as a VERS expression.
2. Use a VERS-compatible upstream parser or normalizer to produce the normalized VERS
   string used for comparison, applying the relevant version-scheme normalization
   rules.
3. If the normalized VERS strings are equal, report the repeated declarations as
   `duplicate-external-dependency`.
4. If the normalized VERS strings are not equal, report the repeated declarations as
   `conflicting-external-dependency`.

This makes byte-identical strings a sufficient but not necessary condition for
duplicate classification. It also means validators should not treat small,
normalizable VERS syntax differences as distinct constraints or as conflicts.
VERS round-tripping does not need to preserve the exact authored string; the
comparison target is the normalized equivalent expression, not the original text.

For v0.1, Agent Volumes treats normalized VERS string equality as equivalent to
portable range equivalence. Validators are not required to prove semantic equivalence
between two different normalized VERS strings. If two constraints normalize to
different VERS strings, they are conflicting for the purposes of Agent Volumes
external dependency validation, even if a local ecosystem-specific solver might later
consider their accepted version sets equivalent.

This decision refines ADR-0123 only for duplicate and conflict validation. Successful
`expected.semanticKeys` remain limited to `purl`, `purpose`, and `scope`; they do not
include normalized constraints unless a later ADR defines a richer normalized output
surface.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- VERS upstream artifacts do not provide stable normalization behavior sufficient for
  cross-language conformance.
- Multiple conforming implementations produce different normalized strings for the
  same valid VERS expression.
- VERS introduces a formal equivalence model that distinguishes normalized string
  equality from semantic range equivalence in a way Agent Volumes must preserve.
- External dependency conformance fixtures need to assert normalized VERS outputs
  directly rather than only failure categories.
- Implementation experience shows that normalized comparison is too heavy for the
  v0.1 declaration-plane validator.

If reopened, the follow-up ADR should evaluate byte-identical comparison,
fixture-pinned normalized outputs, a dedicated VERS equivalence test subset, or a
future diagnostic profile that exposes normalized constraints.

## Consequences

- Good, because normalizable VERS spelling differences cannot bypass duplicate
  detection.
- Good, because conflict classification aligns with VERS as the shared cross-
  ecosystem constraint grammar.
- Good, because Agent Volumes avoids maintaining its own range equivalence rules.
- Good, because conformance fixtures can distinguish duplicate and conflicting
  declarations more precisely.
- Neutral, because implementations need access to VERS-compatible parsing and
  normalization behavior before duplicate comparison.
- Neutral, because normalized constraints are used internally for validation but are
  not yet a successful-case output field.
- Bad, because validators have a stronger dependency on upstream VERS behavior than
  byte-identical comparison would require.
- Bad, because changes or ambiguity in VERS normalization can affect conformance
  results.

## Confirmation

- Verify that duplicate/conflict semantic validation compares normalized VERS
  strings for declarations with the same `(canonical purl, purpose, scope)`.
- Verify that same-key declarations with equivalent normalized constraints use
  `duplicate-external-dependency`.
- Verify that same-key declarations with different normalized constraints use
  `conflicting-external-dependency`.
- Verify that successful `expected.semanticKeys` do not add `constraint` or
  normalized VERS output fields under this decision.
- Verify that conformance fixture prose cites the pinned upstream VERS baseline used
  for parsing and normalization expectations.

## Pros and Cons of the Options

### A — Treat only byte-identical VERS strings as equivalent constraints

- Good, because it is simple, deterministic, and does not need a normalization step.
- Good, because validators can compare raw strings after parse validation.
- Bad, because harmless VERS spelling or formatting differences can evade duplicate
  detection.
- Bad, because semantically equivalent declarations may be misclassified as
  conflicts.
- Bad, because it underuses VERS as the common constraint grammar selected by
  ADR-0113.

### B — Treat upstream-normalized VERS strings as equivalent constraints

- Good, because it catches duplicate declarations despite normalizable syntax
  differences.
- Good, because it relies on upstream VERS behavior rather than local Agent Volumes
  range rules.
- Good, because it gives conformance fixtures a portable comparison boundary.
- Good, because normalized VERS string equality is close enough to semantic
  equivalence for the v0.1 declaration-plane use case.
- Neutral, because implementations need compatible VERS parser or normalizer support.
- Bad, because upstream normalization differences can affect validation outcomes.

### C — Evaluate full semantic range equivalence independent of normalized string equality

- Good, because it is the strongest mathematical interpretation of constraint
  equivalence.
- Good, because it could recognize equivalent ranges that normalize differently.
- Bad, because it requires range-solving behavior beyond the minimal declaration
  validator.
- Bad, because it risks reintroducing ecosystem-specific range semantics that VERS is
  intended to abstract.
- Bad, because it is likely too heavy and brittle for v0.1 conformance.

### D — Treat all same-key repeated declarations as duplicates and never distinguish conflicting constraints

- Good, because it avoids constraint comparison complexity.
- Good, because every same-key repeat is invalid regardless of constraint content.
- Bad, because it removes the useful distinction between exact duplicates and
  contradictory audit claims.
- Bad, because ADR-0122 already chooses separate duplicate and conflict categories.

### E — Leave constraint equivalence implementation-defined

- Good, because implementations can use whatever VERS libraries are available.
- Good, because the spec avoids relying on normalization behavior.
- Bad, because conformance results for duplicate and conflict cases become
  non-portable.
- Bad, because the same manifest could be duplicate-invalid in one implementation and
  conflict-invalid in another.
- Bad, because policy, advisory, and SBOM tooling lose deterministic validation
  behavior.

## More Information

Follow-up work should decide:

- exact fixture cases that demonstrate normalized-equivalent duplicate constraints
- whether fixture schemas need optional local detail fields for raw and normalized
  constraints
- how the upstream VERS baseline manifest identifies the parser or normalizer
  artifacts used for conformance expectations
- whether future mapping/export fixtures need normalized constraints outside the
  validation fixture family
