---
status: accepted
date: 12026-05-16
decision-makers: Yunseo Kim
---

# Use scheme-specific VERS intersection for potential exposure

## Context and Problem Statement

ADR-0113 chooses VERS as the external dependency `constraint` language. ADR-0135
then defines an external dependency advisory match as a declaration-only potential
exposure diagnostic when a declaration's package identity and VERS constraint
intersect an advisory's affected package and affected VERS range. ADR-0138 carries
that result as the structured warning category
`external-dependency-potential-exposure` with dedicated offline conformance
fixtures.

Those decisions leave the matching algorithm open: **how should a validator decide
whether a declared external dependency VERS constraint intersects a normalized
external advisory affected VERS range?**

VERS provides a shared syntax, canonicalization rules, and version-scheme dispatch,
but range satisfiability still depends on the version scheme's ordering,
comparison, and prerelease rules. Draft 6 needs portable warning determinism
without turning the v0.1 baseline into a universal package-manager range solver.

## Decision Drivers

- Potential-exposure warnings should be deterministic for the same normalized PURL
  and VERS advisory-match inputs.
- VERS normalization is necessary but not sufficient to prove that two ranges
  overlap.
- Agent Volumes should use version-scheme semantics rather than inventing local
  range ordering rules for npm, PyPI, Cargo, RubyGems, or other ecosystems.
- Unsupported or ambiguous schemes should not be silently treated as either exposed
  or safe.
- The result model should preserve ADR-0135's declaration-only boundary and avoid
  implying confirmed vulnerability or resolved evidence.
- The fixture model should be able to cover positive matches, negative matches, and
  explicitly indeterminate cases offline.

## Considered Options

- A — Delegate intersection entirely to upstream VERS implementations.
- B — Use scheme-specific VERS-compatible evaluators and return a three-state
  result.
- C — Define a finite conformance matrix and leave edge cases outside the portable
  baseline.
- D — Emit potential exposure whenever a match cannot be disproven.
- E — Emit potential exposure only when a match can be proven.
- F — Leave intersection behavior to local policy.

## Decision Outcome

Chosen option: **B — Use scheme-specific VERS-compatible evaluators and return a
three-state result**, because it keeps the warning decision tied to ecosystem
version semantics while making ambiguous cases explicit instead of silently
collapsing them into exposure or safety.

Under this decision, external dependency potential-exposure matching uses this
pipeline:

1. Parse and canonicalize the declared dependency PURL and advisory affected PURL.
2. Parse and validate the declared dependency `constraint` and advisory
   `affectedRange` as VERS expressions.
3. Confirm that the PURL type and VERS scheme are compatible under ADR-0134 and the
   pinned compatibility exception artifact from ADR-0144.
4. Normalize both VERS expressions using the pinned VERS baseline.
5. Evaluate range intersection using the VERS scheme's pinned, VERS-compatible
   evaluator.
6. Produce one of these portable matching results:
   - `intersects`
   - `does-not-intersect`
   - `indeterminate`

`intersects` means the declaration constraint and advisory affected range share at
least one version under the applicable version-scheme semantics.

`does-not-intersect` means the applicable version-scheme semantics prove that no
version can satisfy both ranges.

`indeterminate` means the validator cannot portably prove either result. Reasons may
include an unsupported version scheme, unavailable evaluator, ambiguous range form,
unsupported comparator, compatibility-exception ambiguity, malformed normalized
advisory-match input that is not otherwise rejected, or a scheme-specific evaluator
error.

Only `intersects` produces the portable warning category
`external-dependency-potential-exposure`.

`does-not-intersect` produces no potential-exposure warning.

`indeterminate` does not produce `external-dependency-potential-exposure` by itself.
Draft 6 artifacts may represent it as a separate diagnostic, warning category, or
fixture expectation so clients can surface uncertainty without labeling it as a
known potential exposure. Local policy may block, warn, escalate, suppress, or
review indeterminate results, but those outcomes are not portable v0.1 trust facts.

## Validation Model

The v0.1 portable conformance surface should include offline potential-exposure
fixtures that cover at least:

- matching PURL and intersecting VERS ranges, producing `intersects` and
  `external-dependency-potential-exposure`
- matching PURL and disjoint VERS ranges, producing `does-not-intersect` and no
  potential-exposure warning
- non-matching PURL, producing no potential-exposure warning before VERS
  intersection evaluation
- unsupported or ambiguous version scheme, producing `indeterminate`
- invalid PURL, invalid VERS syntax, or incompatible PURL type/VERS scheme,
  producing the appropriate validation failure rather than an `indeterminate`
  matching result
- component-scoped declarations, preserving component scope as explanatory warning
  context only

The initial draft 6 fixture subset may cover a limited set of pinned schemes. Adding
new schemes or evaluator behavior should update the upstream baseline manifest and
conformance fixtures in lockstep.

## Consequences

- Good, because warning emission is tied to the same scheme-specific semantics that
  package ecosystems use for version ordering and range membership.
- Good, because unsupported or ambiguous cases are explicit rather than silently
  treated as safe or exposed.
- Good, because the model can test deterministic positive and negative cases without
  requiring a live advisory feed or registry diagnostic API.
- Good, because the model preserves ADR-0135's distinction between declaration-only
  potential exposure and confirmed vulnerability evidence.
- Neutral, because implementers need access to pinned VERS-compatible evaluators for
  the schemes covered by portable fixtures.
- Neutral, because draft 6 needs a representation for `indeterminate` results if it
  wants conformance to assert them directly.
- Bad, because the model is more complex than a boolean intersects / does-not-
  intersect rule.
- Bad, because scheme-specific evaluators and fixture coverage may evolve at
  different speeds across ecosystems.

## Confirmation

- Verify that draft 6 prose defines VERS intersection as a scheme-specific semantic
  operation after PURL/VERS parsing, compatibility checking, and VERS normalization.
- Verify that `external-dependency-potential-exposure` is emitted only for
  `intersects` results.
- Verify that disjoint ranges produce no potential-exposure warning.
- Verify that unsupported or ambiguous matching produces an explicit indeterminate
  result rather than a false positive or false negative.
- Verify that invalid declaration or advisory-match inputs use validation failure
  categories rather than the `indeterminate` matching result.
- Verify that conformance fixtures include positive, negative, and indeterminate
  matching cases for the supported draft 6 scheme subset.

## Pros and Cons of the Options

### A — Delegate intersection entirely to upstream VERS implementations

- Good, because Agent Volumes would avoid defining range satisfiability rules.
- Good, because upstream VERS behavior could improve independently.
- Bad, because VERS normalization alone does not guarantee portable intersection
  semantics across all version schemes.
- Bad, because upstream ambiguity or behavior changes could change warning emission.

### B — Use scheme-specific evaluators and return a three-state result

- Good, because it aligns matching with ecosystem version semantics while preserving
  deterministic portable outputs.
- Good, because ambiguous cases are visible to fixtures and local policy.
- Neutral, because it requires pinned evaluator behavior for every portable scheme.
- Bad, because it adds one more matching result state and associated documentation.

### C — Define a finite conformance matrix only

- Good, because it keeps the v0.1 baseline small and fixture-driven.
- Good, because it avoids overcommitting to a universal solver.
- Bad, because behavior outside the fixture subset remains unclear for implementers.
- Bad, because clients may diverge on real-world advisory inputs not covered by
  fixtures.

### D — Emit potential exposure whenever a match cannot be disproven

- Good, because it minimizes false negatives in security-sensitive agentic AI
  workflows.
- Good, because it gives clients a conservative fallback.
- Bad, because it can create excessive false positives for unsupported or ambiguous
  ranges.
- Bad, because it can make potential exposure warnings feel less actionable.

### E — Emit potential exposure only when a match can be proven

- Good, because it keeps warning precision high.
- Good, because unsupported schemes do not create noisy warnings.
- Bad, because unsupported or ambiguous schemes can hide real exposure.
- Bad, because silence may be misread as safety.

### F — Leave intersection behavior to local policy

- Good, because implementations can choose their own risk posture.
- Bad, because the same declaration and advisory input could produce different
  portable warning outcomes.
- Bad, because conformance could not verify potential-exposure behavior
  deterministically.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- VERS standardizes a complete cross-scheme range intersection algorithm that Agent
  Volumes can reference directly.
- The portable fixture subset becomes too small to be useful for real advisory
  matching.
- Implementers consistently treat `indeterminate` as equivalent to either exposure
  or safety, making the third state ineffective.
- A future resolved-evidence profile changes the matching model for confirmed
  external dependency findings.

## More Information

ADR-0113 selects VERS for external dependency constraints. ADR-0129 uses normalized
VERS equality for duplicate/conflict classification but does not define general
range intersection. ADR-0134 and ADR-0144 define PURL type/VERS scheme
compatibility. ADR-0135 defines the potential-exposure semantics, and ADR-0138
defines the portable warning and fixture carriers.
