---
status: accepted
date: 12026-05-09
decision-makers: Yunseo Kim
---

# Adopt a constrained npm-like SemVer range grammar for v0.1

## Context and Problem Statement

ADR-0019 establishes version constraint interpretation as part of the minimal
v0.1 resolver contract, while keeping full solving behavior and lockfile format
outside the core. ADR-0093 keeps prerelease-selection policy client-local, and
ADR-0097 adopts a Cargo-style version index row model while deferring the
SemVer range grammar itself.

The draft specification already requires volume versions to follow SemVer and
uses dependency constraint examples such as `^2.0.0` and `>=1.5.0, <3.0.0`.
However, it does not yet define which range expressions independent clients and
bibliothecas must parse in the portable v0.1 baseline.

That leaves a grammar question: **which SemVer range syntax should v0.1
standardize so dependency declarations and version index rows are interoperable,
without importing a full package-manager solver grammar?**

## Decision Drivers

- Preserve existing draft and fixture examples that already use caret ranges over
  full SemVer operands
- Provide enough syntax for common compatibility and bounded-range constraints
- Keep the portable grammar small enough for independent client and bibliotheca
  implementations to parse consistently
- Avoid importing the full npm range language, including OR expressions,
  wildcards, partial versions, and hyphen ranges
- Keep prerelease candidate-selection behavior aligned with ADR-0093's
  client-local deferral
- Keep lockfile format, update workflow, and full solver behavior outside this
  decision

## Considered Options

- Adopt the full npm/node-semver range grammar
- Adopt a constrained npm-like subset with exact versions, caret, tilde,
  comparators, and conjunction
- Adopt Cargo-style requirements including implicit caret defaults, wildcards,
  and tilde
- Adopt a minimal comparator-only grammar
- Adopt exact-only constraints with client-local extension syntax
- Leave the grammar bibliotheca-local in v0.1

## Decision Outcome

Chosen option: **Adopt a constrained npm-like subset with exact versions,
caret, tilde, comparators, and conjunction**, because it preserves the draft's
existing caret examples, adds the common tilde shorthand without taking on the
full npm grammar, and remains straightforward to desugar into comparator sets for
resolver and conformance behavior. Existing partial-version examples such as
`^1.0` should be normalized to full SemVer operands rather than expanding the
portable grammar to include partial versions.

Under this decision, the portable v0.1 SemVer range grammar includes:

- exact full SemVer version operands, such as `1.2.3`
- caret ranges over full SemVer operands, such as `^1.2.3`
- tilde ranges over full SemVer operands, such as `~1.2.3`
- comparator terms using `<`, `<=`, `>`, `>=`, or `=` with full SemVer operands
- comma conjunction and whitespace conjunction, such as `>=1.5.0, <3.0.0`

Under this decision, the portable v0.1 SemVer range grammar excludes:

- OR/disjunction syntax such as `||`
- wildcard and partial-version syntax such as `*`, `1.x`, `1.*`, `1`, or
  `1.2`
- hyphen ranges such as `1.0.0 - 2.0.0`
- npm aliases or tags such as `latest`
- registry-specific selector syntax, channels, tracks, or dist-tags
- build metadata in range operands, such as `1.2.3+build.1`
- lockfile pinning syntax, update policy syntax, or source-priority syntax

Full SemVer operands in this decision are three-component SemVer versions with
optional prerelease identifiers and without build metadata. Build metadata may
remain valid where the specification separately allows SemVer version strings,
but it is not part of the portable v0.1 range operand grammar.

For desugaring and comparison:

- `=1.2.3` is equivalent to the exact version range `1.2.3`
- `^X.Y.Z` means versions greater than or equal to `X.Y.Z` and less than the
  next breaking boundary according to SemVer-compatible caret semantics
- `~X.Y.Z` means versions greater than or equal to `X.Y.Z` and less than
  `X.(Y + 1).0`
- multiple comparator terms joined by comma and/or whitespace are interpreted as
  logical AND

This decision defines the portable syntax and its stable-version comparator
meaning. It does not define one universal prerelease candidate-selection policy.
Clients MAY parse prerelease operands as valid SemVer operands, but whether
prerelease candidates are selected during resolution remains client-local under
ADR-0093 unless a later decision changes that policy.

This decision governs manifest dependency constraints and resolver-facing
version index row constraints. It does not define lockfile serialization,
lockfile precedence, registry priority, update workflow UX, or a full
backtracking/version-selection algorithm.

## Consequences

- Good, because the draft's existing full-SemVer caret examples remain valid
- Good, because common dependency constraints can be written compactly without
  requiring the full npm range grammar
- Good, because caret and tilde ranges can be desugared into comparator sets for
  conformance fixtures
- Good, because full SemVer operands avoid partial-version ambiguity such as
  `^1.0` or `~1.2`
- Good, because excluding OR, wildcards, tags, and hyphen ranges keeps parser and
  fixture scope bounded
- Neutral, because implementations that already embed full npm/node-semver
  parsers must reject grammar accepted by those parsers but outside this subset
- Neutral, because prerelease syntax may be parsed even though prerelease
  selection remains client-local
- Bad, because the subset is not fully compatible with npm, Cargo, Composer, or
  any other ecosystem's complete range language
- Bad, because excluding partial versions requires existing partial examples such
  as `^1.0` to be normalized to full SemVer operands such as `^1.0.0`

## Confirmation

- Verify that dependency examples using `^` with full SemVer operands remain
  valid under the chosen grammar
- Verify that partial dependency examples such as `^1.0` are updated or treated
  as rejected portable-baseline inputs
- Verify that the specification defines exact, caret, tilde, comparator, and
  conjunction syntax without implying full npm range compatibility
- Verify that conformance fixtures include accepted and rejected range strings
  for the portable subset
- Verify that partial versions, wildcards, OR expressions, hyphen ranges, tags,
  and build metadata in range operands are rejected by portable-baseline tests
- Verify that prerelease-selection behavior remains marked as client-local under
  ADR-0093
- Verify that ADR-0097 version index rows can carry constraints using this
  grammar without requiring one physical index layout or full solver algorithm
- Verify that lockfile format and registry priority remain out of scope

## Pros and Cons of the Options

### Adopt the full npm/node-semver range grammar

- Good, because it is familiar to many implementers
- Good, because it supports a wide range of concise expressions including OR,
  wildcards, partial versions, hyphen ranges, caret, and tilde
- Neutral, because implementations could delegate parsing to existing libraries
  in some environments
- Bad, because it imports many edge cases that v0.1 does not otherwise need
- Bad, because it increases conformance fixture size and parser compatibility
  burden
- Bad, because npm-specific behavior may be surprising in a runtime-neutral
  standard

### Adopt a constrained npm-like subset with exact versions, caret, tilde, comparators, and conjunction

- Good, because it preserves current draft usage of caret ranges
- Good, because it includes the two most common SemVer shorthand operators while
  avoiding the rest of npm's broad grammar
- Good, because every included shorthand can be mapped to comparator-set
  semantics for testing
- Good, because full SemVer operands keep the grammar explicit and avoid
  partial-version ambiguity
- Neutral, because this is a custom subset and must be documented clearly rather
  than described as full npm compatibility
- Bad, because clients using off-the-shelf full parsers must add an additional
  subset validation layer

### Adopt Cargo-style requirements including implicit caret defaults, wildcards, and tilde

- Good, because it aligns conceptually with the Cargo-style version index row
  model adopted in ADR-0097
- Good, because Cargo's default version requirements are ergonomic for package
  authors
- Neutral, because Cargo-style syntax is well understood in one mature ecosystem
- Bad, because implicit caret defaults for bare versions would make `1.2.3`
  mean a range rather than exact `1.2.3`
- Bad, because wildcards and partial versions would expand the grammar beyond the
  desired v0.1 baseline

### Adopt a minimal comparator-only grammar

- Good, because it is the smallest expressive range algebra needed for bounded
  constraints
- Good, because it is easy to parse and test
- Neutral, because caret and tilde can both be written as explicit comparator
  ranges
- Bad, because it would invalidate or require rewriting current draft examples
  that already use caret ranges
- Bad, because common compatibility constraints become more verbose for authors

### Adopt exact-only constraints with client-local extension syntax

- Good, because the portable baseline would be extremely small
- Good, because it would avoid early commitment to any range shorthand
- Neutral, because clients could still experiment locally
- Bad, because it is too weak for practical dependency resolution
- Bad, because it would make the standard less useful for interoperable resolver
  conformance

### Leave the grammar bibliotheca-local in v0.1

- Good, because it avoids choosing a grammar before implementation experience
  accumulates
- Good, because each bibliotheca could preserve familiar local syntax
- Neutral, because a later version could still standardize a grammar
- Bad, because independent clients and bibliothecas would diverge on basic
  dependency constraint interpretation
- Bad, because resolver conformance fixtures would not be portable
