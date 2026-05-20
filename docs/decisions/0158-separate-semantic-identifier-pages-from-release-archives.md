---
status: accepted
date: 12026-05-20
decision-makers: Yunseo Kim
consulted: ADR-0156, ADR-0157, `site/` Mintlify source tree, IETF RFC 8820, IETF RFC 9457, W3C Cool URIs for the Semantic Web, W3C URI Usage Primer, W3C JSON-LD 1.1 Recommendation, JSON Schema 2020-12 Core, JSON Schema 2020-12 release notes
---

# Separate semantic identifier pages from release archives

## Context and Problem Statement

ADR-0156 assigns rendered documentation to `docs.agentvolumes.org` and reserves
`agentvolumes.org/spec/*` as apex aliases for versioned specification archive
pages. ADR-0157 then classifies release-specific specification, API, schema,
conformance, published identifier, and Problem Details pages as archive content
under immutable `/spec/<version>/...` paths.

That model works for release archive pages and JSON Schema `$id` URLs whose
identity intentionally includes the full specification release. It is less clear
for Agent Volumes-owned semantic identifiers whose own versioning axis is not the
same as the rendered prose release path. Examples include:

- `https://agentvolumes.org/build/manual/v0.1`
- `https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#`
- `https://agentvolumes.org/contexts/spdx-external-dependency-declarations-v0.1.jsonld`
- `https://agentvolumes.org/predicates/external-dependency-declarations/v0.1`
- `https://agentvolumes.org/problems/<slug>`

If those semantic identifiers redirect directly to a single release archive page,
the identifier can appear to be bound to that exact release, such as
`0.1.0-rc.1`, even when the identifier's own lifecycle is the broader `v0.1`
semantic line or an unversioned stable problem type.

External standards and standards-adjacent ecosystems use several patterns that
separate durable identifiers from rendered documentation locations:

- IETF URI design guidance in RFC 8820 cautions against over-constraining URI
  structure in specifications. URI owners can choose stable public paths, but the
  path structure should not become an accidental protocol boundary unless the
  specification explicitly makes it one.
- W3C Cool URIs and the W3C URI Usage Primer distinguish the thing identified by
  a URI from the document that describes it. For non-document resources, a stable
  identifier can resolve to a description document through redirect or content
  negotiation. Hash namespaces are also common for small vocabularies whose term
  identifiers share one namespace base.
- JSON-LD treats remote contexts as dereferenceable processor inputs with
  processor-level version signaling such as `@version`. This favors a stable
  canonical remote context URL for each semantic context version, with release
  archive copies preserved separately for audit.
- JSON Schema treats `$id` as the canonical URI for a schema resource. That
  supports release-scoped schema artifact IDs when the schema artifact itself is
  what the URI identifies.
- RFC 9457 treats the Problem Details `type` URI as the primary machine-readable
  problem type identifier and recommends dereferenceable human documentation for
  HTTP(S) type URIs. The problem type URI should remain stable as long as the
  problem semantics remain compatible.

Those examples suggest that Agent Volumes should distinguish three axes that were
previously close together in the site tree: immutable release archive URLs,
release-scoped artifact identifiers, and semantic identifiers with their own
compatibility boundary.

The question is: **should semantic identifier URIs resolve to release archive
pages directly, or to stable identifier landing pages that link to the release
archives defining and documenting them?**

## Decision Drivers

- JSON Schema `$id` URLs identify immutable release-scoped schema artifacts and
  should continue to include the full specification release path.
- Semantic identifiers should remain stable when a patch release only clarifies
  documentation without changing identifier semantics.
- Identifier version segments such as `v0.1` should not be confused with full
  Agent Volumes prose release versions such as `0.1.0-rc.1` or `0.1.1`.
- Problem Details `type` URIs are primary machine-readable identifiers and should
  stay stable as long as the problem semantics remain compatible.
- Release archive pages should remain reproducible snapshots of a release, not
  the only canonical dereference target for semantic identifiers.
- Public URI resolution should follow mature standards practice: keep
  identifiers stable, separate the described thing from its human description
  page where useful, and mint new identifiers for incompatible semantic changes.
- The site should make clear when a version segment is part of a semantic
  identifier line, such as `v0.1`, and when a version segment names a rendered
  release archive, such as `0.1.0-rc.1`.

## Considered Options

- A — Keep redirecting semantic identifier routes directly to the current release
  archive page.
- B — Publish stable semantic identifier landing pages outside `/spec/<version>/`,
  and link those pages to the release archives and canonical repository artifacts.
- C — Move all identifier documentation out of release archives and keep only
  stable identifier pages.

## Decision Outcome

Chosen option: **B — Publish stable semantic identifier landing pages outside
`/spec/<version>/`, and link those pages to the release archives and canonical
repository artifacts**.

Under this decision:

- This decision refines ADR-0157 without replacing its release archive
  preservation requirement. Stable semantic dereference targets are additive to,
  not substitutes for, release archive copies.
- JSON Schema `$id` URLs remain release-scoped under
  `https://agentvolumes.org/spec/<version>/schemas/<artifact>`.
- JSON-LD remote context URLs use stable independently versioned context paths,
  such as `https://agentvolumes.org/contexts/<context-name>-v0.1.jsonld`, while
  release archives preserve byte-identical copies under
  `/spec/<version>/contexts/...`.
- Release archive pages remain under `https://docs.agentvolumes.org/spec/<version>/...`
  and apex `https://agentvolumes.org/spec/*` aliases continue to redirect to the
  corresponding docs-host archive pages.
- Semantic identifier routes outside `/spec/<version>/`, including `build/`,
  `ns/`, `predicates/`, and `problems/`, resolve to stable landing pages for the
  identifier itself.
- Stable semantic identifier landing pages explain the identifier, its semantic
  version or slug, compatibility boundary, canonical source artifacts, and the
  release archive pages that currently define or clarify it.
- A patch release may update a stable identifier landing page to link to the
  latest clarifying archive when the identifier semantics do not change.
- Incompatible semantic changes require a new identifier version, slug, or URI;
  they must not silently redefine an existing semantic identifier.
- `/latest`, `/current`, and similar routes remain movable convenience aliases and
  must not be used as canonical identifiers.

## Consequences

- Good, because stable identifier URIs no longer appear bound to a single release
  candidate archive when their semantic lifecycle is broader than that archive.
- Good, because patch releases can add clarifications while preserving stable
  `v0.1` or problem-type identifiers.
- Good, because JSON Schema `$id` immutability remains explicit and unchanged.
- Good, because dereferencing a Problem Details `type` URI returns a page for the
  type URI itself rather than a release-snapshot-only page.
- Neutral, because the site now has a small set of unversioned semantic landing
  pages in addition to versioned release archive pages.
- Bad, because maintainers must keep stable identifier pages and release archive
  pages cross-linked without implying that site prose overrides canonical
  repository artifacts.

## Confirmation

- Verify that `/build/manual/v0.1` resolves to a stable landing page and links to
  the release archive page for the current defining release.
- Verify that `/predicates/external-dependency-declarations/v0.1` resolves to a
  stable landing page and links to the release-scoped predicate schema `$id`.
- Verify that `/ns/spdx/external-dependency-declarations/v0.1` resolves to a
  stable namespace landing page and documents that fragment identifiers name
  namespace terms.
- Verify that `/problems/<slug>` resolves to stable Problem Details landing pages
  and that the archived v0.1 problem set remains available under
  `/spec/<version>/problems/...`.
- Verify that schema `$id` URLs continue to use full release paths and remain
  immutable publication artifacts.
- Verify that `mint validate`, `mint broken-links`, markdown lint, and artifact
  validation pass after route changes.

## Pros and Cons of the Options

### A — Keep redirecting semantic identifier routes to release archive pages

- Good, because it keeps the public site small and avoids maintaining separate
  identifier landing pages.
- Good, because every identifier route lands on release-specific documentation
  that can be audited against a frozen release archive.
- Neutral, because non-permanent redirects can be changed later if the route model
  proves confusing.
- Bad, because a semantic identifier such as `/build/manual/v0.1` can appear to be
  bound to one exact release archive such as `/spec/0.1.0-rc.1/...`.
- Bad, because patch releases that clarify the same `v0.1` semantics would need
  either a moving redirect or duplicate release pages as the apparent primary
  identifier documentation.
- Bad, because unversioned Problem Details `type` URIs would dereference to a
  release snapshot instead of a page for the problem type URI itself.

### B — Publish stable semantic identifier landing pages

- Good, because it separates identifier stability from release archive
  immutability.
- Good, because JSON Schema `$id` URLs can remain release-scoped while build type,
  namespace, JSON-LD context, predicate, and problem type identifiers use their own
  compatibility boundaries.
- Good, because patch releases can clarify an existing semantic identifier by
  adding archive links without changing the identifier meaning.
- Good, because the model follows the external ecosystem pattern of stable
  identifiers resolving to description documents while preserving immutable
  archived specifications.
- Neutral, because maintainers must classify each owned URI as a schema artifact,
  semantic identifier, release archive page, or movable alias before publishing.
- Bad, because stable landing pages and release archives must be kept cross-linked
  and release evidence must verify both surfaces.

### C — Move all identifier documentation out of release archives

- Good, because each identifier has one visible public page outside the release
  tree.
- Neutral, because it can work for evergreen registries whose identifier semantics
  are independent of specification releases.
- Bad, because implementers and auditors would lose a complete release-specific
  rendered snapshot of published identifier documentation.
- Bad, because it conflicts with ADR-0157's requirement to archive
  release-specific specification, API, artifact, conformance, and published
  identifier documentation under `/spec/<version>/...`.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- The hosting platform cannot serve stable semantic landing pages at the required
  identifier routes.
- A formal standards publication process requires all identifier documentation to
  live only under release archive paths.
- Agent Volumes adopts a dedicated specification host where semantic identifier
  resolution and release archives can be represented with a simpler route model.
- Release evidence shows repeated drift between stable semantic landing pages,
  release archive pages, and canonical repository artifacts.

## More Information

- ADR-0156 hosts rendered documentation on `docs.agentvolumes.org` with apex
  `/spec/*` aliases.
- ADR-0157 defines the hybrid unversioned/current navigation and immutable release
  archive model.
- RFC 8820, "URI Design and Ownership", explains why URI structure should not be
  over-specified by parties that do not own the URI space and why path structure
  should not become accidental protocol semantics.
- W3C Cool URIs for the Semantic Web describes hash URI and 303 redirect patterns
  for keeping identifiers stable while serving separate description documents.
- The W3C URI Usage Primer explains the distinction between a URI used to identify
  a resource and the representation returned when that URI is dereferenced,
  including namespace document patterns.
- JSON-LD 1.1 defines remote contexts and `@version` processing, reinforcing that
  deployed context documents and namespace semantics need stable dereferenceable
  resources. Canonical context URLs therefore belong with semantic identifier
  routes, while release archives can keep immutable copies.
- JSON Schema 2020-12 Core treats `$id` as the canonical URI for a schema
  resource, which supports keeping Agent Volumes schema `$id` URLs release-scoped
  when they identify immutable schema artifacts.
- RFC 9457 defines Problem Details `type` URIs as primary problem type identifiers
  and recommends dereferenceable documentation for HTTP(S) problem type URIs.
