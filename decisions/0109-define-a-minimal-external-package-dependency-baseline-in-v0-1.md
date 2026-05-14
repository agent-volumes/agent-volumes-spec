---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Define a minimal external package dependency baseline in v0.1

## Context and Problem Statement

Agent Volumes already defines volume-level dependency declarations, component
dependency references, resolver-facing version index rows, and supply-chain trust
attachments for Agent Volumes releases. Those mechanisms currently address
dependencies whose package identity is an Agent Volumes `pkg:volume/...` identity.

However, agent components can depend on packages from other supply-chain
ecosystems. For example, a skill, tool, MCP server, hook, or LSP server can
instruct an agent or runtime to install and use packages from npm, PyPI, crates.io,
RubyGems, or other established package ecosystems. Those dependencies are not
volumes, but they are still relevant to install-time warnings, policy checks,
scanner inputs, SBOM export, advisory matching, and supply-chain review.

That leaves a boundary question: **should Agent Volumes treat external non-volume
package dependencies as opaque prose-only instructions, install and resolve them
itself, or standardize a minimal declaration model that makes them visible to
machines while leaving installation to their native package managers?**

## Decision Drivers

- Agent Volumes should make external dependency requirements visible to machines
  rather than hiding them in prose instructions.
- Supply-chain security should support meaningful audit, policy, SBOM, and
  advisory workflows instead of security theater.
- Existing package ecosystems already have native package managers, resolver
  semantics, lockfile conventions, installer behavior, and ecosystem-specific
  policy surfaces.
- Agent Volumes should avoid reimplementing npm, PyPI, Cargo, RubyGems, or other
  package-manager semantics in the v0.1 core.
- External package identity should align with existing supply-chain standards such
  as Package URL, CycloneDX, SPDX, and SLSA where appropriate.
- Declaration, resolution, installation, and observed provenance are distinct
  supply-chain facts and should not be collapsed into one field.

## Considered Options

- A — Keep external packages as prose-only installation instructions.
- B — Standardize explicit external package dependency declarations as audit
  metadata while leaving installation to native package managers.
- C — Standardize native manifest and lockfile references only.
- D — Standardize declared external dependencies plus resolved facts and digests.
- E — Standardize only a capability or policy signal that native package-manager
  installation is required.
- F — Standardize package-manager installation commands or adapter hooks.
- G — Make Agent Volumes clients resolve and install external packages directly.

## Decision Outcome

Chosen option: **B — Standardize explicit external package dependency declarations
as audit metadata while leaving installation to native package managers**, because
it preserves machine-readable supply-chain visibility without turning Agent
Volumes into a universal package manager.

Under this decision:

- External non-volume package dependencies are dependencies whose canonical package
  identity is not an Agent Volumes `pkg:volume/...` identity.
- Agent Volumes v0.1 treats external package installation as outside the
  responsibility of Agent Volumes itself, bibliothecas, and conforming clients.
- Installation, fetching, native lockfile interpretation, native resolver
  behavior, post-install behavior, and ecosystem-specific package-manager policy
  remain the responsibility of the relevant native ecosystem tooling or local
  runtime policy.
- Agent Volumes should standardize a manifest-level declaration surface for
  external package dependencies as audit metadata.
- External package dependency declarations should use Package URL-compatible
  identity where possible, such as `pkg:npm/...`, `pkg:pypi/...`, or
  `pkg:cargo/...`, while reserving exact field shape for follow-up schema work.
- The declaration surface is intended to support install-time warnings, policy
  checks, scanner inputs, SBOM export, advisory matching, and human review.
- A declared external dependency is not proof that the dependency was installed,
  resolved, executed, bundled, or present in a runtime environment.
- Resolved external package facts, digests, lockfile-derived evidence, and
  provenance observations may be standardized later as stronger profile or schema
  work, but they are not implied by the minimal declaration baseline.

This decision permanently rejects the prose-only model as the standard's long-term
posture. Component documentation may still include human-readable installation
instructions, but prose instructions are not a substitute for machine-readable
external dependency declarations when a volume depends on external packages.

## Consequences

- Good, because machines can discover external package requirements before load,
  install, execution, or policy evaluation.
- Good, because the standard can support meaningful warning, audit, SBOM export,
  advisory matching, and policy workflows for external packages.
- Good, because native package managers retain ownership of their own installer,
  resolver, lockfile, platform marker, feature, extras, peer dependency, and
  post-install semantics.
- Good, because Package URL gives Agent Volumes a cross-ecosystem identity layer
  without requiring one universal external-package resolver.
- Good, because declaration remains separate from observed resolution facts and
  provenance evidence.
- Neutral, because future schema work must define the exact manifest field shape,
  dependency classes, component scoping, and warning behavior.
- Neutral, because external dependency declarations may initially be incomplete
  until tooling learns to validate them against native manifests and lockfiles.
- Bad, because declared external dependencies can drift from native lockfiles or
  actual installed artifacts unless future profiles add stronger reconciliation
  checks.
- Bad, because policy engines and SBOM exporters must understand that declared
  dependencies are audit metadata, not resolved installation facts.
- Bad, because the minimal baseline does not by itself provide reproducible
  external package installation.

## Confirmation

- Verify that future manifest schema work distinguishes Agent Volumes dependencies
  from external non-volume package dependencies.
- Verify that external package dependency declarations do not imply Agent Volumes
  clients must install or resolve external packages.
- Verify that declared external dependencies can be exported to CycloneDX and SPDX
  without losing their non-volume package identity.
- Verify that advisory matching can use declared external package purls as policy
  or warning inputs without changing the existing volume-level advisory targeting
  baseline.
- Verify that scanner and policy workflows can consume declared external
  dependencies while still treating scanner-finding interchange and organization
  policy as local or future-profile concerns.
- Verify that future resolved-facts or native-lockfile profiles can be added
  without contradicting the minimal declaration baseline.

## Pros and Cons of the Options

### A — Keep external packages as prose-only installation instructions

- Good, because it keeps the core specification smallest in the short term.
- Good, because it avoids adding any new manifest schema surface.
- Bad, because machines cannot reliably discover external package requirements.
- Bad, because install-time audit, policy checks, SBOM export, and advisory
  matching become incomplete or dependent on ad hoc natural-language extraction.
- Bad, because hidden external dependencies undermine the standard's supply-chain
  security goals.

This option is permanently rejected as the standard's long-term posture.

### B — Standardize explicit external package dependency declarations as audit metadata while leaving installation to native package managers

- Good, because it provides machine-readable visibility without reimplementing
  external package ecosystems.
- Good, because it supports meaningful supply-chain review before installation or
  execution.
- Good, because it aligns with Package URL, CycloneDX, SPDX, and SLSA separation of
  identity, dependency relationships, and observed provenance facts.
- Good, because it leaves room for future stronger profiles that reconcile native
  manifests, lockfiles, resolved artifacts, and digests.
- Neutral, because exact schema and conformance fixtures still need follow-up work.
- Bad, because declarations alone do not prove what was installed.

### C — Standardize native manifest and lockfile references only

- Good, because it respects native package-manager source-of-truth files.
- Good, because it avoids translating ecosystem-specific constraints into an Agent
  Volumes-specific grammar.
- Neutral, because it can be useful as a future companion profile.
- Bad, because lockfile and manifest formats vary widely across ecosystems and
  package managers.
- Bad, because file references alone are less useful for cross-ecosystem advisory
  matching and policy checks than explicit package identities.

### D — Standardize declared external dependencies plus resolved facts and digests

- Good, because it would improve reproducibility, auditability, and SBOM fidelity.
- Good, because it aligns closely with provenance systems that record observed
  materials and resolved dependencies.
- Neutral, because it is a natural future profile once implementations have enough
  evidence.
- Bad, because resolved facts can be platform-specific, lockfile-specific, and
  time-sensitive.
- Bad, because it is heavier than the minimal visibility baseline needed now.

### E — Standardize only a capability or policy signal that native package-manager installation is required

- Good, because it gives users a coarse install-time risk signal.
- Good, because it can integrate with permission or runtime policy prompts.
- Bad, because it does not identify which packages are required.
- Bad, because it is too weak for SBOM export, advisory matching, and meaningful
  supply-chain audit.

### F — Standardize package-manager installation commands or adapter hooks

- Good, because it could improve automated setup UX.
- Good, because it can still delegate actual installation to native package
  managers.
- Bad, because command execution expands the security surface substantially.
- Bad, because command strings are less portable and harder to audit than
  structured dependency declarations.
- Bad, because it risks standardizing shell behavior, network behavior, and
  post-install execution policy prematurely.

### G — Make Agent Volumes clients resolve and install external packages directly

- Good, because it would provide a single orchestrated install experience.
- Good, because one client could theoretically enforce a uniform policy layer.
- Bad, because it would require Agent Volumes clients to reimplement complex native
  ecosystem semantics.
- Bad, because it conflicts with mature package-manager ownership in npm, PyPI,
  Cargo, RubyGems, and similar ecosystems.
- Bad, because it would make v0.1 substantially heavier and more fragile.

## More Information

Follow-up ADRs or schema work should decide:

- the exact manifest field name and shape for external package declarations
- whether declarations are volume-level only or can be scoped to individual
  components
- dependency classes such as runtime, build, development, optional, test, or
  advisory-only
- how to represent native ecosystem version constraints without pretending every
  ecosystem uses the Agent Volumes SemVer range grammar
- whether native manifest and lockfile references become a companion profile
- whether resolved external package facts and digests become a stricter profile
- conformance fixtures for valid and invalid external package purl declarations
- BOM, provenance, advisory, and warning mappings for declared external packages
