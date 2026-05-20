---
status: accepted
date: 12026-05-20
decision-makers: Yunseo Kim
consulted: ADR-0153, ADR-0154, ADR-0155, ADR-0156, `docs/mintlify-site-maintenance.md`, `site/` Mintlify source tree, Mintlify navigation documentation, W3C Technical Reports, IETF RFC Editor, OpenAPI Initiative specification site, Open Container Initiative specifications site, Kubernetes documentation, OpenTelemetry documentation, AsyncAPI documentation, JSON Schema specification pages, SPDX specification pages, Model Context Protocol documentation
---

# Use a hybrid unversioned and versioned documentation information architecture

## Context and Problem Statement

ADR-0153 adopts Mintlify for the first public documentation site, ADR-0154 places
the Mintlify source under `site/`, ADR-0155 chooses `agentvolumes.org` as the
canonical organization host, and ADR-0156 hosts the Mintlify documentation site
at `docs.agentvolumes.org` with `agentvolumes.org/spec/*` reserved as permanent
specification aliases.

Those decisions establish the publication platform, source-tree location, and
public host routing model, but they do not fully define the information
architecture inside `docs.agentvolumes.org`. The current `site/` tree contains a
mix of unversioned pages such as `/`, `/quickstart`, `/api`, `/uri-publications`,
and `/problems`, plus a mirrored release archive under `/spec/0.1.0-rc.1/`.
Mintlify also supports versioned navigation, but tool support alone does not
answer which pages should be version-independent and which should be preserved as
release-specific archives.

Agent Volumes needs to balance two requirements:

- New readers need a short, current documentation entry point that explains what
  Agent Volumes is and routes them to the right release.
- Implementers, auditors, and specification reviewers need immutable rendered
  documentation for each released specification surface, including the prose
  specification, schemas, Registry API, conformance fixtures, and published
  identifiers.

The question is: **should `docs.agentvolumes.org` make all pages versioned, keep
most pages unversioned, or use a hybrid model that separates current navigation
from immutable release archives?**

## Decision Drivers

- Released specification documentation must remain permanently reachable and must
  not be rewritten with current-release semantics.
- The documentation root should be approachable for readers who do not yet know
  which Agent Volumes version they need.
- Release-specific reference material must remain reproducible for implementers
  targeting a specific release.
- The project should avoid stale duplicated copies of evergreen overview,
  governance, contribution, and site-navigation content.
- The path model should make clear which URLs are immutable release URLs and
  which URLs are movable convenience or navigation pages.
- The path model should fit the existing `docs.agentvolumes.org` and apex
  `/spec/*` alias decisions from ADR-0156.
- The site should remain a publication layer and must not displace the canonical
  repository artifacts.

## Considered Options

- A — Make all documentation pages versioned, with the root redirecting to the
  current versioned subtree.
- B — Keep most pages unversioned, with only a minimal versioned specification
  archive.
- C — Use a hybrid model: keep an unversioned landing and navigation layer, while
  preserving release-specific specification, API, artifact, conformance, and
  identifier documentation under immutable `/spec/<version>/...` paths.

## Decision Outcome

Chosen option: **C — Use a hybrid model with an unversioned landing and
navigation layer plus immutable versioned release archives**.

Under this decision:

- `https://docs.agentvolumes.org/` may host an unversioned documentation landing
  page and other current navigation pages that help readers find the right
  release, understand the project, or move into the release archive.
- `https://docs.agentvolumes.org/spec/` should act as a version selector or
  archive index rather than as the canonical home for release-specific content.
- Release-specific specification documentation belongs under immutable paths of
  the form `https://docs.agentvolumes.org/spec/<version>/...`.
- The versioned release subtree should include the rendered prose specification,
  manifest and component reference pages, Registry API prose, generated OpenAPI
  publication copy, schema documentation, conformance documentation, requirement
  traceability, artifact inventory, published identifier pages, Problem Details
  type pages, and release-specific design-rationale summaries when those pages
  are published for that release.
- Unversioned pages may cover evergreen introduction, quickstart orientation,
  concept overview, version selection, release archive discovery, site usage,
  contribution or governance links, security links, and current-reader routing.
- Unversioned pages that summarize release-specific behavior should link to the
  corresponding versioned release page for exact implementation details.
- `/latest` and `/current` on the docs host may remain convenience redirects or
  navigation aids to the current non-draft release, but they are not canonical
  citation targets and must not replace immutable versioned release URLs.
- `https://agentvolumes.org/spec/*` remains an apex alias surface under ADR-0156
  and should redirect to the corresponding `https://docs.agentvolumes.org/spec/*`
  route rather than serving duplicate indexable content.
- This decision does not make the Mintlify site normative. The prose
  specification, schemas, OpenAPI contract, conformance fixtures, and current
  accepted decision records remain the authoritative sources.

## Consequences

- Good, because new readers can start at an approachable current documentation
  entry point instead of choosing a version before they understand the project.
- Good, because implementers can cite and reproduce release-specific rendered
  documentation under immutable `/spec/<version>/...` paths.
- Good, because release-specific OpenAPI, schema, conformance, and published
  identifier pages can be archived with the release they describe.
- Good, because evergreen site, contribution, security, governance, and version
  selection content does not need to be duplicated for every release.
- Good, because the model resembles mature standards documentation patterns that
  combine current guidance with versioned specification publications, including
  OpenAPI, AsyncAPI, JSON Schema, SPDX, and the Model Context Protocol.
- Neutral, because maintainers must classify each page as evergreen,
  release-specific, an alias, or an archive index before publishing it.
- Neutral, because unversioned current guidance must be reviewed at release time
  to ensure it routes readers to the correct versioned details.
- Bad, because mixed unversioned and versioned navigation creates more link,
  canonical metadata, sitemap, and redirect policy to verify than a single fully
  versioned tree.
- Bad, because stale or overly detailed unversioned pages could drift from the
  release archive if maintainers do not keep the boundary clear.

## Confirmation

- Verify that the documentation root introduces the site and routes readers to
  versioned release documentation without duplicating release-specific reference
  content.
- Verify that `/spec/<version>/...` routes remain available for every published
  non-draft release.
- Verify that `/spec/` behaves as an archive index or version selector rather than
  as a mutable substitute for release-specific pages.
- Verify that `/latest` and `/current` redirect or route to the current non-draft
  release and are documented as movable convenience aliases.
- Verify that release-specific OpenAPI publication copies, schema pages,
  conformance pages, Problem Details pages, and published identifier pages are
  archived under the matching version subtree.
- Verify that unversioned pages link to versioned pages for exact
  implementation-level details.
- Verify that canonical metadata, sitemap membership, internal links, and
  release evidence distinguish immutable versioned URLs from current navigation
  pages and movable aliases.
- Verify that apex `/spec/*` aliases redirect to docs-host `/spec/*` routes and
  do not create duplicate indexable copies.

## Pros and Cons of the Options

### A — Make all documentation pages versioned

- Good, because every page clearly belongs to a release snapshot.
- Good, because historical documentation is easiest to preserve when all content
  lives under versioned paths.
- Neutral, because the root can redirect to the current release if a strict
  release-first model is desired.
- Bad, because evergreen pages such as site introduction, version selection,
  contribution links, governance links, and security links would be duplicated in
  every release archive.
- Bad, because duplicated evergreen pages are likely to become stale in old
  release subtrees.
- Bad, because new readers face a version decision before they understand the
  standard or its release status.

### B — Keep most pages unversioned

- Good, because navigation and maintenance are simple for current readers.
- Good, because there is less duplicated page content across releases.
- Neutral, because it can work for product documentation where only the current
  behavior matters.
- Bad, because implementers cannot reliably reconstruct the rendered
  documentation that matched a historical release.
- Bad, because release-specific OpenAPI, schema, conformance, and identifier pages
  could drift when current documentation changes.
- Bad, because it conflicts with the publication requirement to preserve released
  documentation surfaces by version.

### C — Use a hybrid unversioned and versioned model

- Good, because it separates current-reader navigation from immutable
  release-specific reference material.
- Good, because it preserves exact release archives without forcing every
  evergreen page into every release.
- Good, because it fits the existing `site/` structure, ADR-0156 routing model,
  and Mintlify's versioned navigation support.
- Good, because it lets `/latest` and `/current` serve readers as convenience
  aliases while keeping `/spec/<version>/...` as the durable citation target.
- Neutral, because maintainers need an explicit page-classification rule.
- Bad, because mixed navigation requires more careful canonicalization, redirect,
  and link validation.

## Page Classification Rule

Use this rule when creating or moving pages:

- If a page explains behavior that an implementer, auditor, conformance runner, or
  artifact consumer must reproduce for a specific Agent Volumes release, publish
  it under `/spec/<version>/...`.
- If a page helps readers choose a version, understand the project at a high
  level, navigate the site, or find organization and contribution resources, it
  may remain unversioned.
- If an unversioned page contains release-specific examples or summaries, it
  should link to the exact versioned page for the normative or reproducible
  details.
- If a URL is a movable convenience entry point, such as `/latest` or `/current`,
  document it as an alias and do not use it as a canonical release citation.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- Mintlify versioned navigation cannot support the required release archive
  structure without excessive duplication or broken generated API references.
- The documentation site and specification publication surface diverge enough to
  justify a dedicated `spec.agentvolumes.org` or `specs.agentvolumes.org` host.
- Agent Volumes adopts a formal standards publication process that requires all
  documentation pages, including overview and guidance pages, to be versioned.
- Search, analytics, or user research shows persistent confusion between
  unversioned current guidance, `/latest` aliases, and immutable release pages.
- Release evidence shows repeated drift between unversioned guidance and
  versioned release archives.
- The organization site and documentation site are consolidated onto one platform
  where a different subpath or versioning model becomes simpler and safer.

## More Information

- ADR-0153 adopts Mintlify for the initial public documentation site.
- ADR-0154 places the Mintlify source under `site/` in this repository.
- ADR-0155 chooses `agentvolumes.org` as the canonical organization host.
- ADR-0156 assigns the Mintlify documentation site to `docs.agentvolumes.org` and
  reserves `agentvolumes.org/spec/*` as permanent specification URI aliases.
- `docs/mintlify-site-maintenance.md` defines the maintenance model for versioned
  publication, release archives, latest/current aliases, and published identifier
  coverage.
