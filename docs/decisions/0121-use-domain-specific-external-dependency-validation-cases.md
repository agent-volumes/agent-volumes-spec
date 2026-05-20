---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Use domain-specific external dependency validation cases

## Context and Problem Statement

ADR-0117 decides that `[[external-dependencies]]` needs a dedicated semantic
fixture family because Package URL parsing, VERS parsing, component reference
existence, and semantic duplicate detection cannot be fully expressed in
`volume.schema.json`. ADR-0118 through ADR-0120 then settle the shallow schema
pattern boundary, strict item fields, and reverse-DNS `purpose` extension syntax.

That leaves the fixture schema structure question: **should
`external-dependency-validation-case.schema.json` use full manifest payloads,
compact domain-specific cases, hybrid payloads, algorithmic vectors, or multiple
split fixture files?**

The structure should be compact enough for many focused semantic cases while still
providing enough context to validate component scopes and collection-level rules.

## Decision Drivers

- The fixture family should match existing conformance patterns where possible.
- External dependency semantic validation needs component-name context but not a
  full manifest for most cases.
- Fixtures should keep schema-level manifest validation separate from semantic
  external dependency validation.
- Cases should be concise enough to cover invalid Package URLs, invalid VERS
  constraints, volume purl rejection, component scope references, and duplicate
  declarations.
- PURL and VERS upstream fixture suites should remain compatibility inputs rather
  than being embedded wholesale into Agent Volumes fixtures.

## Considered Options

- A — Use full manifest payloads for each validation case.
- B — Use compact domain-specific cases with `declaredComponents`,
  `external-dependencies`, and `expected`.
- C — Use a hybrid structure with compact fields plus optional full manifest
  context.
- D — Use check-specific algorithmic vectors.
- E — Split record-level and collection-level validation into separate fixture
  families.

## Decision Outcome

Chosen option: **B — Use compact domain-specific cases**, because it aligns with
the existing component dependency validation fixture style while avoiding repeated
full manifest boilerplate.

The fixture file should be named:

```text
conformance/fixtures/external-dependency-validation-cases.json
```

The companion schema should be named:

```text
schemas/external-dependency-validation-case.schema.json
```

The schema should validate the whole fixture file as an object with:

- `specVersion`, fixed to the current spec version
- `cases`, a non-empty array of case objects

Each case should contain:

- `name`, a stable human-readable case slug
- `declaredComponents`, an array of declared component names with structural
  uniqueness
- `external-dependencies`, an array of external dependency declaration candidates
- `expected`, an object containing at least `valid`

The `external-dependencies` entries should use the v0.1 item shape for external
dependency declarations, including `purl`, `constraint`, `purpose`, and optional
`components`, without requiring the rest of a manifest.

The `expected.failureCategory` field should remain optional in the structure, with
its exact vocabulary decided by a follow-up ADR.

The fixture family should not include full manifest payloads by default. End-to-end
manifest parsing and schema validation should remain covered by manifest fixtures,
while this fixture family covers deterministic semantic validation behavior for
external dependencies.

The fixture family should not vendor the complete upstream Package URL or VERS test
suites. Conformance runners may use upstream Package URL and VERS fixtures as
compatibility inputs, but this Agent Volumes fixture family should focus on
integration behavior specific to Agent Volumes.

## Consequences

- Good, because fixtures stay short, focused, and easy to review.
- Good, because the structure mirrors the existing component dependency validation
  pattern.
- Good, because component scope validation has enough context through
  `declaredComponents`.
- Good, because collection-level duplicate checks can be represented directly.
- Good, because schema-level manifest invalid cases remain separate from semantic
  validation cases.
- Neutral, because full manifest end-to-end behavior must be covered by other
  fixture families.
- Neutral, because the fixture item shape must stay aligned with
  `volume.schema.json` as the manifest schema evolves.
- Bad, because cases do not exercise the full manifest parser path by themselves.
- Bad, because future semantic checks that depend on unrelated manifest fields may
  require either schema evolution or separate fixtures.

## Confirmation

- Verify that `external-dependency-validation-case.schema.json` follows the
  `specVersion` plus `cases` wrapper pattern.
- Verify that each case includes `declaredComponents`, `external-dependencies`, and
  `expected`.
- Verify that `declaredComponents` uses the same component-name constraints as the
  manifest schema.
- Verify that `external-dependencies` entries use the external dependency item
  shape without including a full manifest payload.
- Verify that the conformance README maps
  `external-dependency-validation-cases.json` as a whole-file/cases fixture.
- Verify that upstream Package URL and VERS fixtures remain external compatibility
  inputs rather than vendored wholesale into this fixture family.

## Pros and Cons of the Options

### A — Use full manifest payloads for each validation case

- Good, because it resembles the real manifest validation flow.
- Good, because future checks depending on other manifest fields can be expressed
  without changing the fixture shape.
- Bad, because every case repeats unrelated manifest boilerplate.
- Bad, because semantic validation failures can become entangled with schema or
  parse failures.
- Bad, because small Package URL, VERS, and duplicate-key cases become verbose.

### B — Use compact domain-specific cases with `declaredComponents`, `external-dependencies`, and `expected`

- Good, because it gives semantic validation exactly the context it needs.
- Good, because it is consistent with the existing component dependency validation
  fixture style.
- Good, because it keeps semantic cases readable and focused.
- Good, because collection-level and component-scope checks are still expressible.
- Neutral, because full manifest integration must be tested elsewhere.
- Bad, because the item shape needs to be kept in sync with the manifest schema.

### C — Use a hybrid structure with compact fields plus optional full manifest context

- Good, because most cases can remain compact while rare cases include more context.
- Good, because it is more future-proof than a purely compact shape.
- Bad, because it introduces two possible sources of truth.
- Bad, because `declaredComponents` and full manifest components can conflict.
- Bad, because conformance runner behavior becomes more complicated.

### D — Use check-specific algorithmic vectors

- Good, because each semantic algorithm can be isolated precisely.
- Good, because it can line up with upstream Package URL and VERS test styles.
- Bad, because it drifts away from validating complete external dependency
  declaration records.
- Bad, because multi-record checks such as duplicate semantic keys are awkward.
- Bad, because the fixture format can turn into a mini language of check kinds.

### E — Split record-level and collection-level validation into separate fixture families

- Good, because single-record checks and collection-level checks are cleanly
  separated.
- Good, because PURL/VERS parsing tests and duplicate/reference tests can evolve
  independently.
- Bad, because v0.1 gains more schema and fixture files than necessary.
- Bad, because the split is premature before the fixture family grows large.
- Bad, because runners must support two closely related fixture surfaces.

## More Information

Follow-up work should decide:

- the exact `expected.failureCategory` vocabulary
- whether `expected` should later include normalized/canonical forms for successful
  cases
- whether the schema should define a shared `$defs.externalDependencyCandidate`
  copied from or aligned with `volume.schema.json`
- how conformance documentation should reference upstream Package URL and VERS
  compatibility fixtures
