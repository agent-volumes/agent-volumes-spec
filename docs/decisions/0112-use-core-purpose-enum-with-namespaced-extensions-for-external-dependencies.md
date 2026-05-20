---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Use a core purpose enum with namespaced extensions for external dependencies

## Context and Problem Statement

ADR-0109 establishes that Agent Volumes should declare external non-volume package
dependencies as machine-readable audit metadata while leaving installation and
resolution to native package-manager tooling. ADR-0110 chooses
`[[external-dependencies]]` as the TOML shape for those declarations. ADR-0111
requires every external dependency declaration to contain `purl`, `constraint`,
and `purpose`.

ADR-0111 intentionally leaves the vocabulary and extension policy for `purpose`
unresolved. That creates an implementer-readiness gap: schema validation,
conformance fixtures, policy checks, warning behavior, advisory matching, and SBOM
export all need a shared understanding of what `purpose` means.

The field must distinguish dependency use context, not the intrinsic kind of the
package. For example, `runtime`, `build`, `development`, and `test` describe why a
volume declares the external package. SPDX-style package purposes such as
`APPLICATION`, `LIBRARY`, or `FRAMEWORK` describe what the package is. Those are
different axes and should not be collapsed into one field.

## Decision Drivers

- `purpose` is a required baseline field, so its portable meaning must be defined.
- The vocabulary should be small enough for schemas, conformance fixtures, warning
  behavior, and policy engines to implement consistently.
- The vocabulary should cover common dependency-scope concepts across npm, Python
  packaging, Cargo, RubyGems/Bundler, and similar ecosystems.
- The field should support install-time warnings, policy checks, SBOM export,
  advisory matching, and human review without implying installation or resolution.
- The model should preserve future ecosystem-specific or tool-specific purposes
  without turning the baseline into free-form text.
- The model should follow the repository's existing pattern of small core
  vocabularies plus namespace-disciplined extension paths where open-ended growth
  is likely.

## Considered Options

- A — Use a closed fixed enum only.
- B — Use a core enum plus `other` and a free-form detail field.
- C — Use a core enum plus namespaced extension values.
- D — Use a fully free-form string.
- E — Define `purpose` as an SPDX-style package-purpose field.

## Decision Outcome

Chosen option: **C — Use a core enum plus namespaced extension values**, because it
gives baseline clients a stable portable vocabulary while preserving an orderly
extension path for ecosystem-specific dependency scopes.

Under this decision, `[[external-dependencies]].purpose` describes the declared use
context or dependency scope of the external package relative to the Agent Volumes
volume. It does not describe the external package's intrinsic software category.

The core `purpose` vocabulary is:

- `runtime` — needed when the volume's declared component behavior runs or loads.
- `build` — needed to build, generate, compile, package, or prepare volume content.
- `development` — needed for authoring, local development, linting, formatting, or
  maintenance workflows that are not part of runtime behavior.
- `test` — needed to run tests, validation, fixtures, or conformance checks for the
  volume or its components.
- `optional` — useful but not mandatory for the baseline declared behavior of the
  volume.
- `peer` — expected to be supplied by the host runtime, environment, or another
  package rather than installed as an ordinary dependency by the declaring volume's
  native package-manager workflow.
- `source` — used as source material, templates, generated-input material, or
  vendored-source reference rather than as an ordinary runtime package.
- `documentation` — used for documentation generation, examples, tutorials, or
  documentation-site workflows.
- `other` — a known dependency use context that does not fit the core vocabulary
  and is not represented by a namespaced extension value.

Extension values may be used when an external package ecosystem, toolchain, or
future profile needs a dependency purpose that is not in the core vocabulary.
Extension values use a namespace-prefixed string form:

```text
<namespace>:<purpose>
```

The namespace identifies the ecosystem, profile, organization, or tool family that
defines the extension value. Examples include `python:lint`, `ruby:benchmark`, or
`cargo:proc-macro-helper` if those meanings are defined by the corresponding
profile or ecosystem guidance.

Baseline validators must accept the core vocabulary. Baseline validators may
preserve, warn on, or profile-validate namespaced extension values according to
their implemented policy, but must not silently reinterpret an unknown extension
value as one of the core values. Baseline clients must preserve unknown extension
values when round-tripping manifests.

The `other` value is a portability escape hatch, not a replacement for the core
vocabulary. Authors should prefer a core value when one applies. Authors should
prefer a documented namespaced extension value over `other` when ecosystem-specific
semantics are intended to be machine-readable.

This decision does not add a separate `optional` boolean. The `optional` purpose
captures optional dependency context for the baseline declaration model. A future
profile may add a separate optionality or install-policy field if implementations
need to distinguish optionality from dependency use context more precisely.

This decision also does not define the final mappings to CycloneDX, SPDX,
advisory, warning, or policy outputs. Those mappings should treat `purpose` as a
dependency-scope or declared-use-context field. SPDX-style package-purpose values
remain separate SBOM export concerns.

## Consequences

- Good, because the required `purpose` field becomes schema-testable and
  conformance-testable.
- Good, because the core vocabulary covers common runtime, build, development,
  test, optional, peer, source, and documentation dependency contexts.
- Good, because warning, policy, advisory, and SBOM tooling can rely on a stable
  baseline set of values.
- Good, because namespaced extension values preserve room for ecosystem-specific
  meanings without making the field free-form.
- Good, because the decision avoids confusing dependency scope with PURL namespace
  or SPDX package purpose.
- Neutral, because extension values require additional profile or ecosystem
  documentation to become portable across implementations.
- Neutral, because `other` remains necessary for forward compatibility but should
  be discouraged for machine-actionable declarations.
- Bad, because a single `purpose` field cannot express every multi-axis dependency
  classification used by native package managers.
- Bad, because `optional` can be understood either as a dependency purpose or as an
  install-policy modifier, and the baseline chooses the simpler purpose meaning for
  now.
- Bad, because baseline clients need explicit unknown-extension handling rules
  rather than a pure closed enum.

## Confirmation

- Verify that future prose and schema additions define the core `purpose` values
  listed in this decision.
- Verify that examples use core values where possible, especially `runtime` for
  runtime package requirements.
- Verify that namespaced extension values are accepted or warned on according to a
  clear validation policy and are preserved during manifest round-tripping.
- Verify that `purpose` is not described as PURL namespace, npm package scope, or
  SPDX package purpose.
- Verify that future SBOM and advisory mappings treat `purpose` as dependency-scope
  metadata rather than resolved installation evidence.
- Verify that conformance fixtures include valid core values, invalid unnamespaced
  unknown values, and valid syntactic namespaced extension values.

## Pros and Cons of the Options

### A — Use a closed fixed enum only

- Good, because it is the simplest model to validate and document.
- Good, because all accepted values are portable across baseline implementations.
- Good, because policy, warning, advisory, and SBOM mapping logic remains compact.
- Bad, because real package ecosystems use additional dependency groups and
  conditional contexts that may not fit the fixed baseline.
- Bad, because adding a new purpose requires a specification revision.
- Bad, because implementers may encode ecosystem-specific semantics in unrelated
  fields or prose if the enum is too rigid.

### B — Use a core enum plus `other` and a free-form detail field

- Good, because the core enum remains portable while uncommon cases can still be
  represented.
- Good, because it is easy for authors to understand.
- Neutral, because `other` can be useful during early ecosystem experimentation.
- Bad, because free-form detail strings are weak inputs for policy, advisory, and
  SBOM automation.
- Bad, because the same meaning can be represented by many incompatible strings.
- Bad, because conformance can only test the core values and presence of detail,
  not shared semantics.

### C — Use a core enum plus namespaced extension values

- Good, because it balances a stable interoperable baseline with future extension.
- Good, because extension values can be owned and documented by ecosystems,
  profiles, organizations, or tool families.
- Good, because it matches existing Agent Volumes patterns for small core
  vocabularies and namespace-disciplined extensions.
- Good, because widely adopted extension values can later be promoted to the core
  vocabulary through the project's compatibility-bridge pattern.
- Neutral, because validators need explicit syntax and unknown-value behavior.
- Bad, because authors and validators must understand namespace discipline.

### D — Use a fully free-form string

- Good, because it maximizes author freedom.
- Good, because it avoids choosing vocabulary values before all ecosystems are
  studied.
- Bad, because it undermines meaningful machine-readable policy, warning, advisory,
  and SBOM behavior.
- Bad, because it makes conformance fixtures weak or impossible beyond string type
  checks.
- Bad, because it conflicts with the supply-chain visibility goals of ADR-0109 and
  the required-field decision in ADR-0111.

### E — Define `purpose` as an SPDX-style package-purpose field

- Good, because SPDX package purpose is an established SBOM-facing vocabulary.
- Good, because package-purpose values can be useful for inventory and reporting.
- Neutral, because SPDX-style purpose may still be useful in future SBOM mappings.
- Bad, because it describes what the package is rather than why the volume declares
  it as a dependency.
- Bad, because it does not distinguish runtime, build, development, test, optional,
  peer, source, or documentation dependency contexts.
- Bad, because it would not solve the warning, policy, and advisory prioritization
  use cases that motivated `purpose` in ADR-0111.

## More Information

Follow-up work should decide:

- the exact JSON Schema pattern for namespaced extension values
- whether extension namespaces reuse the existing reserved extension namespace list
  or receive a purpose-specific registry
- whether `other` requires a companion explanatory field in future profiles
- how `purpose` values map to CycloneDX, SPDX, advisory matching, warning severity,
  and policy defaults
- whether a future install-policy or optionality field is needed to separate
  optionality from dependency use context
