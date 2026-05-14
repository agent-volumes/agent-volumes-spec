---
status: accepted
date: 12026-05-14
decision-makers: Yunseo Kim
---

# Allow qualifiers in external dependency PURLs while forbidding versions and subpaths

## Context and Problem Statement

ADR-0111 requires every `[[external-dependencies]]` record to include a `purl`
field. ADR-0113 keeps version and range intent in the VERS `constraint` field.
ADR-0114 uses the canonical purl as part of the external dependency semantic key,
and ADR-0130 uses that semantic key as the stable link target for future resolved
evidence.

Those decisions leave a PURL shape question open: **for declaration-plane external
dependencies, which Package URL components are in the v0.1 baseline identity, and
which components belong only to future resolved evidence?**

Package URL supports optional `@version`, qualifiers, and subpath. In Agent
Volumes, `@version` overlaps with VERS constraints, and subpath can look like an
artifact or file-level reference. Qualifiers are more nuanced: some package types
do not have a single default registry or namespace authority, and a qualifier can
be necessary to distinguish two packages with the same type, namespace, and name
but different registries or repositories.

## Decision Drivers

- Declaration-plane external dependencies should identify package coordinates
  clearly without becoming resolved artifact evidence.
- VERS `constraint` should remain the only version or range channel for external
  dependency declarations.
- Resolved versions, digests, lockfile entries, and artifact/file references should
  remain future resolved-evidence concerns.
- Some Package URL types need qualifiers to avoid ambiguous package identity when
  no default registry or repository exists.
- Semantic keys should be stable and canonical, but not so restrictive that they
  collapse distinct packages from different registries into one declaration.
- JSON Schema should remain shallow; detailed Package URL validation and
  canonicalization belong to semantic validation and pinned upstream artifacts.

## Considered Options

- A — Allow only package-coordinate PURLs with type, optional namespace, and name;
  forbid version, qualifiers, and subpath.
- B — Allow full upstream-valid PURLs, including version, qualifiers, and subpath.
- C — Forbid PURL version and subpath, but allow qualifiers as part of declaration
  identity.
- D — Allow PURL version only when it matches or is contained by the VERS
  constraint.
- E — Leave version, qualifier, and subpath handling implementation-defined.

## Decision Outcome

Chosen option: **C — Forbid PURL version and subpath, but allow qualifiers as part
of declaration identity**, because it keeps version and resolved artifact evidence
out of the declaration purl while preserving enough Package URL expressiveness to
distinguish packages whose identity depends on registry or repository qualifiers.

Under this decision:

- External dependency `purl` values must be syntactically valid Package URLs.
- External dependency `purl` values must not use the Agent Volumes `volume` Package
  URL type.
- External dependency `purl` values must not include `@version`.
- External dependency `purl` values may include qualifiers accepted by the pinned
  Package URL baseline.
- External dependency `purl` values must not include subpath.
- Qualifiers in declaration-plane purls are identity qualifiers, not resolved
  evidence, policy metadata, lockfile metadata, provenance metadata, scanner
  metadata, or arbitrary extension fields.
- VERS `constraint` remains the only place for version or range intent in an
  external dependency declaration, including exact pins.
- Resolved versions, digests, download URLs, lockfile references, source archive
  paths, file-level paths, and provenance observations remain future
  resolved-evidence profile concerns.
- Semantic validation must canonicalize the purl, including qualifiers, according
  to the pinned Package URL baseline before using it in semantic keys.

This decision intentionally accepts a higher validation and conformance burden than
the package-coordinate-only baseline. The burden is justified because forbidding
qualifiers would make some declaration-plane package identities too ambiguous to be
useful or safe.

## Consequences

- Good, because version intent remains centralized in VERS constraints.
- Good, because declaration purls do not imply exact resolved package versions.
- Good, because subpath cannot be mistaken for an artifact/file-level resolved
  reference.
- Good, because qualifiers can disambiguate packages from registries or
  repositories that share names but not contents.
- Good, because future resolved-evidence profiles can still add exact versions,
  digests, lockfile references, and artifact paths without redefining declaration
  purls.
- Neutral, because validators need pinned Package URL behavior for qualifier
  parsing and canonicalization.
- Neutral, because Agent Volumes may initially validate qualifier syntax more
  strongly than qualifier semantics until pinned upstream baselines or
  compatibility tables mature.
- Bad, because conformance fixtures need additional valid and invalid qualifier
  cases.
- Bad, because semantic keys may differ by qualifier, which is intended for
  identity disambiguation but can surprise authors who expected name-only
  grouping.
- Bad, because allowing qualifiers creates a risk that authors misuse qualifiers as
  metadata unless prose and validation explain the boundary clearly.

## Confirmation

- Verify that draft 6 prose forbids `@version` in external dependency purls.
- Verify that draft 6 prose allows Package URL qualifiers in external dependency
  purls.
- Verify that draft 6 prose forbids subpath in external dependency purls.
- Verify that exact pins are represented through VERS `constraint`, not PURL
  `@version`.
- Verify that successful external dependency semantic keys include the canonical
  purl with qualifiers when qualifiers are present.
- Verify that fixture cases cover valid qualifier use, invalid qualifier syntax,
  disallowed `@version`, disallowed subpath, and qualifier-sensitive duplicate or
  conflict behavior.
- Verify that mapping and resolved-evidence prose do not treat qualifiers as proof
  of resolved package versions, digests, lockfile entries, or provenance facts.

## Pros and Cons of the Options

### A — Allow only package-coordinate PURLs with type, optional namespace, and name; forbid version, qualifiers, and subpath

- Good, because it is the simplest declaration-plane identity model.
- Good, because semantic keys are less likely to fragment by extra PURL
  components.
- Good, because validators and fixtures are easier to implement.
- Bad, because it cannot distinguish packages whose identity depends on a registry,
  repository, or other qualifier.
- Bad, because name-only ambiguity can make declaration-plane audit metadata too
  weak for ecosystems without a default registry.

### B — Allow full upstream-valid PURLs, including version, qualifiers, and subpath

- Good, because it maximizes Package URL expressiveness.
- Good, because it defers most shape questions to upstream Package URL behavior.
- Bad, because `@version` creates a second version channel beside VERS
  `constraint`.
- Bad, because subpath can look like artifact or file-level resolved evidence.
- Bad, because full PURL allowance increases semantic-key fragmentation and
  conformance burden.

### C — Forbid PURL version and subpath, but allow qualifiers as part of declaration identity

- Good, because it balances declaration-plane clarity with identity
  disambiguation.
- Good, because version and range intent remains in VERS.
- Good, because artifact/file-level references stay out of the declaration purl.
- Good, because distinct registries or repositories can remain distinct in
  semantic keys.
- Neutral, because qualifier semantic validation may be limited by upstream PURL
  type definitions and pinned baselines.
- Bad, because it is more complex than a package-coordinate-only baseline.

### D — Allow PURL version only when it matches or is contained by the VERS constraint

- Good, because exact pins can be written in a familiar PURL form.
- Good, because validators could detect some purl/constraint contradictions.
- Bad, because it still creates two version channels.
- Bad, because containment checks add complexity beyond declaration identity.
- Bad, because versioned purls are easy to misread as resolved evidence.

### E — Leave version, qualifier, and subpath handling implementation-defined

- Good, because implementations can accept whatever their Package URL libraries
  support.
- Good, because the core prose stays short.
- Bad, because semantic keys and duplicate detection become non-portable.
- Bad, because the same declaration can be valid in one implementation and invalid
  in another.
- Bad, because conformance cannot reliably test qualifier, version, or subpath
  behavior.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- Package URL upstream guidance changes qualifier semantics in a way that makes
  qualifier-bearing declaration purls unsuitable for stable identity keys.
- Multiple conforming implementations cannot produce compatible canonical purls for
  qualifier-bearing declarations.
- Qualifier misuse as arbitrary metadata becomes common enough that additional
  restrictions or an allowlist are needed.
- Future resolved-evidence profiles need subpath-like declaration identities rather
  than resolved artifact references.
- VERS or Package URL introduces a native pattern that cleanly combines package
  identity and version constraints without ambiguity.

## More Information

Follow-up work should decide:

- exact qualifier fixture cases for the external dependency validation suite
- whether any qualifier names are disallowed in declaration-plane purls because
  they imply resolved evidence rather than identity
- how pinned Package URL baselines identify type-specific qualifier behavior
- how diagnostics distinguish disallowed `@version`, disallowed subpath, invalid
  qualifier syntax, and qualifier/type incompatibility
