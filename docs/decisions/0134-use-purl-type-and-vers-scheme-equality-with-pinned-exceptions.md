---
status: accepted
date: 12026-05-14
decision-makers: Yunseo Kim
---

# Use PURL type and VERS scheme equality with pinned exceptions

## Context and Problem Statement

ADR-0113 chooses VERS as the version constraint grammar for
`[[external-dependencies]]` and requires the VERS scheme to be compatible with the
package ecosystem identified by the dependency PURL type. ADR-0122 defines
`external-dependency-constraint-type-mismatch` as a validation failure category.
ADR-0133 defines the declaration-plane PURL shape, including qualifier support and
the exclusion of PURL `@version` and subpath.

Those decisions leave a compatibility question: **how should validators decide
whether an external dependency PURL type and VERS scheme are compatible?**

## Decision Drivers

- PURL type and VERS scheme compatibility must be deterministic for conformance.
- The baseline should be simple enough for v0.1 implementations.
- Some ecosystems may need aliases, renames, or type/scheme mappings that are not
  strict string equality.
- Compatibility exceptions should not become implementation-defined local policy.
- Agent Volumes should rely on pinned upstream baselines where upstream projects own
  the relevant terminology.
- The validation rule should remain separate from version range evaluation and
  resolved evidence.

## Considered Options

- A — Require exact equality between PURL type and VERS scheme for all external
  dependency declarations.
- B — Use exact equality by default and allow only exceptions defined by pinned
  upstream baselines or an Agent Volumes compatibility table.
- C — Delegate compatibility entirely to upstream Package URL and VERS libraries.
- D — Allow implementations to define their own compatibility mappings.
- E — Do not validate PURL type and VERS scheme compatibility in v0.1.

## Decision Outcome

Chosen option: **B — Use exact equality by default and allow only exceptions
defined by pinned upstream baselines or an Agent Volumes compatibility table**,
because it gives v0.1 implementations a simple deterministic rule while leaving a
controlled path for ecosystem-specific compatibility exceptions.

Under this decision:

- By default, an external dependency declaration is type-compatible only when the
  PURL type equals the VERS scheme after applying their respective canonicalization
  rules from the pinned baselines.
- A non-equal PURL type and VERS scheme pair is valid only if the pair is listed in
  a pinned upstream baseline or an Agent Volumes-maintained compatibility table.
- If no pinned exception applies, validators must report
  `external-dependency-constraint-type-mismatch`.
- Compatibility exceptions must be finite, reviewable, and versioned with the
  relevant Agent Volumes draft or profile.
- Implementations must not add local compatibility aliases and still claim portable
  v0.1 conformance for those declarations.
- This decision does not require validators to solve version ranges or prove that a
  specific package version satisfies the VERS constraint.

## Consequences

- Good, because the common case is easy to implement and explain: `pkg:npm/...`
  pairs with `vers:npm/...`, `pkg:pypi/...` with `vers:pypi/...`, and so on.
- Good, because compatibility behavior is deterministic for conformance fixtures.
- Good, because controlled exceptions can support ecosystems where equality is too
  strict.
- Good, because local implementation aliases cannot silently change validation
  results.
- Neutral, because the repository needs a place to publish compatibility exception
  data when exceptions are needed.
- Neutral, because pinned upstream baselines must be reviewed when Package URL or
  VERS terminology changes.
- Bad, because exact equality may reject some real-world declarations until an
  exception is standardized.
- Bad, because Agent Volumes may need to maintain a small compatibility table over
  time.

## Confirmation

- Verify that draft 6 prose states exact PURL type / VERS scheme equality as the
  default compatibility rule.
- Verify that non-equal pairs are accepted only through pinned upstream baselines or
  an Agent Volumes compatibility table.
- Verify that implementation-defined aliases are not portable v0.1 conformance.
- Verify that mismatches without an exception use
  `external-dependency-constraint-type-mismatch`.
- Verify that conformance fixtures include equality success cases, mismatch failure
  cases, and at least one table-driven exception case if an exception table exists.

## Pros and Cons of the Options

### A — Require exact equality between PURL type and VERS scheme for all external dependency declarations

- Good, because it is the simplest deterministic rule.
- Good, because fixtures are easy to write and implementations are easy to test.
- Bad, because it cannot support legitimate ecosystem aliases or naming differences.
- Bad, because any future non-equal compatibility case would require reopening the
  rule rather than adding table data.

### B — Use exact equality by default and allow only exceptions defined by pinned upstream baselines or an Agent Volumes compatibility table

- Good, because the default remains simple and portable.
- Good, because exceptions are explicit, finite, reviewable, and versioned.
- Good, because compatibility can evolve without becoming implementation-defined.
- Neutral, because exception data requires maintenance.
- Bad, because declarations that need new exceptions remain invalid until the table
  or pinned baseline is updated.

### C — Delegate compatibility entirely to upstream Package URL and VERS libraries

- Good, because Agent Volumes avoids owning compatibility logic.
- Good, because specialized libraries may track ecosystem behavior quickly.
- Bad, because different libraries may disagree.
- Bad, because conformance outcomes depend on library choice rather than the Agent
  Volumes compatibility baseline.

### D — Allow implementations to define their own compatibility mappings

- Good, because implementations can support local ecosystem needs immediately.
- Good, because no central compatibility table is needed.
- Bad, because validation becomes non-portable.
- Bad, because the same declaration may pass one conforming implementation and fail
  another.
- Bad, because policy and advisory tooling cannot rely on stable compatibility
  semantics.

### E — Do not validate PURL type and VERS scheme compatibility in v0.1

- Good, because it avoids false negatives while Package URL and VERS integrations
  mature.
- Good, because validators need fewer dependencies.
- Bad, because declarations like `pkg:pypi/foo` with `vers:npm/...` become
  structurally valid despite being semantically incoherent.
- Bad, because ADR-0113 and ADR-0122 already require a type mismatch diagnostic.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- VERS defines a normative compatibility mapping to Package URL types that differs
  from exact equality by default.
- Package URL type names and VERS scheme names diverge widely enough that equality
  creates too many false negatives.
- Maintaining an Agent Volumes compatibility table becomes too burdensome or
  controversial.
- Implementations demonstrate that a library-defined compatibility baseline can be
  made deterministic across languages.

## More Information

Follow-up work should decide:

- where the Agent Volumes compatibility table is published if non-equal exceptions
  are needed
- whether the table belongs in the upstream baseline manifest, a separate
  machine-readable artifact, or prose plus fixtures
- exact conformance fixtures for equality, mismatch, and exception behavior
- diagnostic wording for type/scheme mismatch failures
