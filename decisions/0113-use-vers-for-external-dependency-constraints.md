---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Use VERS for external dependency constraints

## Context and Problem Statement

ADR-0109 establishes that Agent Volumes should declare external non-volume package
dependencies as machine-readable audit metadata while leaving installation,
resolution, native manifests, lockfiles, and package-manager policy to the relevant
native ecosystem tooling. ADR-0110 chooses `[[external-dependencies]]` as the TOML
shape. ADR-0111 requires each declaration to include `purl`, `constraint`, and
`purpose`. ADR-0112 defines the `purpose` vocabulary and extension model.

ADR-0111 intentionally leaves the `constraint` grammar unresolved. The remaining
question is: **should `constraint` preserve each ecosystem's native authored
requirement string, use a profile-specific validation model, or use a shared
cross-ecosystem range expression suitable for policy, advisory matching, and SBOM
mapping?**

Because Agent Volumes does not install or resolve external packages, the native
package-manager manifest remains the authoritative place for installer-facing
constraints. The `volume.toml` external dependency declaration has a different
purpose: to make external package requirements visible to machines for
cross-ecosystem audit, install-time warnings, policy checks, SBOM export, advisory
matching, and human review.

## Decision Drivers

- Agent Volumes should not redefine npm, PyPI, Cargo, RubyGems, or other native
  package-manager requirement grammars.
- Native package-manager manifests and lockfiles remain authoritative for external
  package installation and resolution.
- The `constraint` field is audit metadata in the volume manifest, not an installer
  command and not a native manifest replacement.
- Policy, advisory matching, SBOM export, and cross-ecosystem review need a
  consistent machine-readable range expression rather than unstructured prose or
  ecosystem-specific strings.
- Existing Package URL work already provides VERS for version range expressions
  associated with package ecosystems.
- Delegating range-expression semantics to VERS reduces the amount of
  ecosystem-specific version logic Agent Volumes must define.
- Authored constraints, resolved versions, native lockfile evidence, and provenance
  observations remain distinct facts and should not be collapsed into one field.

## Considered Options

- A — Treat `constraint` as an opaque authored string.
- B — Treat `constraint` as an ecosystem-native requirement string validated by
  purl type or profile.
- C — Use VERS as the manifest `constraint` expression.
- D — Keep an authored native `constraint` and add an optional normalized VERS
  companion field.
- E — Define an Agent Volumes-specific cross-ecosystem constraint grammar.

## Decision Outcome

Chosen option: **C — Use VERS as the manifest `constraint` expression**, because
VERS is the appropriate existing cross-ecosystem range-expression layer for the
audit, policy, advisory, and SBOM goals of `[[external-dependencies]]`.

Under this decision:

- `[[external-dependencies]].constraint` contains a VERS-compatible version range
  expression for the package identified by `purl`.
- The VERS expression is the normative machine-readable constraint carried by the
  Agent Volumes manifest for external dependency audit metadata.
- The VERS scheme must be compatible with the package ecosystem identified by the
  dependency's `purl` type.
- Agent Volumes does not reinterpret VERS semantics into its own SemVer range
  grammar.
- Agent Volumes does not require native package-manager manifests to use VERS.
- Agent Volumes does not require clients, bibliothecas, or validators to install,
  resolve, or fetch the external package based on the VERS expression.
- Native package-manager manifests, lockfiles, installer behavior, and resolver
  behavior remain outside the Agent Volumes portable baseline except where future
  profiles explicitly define reconciliation checks.

Example:

```toml
[[external-dependencies]]
purl = "pkg:npm/@modelcontextprotocol/sdk"
constraint = "vers:npm/>=1.12.0|<2.0.0"
purpose = "runtime"
```

The VERS expression represents the volume author's audit-facing declaration of
the external package requirement. It does not prove that the package was resolved,
installed, executed, bundled, or present in any runtime environment.

If the same component also carries a native package-manager manifest or prose
instructions, those native constraints remain installer-facing source material.
Future tooling may compare native constraints against the VERS declaration and
emit diagnostics, but that reconciliation is not part of this decision.

This decision also means that ecosystem-specific native requirement strings should
not be placed directly in `constraint` unless they are valid VERS expressions for
the relevant ecosystem. A future profile may add fields for native-manifest
references, native-authored requirement strings, lockfile evidence, or resolved
facts without changing the baseline meaning of `constraint`.

## Consequences

- Good, because `constraint` becomes a single cross-ecosystem machine-readable
  expression suitable for policy, advisory matching, warning behavior, and SBOM
  mapping.
- Good, because Agent Volumes delegates range-expression semantics to VERS instead
  of standardizing native package-manager grammars itself.
- Good, because the volume manifest remains audit-facing metadata rather than an
  installer-facing native package manifest.
- Good, because the decision avoids applying the Agent Volumes volume dependency
  SemVer range grammar to npm, PyPI, Cargo, RubyGems, or other external ecosystems.
- Good, because future schema and conformance fixtures can validate VERS-shaped
  strings without needing to implement every native resolver.
- Neutral, because authoring tools may need to translate native manifest
  constraints into VERS for volume manifest publication.
- Neutral, because not every external ecosystem may have equally mature VERS
  scheme guidance at the same time.
- Bad, because hand-authored manifests become less convenient for authors who only
  know native package-manager requirement syntax.
- Bad, because drift can still occur between native package-manager manifests and
  the VERS audit declaration until future reconciliation profiles are defined.
- Bad, because implementers must understand enough VERS syntax to validate the
  baseline field.

## Confirmation

- Verify that future prose and schemas define `constraint` as a VERS-compatible
  expression, not as the Agent Volumes constrained SemVer range grammar.
- Verify that examples use VERS syntax for external dependency constraints.
- Verify that validators reject native requirement strings in `constraint` when
  they are not valid VERS expressions for the relevant package ecosystem.
- Verify that clients and bibliothecas do not treat VERS constraints as install or
  resolution instructions for external packages.
- Verify that future SBOM and advisory mappings use the VERS declaration as
  audit-facing range metadata and keep resolved versions separate.
- Verify that future native-manifest, lockfile, resolved-facts, or provenance
  profiles can be added without changing the baseline `constraint` meaning.

## Pros and Cons of the Options

### A — Treat `constraint` as an opaque authored string

- Good, because it can preserve any native ecosystem requirement syntax.
- Good, because baseline schemas only need to validate that a string is present.
- Bad, because policy checks, advisory matching, and SBOM mapping cannot rely on a
  shared machine-readable range expression.
- Bad, because invalid or malformed native constraints are hard to distinguish from
  valid but unknown expressions.
- Bad, because the field becomes weaker than its required status in ADR-0111
  suggests.

### B — Treat `constraint` as an ecosystem-native requirement string validated by purl type or profile

- Good, because it respects native package-manager syntax directly.
- Good, because ecosystem-specific validators can be accurate when available.
- Neutral, because this approach resembles existing profile-specific compatibility
  handling in the specification.
- Bad, because Agent Volumes would need to define or reference many native grammar
  profiles to achieve portable behavior.
- Bad, because implementations would vary based on which ecosystem validators they
  include.
- Bad, because cross-ecosystem policy and advisory tooling would still need to
  normalize heterogeneous native strings.

### C — Use VERS as the manifest `constraint` expression

- Good, because VERS exists specifically to express version ranges across package
  ecosystems.
- Good, because it keeps native package-manager installation outside Agent Volumes
  while making audit metadata more machine-actionable.
- Good, because advisory matching and SBOM mapping can use one standard range
  expression layer.
- Good, because Agent Volumes can delegate ecosystem-specific range-expression
  semantics to VERS rather than inventing its own.
- Neutral, because tooling needs VERS support.
- Bad, because authors may need translation from native constraints to VERS.

### D — Keep an authored native `constraint` and add an optional normalized VERS companion field

- Good, because it preserves native authored syntax and provides a normalized range
  when available.
- Good, because it can support gradual migration from native strings to VERS.
- Neutral, because it may be useful in future reconciliation profiles.
- Bad, because it adds field duplication and drift risk.
- Bad, because policy engines need precedence rules when native and normalized
  constraints disagree.
- Bad, because the minimal baseline becomes heavier than necessary.

### E — Define an Agent Volumes-specific cross-ecosystem constraint grammar

- Good, because the specification would be self-contained.
- Good, because schemas and conformance fixtures could target one grammar.
- Bad, because it would duplicate or compete with VERS.
- Bad, because it would force Agent Volumes to model ecosystem-specific version
  semantics that it otherwise delegates to native tooling and existing standards.
- Bad, because it would increase v0.1 scope while solving a problem already covered
  by the Package URL standards ecosystem.

## More Information

Follow-up work should decide:

- the exact JSON Schema pattern or reference strategy for VERS validation
- whether conformance fixtures include only syntactic VERS validation or also
  ecosystem-specific VERS examples
- how to report diagnostics when `purl` type and VERS scheme disagree
- how to map VERS constraints to CycloneDX, SPDX, OSV, warnings, and policy outputs
- whether future profiles add native manifest references, native authored
  requirement strings, lockfile evidence, resolved purls, or digests
- whether future reconciliation profiles compare native package-manager constraints
  against the VERS manifest declaration
