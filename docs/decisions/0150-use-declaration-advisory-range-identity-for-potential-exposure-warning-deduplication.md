---
status: accepted
date: 12026-05-16
decision-makers: Yunseo Kim
---

# Use declaration, advisory, and affected range identity for potential exposure warning deduplication

## Context and Problem Statement

ADR-0138 chooses `external-dependency-potential-exposure` as the structured warning
category for declaration-only external dependency advisory matches. ADR-0145 defines
a category-specific warning context schema approach. ADR-0147 defines that only an
`intersects` matching result emits `external-dependency-potential-exposure`; a
`does-not-intersect` result emits no warning, and `indeterminate` does not emit this
warning by itself.

Those decisions define the category and broad trigger, but they do not yet define
the warning counting unit. Given the same release metadata and normalized advisory
inputs, independent implementations need to emit the same number of portable
potential-exposure warnings with the same deduplication behavior.

The remaining question is: **which identity tuple determines one portable
`external-dependency-potential-exposure` warning?**

## Ecosystem Precedents Considered

The following ecosystem patterns informed this decision. They are precedents for
separating advisory identity, package identity, affected range, and location-like
context before deciding deduplication behavior.

| System                   | Observed identity or dedup axes                                                                             | Implication for Agent Volumes                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| OSV and OSV-Scanner      | Vulnerability identity, alias closure, package identity, version/range, and source path                     | Normalize advisory identity and aliases before warning deduplication; keep source/path-like context separate from identity     |
| GitHub Dependabot alerts | Alert identity, dependency package, manifest path, relationship, advisory identifiers, and vulnerable range | Treat actionable location as a distinct axis when it is part of the product model; do not conflate advisory ID with occurrence |
| npm audit                | Advisory identity, vulnerable versions, dependency path, patched status, and dependency-of/path context     | Include affected range in the finding identity when different affected ranges matter to the user                               |
| pip-audit                | Package name/version, vulnerability ID, aliases, and fix versions                                           | Alias-aware vulnerability identity can reduce duplicate findings even when source IDs differ                                   |
| cargo-audit              | RustSec advisory ID, package instance, and dependency tree context                                          | Dependency-tree or component context can explain a finding without necessarily multiplying the canonical warning count         |
| SARIF result management  | Rule/result identity, fingerprints, partial fingerprints, locations, and correlation IDs                    | Stable result comparison benefits from an explicit fingerprint-like identity tuple                                             |

These systems differ in details, but the common pattern is that deduplication is
not simply "one warning per raw match." They identify a vulnerability or advisory,
identify the package/range being evaluated, and then decide whether location-like
information should split or merely annotate findings.

## Decision Drivers

- Warning count must be deterministic for offline conformance fixtures.
- Duplicate advisory feed entries and source aliases should not cause duplicate
  portable warnings for the same declaration/range exposure.
- Different affected ranges for the same advisory and package should remain
  distinguishable when they produce different matching evidence.
- Component scope is explanatory context under ADR-0135 and should not become a
  component-level advisory target.
- Local policy may suppress, rank, group, or enrich warnings, but those choices
  should not change the portable warning identity.
- The identity rule should align with ADR-0146 declaration keys and ADR-0147
  matching results.

## Considered Options

- A — Emit one warning per raw declaration/advisory match.
- B — Deduplicate by declaration key and canonical advisory identity.
- C — Deduplicate by declaration key, canonical advisory identity, affected PURL,
  and affected range.
- D — Deduplicate by release and canonical advisory identity.
- E — Deduplicate by component scope and canonical advisory identity.
- F — Define a separate SARIF-like warning fingerprint system.

## Decision Outcome

Chosen option: **C — Deduplicate by declaration key, canonical advisory identity,
affected PURL, and affected range**, because it gives draft 6 deterministic warning
counts while preserving the package/range evidence that caused the potential
exposure.

The portable warning identity for `external-dependency-potential-exposure` is:

```text
(
  dependency.declarationKey,
  advisoryMatch.canonicalId,
  advisoryMatch.affectedPurl,
  advisoryMatch.affectedRange
)
```

Under this decision:

1. Validators first apply the ADR-0147 matching pipeline.
2. Only `intersects` results are eligible to produce
   `external-dependency-potential-exposure` warnings.
3. For every eligible result, validators compute the portable warning identity
   tuple above.
4. Validators emit exactly one portable warning per unique warning identity.
5. If multiple normalized advisory-match inputs collapse to the same warning
   identity, validators merge explanatory source and alias metadata
   deterministically rather than emitting additional portable warnings.
6. Merged arrays such as `aliases` or `sourceIds` are sorted lexicographically and
   duplicate values are removed.
7. Component scope remains warning context. It does not multiply warning count unless
   it caused a distinct `dependency.declarationKey` through the declaration identity
   model.
8. `indeterminate` matching results do not emit
   `external-dependency-potential-exposure`; draft 6 may represent them through a
   separate diagnostic or fixture result.

`advisoryMatch.canonicalId` is the normalized advisory identity supplied by the
normalized advisory-match input. Draft 6 adapters may use source-specific rules and
alias closures to produce it, but the portable warning deduplication step consumes
the normalized `canonicalId` value rather than standardizing live feed ingestion,
source trust, withdrawal, or alias-ranking policy.

`advisoryMatch.affectedRange` is the normalized affected VERS range used for the
intersection check. If an advisory contains multiple affected ranges for the same
package and canonical advisory identity, each affected range may produce a distinct
portable warning identity when it intersects the declaration constraint.

## Consequences

- Good, because conformance fixtures can assert exact warning counts.
- Good, because duplicate feed entries and advisory aliases do not multiply portable
  warning output when they normalize to the same advisory identity and affected
  range.
- Good, because distinct affected ranges remain distinguishable instead of being
  hidden under one broad advisory-level warning.
- Good, because component scope stays explanatory and does not become a component-
  level advisory target.
- Good, because local UI grouping can still collapse warnings further without
  changing the portable warning identity.
- Neutral, because normalized advisory-match inputs need a `canonicalId` value and a
  normalized affected range.
- Neutral, because conformance fixtures need cases for duplicate advisory inputs,
  aliases, repeated source IDs, and multiple affected ranges.
- Bad, because warning identity is more complex than a simple advisory ID or raw
  match count.

## Confirmation

- Verify that draft 6 prose defines exactly one
  `external-dependency-potential-exposure` warning per unique
  `(declarationKey, canonicalId, affectedPurl, affectedRange)` tuple.
- Verify that duplicate normalized advisory inputs merge source and alias context
  instead of increasing portable warning count.
- Verify that sorted, duplicate-free alias and source arrays are used when merging
  context.
- Verify that component scope appears as context and does not independently multiply
  warning count.
- Verify that `indeterminate` matching results are not counted as
  `external-dependency-potential-exposure` warnings.
- Verify that conformance fixtures cover raw duplicate inputs, alias-equivalent
  inputs, multiple affected ranges, component-scoped declarations, and
  non-intersecting inputs.

## Pros and Cons of the Options

### A — Emit one warning per raw declaration/advisory match

- Good, because it is simple and mirrors the raw matching loop.
- Bad, because duplicate feed entries and aliases can create non-deterministic or
  noisy warning counts.
- Bad, because implementations that pre-deduplicate advisory inputs would differ
  from implementations that do not.

### B — Deduplicate by declaration key and canonical advisory identity

- Good, because it collapses aliases and duplicate advisory records.
- Good, because the warning count is compact.
- Bad, because multiple affected ranges for the same advisory/package can be hidden
  inside one warning without a deterministic context merge rule.

### C — Deduplicate by declaration key, canonical advisory identity, affected PURL, and affected range

- Good, because it keeps warning count stable while preserving affected-range
  evidence.
- Good, because it aligns with OSV, npm, GitHub, and SARIF-style separation of
  advisory identity, package/range, and location-like context.
- Neutral, because normalized `canonicalId` and `affectedRange` values are required.
- Bad, because users may see more than one warning for the same advisory if the
  advisory has multiple intersecting affected ranges.

### D — Deduplicate by release and canonical advisory identity

- Good, because it produces fewer warnings and a simple release-level summary.
- Bad, because the declaration and affected-range evidence that caused the warning
  becomes less precise.
- Bad, because context arrays need additional ordering and merge rules.

### E — Deduplicate by component scope and canonical advisory identity

- Good, because it can be more actionable for component-focused UIs.
- Bad, because ADR-0135 treats component scope as explanatory context rather than a
  component-level advisory target.
- Bad, because multi-component declarations can multiply warnings unnecessarily.

### F — Define a separate SARIF-like warning fingerprint system

- Good, because stable fingerprints are useful for suppression and regression
  tracking.
- Bad, because a fingerprint system is additional machinery beyond the warning
  identity rule.
- Bad, because the fingerprint still needs an underlying identity tuple, so it does
  not remove the need for this decision.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- Normalized advisory-match inputs cannot reliably provide `canonicalId` and
  normalized `affectedRange` values.
- Implementers need first-class stable warning fingerprints for suppression or
  longitudinal result management.
- Future registry diagnostic APIs standardize a different portable warning grouping
  model.
- Component-level advisory targeting is reopened and component scope becomes a
  normative advisory target rather than explanatory context.

## More Information

ADR-0135 defines declaration-only potential exposure. ADR-0137 keeps live feed
ingestion, trust ranking, alias deduplication, and enforcement outcomes outside the
portable v0.1 baseline. ADR-0138 defines the warning category and offline fixture
carrier. ADR-0145 defines the category-specific context schema approach. ADR-0146
defines declaration keys. ADR-0147 defines matching result states, and ADR-0149
defines how compatibility exceptions can appear in explanatory warning context.
