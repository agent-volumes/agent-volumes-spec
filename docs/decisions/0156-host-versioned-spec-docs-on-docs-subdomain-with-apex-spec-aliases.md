---
status: accepted
date: 12026-05-20
decision-makers: Yunseo Kim
consulted: ADR-0153, ADR-0154, ADR-0155, `site/` Mintlify source tree, W3C Technical Reports, IETF RFC Editor and Datatracker, OpenAPI Initiative publications site, Open Container Initiative specifications site, Kubernetes documentation, OpenTelemetry documentation, AsyncAPI documentation, JSON Schema specification pages, SPDX specification pages, Google Search Central documentation
---

# Host versioned specification documentation on `docs.agentvolumes.org` with apex spec aliases

## Context and Problem Statement

ADR-0153 adopts Mintlify for the first public documentation site. ADR-0154 places
the Mintlify source in this repository under `site/`. ADR-0155 chooses
`agentvolumes.org` as the canonical host for organization-facing pages and
redirects `www.agentvolumes.org` to that apex host.

The current `site/` subtree is a publication layer for the Agent Volumes
specification repository. Its `docs.json` navigation already contains
documentation, release archive, and Registry API surfaces, including versioned
routes such as `/spec/0.1.0-rc.1`, narrative API pages under `/api`, and generated
OpenAPI reference pages under `/api-reference`. The canonical sources remain
`agent-volumes-spec.md`, `schemas/`, `openapi/`, `conformance/`, and
`docs/decisions/`.

Agent Volumes needs both a developer-friendly documentation host and long-lived
specification URLs that can be cited as authoritative public identifiers. The
question is: **should the Mintlify `site/` deployment live on a docs subdomain or
under the apex site, and how should apex `/spec` URLs be treated?**

## Decision Drivers

- The broader organization site and the versioned specification documentation
  have different audiences, lifecycle, and information architecture.
- The existing `site/` tree assumes root-relative documentation routes such as
  `/spec/0.1.0-rc.1`, `/api`, and `/api-reference`.
- Versioned specification pages and release archives should remain stable and
  easy to cite.
- The apex host should retain organization branding, governance, and adopter
  content without becoming tightly coupled to every documentation-site route.
- The project should avoid duplicate indexable copies of the same specification
  content on both apex and documentation hosts.
- The strategy should preserve the authority hierarchy: repository artifacts are
  canonical, and the Mintlify site is a publication layer.

## Considered Options

- A — Host the current `site/` Mintlify deployment at
  `https://docs.agentvolumes.org`, and use `https://agentvolumes.org/spec/*` as
  permanent specification URI aliases that redirect to corresponding docs pages.
- B — Host the current `site/` deployment under `https://agentvolumes.org/docs/*`.
- C — Host the current `site/` deployment under `https://agentvolumes.org/spec/*`.
- D — Host a dedicated specification-only site at `https://spec.agentvolumes.org`
  or `https://specs.agentvolumes.org`.

## Decision Outcome

Chosen option: **A — Host the current `site/` Mintlify deployment at
`https://docs.agentvolumes.org`, and use `https://agentvolumes.org/spec/*` as
permanent specification URI aliases that redirect to corresponding docs pages**.

Under this decision:

- The `site/` subtree builds the public developer and specification documentation
  site for `https://docs.agentvolumes.org`.
- Versioned documentation routes under the docs host, such as
  `https://docs.agentvolumes.org/spec/0.1.0-rc.1`, are the canonical rendered
  documentation pages for versioned specification archives unless a future ADR
  changes that policy.
- `https://agentvolumes.org/spec/*` is reserved for permanent specification URI
  aliases on the organization apex host.
- Apex `/spec/*` aliases should redirect to the corresponding
  `https://docs.agentvolumes.org/spec/*` page rather than serving duplicate
  indexable content.
- Convenience aliases such as `/latest` or `/current` may continue to exist on the
  docs host when they are clearly treated as movable aliases rather than immutable
  release URLs.
- Apex organization pages should link to the docs host for implementation guides,
  release archives, Registry API documentation, conformance documentation, and
  generated API reference pages.
- This decision does not make the Mintlify site normative. The prose
  specification and companion artifacts in this repository remain authoritative.

## Consequences

- Good, because organization pages and developer/specification documentation have
  separate hosts that match their different audiences and deployment lifecycles.
- Good, because the current `site/` root-relative routes can be served directly
  from the root of `docs.agentvolumes.org` without a public subpath mount.
- Good, because apex `/spec/*` URLs can act as durable, organization-branded spec
  aliases while avoiding duplicate content through redirects.
- Good, because the model resembles standards ecosystems that split organization
  pages from specification publication surfaces, including OpenAPI and OCI.
- Neutral, because SEO and analytics reporting must account for both
  `agentvolumes.org` and `docs.agentvolumes.org`.
- Neutral, because the project must document which URLs are immutable release
  URLs and which are convenience aliases.
- Bad, because redirect policy, Search Console properties, sitemaps, and link
  checks become more complex than a single-host documentation site.
- Bad, because cross-host redirects can create canonical drift if the same
  specification content is later served from both apex and docs hosts.

## Confirmation

- Verify that `site/` is deployed with `docs.agentvolumes.org` as its public
  custom domain.
- Verify that `https://docs.agentvolumes.org/spec/<version>/...` routes resolve for
  versioned release archives.
- Verify that `https://agentvolumes.org/spec/<version>/...` redirects to the
  corresponding `https://docs.agentvolumes.org/spec/<version>/...` route.
- Verify that apex `/spec/*` aliases are not served as duplicate indexable copies
  of docs-host content.
- Verify that canonical metadata, sitemaps, and internal links consistently point
  to the chosen canonical rendered documentation URLs.
- Verify that release evidence records cover required apex spec aliases and docs
  host routes for schema `$id` URLs, Problem Details type URIs, namespace
  publications, and other Agent Volumes-owned public URI surfaces where relevant.
- Verify that `site/` pages continue to link back to canonical repository
  artifacts rather than presenting the site as the normative source.

## Pros and Cons of the Options

### A — Use `docs.agentvolumes.org` with apex `/spec/*` aliases

- Good, because it preserves a clean separation between organization content and
  implementer/specification documentation.
- Good, because the current Mintlify site can be mounted at a domain root instead
  of being adapted to a public subpath.
- Good, because apex `/spec/*` aliases provide durable, organization-branded spec
  citation URLs while the docs host handles the documentation experience.
- Neutral, because search, analytics, robots, and sitemap setup must include a
  subdomain.
- Bad, because cross-host routing requires explicit redirect and canonicalization
  discipline.

### B — Host documentation under `agentvolumes.org/docs/*`

- Good, because all organization and documentation content stays under one host.
- Good, because internal linking, Search Console reporting, and sitemap management
  can be simpler for a single-host site.
- Neutral, because it can work well if the organization site and documentation
  site share one platform or proxy layer.
- Bad, because the current `site/` root-relative route model would require stable
  subpath mounting or rewrite support.
- Bad, because it makes the organization site's deployment more tightly coupled to
  the documentation site's deployment and release cadence.

### C — Host documentation under `agentvolumes.org/spec/*`

- Good, because versioned specification archives would sit directly under the
  organization apex host.
- Good, because this resembles path-based standards publication models such as
  W3C Technical Reports and JSON Schema draft paths.
- Neutral, because it is best suited to a specification-only publication surface.
- Bad, because the current `site/` tree contains more than specification archives,
  including quickstart, concepts, Registry API pages, conformance pages, and
  generated OpenAPI reference pages.
- Bad, because `/spec` is too narrow as the public root for all developer
  documentation currently in `site/`.

### D — Use a dedicated `spec` or `specs` subdomain

- Good, because it gives specification publications a clearly separate host, like
  `spec.openapis.org` or `specs.opencontainers.org`.
- Good, because it may become attractive if Agent Volumes grows multiple
  specification families or needs a stricter publication pipeline.
- Neutral, because it can coexist with `docs.agentvolumes.org` later if the docs
  site and specification publication site diverge.
- Bad, because it is premature while the current `site/` surface combines
  concepts, API documentation, conformance guidance, URI publications, and release
  archives.
- Bad, because adding another host increases routing, certificate, search, and
  analytics complexity before there is a clear operational need.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- Mintlify or the chosen hosting provider cannot reliably serve the `site/`
  deployment from `docs.agentvolumes.org`.
- Apex `/spec/*` aliases cannot be implemented with reliable permanent redirects
  and release evidence.
- Agent Volumes requires path-based apex publication for formal standards
  governance, external citations, or machine-readable identifier resolution.
- The documentation site and specification publication surface diverge enough to
  justify a dedicated `spec.agentvolumes.org` or `specs.agentvolumes.org` host.
- Search, analytics, or canonicalization behavior shows persistent confusion
  between apex aliases and docs-host rendered pages.
- The organization site and documentation site are consolidated onto one platform
  where subpath hosting becomes simpler than subdomain hosting.

## More Information

- ADR-0153 adopts Mintlify for the initial public documentation site.
- ADR-0154 places the Mintlify source under `site/` in this repository.
- ADR-0155 chooses `agentvolumes.org` as the canonical organization host.
- The current `site/docs.json` includes documentation, release archive, and
  Registry API navigation with versioned `/spec/0.1.0-rc.1` routes.
