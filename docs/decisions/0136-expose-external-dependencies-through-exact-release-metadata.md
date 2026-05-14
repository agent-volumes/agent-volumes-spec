---
status: accepted
date: 12026-05-15
decision-makers: Yunseo Kim
---

# Expose external dependencies through exact release metadata

## Context and Problem Statement

ADR-0109 establishes external non-volume package dependencies as machine-readable
audit metadata while leaving installation, fetching, native lockfile
interpretation, native resolver behavior, and package-manager policy to native
ecosystem tooling or local runtime policy.

ADR-0116 places `[[external-dependencies]]` records in the declaration plane, not
the resolved-evidence plane. ADR-0131 requires exported external dependencies to
remain declaration-only relationships. ADR-0135 defines advisory intersections
with declaration-plane external dependencies as declaration-only potential
exposure diagnostics, not confirmed vulnerable installed-component findings.

Those decisions leave a registry/API exposure question: **where should
bibliothecas expose external dependency declarations so clients, policy tools,
SBOM exporters, and advisory tooling can consume them without turning them into
resolver inputs, search guarantees, or resolved package evidence?**

## Decision Drivers

- External dependency declarations should be visible to machines before install,
  load, trust evaluation, SBOM export, or policy review.
- The exposure surface must preserve declaration-only semantics and must not imply
  resolution, installation, bundling, execution, or runtime presence.
- Exact release metadata is the authoritative per-release API surface in v0.1;
  clients still fetch it before installation or trust evaluation.
- Version index rows are resolver inputs for Agent Volumes dependencies and
  lifecycle candidate pruning, not complete release records.
- Search is a discovery surface with bibliotheca-local ranking and filtering
  semantics, not a resolver or completeness guarantee.
- Advisory read/discovery is portable in v0.1, while advisory write and moderation
  workflows remain bibliotheca-local.
- Capability metadata should remain a narrow registry-level discovery surface, not
  a general negotiation framework for scanners, resolvers, or package managers.

## Considered Options

- A — Validate external dependency declarations only in manifests; do not expose
  them in the registry API.
- B — Validate declarations and expose them through exact release metadata or an
  exact-release manifest-summary field.
- C — Include external dependency summaries in version index rows.
- D — Standardize external dependency search and filter indexing.
- E — Add a dedicated advisory diagnostics API for declaration-only external
  dependency potential exposure.
- F — Advertise external dependency support through capability metadata only.
- G — Use validation plus exact release metadata as the core boundary, with narrow
  capability advertisement for optional enhanced surfaces.

## Decision Outcome

Chosen option: **G — Use validation plus exact release metadata as the core
boundary, with narrow capability advertisement for optional enhanced surfaces**,
because it makes declarations available at the authoritative per-release boundary
without contaminating resolver, search, advisory, or trust-evidence surfaces.

Under this decision:

- Bibliothecas MUST validate `[[external-dependencies]]` declarations as part of
  manifest validation when publishing, consuming, or serving manifests under the
  draft 6 external dependency model.
- Exact release metadata MUST expose the release's external dependency
  declarations, or an equivalent manifest-derived exact-release declaration
  summary, when the release manifest contains such declarations.
- Exact release metadata exposure MUST preserve the declaration-only nature of each
  external dependency record.
- Exact release metadata exposure MUST NOT claim that an external package was
  resolved, fetched, installed, bundled, executed, verified, incorporated into the
  release, or present at runtime.
- Exact release metadata exposure MUST NOT include resolved external package
  versions, package digests, native lockfile evidence, provenance observations,
  scanner findings, or runtime inventory unless a future resolved-evidence profile
  defines those fields outside the declaration item.
- Version index rows MUST NOT include external dependency declarations in the v0.1
  portable baseline.
- Search and filtering by external dependency identity, ecosystem, purpose, or
  component scope remain bibliotheca-local discovery features in v0.1 and MUST NOT
  be required for portable conformance.
- If a bibliotheca implements external dependency search or filters, clients MUST
  treat those results as discovery hints only and MUST NOT use them as a substitute
  for exact release metadata.
- Advisory read/discovery payloads MAY reference declaration-only potential
  exposure diagnostics only when a future diagnostic carrier decision defines the
  field shape. Until then, advisory potential exposure remains a client, policy,
  or conformance diagnostic derived from exact release declarations and advisory
  inputs, not a new required API surface.
- Capability metadata MAY advertise non-core external dependency capabilities such
  as external dependency search, filtering, or registry-side potential-exposure
  diagnostics. Such flags MUST be narrow capability signals and MUST NOT imply
  native package-manager resolution, scanner interchange, confirmed vulnerability
  evidence, or universal search completeness.

This decision makes exact release metadata the portable API exposure boundary for
external dependency declarations. Manifest validation remains the authoring and
publish-time validation boundary. Mapping and SBOM export continue to use the
declaration-only relationship semantics from ADR-0131 and ADR-0132.

## Consequences

- Good, because clients can discover external dependency declarations through the
  same authoritative release surface they already fetch before installation or
  trust evaluation.
- Good, because the declaration remains release-scoped and tied to the manifest
  that produced it.
- Good, because version index rows stay focused on Agent Volumes resolver inputs
  and lifecycle candidate pruning.
- Good, because search remains discovery-oriented and bibliotheca-local rather
  than becoming a portable dependency-intelligence index.
- Good, because capability metadata can still advertise optional enhanced support
  without making those enhancements part of the core baseline.
- Neutral, because exact release metadata becomes larger when a release declares
  many external dependencies.
- Neutral, because bibliothecas must preserve or derive external dependency
  declaration summaries from the validated manifest.
- Bad, because clients that want early warning before exact release fetch cannot
  rely on version index rows for external dependency information in the v0.1 core.
- Bad, because registry-wide analytics and dependency search remain
  implementation-specific unless future evidence justifies standardizing them.

## Confirmation

- Verify that draft 6 prose describes exact release metadata as the portable API
  exposure boundary for external dependency declarations.
- Verify that `release-metadata.schema.json` or an equivalent exact-release
  companion schema can carry declaration-only external dependency summaries without
  resolved evidence fields.
- Verify that `version-index-row.schema.json` does not add external dependency
  declarations in the v0.1 baseline.
- Verify that search prose states external dependency indexing and filtering are
  bibliotheca-local discovery features unless a future ADR standardizes them.
- Verify that capability metadata, if extended, advertises only narrow external
  dependency support signals and does not become a scanner, resolver, package
  manager, or search-negotiation framework.
- Verify that conformance fixtures distinguish exact release metadata exposure from
  version index rows, search results, advisory payloads, and trust evidence.

## Pros and Cons of the Options

### A — Validate external dependency declarations only in manifests; do not expose them in the registry API

- Good, because it keeps the registry API smallest.
- Good, because it strongly avoids resolver, search, and advisory overreach.
- Bad, because clients and policy tools must retrieve and parse the manifest or
  release artifact before seeing external dependency declarations.
- Bad, because install-time warnings, SBOM export, and advisory prechecks become
  less useful before release retrieval.
- Bad, because machine-readable declaration visibility is weakened even though
  ADR-0109 rejects prose-only dependency visibility.

### B — Validate declarations and expose them through exact release metadata or an exact-release manifest-summary field

- Good, because exact release metadata is already authoritative for release
  validation.
- Good, because clients already fetch exact release metadata before installation or
  trust evaluation.
- Good, because declaration-only external dependencies remain release-scoped rather
  than becoming registry-wide facts.
- Good, because the approach supports warnings, policy checks, SBOM export, and
  advisory prechecks without adding resolver semantics.
- Neutral, because exact metadata payloads become larger.
- Bad, because clients cannot see the declarations until they fetch exact release
  metadata.

### C — Include external dependency summaries in version index rows

- Good, because clients could see external dependency declarations earlier during
  candidate discovery.
- Good, because package-scoped indexes can be cached or incrementally refreshed.
- Neutral, because this may be useful for a future warning-optimized or enterprise
  policy profile.
- Bad, because version index rows are resolver inputs and would make
  declaration-only metadata look like candidate-pruning or dependency-graph facts.
- Bad, because index rows would duplicate more release metadata and increase
  inconsistency risk.
- Bad, because large external dependency sets would bloat a surface meant for
  version candidate enumeration.

### D — Standardize external dependency search and filter indexing

- Good, because users could discover volumes that declare a dependency on a given
  external package, ecosystem, purpose, or component scope.
- Good, because registry analytics and security review workflows could become more
  convenient.
- Neutral, because individual bibliothecas may still offer this locally.
- Bad, because search result ordering, ranking, and text relevance are already
  bibliotheca-local in v0.1.
- Bad, because portable search/filter semantics would imply completeness and
  normalization guarantees the v0.1 core does not otherwise require.
- Bad, because it risks turning bibliothecas into dependency-intelligence services
  before enough implementation experience exists.

### E — Add a dedicated advisory diagnostics API for declaration-only external dependency potential exposure

- Good, because potential exposure warnings could be retrieved directly and shown
  prominently.
- Good, because security and policy tooling could consume one focused diagnostic
  surface.
- Neutral, because this may become valuable once diagnostic carrier semantics are
  settled.
- Bad, because it risks standardizing advisory matching policy, scanner behavior,
  and diagnostic lifecycle too early.
- Bad, because diagnostics may be mistaken for confirmed vulnerable installed-
  component findings unless the carrier is carefully designed.
- Bad, because ADR-0135 already leaves exact diagnostic field names and warning
  categories as follow-up work.

### F — Advertise external dependency support through capability metadata only

- Good, because capability metadata is the existing registry-level discovery
  surface for API availability.
- Good, because optional enhanced features such as search or registry-side
  diagnostics can be advertised without making them mandatory.
- Bad, because capability flags alone do not expose the declarations themselves.
- Bad, because too many capability flags would turn the narrow capability document
  into a negotiation framework.
- Bad, because external dependency validation should follow from spec compatibility,
  not from an optional flag that weakens baseline expectations.

### G — Use validation plus exact release metadata as the core boundary, with narrow capability advertisement for optional enhanced surfaces

- Good, because it combines the mandatory authoring/validation boundary with the
  authoritative per-release API exposure boundary.
- Good, because it keeps version index, search, advisory, and trust evidence
  surfaces semantically clean.
- Good, because it allows future enhanced registry features without making them
  portable v0.1 requirements.
- Neutral, because clients still need exact release metadata before seeing external
  dependencies in the portable baseline.
- Bad, because registries that want dependency search or centralized potential-
  exposure diagnostics must define those features locally or wait for future
  profiles.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- Multiple independent clients demonstrate that exact release metadata exposure is
  too late for practical install-time policy and that earlier external dependency
  visibility materially improves safety without confusing resolver semantics.
- Multiple bibliothecas independently converge on compatible version-index summaries
  for declaration-only external dependencies, including freshness and inconsistency
  handling that does not interfere with Agent Volumes dependency resolution.
- Large-scale registries demonstrate a need for portable external dependency search
  or filtering and can define completeness, normalization, pagination, and ranking
  semantics without contradicting search's discovery-only role.
- Agent Volumes standardizes a diagnostic carrier for declaration-only potential
  exposure that can be exposed through advisory read/discovery without implying
  confirmed vulnerability evidence.
- A resolved-evidence profile is adopted and creates a separate need to expose
  confirmed external dependency facts through exact metadata, advisory diagnostics,
  trust artifacts, or another API surface.
- Capability metadata starts carrying enough external dependency flags that the
  narrow capability model becomes insufficient and a profile negotiation model is
  needed.
- Implementations show that very large external dependency declaration sets make
  exact release metadata too large for ordinary clients and require a paginated or
  separately linked exact-release declaration view.

If these triggers are met, future ADRs should evaluate at least version-index
summary exposure, portable search/filter profiles, advisory diagnostic carriers,
and paginated exact-release declaration views while preserving the declaration
plane versus resolved-evidence-plane distinction.

## More Information

Follow-up work should decide:

- the exact `release-metadata.schema.json` field name and object shape for external
  dependency declarations or declaration summaries
- whether exact release metadata embeds declarations directly or links to a
  same-release manifest-summary resource
- capability metadata field names for optional external dependency search,
  filtering, or registry-side potential-exposure diagnostics
- conformance fixtures that prove external dependencies are present in exact
  release metadata and absent from version index rows
- API prose and OpenAPI updates that keep search and advisory diagnostics out of the
  portable baseline until future decisions standardize them
