---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Use purl, purpose, and scope as the external dependency uniqueness key

## Context and Problem Statement

ADR-0109 establishes external non-volume package declarations as machine-readable
audit metadata. ADR-0110 chooses `[[external-dependencies]]` as the TOML shape and
explicitly leaves duplicate detection and uniqueness semantics to semantic
validation rather than TOML map key uniqueness. ADR-0111 requires `purl`,
`constraint`, and `purpose`. ADR-0112 defines the `purpose` vocabulary. ADR-0113
defines `constraint` as a VERS-compatible range expression.

Because `[[external-dependencies]]` is an array of records, the manifest can
syntactically contain multiple records for the same external package. The remaining
question is: **which fields identify a unique external dependency declaration, and
when should repeated records be treated as duplicate or conflicting declarations?**

The rule must preserve the audit value of declarations for the same package used in
different ways while avoiding ambiguous repeated rows that force policy, advisory,
and SBOM tooling to guess which declaration is authoritative.

## Decision Drivers

- External dependency declarations are audit metadata, not native package-manager
  dependency solver inputs.
- `purpose` carries dependency use context and should affect how warning, policy,
  advisory, and SBOM tooling interpret a declaration.
- Component scoping is expected to be decided separately and should fit naturally
  into the uniqueness model.
- `constraint` is VERS-based audit range metadata and should not by itself create
  multiple independent declarations for the same package use context.
- Duplicate detection should use canonical package identity rather than raw string
  comparison where Package URL canonicalization is available.
- Ambiguous repeated declarations should fail semantic validation rather than being
  silently merged or deduplicated.

## Considered Options

- A — Use `purl` alone as the uniqueness key.
- B — Use `(purl, purpose)` as the uniqueness key.
- C — Use `(purl, constraint, purpose)` as the uniqueness key.
- D — Use `(canonical purl, purpose, scope)` as the uniqueness key.
- E — Allow duplicate declarations and only emit warnings.

## Decision Outcome

Chosen option: **D — Use `(canonical purl, purpose, scope)` as the uniqueness key**,
because this preserves distinct declared use contexts and future component scoping
without allowing constraint-only duplication to fragment audit metadata.

Under this decision:

- Each external dependency declaration is uniquely identified by the tuple
  `(canonical purl, purpose, scope)`.
- `canonical purl` is the parsed and canonicalized Package URL identity for the
  external package.
- `purpose` is the dependency use context defined by ADR-0112.
- `scope` is the declaration scope defined by the external dependency scoping model.
- Two records with the same `(canonical purl, purpose, scope)` are duplicate
  declarations and must fail semantic validation.
- Two records with the same `(canonical purl, purpose, scope)` but different VERS
  `constraint` values are conflicting duplicate declarations and must fail semantic
  validation rather than being merged, intersected, or silently preferred.
- The same `canonical purl` may appear in multiple records when `purpose` or `scope`
  differs.
- Validators, clients, and bibliothecas must not rely on raw TOML row order to
  decide which duplicate declaration wins.

This decision does not define the concrete syntax for component scoping. It only
establishes that scoping participates in declaration identity once the scoping model
is defined.

This decision also does not require clients to resolve or install external
packages, and it does not change the declaration-only boundary established by
ADR-0109 and ADR-0113.

Example of distinct declarations for the same package in different use contexts:

```toml
[[external-dependencies]]
purl = "pkg:npm/@modelcontextprotocol/sdk"
constraint = "vers:npm/>=1.12.0|<2.0.0"
purpose = "runtime"

[[external-dependencies]]
purl = "pkg:npm/@modelcontextprotocol/sdk"
constraint = "vers:npm/>=1.12.0|<2.0.0"
purpose = "development"
```

These records are distinct because `purpose` differs. A future scoping model may
similarly allow distinct declarations for different component scopes.

## Consequences

- Good, because duplicate handling becomes deterministic and testable through
  semantic validation.
- Good, because the same package can be declared for different dependency use
  contexts without collapsing those contexts into one row.
- Good, because future component scoping can extend the same identity tuple instead
  of replacing the baseline duplicate rule.
- Good, because conflicting VERS constraints for the same package, purpose, and
  scope cannot be silently merged or ignored.
- Good, because SBOM, advisory, warning, and policy tooling can group by package
  identity while preserving purpose and scope relationships.
- Neutral, because validators need Package URL canonicalization before comparing
  declaration keys.
- Neutral, because VERS constraint normalization may still be useful for diagnostics
  but is not part of the uniqueness key.
- Bad, because authors cannot express multiple alternative constraints for the same
  package, purpose, and scope in separate rows.
- Bad, because a later scoping model must define `scope` precisely enough for
  validators to compare declaration keys.
- Bad, because tooling must distinguish exact duplicate rows from conflicting
  duplicate rows to produce useful diagnostics.

## Confirmation

- Verify that future prose and schema-adjacent semantic validation define
  `(canonical purl, purpose, scope)` as the external dependency uniqueness key.
- Verify that duplicate declarations with the same tuple fail semantic validation.
- Verify that duplicate declarations with the same tuple and different VERS
  constraints are reported as conflicts, not merged.
- Verify that examples allow the same package to appear more than once when purpose
  or scope differs.
- Verify that conformance fixtures include exact duplicate, conflicting duplicate,
  different-purpose, and different-scope cases.
- Verify that raw string differences that canonicalize to the same Package URL do
  not bypass duplicate detection.

## Pros and Cons of the Options

### A — Use `purl` alone as the uniqueness key

- Good, because it is the simplest rule to validate and explain.
- Good, because each external package appears at most once in the declaration set.
- Bad, because it cannot represent the same package used for different purposes
  without adding a separate multi-purpose field.
- Bad, because it does not fit future component scoping well.
- Bad, because it collapses audit contexts that policy and SBOM tooling may need to
  preserve.

### B — Use `(purl, purpose)` as the uniqueness key

- Good, because it preserves dependency use context with the fields already defined
  by ADR-0111 and ADR-0112.
- Good, because it matches common package-manager patterns where the same package
  can appear in runtime, development, build, test, or optional scopes.
- Neutral, because it is a practical baseline if component scoping is never added.
- Bad, because a later component scoping model would need to extend or revise the
  key.
- Bad, because the model is less explicit about how component-level declarations
  remain distinct.

### C — Use `(purl, constraint, purpose)` as the uniqueness key

- Good, because it preserves every distinct range declaration as a separate record.
- Good, because it can represent multiple audit claims for the same package and
  purpose.
- Bad, because constraint-only differences can fragment one logical dependency use
  context into several rows.
- Bad, because advisory, warning, policy, and SBOM tooling must decide how to handle
  conflicting constraints for the same package and purpose.
- Bad, because it encourages silent coexistence of declarations that are better
  treated as conflicts.

### D — Use `(canonical purl, purpose, scope)` as the uniqueness key

- Good, because it preserves package identity, dependency use context, and
  declaration scope as separate axes.
- Good, because it aligns with the expectation that component scoping will be
  defined separately.
- Good, because it treats conflicting constraints in the same use context as
  semantic validation failures.
- Good, because it gives SBOM and advisory tooling stable grouping keys while
  preserving useful context.
- Neutral, because it requires canonical Package URL comparison and a defined scope
  model.
- Bad, because it is more complex than purl-only or purl-plus-purpose uniqueness.

### E — Allow duplicate declarations and only emit warnings

- Good, because it is permissive for hand-authored manifests and unusual ecosystem
  patterns.
- Good, because it avoids rejecting manifests before all downstream policy tools are
  mature.
- Bad, because policy, advisory, warning, and SBOM tooling must resolve ambiguity
  locally.
- Bad, because duplicate rows can hide drift or conflicting audit claims.
- Bad, because the repository generally prefers deterministic semantic validation
  over warning-only handling for duplicate identity conflicts.

## More Information

Follow-up work should decide:

- the concrete external dependency scope syntax and its relationship to components
- the exact diagnostic names for exact duplicates versus conflicting duplicates
- whether VERS-equivalent constraints with different textual forms produce warnings
  or are treated as distinct only for diagnostics
- how duplicate and conflict cases are represented in conformance fixtures
- how SBOM and advisory mappings group multiple purpose or scope records for the
  same external package
