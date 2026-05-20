---
status: accepted
date: 12026-05-20
decision-makers: Yunseo Kim
consulted: ADR-0153, ADR-0154, W3C website, IETF website, OpenAPI Initiative website, Open Container Initiative website, Kubernetes website, OpenTelemetry website, AsyncAPI website, JSON Schema website, SPDX website, Google Search Central documentation
---

# Use `agentvolumes.org` as the canonical organization host

## Context and Problem Statement

ADR-0153 adopts Mintlify for the initial public documentation site, and ADR-0154
places that site source under `site/` in this repository. Those records establish
the publication platform and source-tree topology, but they do not choose the
canonical public host for the Agent Volumes Organization's broader web presence.

Agent Volumes now needs a stable organization-facing URL for landing pages,
introductory material, adopter information, governance, charter, membership or
participation information, and other organization-level contact surfaces. Both
`agentvolumes.org` and `www.agentvolumes.org` can serve that role if one host is
made canonical and the other redirects to it.

The question is: **should the Agent Volumes Organization use the apex host or the
`www` host as the canonical organization website?**

## Decision Drivers

- The canonical host should strengthen Agent Volumes' organization and standard
  brand identity.
- The canonical host should be short, memorable, and easy to cite in community,
  governance, and adopter contexts.
- Search engines and users should see one canonical host, not duplicate apex and
  `www` variants.
- Host selection should not depend on speculative SEO differences between apex
  and `www`; consistency, redirects, canonical links, sitemaps, and internal links
  are the important controls.
- The host strategy should leave room for separate documentation or specification
  publication surfaces under subdomains.

## Considered Options

- A — Use `https://agentvolumes.org` as the canonical organization host and
  redirect `https://www.agentvolumes.org` to it.
- B — Use `https://www.agentvolumes.org` as the canonical organization host and
  redirect `https://agentvolumes.org` to it.
- C — Serve equivalent organization content from both hosts and rely on canonical
  tags.

## Decision Outcome

Chosen option: **A — Use `https://agentvolumes.org` as the canonical organization
host and redirect `https://www.agentvolumes.org` to it**.

Under this decision:

- `https://agentvolumes.org` is the canonical public host for Agent Volumes
  Organization landing, governance, charter, adopter, introductory, and contact
  pages.
- `https://www.agentvolumes.org` is not a separate website. It should redirect to
  the corresponding `https://agentvolumes.org` URL with a permanent redirect such
  as HTTP 301 or 308.
- Internal links, canonical metadata, sitemap entries, social metadata, and public
  references controlled by the project should use the apex host for organization
  pages.
- The apex host can link to separate documentation surfaces such as
  `docs.agentvolumes.org` without weakening its role as the organization
  canonical host.
- This decision is about web host canonicalization and organization branding. It
  does not change the normative authority of the prose specification, schemas,
  OpenAPI contract, conformance fixtures, or decision records.

## Consequences

- Good, because the organization identity is represented directly by the shortest
  stable domain: `agentvolumes.org`.
- Good, because `www` duplicate content risk is avoided through a redirect-only
  policy.
- Good, because governance, adopter, charter, and participation pages can use a
  single canonical host in citations and public communications.
- Neutral, because many standards and open source organizations use `www` hosts,
  while many project sites use apex hosts; either pattern can work when
  canonicalization is consistent.
- Neutral, because DNS, CDN, and certificate configuration must support apex
  hosting reliably.
- Bad, because some hosting providers make apex routing slightly more operationally
  constrained than `www` CNAME-based routing.

## Confirmation

- Verify that `https://www.agentvolumes.org/*` redirects permanently to the
  corresponding `https://agentvolumes.org/*` organization URL.
- Verify that organization pages self-canonicalize to `https://agentvolumes.org`.
- Verify that sitemap entries and controlled internal links use the apex host for
  organization pages.
- Verify that Search Console or equivalent search monitoring covers both apex and
  `www` variants, or a domain property that includes both.
- Verify that DNS, TLS, and CDN configuration keep the apex host reliable before
  public launch.

## Pros and Cons of the Options

### A — Use `agentvolumes.org` as canonical and redirect `www`

- Good, because the apex host is short, memorable, and closely matches the
  organization name.
- Good, because it fits the desired organization-branding strategy for Agent
  Volumes.
- Good, because it keeps `www` available as a compatibility entry point without
  creating a second public site.
- Neutral, because it depends on reliable apex DNS and hosting support.
- Bad, because some infrastructure providers make `www` marginally easier to
  configure than an apex host.

### B — Use `www.agentvolumes.org` as canonical and redirect apex

- Good, because `www` is common among long-running standards and nonprofit
  websites.
- Good, because `www` can be operationally convenient with providers that prefer
  CNAME-based host routing.
- Neutral, because it can still provide correct SEO behavior if redirects,
  canonical tags, and sitemaps are consistent.
- Bad, because it is less direct as the primary brand URL for a new standards
  organization.

### C — Serve equivalent content from both hosts

- Good, because both host variants remain directly accessible.
- Bad, because duplicate host variants increase canonicalization, analytics,
  sitemap, and internal-link complexity.
- Bad, because it creates avoidable ambiguity about which URL should be cited as
  the official Agent Volumes Organization website.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- The chosen hosting platform cannot reliably support apex routing, TLS, preview,
  or redirect behavior for `agentvolumes.org`.
- Organization policy, sponsorship, or foundation infrastructure requires `www` as
  the canonical host.
- Search, analytics, or browser behavior reveals persistent canonicalization
  problems that cannot be fixed with redirects, canonical metadata, and sitemaps.
- The organization site is migrated into an infrastructure environment where `www`
  becomes materially safer or more maintainable than apex hosting.

## More Information

- ADR-0153 adopts Mintlify for the initial public documentation site.
- ADR-0154 places the Mintlify source under `site/` in this repository.
- ADR-0156 assigns the Mintlify documentation site to `docs.agentvolumes.org` and
  reserves `agentvolumes.org/spec/*` as permanent specification URI aliases.
