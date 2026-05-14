---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Use array-of-tables for external dependencies

## Context and Problem Statement

ADR-0109 establishes that Agent Volumes should standardize explicit declarations
for external non-volume package dependencies as audit metadata while leaving
installation, resolution, native lockfile interpretation, and package-manager
policy to the relevant native ecosystem tooling.

That decision intentionally reserved the exact manifest field shape for follow-up
schema work. The field name is now fixed as `external-dependencies`. The remaining
shape question is: **should `external-dependencies` be represented as a simple
keyed map, a keyed map of inline tables, an array of tables, or component-nested
declarations?**

The shape must support the standard's supply-chain goals: machine-readable
external dependency visibility, policy checks, SBOM export, advisory matching,
clear diagnostics, and future expansion toward richer audit metadata.

## Decision Drivers

- External package dependencies are audit records, not Agent Volumes resolver
  inputs.
- The shape should make the package identity explicit and easy to validate.
- The shape should leave room for additional audit metadata without requiring a
  breaking migration from a scalar map.
- The shape should align with existing Agent Volumes manifest conventions for
  repeated records such as `[[components]]`, `[[runtimes]]`, and `[[protocols]]`.
- The shape should avoid overloading TOML keys with canonical Package URL strings
  when those strings are better represented as values with direct schema and
  diagnostic paths.
- Component scoping, native manifest references, and resolved facts should remain
  addable later without contradicting the initial shape.

## Considered Options

- A — Use a simple keyed map under `[external-dependencies]`.
- B — Use a keyed map of inline tables under `[external-dependencies]`.
- C — Use array-of-tables with `[[external-dependencies]]`.
- D — Put external dependency declarations only inside `[[components]]` entries.
- E — Use separate volume-level and component-level maps.

## Decision Outcome

Chosen option: **C — Use array-of-tables with `[[external-dependencies]]`**, because
external dependencies are structured audit records and are expected to grow beyond
a single package-to-version mapping.

Under this decision:

- `external-dependencies` is represented in TOML as an array of tables:

  ```toml
  [[external-dependencies]]
  purl = "pkg:npm/@modelcontextprotocol/sdk"
  constraint = "^1.12.0"
  purpose = "runtime"
  ```

- Each `[[external-dependencies]]` entry represents one declared external
  non-volume package dependency record.
- The canonical package identity is represented as a field on the record rather
  than as the TOML key.
- Validators, clients, and bibliothecas must treat duplicate detection,
  uniqueness rules, component scoping, and richer field validation as semantic
  validation concerns rather than relying on TOML map key uniqueness alone.
- This decision does not define component scoping, native manifest references,
  lockfile references, resolved external package facts, or digest evidence.
  Those remain follow-up decisions or profile work.

## Consequences

- Good, because array-of-tables is the existing manifest convention for repeated
  structured records.
- Good, because `purl`, `constraint`, `purpose`, and future fields have direct
  schema paths and diagnostics.
- Good, because the shape can add optional fields such as component scope,
  evidence, source, notes, native manifest references, or resolved facts without
  changing from scalar values to objects later.
- Good, because Package URL strings remain ordinary field values rather than
  quoted TOML keys.
- Good, because SBOM and advisory export tooling can treat each declaration as a
  record.
- Neutral, because array-of-tables is more verbose than a map for simple cases.
- Neutral, because uniqueness and duplicate handling require validator logic.
- Bad, because simple lookup by purl is less direct than with a keyed map.
- Bad, because authors may find repeated tables heavier for volumes with many
  external dependencies.

## Confirmation

- Verify that future prose and schema additions model `external-dependencies` as an
  array of records.
- Verify that example TOML uses `[[external-dependencies]]`, not
  `[external-dependencies]`, for the baseline shape.
- Verify that the JSON Schema companion artifact represents the field as an array
  of objects.
- Verify that conformance fixtures include duplicate and invalid-record cases that
  are checked by semantic validation rather than TOML key uniqueness.
- Verify that future component-scoping work can add explicit fields or a companion
  shape without replacing the array-of-tables baseline.

## Pros and Cons of the Options

### A — Use a simple keyed map under `[external-dependencies]`

- Good, because it is compact and resembles existing volume-level `[dependencies]`.
- Good, because lookup by package identity is straightforward.
- Bad, because it only represents a package-to-constraint mapping.
- Bad, because audit metadata such as purpose, optionality, evidence, and notes
  cannot be represented without changing the value type later.
- Bad, because using Package URLs as TOML keys makes diagnostics and schema paths
  less direct.

### B — Use a keyed map of inline tables under `[external-dependencies]`

- Good, because it preserves map-style lookup while allowing some structured
  metadata.
- Good, because TOML inline tables can be concise for short entries.
- Neutral, because it can work for small manifests with limited metadata.
- Bad, because inline tables become hard to read as fields grow.
- Bad, because repeated records with the same purl but different component scope or
  purpose become awkward.
- Bad, because the canonical identity is split between the TOML key and record
  fields unless the key itself is the purl.

### C — Use array-of-tables with `[[external-dependencies]]`

- Good, because it treats external dependencies as first-class structured records.
- Good, because it aligns with existing repeated-record manifest sections.
- Good, because it supports future metadata without a shape migration.
- Good, because schema validation and diagnostics can point at explicit fields.
- Neutral, because duplicate detection moves to semantic validation.
- Bad, because it is more verbose than a map.

### D — Put external dependency declarations only inside `[[components]]` entries

- Good, because dependency declarations appear near the component that uses them.
- Good, because component-local policy decisions can be easier to explain.
- Neutral, because it may become useful as a future scoping extension.
- Bad, because shared volume-level dependencies would be duplicated across
  components.
- Bad, because volume-level SBOM export and advisory matching would need an
  aggregation step before seeing the complete declared set.
- Bad, because it makes the first baseline more complex than necessary.

### E — Use separate volume-level and component-level maps

- Good, because it could separate package-wide and component-specific dependency
  declarations.
- Good, because it resembles the existing split between `[dependencies]` and
  `[component-dependencies]`.
- Neutral, because the pattern may be useful after component scoping is specified.
- Bad, because it multiplies shapes before the baseline declaration record is
  proven.
- Bad, because component scoping, inheritance, and duplicate handling would need to
  be solved immediately.

## More Information

Follow-up work should decide:

- exact uniqueness semantics for entries with the same `purl`
- whether component scoping uses a `component`, `components`, or separate companion
  field
- whether package identity comparison uses raw strings or parsed canonical purl
  normalization
- how array entries map into CycloneDX, SPDX, advisory matching, warnings, and
  conformance fixtures
