---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Include semantic keys in successful external dependency cases

## Context and Problem Statement

ADR-0114 defines the external dependency uniqueness key as `(canonical purl,
purpose, scope)`. ADR-0121 defines compact domain-specific external dependency
validation cases, and ADR-0122 defines the failure category vocabulary for invalid
cases.

Those decisions leave one successful-case question: **should successful
`external-dependency-validation-cases.json` cases assert only `valid: true`, or
should they also assert the canonical semantic keys that validators compute for
duplicate and conflict detection?**

Without canonical semantic key expectations, conformance can tell that a case
passed, but cannot directly verify that the validator canonicalized Package URLs
and component scopes in the way required for duplicate detection.

## Decision Drivers

- Successful fixtures should verify the semantic key used by ADR-0114 uniqueness.
- The fixture family should avoid standardizing a full normalized external
  dependency output model in v0.1.
- VERS constraint strings should remain declaration values and should not be
  normalized as part of the semantic key.
- Component scopes should have a deterministic canonical representation.
- The expected output should be small enough for fixture authors and runners.

## Considered Options

- A — Successful cases assert only `expected.valid: true`.
- B — Successful cases include expected canonical semantic keys.
- C — Successful cases include canonical Package URLs and canonical scopes as
  separate arrays.
- D — Successful cases include full normalized external dependency records.
- E — Successful cases may optionally include canonical outputs on a case-by-case
  basis.
- F — Move canonicalization expectations to a separate fixture family.

## Decision Outcome

Chosen option: **B — Successful cases include expected canonical semantic keys**,
because it verifies the ADR-0114 uniqueness basis without turning semantic
validation fixtures into a full normalized manifest output contract.

Successful external dependency validation cases should include `expected.semanticKeys`.
Each semantic key contains:

- `purl` — the canonical Package URL string used for semantic comparison
- `purpose` — the core or syntactically valid extension purpose value used for
  semantic comparison
- `scope` — the canonical component scope set used for semantic comparison

Example:

```json
{
  "expected": {
    "valid": true,
    "semanticKeys": [
      {
        "purl": "pkg:npm/%40modelcontextprotocol/sdk",
        "purpose": "runtime",
        "scope": ["agent"]
      }
    ]
  }
}
```

The canonical scope representation is:

- `scope: []` for volume-scoped declarations where `components` is absent
- sorted, duplicate-free component-name arrays for component-scoped declarations

The semantic key does not include `constraint`. Constraint differences are used to
detect conflicts among declarations with the same semantic key, but the constraint
string is not part of the key itself.

The semantic key also does not require VERS normalization or round-tripping.
Validators should preserve and validate the declared VERS constraint, but v0.1
fixtures should not require a normalized VERS output form.

`semanticKeys` should be ordered deterministically by fixture authors and runners.
When a case contains multiple valid declarations, ordering should follow the order
of first appearance after semantic canonicalization unless a later schema decision
defines a stronger ordering rule.

## Consequences

- Good, because successful cases verify the canonical key used for duplicate and
  conflict detection.
- Good, because the fixture family can test Package URL canonicalization and scope
  canonicalization without defining full normalized records.
- Good, because VERS remains validated but not normalized into a new output surface.
- Good, because volume-scoped and component-scoped declarations have deterministic
  scope representations.
- Neutral, because fixture runners must expose or compute semantic keys for
  successful cases.
- Neutral, because semantic key ordering still needs deterministic runner behavior.
- Bad, because upstream Package URL canonicalization differences can affect fixture
  results if implementations do not follow the same artifacts.
- Bad, because future mapping/export fixtures may still need richer normalized data.

## Confirmation

- Verify that successful `external-dependency-validation-cases.json` cases include
  `expected.semanticKeys`.
- Verify that each semantic key contains `purl`, `purpose`, and `scope`.
- Verify that volume-scoped declarations use `scope: []`.
- Verify that component-scoped declarations use sorted, duplicate-free component
  name arrays.
- Verify that `constraint` is not part of the semantic key.
- Verify that VERS constraint normalization is not required for v0.1 successful
  fixture expectations.

## Pros and Cons of the Options

### A — Successful cases assert only `expected.valid: true`

- Good, because the fixture schema stays minimal.
- Good, because implementations do not need to expose canonical comparison keys.
- Bad, because conformance cannot directly verify the ADR-0114 uniqueness key.
- Bad, because Package URL and scope canonicalization bugs may go unnoticed in
  successful cases.

### B — Successful cases include expected canonical semantic keys

- Good, because it directly tests the semantic key used for duplicate detection.
- Good, because it keeps expected output small and focused.
- Good, because it avoids standardizing full normalized external dependency
  records.
- Good, because constraint conflict behavior remains separate from key generation.
- Neutral, because runners must compute comparable semantic keys.
- Bad, because canonical Package URL output must be aligned across implementations.

### C — Successful cases include canonical Package URLs and canonical scopes as separate arrays

- Good, because PURL and scope canonicalization can be tested separately.
- Good, because the fixture output is smaller than full normalized records.
- Bad, because the association between purl, purpose, and scope is weaker.
- Bad, because multi-dependency cases become ambiguous.
- Bad, because it maps less directly to the ADR-0114 semantic key.

### D — Successful cases include full normalized external dependency records

- Good, because it gives the richest successful-case output.
- Good, because mapping and export tests could reuse the normalized records.
- Bad, because it risks creating a new normalized manifest output contract.
- Bad, because it would force decisions about VERS normalization and other fields.
- Bad, because it is heavier than needed for validation conformance.

### E — Successful cases may optionally include canonical outputs on a case-by-case basis

- Good, because simple cases remain lightweight.
- Good, because targeted canonicalization cases can still be expressed.
- Bad, because fixture expectations become inconsistent.
- Bad, because implementers may not know which successful cases must expose
  semantic keys.
- Bad, because conformance reports become less comparable.

### F — Move canonicalization expectations to a separate fixture family

- Good, because validation and canonicalization responsibilities are separated.
- Good, because canonical output schema could evolve independently.
- Bad, because it adds another fixture family before there is clear need.
- Bad, because duplicate and conflict validation already depend on canonical keys,
  so splitting them weakens the current fixture family.

## More Information

Follow-up work should decide:

- exact JSON Schema representation for `expected.semanticKeys`
- deterministic ordering rules for multiple semantic keys if first-appearance order
  proves insufficient
- whether future mapping/export fixtures need richer normalized external dependency
  records
- how to cite Package URL canonicalization artifacts for expected `purl` strings
