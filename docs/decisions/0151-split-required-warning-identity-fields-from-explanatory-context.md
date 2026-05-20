---
status: accepted
date: 12026-05-16
decision-makers: Yunseo Kim
---

# Split required warning identity fields from explanatory context

## Context and Problem Statement

ADR-0145 chooses a generic warning `context` field plus a category-specific
companion schema for `external-dependency-potential-exposure` warnings. ADR-0150
then defines the portable warning identity tuple for deterministic warning counts:

```text
(
  dependency.declarationKey,
  advisoryMatch.canonicalId,
  advisoryMatch.affectedPurl,
  advisoryMatch.affectedRange
)
```

Those decisions leave a schema-design question: **which warning context fields are
required because they define the portable warning identity, and which fields are
optional explanatory metadata?**

Draft 6 should make this distinction explicit so validators, conformance fixtures,
and clients do not infer warning identity from optional message text, source names,
component scope, volume display fields, or compatibility explanations.

## Decision Drivers

- The warning context schema should expose the fields needed to reproduce the ADR-
  0150 warning identity.
- Explanatory fields should remain useful for users without changing warning count
  or deduplication behavior.
- Component scope should remain explanatory context, not a component-level advisory
  target.
- Source aliases and source IDs may explain merged warning inputs, but they should
  not replace the normalized canonical advisory identity.
- Compatibility exception metadata should explain evaluator dispatch without
  rewriting package identity or declaration keys.
- The schema should stay small enough for offline fixtures and conformance reports.

## Considered Options

- A — Require only minimal human-readable context.
- B — Require all possible matching and explanatory fields.
- C — Split required identity fields from optional explanatory metadata.
- D — Keep all potential-exposure context fields optional.
- E — Put identity fields in the base warning envelope instead of category context.

## Decision Outcome

Chosen option: **C — Split required identity fields from optional explanatory
metadata**, because it gives conformance fixtures enough structure to verify warning
identity while allowing clients to carry useful explanatory details without changing
portable warning semantics.

The category-specific context schema for `external-dependency-potential-exposure`
should require exactly the identity-bearing fields needed by ADR-0150:

```text
dependency.declarationKey
dependency.purl
dependency.constraint
advisoryMatch.canonicalId
advisoryMatch.affectedPurl
advisoryMatch.affectedRange
```

The schema should allow optional explanatory fields such as:

```text
dependency.components
advisoryMatch.sourceKind
advisoryMatch.sourceId
advisoryMatch.sourceIds
advisoryMatch.aliases
volume.purl
volume.name
volume.version
compatibility.purlType
compatibility.versScheme
compatibility.exceptionId
```

The required identity fields define what warning this is. Optional explanatory
fields explain why it appeared, where the declaration came from, which source inputs
were merged, or which compatibility bridge was used.

## Field Semantics

`dependency.declarationKey` is the stable declaration key defined by ADR-0143 and
ADR-0146. It anchors the warning to the declaration identity without relying on
manifest array position or authored TOML formatting.

`dependency.purl` is the canonical external package PURL for the declaration.

`dependency.constraint` is the declaration's VERS constraint. It is required in the
warning context so users can see the declared range that intersected the advisory
range, but it does not participate in declaration key construction.

`advisoryMatch.canonicalId` is the normalized advisory identity consumed by ADR-
0150 warning deduplication. It should be stable across source aliases after local
adapter normalization.

`advisoryMatch.affectedPurl` is the canonical affected external package PURL from
the normalized advisory-match input.

`advisoryMatch.affectedRange` is the normalized affected VERS range used for the
ADR-0147 intersection check.

`dependency.components`, when present, is explanatory component scope. It does not
turn the warning into a component-level advisory target and does not multiply warning
count except through the declaration identity that produced `declarationKey`.

`advisoryMatch.sourceId`, `sourceIds`, `sourceKind`, and `aliases` are explanatory
source metadata. When multiple raw inputs collapse to the same ADR-0150 warning
identity, arrays such as `sourceIds` and `aliases` should be sorted
lexicographically and duplicate-free.

`volume` fields identify the affected Agent Volumes release for user-facing context.
They do not participate in warning identity because the warning is already scoped by
the exact release metadata or fixture input that produced the warning.

`compatibility` fields explain PURL/VERS compatibility exceptions under ADR-0149.
They do not rewrite PURL identity, VERS scheme names, declaration keys, or affected
range identity.

## Consequences

- Good, because warning identity fields are machine-readable and always available to
  conformance fixtures.
- Good, because optional explanatory fields can evolve without changing warning
  count or deduplication semantics.
- Good, because the schema makes it clear that `constraint` explains the warning but
  does not become part of the declaration key.
- Good, because source aliases, component scope, volume display fields, and
  compatibility exceptions remain explanatory context.
- Neutral, because the companion context schema must distinguish required nested
  fields from optional nested fields.
- Neutral, because adapters need to provide `canonicalId` before portable warning
  deduplication can run.
- Bad, because warning context is more structured than a simple message string.

## Confirmation

- Verify that draft 6 context schema requires `dependency.declarationKey`,
  `dependency.purl`, `dependency.constraint`, `advisoryMatch.canonicalId`,
  `advisoryMatch.affectedPurl`, and `advisoryMatch.affectedRange`.
- Verify that component scope, aliases, source IDs, volume metadata, and
  compatibility exception metadata remain optional explanatory fields.
- Verify that optional fields do not alter ADR-0150 warning identity.
- Verify that merged `aliases` and `sourceIds` are sorted and duplicate-free when
  present.
- Verify that warning context prose says the payload is declaration-only and not
  resolved evidence, confirmed vulnerability, scanner finding, VEX status, advisory
  publication, or policy outcome.

## Pros and Cons of the Options

### A — Require only minimal human-readable context

- Good, because payloads are small and easy to produce.
- Bad, because conformance cannot reconstruct or verify warning identity.
- Bad, because clients may infer identity from unstable message text.

### B — Require all possible matching and explanatory fields

- Good, because every warning is richly self-describing.
- Bad, because every implementation must supply fields that may not be meaningful
  for every input.
- Bad, because optional source and compatibility metadata could be mistaken for
  identity-bearing data.

### C — Split required identity fields from optional explanatory metadata

- Good, because it is precise enough for deterministic conformance while keeping
  explanatory metadata flexible.
- Good, because it aligns with ADR-0150's warning identity tuple.
- Neutral, because it requires clear schema documentation.
- Bad, because implementers must understand two classes of context fields.

### D — Keep all potential-exposure context fields optional

- Good, because it maximizes implementation flexibility.
- Bad, because warning count and deduplication cannot be validated reliably from the
  warning payload.
- Bad, because clients cannot rely on fields needed for remediation or suppression.

### E — Put identity fields in the base warning envelope

- Good, because identity fields would be visible without category-specific schema
  dispatch.
- Bad, because generic warnings would appear to support external dependency fields
  they do not use.
- Bad, because it conflicts with ADR-0145's decision to keep the base warning schema
  generic.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- Future warning categories need enough structured identity fields that the base
  warning envelope should grow a generic fingerprint or identity object.
- Normalized advisory-match inputs cannot reliably provide `canonicalId`.
- Component-level advisory targeting is reopened and component scope becomes
  identity-bearing rather than explanatory.
- A future registry diagnostic API standardizes a different context shape for
  potential-exposure warnings.

## More Information

ADR-0138 defines `external-dependency-potential-exposure` as the portable warning
category. ADR-0145 defines the companion context schema approach. ADR-0146 defines
declaration keys. ADR-0149 defines compatibility exception context as explanatory.
ADR-0150 defines the warning identity and deduplication tuple that this decision
exposes through required context fields.
