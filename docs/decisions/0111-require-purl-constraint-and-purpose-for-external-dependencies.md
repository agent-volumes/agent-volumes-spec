---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Require purl, constraint, and purpose for external dependencies

## Context and Problem Statement

ADR-0109 establishes a minimal external package dependency baseline for
machine-readable audit metadata. ADR-0110 then chooses `[[external-dependencies]]`
as the TOML shape for those declarations.

The remaining minimum-field question is: **which fields must every external
dependency declaration contain so that the declaration is useful for warnings,
policy checks, SBOM export, advisory matching, and human review without implying
that Agent Volumes installed or resolved the external package?**

The minimum field set must be small enough for authors to use consistently, but
complete enough to avoid empty security theater. A declaration that identifies a
package without its intended version range or reason for use is too weak for
meaningful supply-chain decisions.

## Decision Drivers

- External package declarations should identify the package across ecosystems.
- Declarations should represent author intent, not observed installation facts.
- Policy and advisory workflows need a version intent or constraint to evaluate
  whether a package requirement is relevant.
- Audit and SBOM workflows need to distinguish runtime requirements from build,
  development, optional, or other dependency purposes.
- Minimum fields should avoid redundant convenience data when Package URL already
  carries ecosystem, namespace, package name, and optional version information.
- The minimum field set should leave room for later component scoping, native
  manifest references, lockfile evidence, resolved facts, and digests.

## Considered Options

- A — Require only `purl`.
- B — Require `purl` and `constraint`.
- C — Require `purl`, `constraint`, and `purpose`.
- D — Require `purl`, `constraint`, `purpose`, and `optional`.
- E — Require decomposed fields such as `ecosystem`, `name`, and `version` instead
  of `purl`.
- F — Require resolved package facts such as resolved purl and digest.

## Decision Outcome

Chosen option: **C — Require `purl`, `constraint`, and `purpose`**, because this
is the smallest field set that records cross-ecosystem package identity, version
intent, and dependency role.

Under this decision, each `[[external-dependencies]]` record must contain:

- `purl` — the canonical Package URL-compatible identity for the external
  non-volume package dependency.
- `constraint` — the authored version requirement or ecosystem-native constraint
  expression for the external package.
- `purpose` — the declared reason the dependency is needed, such as runtime,
  build, development, optional, test, or advisory-oriented use.

Example:

```toml
[[external-dependencies]]
purl = "pkg:npm/@modelcontextprotocol/sdk"
constraint = "^1.12.0"
purpose = "runtime"
```

This decision does not define the final controlled vocabulary for `purpose`. It
does establish that the field is required and that its value must be suitable for
policy, warning, SBOM, and advisory workflows. A follow-up schema decision should
define whether `purpose` uses a small fixed vocabulary, a fixed vocabulary with
extension hooks, or a looser warning-based model.

The `constraint` field is an authored external-ecosystem requirement expression.
It does not use the Agent Volumes volume dependency SemVer range grammar by
default. A follow-up decision should define whether each external package
ecosystem uses native constraint syntax, opaque strings with ecosystem-specific
validation, or a future normalized companion representation.

A declaration's `purl`, `constraint`, and `purpose` fields do not prove that the
external package was installed, resolved, bundled, executed, or present at runtime.
Resolved purls, digests, native lockfile evidence, provenance observations, and
installation results remain future profile or schema work.

## Consequences

- Good, because every declaration has a cross-ecosystem package identity.
- Good, because policy and advisory workflows can reason about intended version
  requirements instead of package names alone.
- Good, because `purpose` lets clients and policy engines distinguish runtime risk
  from build, development, optional, test, or advisory-only context.
- Good, because the field set remains small and authorable.
- Good, because the decision avoids duplicating `ecosystem`, `namespace`, `name`,
  or `version` fields that can be derived from a parsed purl when present.
- Neutral, because `purpose` vocabulary and `constraint` grammar still need
  follow-up schema decisions.
- Neutral, because authors may need guidance for external ecosystems whose package
  identity or version syntax does not map cleanly to Package URL.
- Bad, because requiring `constraint` can be awkward for dependencies that are
  intentionally unbounded or discovered through native manifests only.
- Bad, because declarations can drift from native manifests or lockfiles until
  future reconciliation profiles are defined.
- Bad, because the baseline still does not provide resolved artifact identity or
  reproducible external package installation.

## Confirmation

- Verify that future prose and schema additions require `purl`, `constraint`, and
  `purpose` for each `[[external-dependencies]]` record.
- Verify that examples do not imply Agent Volumes installs or resolves the
  declared external package.
- Verify that `constraint` is not accidentally interpreted as the existing Agent
  Volumes volume dependency SemVer range grammar.
- Verify that `purpose` is defined by follow-up schema work before conformance
  fixtures depend on one vocabulary.
- Verify that future resolved-facts profiles can add resolved purl, digest,
  native-lockfile evidence, and provenance references without changing the
  required declaration fields.

## Pros and Cons of the Options

### A — Require only `purl`

- Good, because it is the smallest possible declaration.
- Good, because it identifies the external package across ecosystems.
- Bad, because package identity alone is too weak for version-aware policy or
  advisory matching.
- Bad, because it does not explain whether the dependency is runtime, build,
  development, optional, or otherwise contextual.
- Bad, because it risks becoming inventory theater rather than actionable audit
  metadata.

### B — Require `purl` and `constraint`

- Good, because it captures package identity and version intent.
- Good, because advisory matching and policy checks become more meaningful.
- Neutral, because it may be sufficient for simple runtime-only use cases.
- Bad, because it does not tell policy engines why the dependency exists.
- Bad, because build-only or development-only dependencies could be treated as
  runtime risk without additional context.

### C — Require `purl`, `constraint`, and `purpose`

- Good, because it captures identity, version intent, and dependency role.
- Good, because it is still compact enough for authors.
- Good, because it directly supports warning, policy, SBOM, and advisory workflows.
- Neutral, because `purpose` vocabulary still needs a concrete schema decision.
- Bad, because it is stricter than an identity-only declaration.

### D — Require `purl`, `constraint`, `purpose`, and `optional`

- Good, because optionality is useful for installation and policy diagnostics.
- Good, because clients can distinguish mandatory and optional external package
  requirements.
- Neutral, because optionality may become useful in a future profile.
- Bad, because optionality has ecosystem-specific semantics that may not map cleanly
  across npm, Python packaging, Cargo, and other ecosystems.
- Bad, because requiring it in the baseline adds complexity before component
  scoping and purpose vocabulary are settled.

### E — Require decomposed fields such as `ecosystem`, `name`, and `version` instead of `purl`

- Good, because decomposed fields can be easier for humans to read.
- Good, because schemas can validate each field independently.
- Bad, because it duplicates Package URL semantics and increases the chance of
  inconsistent identity serialization.
- Bad, because SBOM, SPDX, advisory, and provenance workflows already commonly use
  Package URL-compatible identities.
- Bad, because package identity can require namespace, qualifiers, and subpath
  semantics that are easier to preserve in purl form.

### F — Require resolved package facts such as resolved purl and digest

- Good, because it would provide stronger evidence for audit and reproducibility.
- Good, because it aligns with provenance systems that record observed materials.
- Neutral, because it is a strong candidate for a later stricter profile.
- Bad, because it exceeds the minimal declaration baseline chosen in ADR-0109.
- Bad, because resolved facts can vary by platform, package manager, lockfile,
  environment, and installation time.

## More Information

Follow-up work should decide:

- the controlled vocabulary or extension policy for `purpose`
- whether `constraint` is an opaque string or has ecosystem-specific validation
- how unbounded or intentionally unconstrained dependencies are represented
- whether `optional` is a baseline optional field or a later profile field
- how declaration fields map to CycloneDX, SPDX, provenance, warnings, and
  advisory matching
- how resolved purl, digest, native manifest references, and lockfile evidence are
  added without weakening the declaration baseline
