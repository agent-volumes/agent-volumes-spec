---
status: accepted
date: 12026-05-15
decision-makers: Yunseo Kim
---

# Publish PURL/VERS compatibility exceptions as a conformance artifact

## Context and Problem Statement

ADR-0113 chooses VERS as the external dependency constraint grammar. ADR-0134
then chooses exact equality between the external dependency PURL type and VERS
scheme as the default compatibility rule, while allowing non-equal pairs only
when they are defined by pinned upstream baselines or an Agent Volumes-maintained
compatibility table.

ADR-0124 through ADR-0127 separately define how Agent Volumes records pinned
upstream Package URL and VERS baselines without vendoring their full fixture
suites. Those baseline records identify which upstream snapshots Agent Volumes
cites, but they do not yet define where Agent Volumes-owned compatibility
exceptions live.

The remaining question is: **where should Agent Volumes publish PURL type / VERS
scheme compatibility exceptions, and which exceptions should v0.1.0 include
initially?**

## Decision Drivers

- Compatibility exceptions must be deterministic for offline conformance.
- The exception list should be machine-readable and schema-validated.
- Upstream baseline references and Agent Volumes compatibility policy should remain
  distinguishable.
- Implementers should not have to infer portable exceptions from prose-only text or
  fixture-local expectations.
- The v0.1.0 exception set should be conservative and limited to officially
  documented non-equal PURL/VERS naming differences.
- Implementation-local aliases and observed tooling behavior should not become
  portable Agent Volumes compatibility unless explicitly standardized.

## Considered Options

- A — Publish a separate conformance artifact with a companion schema.
- B — Embed exceptions inside `conformance/upstream-baselines.json`.
- C — Publish exceptions as a schema-owned registry artifact under `schemas/`.
- D — Define exceptions only in prose.
- E — Define exceptions only through conformance fixture expected results.
- F — Ship no exception table in v0.1.0.

## Decision Outcome

Chosen option: **A — Publish a separate conformance artifact with a companion
schema**, because this gives validators a deterministic offline source of Agent
Volumes compatibility policy while keeping upstream reference pinning separate
from Agent Volumes-owned exception data.

Agent Volumes should publish the compatibility exception table as:

```text
conformance/purl-vers-compatibility-exceptions.json
```

The table should have a companion schema such as:

```text
schemas/purl-vers-compatibility-exceptions.schema.json
```

The artifact should include at least:

- `specVersion`
- `exceptions`

Each exception entry should include at least:

- `purlType`
- `versScheme`
- `source`
- `rationale`

The initial v0.1.0 exception table should include exactly one non-equal
compatibility exception:

```json
{
  "purlType": "pub",
  "versScheme": "dart",
  "source": "pinned-purl-and-vers-baselines",
  "rationale": "PURL registers Dart Pub packages with the pub type while VERS documents the Dart Pub version scheme with the dart scheme."
}
```

Under this decision, a declaration using `pkg:pub/...` with `vers:dart/...` is
type-compatible in the v0.1.0 baseline when the pinned upstream Package URL and
VERS baselines continue to support the stated source rationale.

All other non-equal PURL type / VERS scheme pairs remain incompatible in the
portable v0.1.0 baseline unless they are added to this artifact by a later
decision or are explicitly defined by pinned upstream baselines.

## Non-Exceptions

The initial v0.1.0 table should not include:

- `generic` fallback mappings;
- mappings from package ecosystems to their underlying versioning style, such as
  `cargo` to `semver`;
- implementation-local aliases such as `gem` to `rubygems`;
- observed-only schemes such as `github`, `hex`, `swift`, `cocoapods`, or `cran`
  unless later pinned upstream baselines make them official compatibility cases;
- equality pairs such as `conan` to `conan`, which should be handled by the default
  equality rule if the pinned VERS baseline recognizes the scheme.

## Consequences

- Good, because conformance runners can load one deterministic offline artifact for
  Agent Volumes-owned compatibility exceptions.
- Good, because `conformance/upstream-baselines.json` remains a reference inventory
  for upstream snapshots rather than a mixed policy table.
- Good, because the companion schema can validate table shape without hardcoding
  policy data into `volume.schema.json` or other structural schemas.
- Good, because the initial `pub` / `dart` exception supports a documented PURL/VERS
  naming mismatch without opening the door to generic aliases.
- Good, because fixtures can test equality success, mismatch failure, and the
  table-driven exception against the same machine-readable source.
- Neutral, because another artifact and schema must be maintained.
- Neutral, because table updates require review whenever pinned PURL or VERS
  baselines change.
- Bad, because legitimate future ecosystem mappings remain invalid until the table
  or pinned upstream baseline is updated.

## Confirmation

- Verify that draft 6 prose identifies
  `conformance/purl-vers-compatibility-exceptions.json` as the Agent
  Volumes-maintained compatibility exception table.
- Verify that `schemas/purl-vers-compatibility-exceptions.schema.json` validates the
  table structure.
- Verify that artifact validation covers the compatibility exception table once the
  file and schema are added.
- Verify that the initial table contains `purlType: "pub"` and
  `versScheme: "dart"` as the only non-equal exception.
- Verify that external dependency semantic validation accepts `pkg:pub/...` with
  `vers:dart/...` and rejects other non-equal pairs unless they are listed in the
  table or pinned upstream baselines.
- Verify that conformance fixtures include equality success, mismatch failure, and
  the `pub` / `dart` exception case.

## Pros and Cons of the Options

### A — Publish a separate conformance artifact with a companion schema

- Good, because it cleanly separates Agent Volumes compatibility policy from
  upstream baseline references.
- Good, because it is machine-readable, schema-validated, and compatible with
  offline conformance.
- Good, because implementers can discover the portable exception list without
  parsing prose or fixtures.
- Neutral, because it adds one more artifact to the conformance surface.
- Bad, because artifact updates need coordination with prose and fixture updates.

### B — Embed exceptions inside `conformance/upstream-baselines.json`

- Good, because all PURL/VERS-related compatibility data would live in one file.
- Bad, because it mixes upstream snapshot metadata with Agent Volumes-owned
  compatibility policy.
- Bad, because it makes the baseline manifest less focused and harder to explain.

### C — Publish exceptions as a schema-owned registry artifact under `schemas/`

- Good, because schemas already define machine-readable contracts.
- Good, because validation wiring may be straightforward.
- Bad, because `schemas/` should define artifact shapes rather than serve as the
  primary home for conformance policy data.
- Bad, because routine exception-table updates could look like schema evolution even
  when only data changed.

### D — Define exceptions only in prose

- Good, because it is simple and easy to review in the specification text.
- Bad, because tooling cannot consume prose reliably.
- Bad, because conformance drift is more likely when implementations transcribe the
  table manually.

### E — Define exceptions only through conformance fixture expected results

- Good, because fixtures would test at least the included examples.
- Bad, because fixtures are examples of behavior, not a discoverable canonical
  compatibility table.
- Bad, because implementers would need to infer general validation policy from test
  cases.

### F — Ship no exception table in v0.1.0

- Good, because the equality rule remains maximally simple.
- Good, because no extra artifact is needed until more implementation evidence
  exists.
- Bad, because `pkg:pub/...` with `vers:dart/...` would remain invalid despite the
  documented PURL/VERS naming mismatch.
- Bad, because ADR-0134 already creates a controlled exception path that should be
  exercised by conformance if an exception is known.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- VERS publishes a normative Package URL compatibility mapping that supersedes the
  Agent Volumes exception table.
- Package URL renames or aliases the `pub` type in a way that removes the `pub` /
  `dart` mismatch.
- The pinned VERS baseline no longer documents the Dart Pub version scheme as
  `dart`.
- Multiple additional official non-equal mappings appear and require richer table
  metadata, versioning, or deprecation fields.
- Implementers show that the exception artifact belongs in a broader conformance
  registry structure rather than a dedicated file.

## More Information

ADR-0124 through ADR-0127 define the pinned upstream baseline model. ADR-0134
defines the default PURL type / VERS scheme equality rule and allows finite,
versioned exceptions. This decision records the exception table placement and the
initial v0.1.0 exception set.
