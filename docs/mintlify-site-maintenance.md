# Mintlify Documentation Site Maintenance

This document records the maintenance model for the public Agent Volumes
Mintlify documentation site. The site is a publication layer for human readers,
agentic documentation consumers, and stable URI discovery. It does not replace
the normative specification artifacts in this repository.

## Source-of-truth hierarchy

Maintain the site from these sources, in this order:

1. Current decision records in [`decisions/`](decisions/) control the decisions
   they record. Later decision records can refine, update, or supersede earlier
   decision records. The specification prose, schemas, OpenAPI contract,
   fixtures, and site content must not contradict a current accepted decision. If
   a recorded decision needs to change, add a follow-up decision record instead
   of silently overriding it elsewhere.
2. [`../agent-volumes-spec.md`](../agent-volumes-spec.md) is the final normative
   authority for the current release surface where current decision records have
   not fixed the matter more specifically. It may define detailed requirements,
   vocabulary, and interoperability behavior that are consistent with the
   decisions.
3. [`../schemas/`](../schemas/),
   [`../openapi/bibliotheca.openapi.yaml`](../openapi/bibliotheca.openapi.yaml),
   and [`../conformance/fixtures/`](../conformance/fixtures/) are normative
   companion artifacts for structured contracts. They are subordinate to the
   prose specification for interpretation and subordinate to current decision
   records for decisions already recorded there.
4. GitHub issues, including URI publication planning issues, are planning
   context only. They do not define requirements unless the specification and
   companion artifacts are updated.

When site content disagrees with a current decision record, the prose
specification, or companion artifacts, the site is wrong. Fix the site or
regenerate its derived publication artifacts; do not treat website text as a
competing source of truth. When the prose specification or a companion artifact
appears to contradict a current decision record, treat that as source drift that
requires a follow-up decision record or an artifact correction.

## Site role

The Mintlify site should help readers and tools answer these questions:

- What is Agent Volumes, and what is in scope for v0.1.0-rc.1?
- How do I author, identify, publish, fetch, verify, and validate a volume?
- Which machine-readable artifacts define each structured contract?
- Which public Agent Volumes-owned identifiers are stable and versioned?
- Which behaviors are recorded decisions, portable v0.1 core behavior, local
  policy, deferred work, or explanatory rationale?

Avoid product-style claims. In particular, do not describe conformance labels as
certification badges, hosted-service approval, production readiness, or live
cross-registry interoperability guarantees.

## Versioned publication and archive model

The public site must preserve released documentation surfaces by version. For
specification sites, readers, implementers, auditors, and automated tools need to
resolve the documentation that matched the artifacts available at the time of a
release, not only the latest site text.

ADR-0157 adopts a hybrid information architecture for this site: maintain an
unversioned landing and navigation layer for current readers, but publish
release-specific specification, API, artifact, conformance, and identifier
documentation under immutable `/spec/<version>/...` archive paths. Implement that
hybrid model with Mintlify `navigation.versions`: keep unversioned orientation
pages in each version's navigation tree, and list release-specific pages under
the matching `/spec/<version>/...` subtree so the Mintlify version selector shows
the selected release's pages. Treat `/spec/` itself as a release archive selector
or version index, not as a mutable replacement for the released pages beneath it.

Maintain these publication boundaries:

- Keep unversioned pages limited to site entry, version selection, high-level
  orientation, release archive discovery, and organization or contribution
  routing. These pages may point readers to the current release, but they must not
  duplicate release-specific reference content.
- Publish non-draft release documentation under immutable versioned paths, such
  as `/spec/0.1.0-rc.1/`, with the matching prose, schema identifier pages,
  OpenAPI publication copy, conformance fixture documentation, URI publication
  pages, and design-rationale summaries for that release.
- Keep all past non-draft release documentation permanently reachable. Do not
  replace historical release pages with current-release prose, and do not rewrite
  released schema `$id` pages, Problem Details slugs, namespace term fragments,
  predicate identifiers, or release-specific artifact inventories for style.
- Treat draft or unreleased work as preview or repository content until it is
  intentionally published. Drafts are not required to appear on the public site,
  and draft content must not be presented as the latest released specification.
- If the site provides a latest-style alias, make it a redirect or navigation aid
  to the current non-draft release rather than the canonical home for released
  identifiers. The versioned page remains the durable citation target.
- Redirect `/spec/latest` and `/spec/current` to the most recent non-draft
  release subtree. These aliases are convenience routes only; update them
  atomically when a newer non-draft release becomes the active release, and keep
  older versioned subtrees permanently reachable.
- Configure Mintlify `navigation.versions` entries for published non-draft
  releases. Each version entry should contain the navigation tree for that release
  and should point release-specific pages at the matching immutable
  `/spec/<version>/...` archive subtree.
- Archive derived publication artifacts with their release. A Mintlify OpenAPI
  publication copy, generated schema reference page, or fixture inventory page is
  still derived, but the derived copy used for a release must remain auditable
  against the canonical artifact for that release.

The active site structure should therefore support both current-release browsing
and historical release lookup. A single unversioned overview can introduce Agent
Volumes and point readers to the latest release, but release-specific reference
content belongs under a versioned subtree.

## Public host and routing model

ADR-0155 and ADR-0156 split Agent Volumes' public web presence into an
organization host, a documentation host, and permanent specification aliases.
Maintain the Mintlify site with these host responsibilities in mind:

- `https://agentvolumes.org` is the canonical host for Agent Volumes Organization
  landing, governance, charter, adopter, introductory, and contact pages.
- `https://www.agentvolumes.org` is not a separate website. It should redirect
  permanently to the corresponding `https://agentvolumes.org` organization URL.
- `https://docs.agentvolumes.org` is the public host for the Mintlify `site/`
  deployment, including implementation guidance, release archives, Registry API
  documentation, conformance documentation, and generated API reference pages.
- Versioned routes on the docs host, such as
  `https://docs.agentvolumes.org/spec/0.1.0-rc.1/`, are the canonical rendered
  documentation pages for versioned specification archives.
- `https://docs.agentvolumes.org/spec/` should act as a release archive selector
  or version index. It should route readers to immutable versioned archives rather
  than serving release-specific reference content directly.
- `https://agentvolumes.org/spec/*` is reserved for permanent specification URI
  aliases on the organization apex host. These aliases should redirect to the
  corresponding `https://docs.agentvolumes.org/spec/*` page rather than serving a
  duplicate indexable copy.

Do not configure the Mintlify site as a competing organization homepage, and do
not publish duplicate specification pages from both apex and docs hosts. Internal
links controlled by the project should use the apex host for organization pages,
the docs host for rendered documentation pages, and apex `/spec/*` only when the
intent is to cite or verify the durable organization-branded specification alias.
Canonical metadata, sitemap entries, social metadata, Search Console properties,
analytics, redirect checks, and release evidence should reflect that split.

## Landing page and navigation visibility

Treat `site/index.mdx` as the public landing page for the documentation site. If
the root landing page is omitted from `docs.json` navigation, Mintlify treats it
like a hidden page: it can remain reachable by URL, but it should not be assumed
to be a normal visible sidebar entry. Use that pattern only when the page is meant
to introduce the site, link to the latest release, and route readers into the
versioned documentation tree without duplicating release-specific reference
content.

When the landing page should appear in the rendered navigation, add it explicitly
to `docs.json` or make it the root page for the relevant navigation group. When it
is a standalone marketing-free landing page rather than a reference page, use
Mintlify page controls such as custom layout mode and hidden footer pagination
only when they improve navigation clarity. Keep `hidden` and `noindex` distinct:
hidden pages are navigation-hidden, while `noindex` is an indexing directive and
does not by itself remove a page from navigation.

## Unversioned and versioned page classification

Use ADR-0157's classification rule before adding, moving, or rewriting a page:

- If a page explains behavior that an implementer, auditor, conformance runner, or
  artifact consumer must reproduce for a specific Agent Volumes release, publish
  it under `/spec/<version>/...`.
- If a page helps readers choose a version, understand the project at a high
  level, navigate the site, or find organization and contribution resources, it
  may remain unversioned.
- If an unversioned page contains release-specific examples or summaries, keep
  the summary short and link to the exact versioned page for normative or
  reproducible details.
- If a URL is a movable convenience entry point, such as `/spec/latest` or
  `/spec/current`, configure it as an alias or redirect and do not use it as a
  canonical release citation.

Classify pages by content role rather than by directory convenience:

| Content role                                                         | Path policy                                          |
| -------------------------------------------------------------------- | ---------------------------------------------------- |
| Landing page, project overview, version selector, archive index      | Unversioned, outside release archives                |
| Quickstart orientation and broad concepts                            | Unversioned only when they link to versioned details |
| Manifest, identity, component, compatibility, and permission details | Versioned under `/spec/<version>/...`                |
| Registry API prose and generated OpenAPI reference                   | Versioned with the release they describe             |
| Schemas, conformance, requirement traceability, artifact inventory   | Versioned with the release they describe             |
| Problem Details, schema `$id`, namespace, predicate, and URI pages   | Versioned when tied to a release-specific identifier |
| Governance, contribution, security contact, and organization links   | Unversioned or linked to `https://agentvolumes.org`  |

When using Mintlify navigation, prefer explicit structure over implicit routing.
Use `navigation.versions` for the site's primary version-selection UI. Keep
unversioned pages such as the landing page, quickstart orientation, concepts, and
`/spec/` archive index available from each version entry when they should remain
stable across releases. Put release-specific pages under the selected version's
own navigation tree so switching versions changes the release archive sidebar and
content together. Mintlify's navigation documentation supports versioned
navigation, nested groups and tabs, and version selector labels such as
`tag: "Latest"`, but the tag is a visual label rather than an automatic
latest-version route. Mintlify version labels and `default` fields are UI
behavior, not release policy by themselves: keep `/spec/latest` and
`/spec/current` as explicit `docs.json` redirects or navigation aids when
maintained, and record the active release in redirects, release evidence, and
site-maintenance notes.

Avoid a separate top-level `Release archive` tab that duplicates the Mintlify
version selector as the primary release-selection control. The unversioned
`/spec/` archive index may remain linked from each version's documentation
navigation for readers, search engines, and release-evidence workflows.

Within Mintlify navigation, keep nesting shallow and use one child-navigation
pattern at each level. Use group `root` pages for readable index pages such as a
release overview or archive selector. Use `hidden` only when a page should remain
directly reachable but absent from navigation; use `noindex` only as an indexing
directive. Do not use hidden pages, `noindex`, or canonical tags to mask source
drift between unversioned summaries and versioned archives.

## Information architecture baseline

When building or organizing the site from a blank slate, use this sidebar shape
as the baseline for each published release subtree. The exact page names can
change, and Mintlify tabs may be used for readability, but the coverage should
remain intact. For the current release, the Bibliotheca API reference can remain
in a dedicated tab when that is easier to scan than a single long sidebar.

Outside the release subtree, keep the unversioned layer small: the docs landing
page, `/spec/` archive selector, version selection guidance, current-reader
quickstart orientation, and links to organization resources are enough. The
sections below describe the coverage expected inside each immutable
`/spec/<version>/...` release subtree.

### Start here

#### Overview

Explain what Agent Volumes is, why volumes exist as a distribution unit for AI
agent components, and how bibliothecas relate to package ecosystems such as npm,
PyPI, and crates.io. Cover the v0.1.0-rc.1 status, the standard's runtime-neutral
goals, and the high-level scope/non-scope boundary from the introduction.

#### Specification authority

Summarize the source-of-truth hierarchy for readers: current accepted decision
records control the decisions they record, the prose specification defines the
current release surface where decisions have not fixed the matter more
specifically, and companion artifacts define structured contracts. Include a
short note that issues and website content are planning or publication context,
not independent requirements.

#### Quickstart: author a volume

Show a minimal `volume.toml` with `[volume]`, `[publisher]`, and at least one
`[[components]]` entry. Explain the resulting `pkg:volume/...@version` identity,
how a component purl addresses an exported component, and which validation steps
an author should expect before publishing. The quickstart may be more detailed
than this minimum when it remains task-oriented: compatibility metadata,
permissions, publish steps, content integrity verification, and a complete example
are useful additions for implementers.

#### Glossary

Provide reader-facing definitions for the terms that appear across the site:
Agent Volumes, volume, component, bibliotheca, runtime, publisher, scope, logical
identity, immutable content identity, trust attachment, derived judgment,
capability metadata, and portable capability class. Link each term back to the
specification section that defines it.

### Core concepts

#### Package identity

Explain scopeless and scoped package identifiers, versioned purls, component
subpaths, canonical purl serialization, decoded display names, and why clients
must compare parsed canonical purl values rather than user-facing strings.
Include examples for `pkg:volume/<name>`,
`pkg:volume/%40<scope>/<name>@<version>`, and component references.

#### Component types

Document the seven component types: `agent`, `skill`, `command`, `tool`, `hook`,
`mcp-server`, and `lsp-server`. Prefer an overview page plus one page per
component type when the site can sustain that structure; this keeps invocation
model, entrypoint format, portable validation minimum, examples, and runtime-local
boundary text easier to scan. At minimum, the component type section must cover
who invokes each type, its execution model, expected entrypoint format, and the
boundary between portable Agent Volumes semantics and runtime-local behavior.

#### Component export and loading

Describe how `volume.toml` declares exported components, how entrypoint paths are
resolved, and which type-specific portable validation minimum applies before a
runtime adapter loads a component. Distinguish portable validation failures from
load-time failures caused by local policy, missing execution environments, or
runtime-specific adapters.

#### Compatibility model

Explain runtime compatibility declarations, protocol declarations, provider
metadata, environment requirements, and portable capability classes. Make clear
that unknown runtime or protocol version schemes are preserved and surfaced
rather than used as portable rejection filters unless a profile defines stronger
comparison semantics.

#### Package roles

Describe the `component`, `plugin`, `provider`, and `meta` roles. Include the
special rule that a `component` package declares exactly one exported component,
while `meta` remains a lightweight dependency-bundle role without special
transitive-closure semantics in v0.1.

### Manifest reference

#### Manifest overview

Introduce `volume.toml` as the human-authored manifest and distinguish authored
TOML, typed parser output, and the canonical parsed data model used for schema
validation. Explain minimal normalization, semantic defaults, and where JSON
Schema stops short of full semantic validation. The site may keep a complete
manifest reference page and split dependency, compatibility, and role guidance
into adjacent pages when that improves scanability, but the reference cluster
must still cover every subsection below and link related pages together.

#### Package metadata

List required and optional `[volume]` fields, including `schema`, `name`,
`version`, `description`, `license`, `role`, `homepage`, `repository`,
`documentation`, `keywords`, `secondary-roles`, and `providers`. Mention SemVer,
SPDX expressions, and the maximum description length.

#### Publisher metadata

Document the required `[publisher]` table and `id` field. Explain that publisher
metadata identifies the package-facing publisher entity, while verification,
authorization, and ownership status are managed by a bibliotheca and not declared
in the manifest.

#### Components

Cover `[[components]]` fields, uniqueness rules, component-specific providers,
and component permission overrides. Link to the component export/load-boundary
page for entrypoint existence checks and type-specific descriptor validation.

#### Dependencies

Explain `[dependencies]`, `[component-dependencies]`, the constrained npm-like
SemVer range grammar, component purl references, and single-version enforcement.
Explicitly state that lockfile format, registry priority, and universal
prerelease selection are outside the portable v0.1 baseline.

#### External dependencies

Document `[[external-dependencies]]` as declaration-plane audit metadata. Cover
required `purl`, `constraint`, and `purpose` fields; optional component scoping;
VERS constraints; non-`volume` PURL rules; semantic keys; duplicate/conflict
handling; declaration keys; and potential-exposure warnings.

#### Permissions

Explain volume-level permissions, component narrowing, the partial order for
`filesystem`, `network`, and `browser`, the coarse `shell` model, and why
permission escalation is a semantic validity failure. Include examples where
`read` and `write` are sibling permissions.

#### Runtime and environment declarations

Cover `[[runtimes]]`, `[[protocols]]`, `[environment]`, provider declarations,
and manifest-level `[provenance]` metadata. Emphasize that compatibility
expressions are advisory unless a client understands the relevant version scheme,
and that manifest provenance does not replace release-scoped trust attachments.

#### Warnings and unknown fields

Explain unknown manifest structure handling, explicit warnings, core warning
categories, and extension warning categories. Note that the unknown-field rule
applies to manifest structure and does not imply permissive unknown-field
behavior for every artifact family.

### Bibliotheca API

The Bibliotheca API may be organized as a dedicated Mintlify tab instead of a
group inside the primary documentation sidebar. Use the tab when it improves
readability for implementers who are focused on HTTP API work. Keep adjacent
prose pages and generated OpenAPI reference pages in the same tab so readers can
move between interoperability semantics and operation-level shapes without
leaving the API surface.

#### API overview

Explain that a bibliotheca exposes an HTTP API for package operations and
discovery surfaces, while storage backends, CDN behavior, token issuance,
ranking, moderation, and other local policies remain implementation-local unless
the specification defines a portable boundary.

#### Package operations

Document publish intent creation, `.tar.gz` hosted archive upload, finalization,
exact release fetch, lifecycle mutation, yanking, tombstoning, blocking, and
unavailability. Emphasize route-derived identity, version immutability, archive
transport profile checks, and normalized-file-tree integrity computation.

#### Version index

Describe the package-scoped version index as a resolver input, not a lockfile,
search ranking, or exact release record. Explain lifecycle states, candidate
selection, highest compatible version preference, and the requirement to fetch
exact release metadata before installation or trust evaluation.

#### Search

Cover query-based catalog discovery, supported filters, pagination, and
bibliotheca-local ranking. State that search responses are not substitutes for
version indexes, exact metadata, or trust evaluation inputs.

#### Trust metadata

Explain summary and detail views, empty success responses when no trust artifacts
exist, fact-first trust metadata, raw locators, revision metadata, status
semantics, and how derived judgments remain bibliotheca-local rather than
canonical trust facts.

#### Trust uploads

Document the two-phase trust attachment upload lifecycle, `http-put` portable
upload profile, declared digest and size checks, release-subject binding,
idempotency handling, and lifecycle status after finalization.

#### Advisories

Cover advisory list/detail behavior, volume-level targeting, local and external
advisory identifiers, severity/source/relationship vocabularies, withdrawn
metadata, affected version events, and the distinction between Agent Volumes
advisories and external dependency potential-exposure warnings.

#### Capability metadata

Explain the registry-level capability endpoint, scope-policy shape, supported
delivery modes, advertised surfaces, compatible spec versions, supported upload
profiles, unknown field/value tolerance, extension containers, and bridge
metadata.

#### Authentication, authorization, rate limits, and errors

Document which endpoint families are public or bearer-token protected, how local
authorization policy remains bibliotheca-specific, what rate-limit behavior looks
like, and how the closed RFC 9457 Problem Details set maps to representative
endpoint failures.

#### Generated OpenAPI reference

Use Mintlify's OpenAPI support for endpoint-level reference pages. The generated
reference should document operation shapes and examples, while adjacent prose
pages explain the interoperability semantics and local-policy boundaries.

The generated API reference must come from
[`../openapi/bibliotheca.openapi.yaml`](../openapi/bibliotheca.openapi.yaml) or
from an explicitly pinned publication copy generated from that file. A bundled
OpenAPI document used for Mintlify publication is a derived publication artifact,
not the canonical API contract.

### Security and trust

#### Content integrity

Explain that the release integrity value is a `sha256:<hex>` digest of a
normalized file tree, not arbitrary archive bytes. Cover path normalization,
regular-file constraints, executable-bit handling, byte stream construction, and
digest rejection behavior. Detailed worked examples and algorithm walk-throughs
are encouraged because this page is one of the main implementation aids for
clients and bibliothecas.

#### Release subject identity

Describe the dual subject model: logical identity as `pkg:volume/...@version`
and immutable content identity as the normalized-file-tree digest. Explain why
trust attachments and release metadata must remain losslessly mappable to both.

#### Core trust baseline

Summarize the baseline trust stack: CycloneDX as the normative BOM exchange
format, SPDX as a secondary export/reference target, SLSA provenance, and
Sigstore-family signatures. State that universal trust roots, scanner-finding
interchange, and stronger AI-BOM profiles are outside v0.1 core.

#### Publisher identity

Explain publisher registration, scope ownership, `unverified`, `verified`, and
`trusted` levels, and the fact that `trusted` is a bibliotheca-local governance
signal rather than a canonical release-scoped trust fact.

#### Trust attachments

Cover append-only release-scoped attachments, current-state discovery, lifecycle
statuses, revoked/invalid default-failure behavior, superseded stale-current
evidence behavior, and client-side objective verification versus local policy.

#### Threat model

List the in-scope threats and primary mitigations: mutable Git references,
substituted CDN artifacts, mismatched trust attachments, prompt injection,
permission overreach, dependency confusion, stale metadata, and compromised
bibliotheca projection behavior. Also identify out-of-scope threats.

#### Security advisories

Explain package-facing advisory records, affected version history, withdrawal,
relationships, component-impact metadata as informational only, and why external
package advisory matches produce warnings rather than Agent Volumes advisories.

### Machine-readable artifacts

#### Artifact overview

Explain why v0.1 publishes machine-readable companion artifacts, which artifact
families exist, and how lockstep versioning ties them to the prose release and
current ADR decisions.

#### Schemas

Group schema documentation by manifest model, release metadata, version index,
release upload, trust discovery/upload, advisories, capability metadata,
errors/warnings, conformance, external dependencies, mapping/export, and search.
Each schema page should link to its `$id` and canonical source file.

#### OpenAPI contract

Document `openapi/bibliotheca.openapi.yaml` as the machine-readable HTTP API
contract for Bibliotheca endpoints. Explain how prose/OpenAPI drift is reviewed
and how publication copies are generated without becoming canonical.

#### Conformance fixtures

Describe fixture families, validation units, algorithmic vectors, deterministic
expected outcomes, and the offline runner contract. Link fixtures to the schema
or evaluator they exercise.

#### Artifact inventory

Provide a release-specific inventory of published schema files, OpenAPI contract,
fixture corpus, reserved-name artifacts, upstream baselines, PURL/VERS
compatibility exceptions, and BOM/provenance mapping files.

Repeat the source-of-truth rule on these pages: companion artifacts are
first-class structured contracts, but current decision records control the
decisions they record, and the prose specification wins when interpreting
structured artifacts that appear to conflict with prose.

### Conformance

#### Conformance model

Explain the v0.1 core baseline, future profiles, artifact conformance, and
role-scoped claims. Clarify that profiles can add stricter behavior later but do
not weaken the core baseline.

#### Claim labels

Document `artifact-fixture-pass`, `client-role`, `bibliotheca-read-role`,
`bibliotheca-write-capable-role`, and `validator-exporter-role`. State that
these labels are additive and are not certification badges or hosted-service
approval. Keep the current distinction between role-scoped claims, fixture
coverage, and product claims visible on conformance overview and fixture pages.

#### Bibliotheca requirements

Summarize `AV-BIB-001` through `AV-BIB-018`, grouped by manifest serving,
identity, publish/fetch/version index, trust metadata, advisories, capability
metadata, upload behavior, companion artifacts, and external dependency exposure
boundaries.

#### Client requirements

Summarize `AV-CLI-001` through `AV-CLI-018`, grouped by manifest parsing,
dependency resolution, permission escalation, exact metadata fetch, integrity,
trust verification, compatibility expression preservation, capability metadata,
bridge warnings, and external dependency warnings.

#### Fixture catalog

Group fixture pages by manifest validation, permissions, resolver behavior,
external dependencies, package identity, archive/integrity, release metadata,
trust discovery/upload/verification, advisories, capability metadata, mapping,
errors/warnings, search, and coverage. The fixture catalog can include more detail
than a simple inventory, including schema validation units, algorithmic vectors,
report shape guidance, mapping classifications, and runner workflow examples.

#### Requirement traceability

Explain `conformance-coverage.json`, stable result IDs, role-scoped `AV-*`
coverage, fixture-covered behavior, prose-boundary behavior, and how reviewers
use the matrix during readiness checks.

#### Deferred topics

List intentionally deferred v0.1 topics such as lockfile format, registry
priority, universal prerelease policy, scanner-finding interchange, component
advisory targeting, universal trust roots, and upload profiles beyond `http-put`.
Make clear these are not readiness gaps unless a relevant ADR is reopened.

Keep the distinction between fixture results and product claims visible. The
offline fixture corpus supports artifact/vector conformance claims; it is not a
certification program.

### Published identifiers

Use “published identifiers” or “URI publications” language. Do not describe this
area as an external registry unless a future specification release creates such a
registry.

#### URI publication policy

Explain that Agent Volumes-owned identifiers need stable public documentation,
but each page must distinguish canonical identifiers, human-readable pages, and
machine-readable artifact URLs. Include versioning, immutability, redirects, and
latest-alias guidance where applicable.

For versioned specification archives, use `/spec/<version>/...` as the rendered
documentation target. Use `/spec/` for archive selection, and use `/spec/latest`
or `/spec/current` only as movable aliases to the active non-draft release. Do not
cite a latest-style alias as the durable URL for a released schema, Problem
Details type, namespace term, predicate, or release inventory.

Use full release versions, including patch and prerelease labels such as
`0.1.0-rc.1`, for immutable release artifacts and release archive paths. This
includes schema `$id` URLs, generated OpenAPI publication copies, conformance
artifact inventories, and rendered `/spec/<version>/...` documentation. Use a
minor-line identifier such as `v0.1` for Agent Volumes-owned semantic URI
publications whose meaning is intended to remain stable across compatible patch
releases, including SPDX extension namespaces, in-toto predicate identifiers,
SLSA build type URIs, and BOM/profile identifiers. Do not introduce patch-level
semantic URI versions unless the URI identifies one exact release snapshot rather
than a compatibility-preserving namespace or profile. Incompatible semantic
changes require a new identifier, namespace version, predicate URI, build type
URI, or profile string rather than rewriting the existing `v0.1` meaning.

#### Schema `$id` URLs

Document the versioned schema `$id` URL pattern, explain how schema identifiers
map to source files under `schemas/`, and state that released schema identifiers
must not be rewritten for style.

#### Problem Details type URIs

Provide an index page or table for the closed v0.1 problem set, and also provide
stable public documentation for each Problem Details type URI. Each problem entry
or page should show the URI, expected HTTP status, short meaning, representative
endpoint families, and canonical source artifacts. The aggregate table helps
readers compare the set; the individual URI pages provide durable dereference
targets.

#### SPDX extension namespace

Document the canonical URI-backed SPDX namespace for external dependency
declaration terms, the class/property term list, the preferred `av:` compact
alias, and the separation from CycloneDX `agent-volumes:*` property names.

#### in-toto predicate identifiers

Explain the optional external dependency declaration predicate, why declarations
are omitted from SLSA subject/materials/resolved dependencies, and how the
predicate relates to mapping fixtures rather than scanner or resolver evidence.

#### Build and profile identifiers

Document Agent Volumes-owned build/profile URIs only to the extent they appear in
the specification or fixtures. For sample-only identifiers, explain the sample
role without turning it into a broad registry.

#### Reserved extension namespaces

Explain the reserved extension namespace list, spec-owned-looking keys, bridge
period behavior, migration warnings, and why adding reserved names is a breaking
change for the relevant release line.

#### PURL/VERS compatibility exceptions

Document the machine-readable exception artifact, when exceptions apply to
validation, matching, and warning context, and why exceptions do not create a
general package-manager resolution policy.

#### Upstream baselines

Explain the upstream baseline manifest, pinned upstream references, optional
digests, and how maintainers use the artifact to track purl/VERS reference
compatibility without vendoring those upstream projects.

These pages must distinguish three things:

1. canonical identifiers used inside artifacts;
2. human-readable documentation pages for those identifiers; and
3. machine-readable artifact URLs such as JSON Schema `$id` URLs.

### Compatibility and mappings

#### External dependency declarations

Explain declaration-only external package relationships, required fields,
component scoping, purpose vocabulary, extension purpose namespaces, and the
boundary excluding resolved dependencies, scanner findings, VEX, installed
package evidence, and provenance materials.

#### PURL and VERS compatibility

Cover non-`volume` external package PURLs, VERS constraints, purl type / VERS
scheme equality, pinned exceptions, and scheme-specific intersection behavior.

#### External dependency declaration keys

Document `av-extdep-v1:sha256:<hex>`, semantic key input, JCS canonical JSON,
volume versus component scope encoding, and excluded fields such as constraints,
warnings, advisory matches, comments, and whitespace.

#### Potential-exposure warnings

Explain advisory match inputs, `intersects`, `does-not-intersect`, and
`indeterminate` outcomes, warning context schema, required warning identity
fields, explanatory context, and deduplication by declaration/advisory/range
identity.

#### BOM and provenance mapping

Describe the mapping matrix, mapping sample, native/extension/lossy
classification, CycloneDX external component properties, SPDX extension profile,
and SLSA omission plus optional in-toto predicate behavior.

### Design rationale

#### ADR index

List decision records chronologically and by topic. Explain status values,
supersession, follow-up records, and how maintainers should find the latest
decision before changing prose, schemas, fixtures, OpenAPI, or site pages.

#### Identity and manifest decisions

Group decisions covering purl identity, `volume.toml`, canonical parsed data,
unknown fields, naming rules, external dependencies, and schema boundaries.

#### Trust and supply-chain decisions

Group decisions covering BOM strategy, provenance, Sigstore-family signatures,
dual subject binding, trust discovery, publisher verification, attachment
lifecycle, and client trust consumption.

#### Registry API decisions

Group decisions covering resolver boundaries, version index, SemVer range
grammar, upload lifecycles, bearer-token semantics, `http-put`, Problem Details,
and exact release metadata exposure.

#### Conformance decisions

Group decisions covering fixture requirements, artifact-first deterministic
harness behavior, compatibility exceptions, warning context, declaration key
vectors, mapping fixtures, and readiness boundaries.

#### URI publication decisions

Cover ADRs that establish Mintlify as the publication platform, keep the site
source in this repository, choose `agentvolumes.org` as the canonical
organization host, place the Mintlify deployment on `docs.agentvolumes.org`,
reserve apex `/spec/*` as permanent specification aliases, define URI-backed SPDX
namespace terms, and require stable documentation for Agent Volumes-owned
identifiers.

#### Deferred decisions

Summarize intentionally deferred topics and their reconsideration triggers. Link
to the relevant ADRs and keep wording clear that deferred topics are deliberate
scope boundaries, not missing documentation work.

Label ADR pages and summaries as decision history, not as ordinary reference
pages. Current accepted decision records control the decisions they record, and
only later decision records can reverse or supersede them. The prose
specification, schemas, OpenAPI contract, and fixtures provide the current
release surface and detailed structured contracts only where they remain
consistent with those decisions.

## Published identifier coverage

The v0.1.0-rc.1 documentation site should provide stable public documentation
for Agent Volumes-owned identifiers that appear in the specification,
companion artifacts, or mapping fixtures. For versioned specification archive
pages, the canonical rendered documentation URL is on `docs.agentvolumes.org`.
When an Agent Volumes-owned identifier or release evidence uses an apex
`https://agentvolumes.org/spec/*` URI, treat that apex URI as the durable
specification alias and verify that it redirects to the corresponding docs-host
page without creating a duplicate indexable page.

### Schema identifiers

Every schema `$id` under this versioned prefix should be externally
referenceable:

```text
https://agentvolumes.org/spec/0.1.0-rc.1/schemas/
```

Schema documentation pages should resolve on the corresponding docs-host route,
such as `https://docs.agentvolumes.org/spec/0.1.0-rc.1/schemas/`, link to the
canonical source file in [`../schemas/`](../schemas/), and explain the artifact
family it belongs to. The apex `/spec/*` schema URL remains a stable public alias
or identifier surface where used by the release; it should redirect rather than
serve a second rendered copy.

### Problem Details type URIs

Problem type pages should cover the closed v0.1 portable problem set under:

```text
https://agentvolumes.org/problems/
```

The set is defined by
[`../schemas/problem-details.schema.json`](../schemas/problem-details.schema.json)
and mirrored by
[`../conformance/fixtures/problem-registry.json`](../conformance/fixtures/problem-registry.json).
Do not add new problem slugs in site content alone.

### SPDX extension namespace

The canonical SPDX namespace for external dependency declaration terms is:

```text
https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#
```

Document the canonical class and property terms from ADR-0141. The preferred
compact alias for examples is `av:`, but the expanded URI is the canonical term
identity. CycloneDX `agent-volumes:*` property names are not canonical SPDX term
identifiers.

### in-toto predicate identifier

External dependency declarations may be carried outside SLSA provenance subjects,
materials, resolved dependencies, byproducts, and internal parameters by an
optional in-toto predicate:

```text
https://agentvolumes.org/predicates/external-dependency-declarations/v0.1
```

Document this as part of the external dependency mapping model, not as a generic
resolved dependency or scanner finding format.

### Build and profile identifiers

If a mapping sample uses an Agent Volumes-owned build or profile URI such as:

```text
https://agentvolumes.org/build/manual/v0.1
```

document its role as used by the mapping fixture. Do not generalize sample-only
identifiers into broad registries or profiles unless the specification creates
that surface.

### Reserved extension namespaces

Reserved extension namespace documentation should link to
[`../schemas/reserved-extension-namespaces.json`](../schemas/reserved-extension-namespaces.json)
and explain that adding new reserved names is a breaking change for the relevant
release line.

### PURL/VERS compatibility exceptions and upstream baselines

Publish explanatory pages for:

- [`../conformance/purl-vers-compatibility-exceptions.json`](../conformance/purl-vers-compatibility-exceptions.json)
- [`../conformance/upstream-baselines.json`](../conformance/upstream-baselines.json)

These pages should explain how the artifacts support validation, matching, and
warning context without becoming package-manager resolution policy.

## Maintainer search discovery and SEO guidance

This section is for site maintainers and publication editors. It is operational
guidance for maintaining the Mintlify site; it is not reader-facing specification
content and should not become a public documentation page.

Treat SEO as publication-layer discoverability work. Search metadata, sitemap
membership, `robots` behavior, social previews, and AI-facing discovery files
must help readers and tools find the right page; they must not redefine Agent
Volumes terminology, broaden published identifiers, or outrank the
source-of-truth hierarchy.

### Mintlify SEO controls

Mintlify automatically handles several baseline SEO concerns for pages included
in the documentation navigation, including meta tag generation, semantic HTML,
mobile-friendly output, `sitemap.xml`, and `robots.txt`. Use those defaults
unless the site needs an explicit publication decision.

When maintainers need explicit SEO metadata, configure it through
Mintlify-supported site configuration or page frontmatter:

- Use `docs.json` `seo.metatags` for site-wide defaults such as domain-level
  verification, global Open Graph defaults, or the preferred canonical host for
  the documentation deployment.
- Use page frontmatter for page-specific `title`, `description`, `keywords`,
  `og:*`, `twitter:*`, `canonical`, `robots`, and `noindex` values.
- Quote frontmatter keys that contain colons, such as `"og:title"`.
- Format `keywords` as a YAML array, and include only terms that genuinely
  describe the page.
- Verify deployed canonical URL behavior on the public site, especially after
  changing custom-domain or redirect configuration. Confirm that documentation
  pages self-canonicalize on `docs.agentvolumes.org`, organization pages
  self-canonicalize on `agentvolumes.org`, and apex `/spec/*` aliases redirect
  instead of indexing duplicate docs-host content.

Mintlify can generate Open Graph images from the page title, page description,
site logo, and site color. Prefer generated previews or a consistent
`thumbnails.background` when the default preview is sufficient. Set a static
`og:image` globally or per page only when the replacement image is intentional
and remains accurate for the target page.

### Maintainer page metadata rules

When preparing indexed pages, maintainers should ensure metadata matches the
page's actual purpose:

- Write one unique, descriptive title per page. Lead with the topic a reader is
  looking for, then add the Agent Volumes context when helpful.
- Write one unique description that explains what the reader can do or learn on
  the page. Prefer concrete nouns from the specification over marketing claims.
- Keep titles and descriptions concise enough to scan in search results, but do
  not sacrifice accuracy for character-count targets.
- Use the canonical source artifact as the page's framing context. A page about a
  schema, Problem Details type, ADR, fixture family, or OpenAPI surface should
  identify the canonical artifact early.
- Use `noindex: true` for draft, duplicate, generated-support, or navigation-only
  pages that should not appear as independent search results.
- Do not use `noindex`, `robots`, or canonical tags to hide unresolved
  source-of-truth drift. Fix the source or the page instead.

Metadata must remain consistent with URI publication rules. Do not rewrite
versioned URI paths, schema `$id` values, Problem Details slugs, SPDX term
fragments, predicate identifiers, or reserved namespace keys to make them more
search-friendly.

### Maintainer checklist for search and AI retrieval

Google's guidance for generative AI features is that ordinary SEO fundamentals
continue to apply: pages need to be crawlable, indexable, eligible for snippets,
and useful to readers. For this site, that means:

- Write human-first documentation with original, standards-specific explanation.
  Avoid commodity summaries that restate generic package-registry advice without
  Agent Volumes-specific value.
- Use a clear heading hierarchy. Each page should have one primary topic, then
  descriptive sections that match the questions implementers and reviewers ask.
- Put the page's core answer or scope statement near the top. Reference pages
  should identify the canonical source artifact before moving into examples or
  rationale.
- Use short paragraphs, lists, tables, and examples when they make the document
  easier to scan. Do not split pages into artificial fragments only for search or
  AI systems.
- Link related pages with descriptive anchor text, such as “version index
  resolver behavior” or “Problem Details type URIs,” not “click here.”
- Keep topic clusters coherent: conceptual pages should link to reference pages,
  reference pages should link to canonical artifacts, and ADR summaries should
  link to the current accepted decision records they summarize.
- Add images, diagrams, or video only when they clarify the standard. Provide
  descriptive filenames and alt text for every meaningful image.
- Keep examples, generated API references, screenshots, redirects, and
  publication copies current during release-candidate and stable-release work.

Do not create doorway pages, near-duplicate keyword variants, or “AI SEO” rewrites
for every possible query. Google explicitly treats generative AI visibility as
part of Search rather than a separate optimization channel, and its guidance
warns against scaled content created primarily to manipulate rankings or AI
answers.

### Indexing, sitemap, robots, and AI-facing surfaces

By default, Mintlify indexes pages included in `docs.json` navigation. Hidden
pages are excluded from search engine sitemaps, internal documentation search,
AI assistant context, and MCP search unless the site configuration deliberately
makes them searchable.

Use indexing controls deliberately:

- Keep canonical public pages in navigation unless there is a clear reason to
  hide them.
- Use `seo.indexing: "all"` or `searchable: true` on hidden navigation groups only
  when hidden pages are intended to be discoverable.
- Review `/sitemap.xml` after navigation, hidden-page, or indexing changes.
- Avoid custom `robots.txt` rules unless they are necessary. A custom file
  replaces Mintlify's generated file.
- Do not block AI crawlers such as GPTBot, ClaudeBot, or PerplexityBot unless the
  project intentionally wants to prevent those tools from crawling and citing the
  documentation.

Mintlify's AI-facing surfaces, including `llms.txt`, `llms-full.txt`,
`.well-known` discovery paths, MCP access, and Markdown-oriented publication
formats, are useful for documentation consumers and agentic tools. Maintain them
as publication aids, but do not describe them as Google ranking factors. Google's
AI optimization guidance says special AI text files or markup are not required
for visibility in Google generative AI features.

### Mintlify configuration surfaces to review

Treat `site/docs.json` as the publication blueprint for the Mintlify site. It can
control navigation, search, AI-facing controls, SEO defaults, API reference
generation, and interaction behavior. Configuration changes should remain
publication-layer changes unless the canonical specification artifacts also
change.

When reviewing `docs.json`, check these Mintlify-specific surfaces:

- Keep `$schema` current with the Mintlify configuration schema used by the site.
- Use `$ref` only to split large configuration files without hiding publication
  policy. Referenced files remain part of the same review surface.
- Review `navigation.directory`, `navigation.versions`, group `root` pages, and
  `default` version markers together so sidebar behavior, archive routing, and
  release-selector behavior do not drift.
- Use `interaction.drilldown` or similar navigation affordances only when they
  improve scanning; do not use them to bury canonical release pages.
- Review `contextual.options` and related contextual-menu settings as AI and
  reader convenience controls. They do not create additional sources of truth.
- Use `seo.indexing` and group-level `searchable` controls deliberately. Hidden
  pages should become searchable only when they are intentionally public support
  pages.
- Use `metadata.timestamp` only when page timestamps would help readers judge
  freshness. Timestamps must not imply that old immutable release archives have
  been updated with current-release semantics.

### Assets, media, and reusable snippets

Keep Mintlify assets and snippets maintainable:

- Store images, icons, and other static files where Mintlify can serve them from
  stable site paths. Use descriptive filenames and avoid replacing versioned
  evidence images without release justification.
- Keep meaningful images within Mintlify's supported image-size limits and provide
  alt text that explains the image's documentation purpose.
- Avoid decorative images on reference pages. If a diagram, screenshot, or video
  stops reflecting the current release, update it with the same source-of-truth
  review used for prose.
- Use reusable snippets for repeated publication-layer text such as support
  notices, derived-artifact labels, or shared navigation explanations. Do not use
  snippets to duplicate normative requirements that belong in
  `agent-volumes-spec.md`, schemas, OpenAPI, or conformance artifacts.
- Review snippet imports during link and preview checks. Some editor surfaces may
  not support every snippet workflow, so snippet-heavy changes should receive a
  local preview before merge.

### Search quality anti-patterns

Avoid these SEO practices on the Agent Volumes site:

- keyword stuffing in titles, descriptions, headings, or hidden metadata;
- changing normative terminology to match search volume;
- using speculative future profiles as search landing pages;
- duplicating pages for minor query variations;
- representing conformance fixture results as certification, hosted-service
  approval, or production readiness;
- using structured data as a substitute for accurate prose and canonical links;
- seeking inauthentic mentions or backlinks;
- relying on `llms.txt`, custom AI markup, or content chunking as a replacement
  for useful, crawlable documentation.

Structured data can support ordinary rich-result eligibility when a future site
page has an appropriate schema.org use case, but it is not required for Google
generative AI visibility and must not imply semantics that the specification does
not define.

## Maintainer page authoring rules

- Use direct, implementer-facing prose.
- Start each reference page with the canonical source artifact.
- Give every indexed page a unique, accurate title and description.
- Keep SEO metadata aligned with the page's canonical source artifact and URI
  publication role.
- Prefer examples copied from or derived from the prose specification and
  conformance fixtures.
- Use descriptive internal-link anchor text and maintain topic-cluster links
  between concept, reference, artifact, and ADR pages.
- Mark generated or bundled publication copies as derived.
- Add alt text for meaningful images and avoid decorative images that distract
  from the specification.
- Give fenced code blocks accurate language tags when the language is known, and
  use plain text fences for terminal output, URLs, or identifier examples.
- Keep internal links root-relative or repository-relative according to context,
  and avoid file-extension links in public site prose unless the target is a
  downloadable artifact.
- Keep reusable snippets short, publication-layer focused, and easy to preview in
  local Mintlify builds.
- Preserve Human Era / Holocene Era dates in human-readable project text.
- Do not normalize versioned URI paths, Problem Details slugs, schema `$id`
  values, or URI fragments for style.
- Avoid speculative future profiles unless a page clearly labels them as deferred
  or future work.

## Maintenance workflow

When changing the public documentation site:

1. Identify the source-of-truth artifact that justifies the change.
2. Update the site page only after the source artifact is correct.
3. If the change affects structured behavior, check whether schemas, OpenAPI,
   fixtures, conformance coverage, and release notes also need updates.
4. Classify the target page as unversioned navigation, `/spec/` archive selector,
   immutable `/spec/<version>/...` release content, a `/spec/latest` or
   `/spec/current` alias, or an apex `/spec/*` redirect alias.
5. If the change affects a published URI, confirm whether the path is versioned,
   immutable, redirected, an apex `/spec/*` alias, or a latest-style alias.
6. If the change affects a released documentation surface, confirm whether the
   change belongs only in the current release subtree, requires a new release
   subtree, or is an allowed unversioned overview/navigation update. Do not
   retrofit historical release pages with current-release semantics.
7. If the change changes the active release, update `navigation.versions`,
   `/spec/latest`, and `/spec/current` atomically with the release archive and release
   evidence when those aliases are maintained.
8. If the change affects public discoverability, review title, description,
   canonical URL, sitemap membership, host-specific redirects, `robots`,
   `noindex`, and AI-facing publication surfaces.
9. If the change affects API documentation, regenerate any Mintlify publication
   copy from the canonical OpenAPI contract.
10. Run the validation commands for the affected change type.

For Markdown-only maintenance documents, run:

```bash
bun run format:check
bun run lint:md
```

For Mintlify site content, navigation, assets, snippets, or configuration
changes, run the site validation from the repository root:

```bash
bun run lint:site
```

When a change affects anchors, snippets, accessibility, or local preview behavior,
run the corresponding Mintlify checks from the `site/` subtree before merge:

```bash
bun run --cwd site broken-links -- --check-anchors --check-snippets
bun run --cwd site mint a11y
bun run site:dev
```

Use `mint score` or other optional Mintlify quality checks only when the pinned
local Mintlify CLI supports them. Treat their output as publication-quality
feedback, not as a substitute for source-of-truth review.

For release-candidate or stable-release site work, also follow the release-freeze
checks in [`release-process.md`](release-process.md), including site linting,
OpenAPI publication refresh, artifact validation, and URI publication evidence.

## Review checklist

Before merging documentation-site changes, reviewers should confirm:

- The page links back to the canonical source artifact.
- Release-specific pages live under the correct versioned subtree, and historical
  non-draft release pages remain permanently reachable.
- Unversioned pages are limited to landing, navigation, orientation, archive
  selection, and organization-resource routing, or they link to exact versioned
  pages for implementation details.
- `/spec/` behaves as an archive selector or version index, not as a mutable copy
  of release-specific reference content.
- `navigation.versions` contains the published non-draft release navigation trees,
  and the site does not present a competing top-level `Release archive` tab as a
  second primary version selector.
- `/spec/latest` and `/spec/current` are explicit convenience redirects or navigation aids,
  not canonical release citation targets.
- Decisions, normative release-surface material, and explanatory context are
  clearly labeled.
- Published identifiers are not rewritten or broadened.
- Indexed pages have accurate, unique titles and descriptions.
- Canonical URLs, sitemap membership, `robots`, and `noindex` settings match the
  intended publication role.
- `docs.json` changes preserve the intended `$schema`, `$ref`, navigation,
  contextual-menu, indexing, and timestamp behavior for the affected release
  surface.
- `docs.agentvolumes.org` routes, `agentvolumes.org` organization pages,
  `www.agentvolumes.org` redirects, and apex `/spec/*` aliases follow ADR-0155
  and ADR-0156.
- AI-facing surfaces are treated as publication aids, not as Google ranking
  requirements or alternate sources of truth.
- Assets, media, and reusable snippets remain publication-layer aids, have local
  preview coverage when changed, and do not duplicate canonical requirements.
- Conformance claims are not represented as certification.
- Derived OpenAPI or schema publication copies match their canonical sources.
- URI publication pages distinguish canonical identifiers, documentation pages,
  and machine-readable artifacts.
- Deferred topics remain described as local policy or future work, not accidental
  omissions.
