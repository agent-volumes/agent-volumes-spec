---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Use an optional components array for external dependency scoping

## Context and Problem Statement

ADR-0109 establishes external non-volume package declarations as machine-readable
audit metadata. ADR-0110 chooses the `[[external-dependencies]]` record shape and
defers component scoping. ADR-0111 requires `purl`, `constraint`, and `purpose`.
ADR-0112 defines `purpose` as dependency use context. ADR-0113 defines
`constraint` as a VERS-compatible expression. ADR-0114 defines the external
dependency uniqueness key as `(canonical purl, purpose, scope)` and leaves the
concrete scope syntax to follow-up work.

The remaining scoping question is: **how should a volume declare whether an
external dependency applies to the whole volume, to one component, or to a subset
of components?**

The scoping model must keep the single `[[external-dependencies]]` record shape,
support useful SBOM/advisory/policy mapping, avoid component-only duplication for
shared dependencies, and remain audit metadata rather than native package-manager
resolver input.

## Decision Drivers

- Multi-component volumes need to distinguish package-wide external requirements
  from component-specific requirements.
- Shared external dependencies should not need to be repeated once per component.
- Component-scoped declarations should refer to the existing `[[components]]` names
  and be semantically validated against them.
- The model should preserve the `[[external-dependencies]]` array-of-records shape
  chosen in ADR-0110.
- The model should fit the uniqueness key chosen in ADR-0114.
- Scoping should not imply inheritance, override, installation, resolution, or
  native package-manager behavior.
- Volume-level advisory targeting remains separate from external dependency audit
  scoping.

## Considered Options

- A — Treat all external dependency declarations as volume-scoped only.
- B — Require every external dependency declaration to name exactly one component.
- C — Add an optional single `component` field.
- D — Add an optional `components` array field.
- E — Use separate volume-level and component-level declaration shapes.
- F — Replace declaration scoping with a graph-first relationship model.

## Decision Outcome

Chosen option: **D — Add an optional `components` array field**, because it keeps one
record shape while supporting volume-wide, single-component, and shared
multi-component external dependency declarations.

Under this decision:

- `[[external-dependencies]]` records may include an optional `components` array.
- When `components` is absent, the external dependency declaration is scoped to the
  volume as a whole.
- When `components` is present, the external dependency declaration is scoped to the
  listed component-name set.
- `components` must be non-empty when present.
- `components` must be duplicate-free.
- Every value in `components` must match the `name` of a component declared in the
  same manifest's `[[components]]` array.
- The order of values in `components` is not semantically meaningful.
- For ADR-0114 uniqueness, the scope value is the canonical component-name set when
  `components` is present and the volume scope when it is absent.
- Component-scoped external dependency declarations do not inherit from, narrow,
  override, or replace volume-scoped external dependency declarations.
- Scoping remains audit metadata for warning, policy, SBOM, advisory, and human
  review workflows. It does not make Agent Volumes responsible for installing or
  resolving the external package.

Example of a volume-scoped declaration:

```toml
[[external-dependencies]]
purl = "pkg:npm/@modelcontextprotocol/sdk"
constraint = "vers:npm/>=1.12.0|<2.0.0"
purpose = "runtime"
```

Example of a declaration scoped to a component set:

```toml
[[external-dependencies]]
components = ["research-mcp", "paper-summarizer"]
purl = "pkg:npm/@modelcontextprotocol/sdk"
constraint = "vers:npm/>=1.12.0|<2.0.0"
purpose = "runtime"
```

This decision does not define component-level advisory targeting. Existing advisory
targeting decisions remain separate. External dependency scoping identifies where a
declared external package requirement applies inside a volume for audit metadata
purposes.

## Consequences

- Good, because volume-wide, single-component, and multi-component shared external
  dependency use cases all fit one record shape.
- Good, because shared component subsets can be represented without duplicating the
  full dependency record for every component.
- Good, because scoping uses existing component names rather than inventing a new
  component identifier surface.
- Good, because the scope axis in ADR-0114 becomes directly computable from the
  manifest.
- Good, because SBOM and advisory mapping can preserve component relationships
  without making component-level advisory targeting normative.
- Neutral, because semantic validation must check component existence,
  duplicate-free component sets, and canonical ordering for comparison.
- Neutral, because component renames require updates to scoped external dependency
  declarations.
- Bad, because very large component sets can make declarations verbose.
- Bad, because the absence of `components` and the presence of a full component list
  could be accidentally treated as equivalent by authors, even though the baseline
  model gives them distinct scopes.
- Bad, because tools must be clear that component-scoped external dependencies do
  not imply inheritance or override behavior.

## Confirmation

- Verify that future prose and schemas model external dependency scoping with an
  optional `components` array.
- Verify that `components`, when present, is non-empty and duplicate-free.
- Verify that all `components` values reference declared component names in the same
  manifest.
- Verify that validators treat `components` ordering as non-semantic for uniqueness
  comparison.
- Verify that conformance fixtures include volume-scoped, single-component,
  multi-component, unknown-component, empty-array, and duplicate-component cases.
- Verify that examples do not imply inheritance, override, installation,
  resolution, or component-level advisory targeting semantics.

## Pros and Cons of the Options

### A — Treat all external dependency declarations as volume-scoped only

- Good, because it is the simplest model to specify and validate.
- Good, because volume-level SBOM and advisory export can aggregate declarations
  easily.
- Bad, because it loses information about which component actually uses an external
  package.
- Bad, because multi-component volumes can overstate the applicability of an
  external dependency.
- Bad, because it does not satisfy the scope axis established in ADR-0114 beyond a
  single global scope.

### B — Require every external dependency declaration to name exactly one component

- Good, because each declaration is close to the component that uses it.
- Good, because component-level warning and policy messages can be precise.
- Bad, because shared dependencies must be repeated across components.
- Bad, because volume-level dependency bundles and package-wide requirements become
  awkward.
- Bad, because volume-level SBOM and advisory export need aggregation before they
  can see the complete declared external package set.

### C — Add an optional single `component` field

- Good, because it is easy to read and validate.
- Good, because it supports volume-scoped and single-component declarations.
- Neutral, because it may be enough for simple component packages.
- Bad, because shared dependencies across a subset of components still require
  duplicate rows.
- Bad, because it makes multi-component sharing less explicit than a component-name
  set.

### D — Add an optional `components` array field

- Good, because it supports volume-wide, single-component, and shared subset scopes
  without changing the record shape.
- Good, because the component set gives a deterministic scope value for ADR-0114
  uniqueness.
- Good, because it follows existing set-like validation patterns in the repository.
- Neutral, because semantic validation is required beyond JSON Schema.
- Bad, because component sets add canonicalization and diagnostics work.

### E — Use separate volume-level and component-level declaration shapes

- Good, because each placement can be optimized for its scope.
- Good, because component-local declarations can live near component metadata.
- Bad, because it duplicates the external dependency record model.
- Bad, because schema, prose, examples, and conformance fixtures must cover two
  shapes.
- Bad, because it weakens the simplicity gained by ADR-0110's single
  array-of-tables shape.

### F — Replace declaration scoping with a graph-first relationship model

- Good, because SBOM standards such as CycloneDX and SPDX are relationship-friendly.
- Good, because a graph model can express many precise relationships.
- Neutral, because it may be useful for future richer profiles.
- Bad, because it is too heavy for the minimal manifest declaration baseline.
- Bad, because it would replace the chosen `[[external-dependencies]]` record shape
  with a more complex graph schema.
- Bad, because authoring simple external dependency declarations would become
  harder.

## More Information

Follow-up work should decide:

- the exact JSON Schema representation for `components`
- diagnostic identifiers for unknown component names, duplicate names, and empty
  component arrays
- how scoped external dependency records map to CycloneDX and SPDX relationships
- whether future profiles add graph-first export artifacts without changing the
  manifest scoping baseline
- whether tooling should warn when a component set equals the complete component
  list and a volume-scoped declaration might be clearer
