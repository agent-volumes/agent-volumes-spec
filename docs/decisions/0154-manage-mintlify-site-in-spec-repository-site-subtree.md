---
status: accepted
date: 12026-05-18
decision-makers: Yunseo Kim
consulted: Mintlify documentation, Issue #29, ADR-0153, `agent-volumes-spec` repository structure, `agent-volumes/.github` contribution and routing guidance
---

# Manage the Mintlify site in this repository under `site/`

## Context and Problem Statement

ADR-0153 adopts Mintlify as the initial platform for the public
`agentvolumes.org` documentation site. That decision resolves the publication
platform question, but it leaves the repository topology open.

Issue #29 requires stable public documentation and dereference behavior for
Agent Volumes-owned Namespace and URI publications, including schema `$id` URLs,
Problem Details type URIs, SPDX extension namespace documentation, in-toto
predicate documentation, SLSA-related profile identifiers, BOM/profile
identifiers, external dependency declaration key documentation, and reserved
extension namespace governance.

Those publication surfaces are tightly coupled to this repository's canonical
artifacts:

- `agent-volumes-spec.md`
- `schemas/`
- `openapi/bibliotheca.openapi.yaml`
- `conformance/`
- `docs/decisions/`

The question is: **should the Mintlify source for `agentvolumes.org` live in this
repository or in a separate documentation-site repository?**

## Decision Drivers

- URI publication pages need to stay aligned with release-candidate and release
  tags for the specification and companion artifacts.
- The website must not become a competing normative source of truth. The prose
  specification, schemas, OpenAPI contract, conformance fixtures, and decision
  records remain authoritative.
- The repository already validates Markdown, JSON, YAML, OpenAPI, and companion
  artifacts; Mintlify validation can become an additional release gate.
- Mintlify supports monorepo documentation paths, so the site source can be kept
  in a dedicated subtree without making the repository root a Mintlify project.
- Existing `docs/` content is project process documentation and ADR history, not
  a Mintlify site scaffold.
- A separate repository would require artifact import, release-tag alignment,
  provenance tracking, and drift controls before every publication update.

## Considered Options

- A — Manage the Mintlify site in this repository under a dedicated `site/`
  subtree.
- B — Create a separate `agentvolumes.org` or documentation-site repository.
- C — Keep only generated publication artifacts in this repository and author the
  Mintlify source elsewhere.

## Decision Outcome

Chosen option: **A — Manage the Mintlify site in this repository under a
dedicated `site/` subtree**.

Under this decision:

- The Mintlify documentation-site source for `agentvolumes.org` lives under
  `site/` in this repository.
- `site/` is a publication layer. It does not change the normative authority of
  `agent-volumes-spec.md`, `schemas/`, `openapi/`, `conformance/`, or
  `docs/decisions/`.
- Existing `docs/` remains the repository's project documentation and ADR tree;
  it is not repurposed as the Mintlify site root.
- Mintlify deployment should be configured as a monorepo deployment whose
  documentation path points to `/site`.
- URI publication pages under `site/` should link to the canonical source
  artifacts and cite release versions or immutable artifact paths where relevant.
- Generated or copied website artifacts must be clearly marked as derived when
  they are not the canonical source.
- The Bibliotheca OpenAPI reference used by Mintlify should be generated from
  `openapi/bibliotheca.openapi.yaml` or from a pinned release copy. If Mintlify
  cannot consume the canonical external-reference form directly, the site should
  use a bundled OpenAPI document generated for publication while keeping the
  canonical contract unchanged.

## Consequences

- Good, because one pull request can update specification text, companion
  artifacts, and their public URI documentation together.
- Good, because release tags capture the normative artifacts and the publication
  source that describes them.
- Good, because existing artifact validation can be extended with Mintlify checks
  such as `mint validate` and `mint broken-links`.
- Good, because this avoids cross-repository synchronization for v0.1.0-rc.1 URI
  publication work.
- Neutral, because the repository now contains a second documentation surface:
  repository process documentation under `docs/` and public site source under
  `site/`.
- Neutral, because Mintlify remains a managed publication platform even though the
  source files are repository-owned.
- Bad, because site content increases repository size, review scope, and CI
  surface area.
- Bad, because generated site-oriented artifacts can drift from canonical sources
  unless generation, review, and validation discipline are maintained.

## Confirmation

- Verify that `site/docs.json` is the Mintlify configuration root for the public
  website.
- Verify that Mintlify deployment is configured with `/site` as the monorepo
  documentation path.
- Verify that `site/` pages for Agent Volumes-owned Namespace and URI
  publications link back to the canonical specification, schema, OpenAPI,
  conformance, and ADR sources.
- Verify that generated OpenAPI documentation is sourced from
  `openapi/bibliotheca.openapi.yaml` or an explicitly pinned release copy.
- Verify that any bundled OpenAPI document used for Mintlify is treated as a
  publication artifact, not as the canonical OpenAPI contract.
- Verify that required `agentvolumes.org` URI routes are covered by link,
  redirect, content-type, or equivalent release evidence checks where practical.
- Verify that schema `$id` URLs and other versioned URI publications remain
  immutable after release.

## Pros and Cons of the Options

### A — Manage the Mintlify site in this repository under `site/`

- Good, because the publication source stays close to the canonical artifacts it
  documents.
- Good, because release tags can preserve a coherent snapshot of specification,
  artifact, and public-site source state.
- Good, because monorepo deployment is supported by Mintlify and avoids creating
  a new repository solely for v0.1.0-rc.1 publication work.
- Neutral, because repository contributors must understand that `site/` is a
  publication layer while `agent-volumes-spec.md` and companion artifacts remain
  authoritative.
- Bad, because the repository gains additional site-specific files and validation
  requirements.

### B — Create a separate `agentvolumes.org` or documentation-site repository

- Good, because website ownership, deployment, and branch protection could be
  isolated from specification development.
- Good, because a broader future website with marketing, community, blog, or
  event content could evolve without adding non-normative material to the spec
  repository.
- Neutral, because a separate repository could still import release artifacts from
  this repository with automation.
- Bad, because v0.1.0-rc.1 URI publication pages would need explicit sync and
  provenance controls to avoid stale schema, OpenAPI, problem-type, namespace, or
  fixture references.
- Bad, because separate release tagging would make it harder to prove which
  website source described a particular specification release.

### C — Keep only generated publication artifacts here and author elsewhere

- Good, because generated files could be tied to release tags while authoring
  workflows remain separate.
- Neutral, because this could be useful if a future web team needs independent
  tools or permissions.
- Bad, because it adds both cross-repository synchronization and generated-file
  review burden.
- Bad, because it makes the authoritative authoring location less obvious for
  contributors trying to fix URI publication documentation.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- `agentvolumes.org` grows into a broader website whose lifecycle is materially
  independent from specification releases.
- Website maintainers, permissions, review rules, or deployment cadence diverge
  from the `agent-volumes-spec` repository.
- Mintlify monorepo deployment cannot satisfy required `agentvolumes.org` route,
  redirect, preview, or validation workflows.
- Required machine-readable publication behavior needs hosting controls that are
  better handled by a dedicated static or infrastructure repository.
- Site-specific assets or generated files become large enough to interfere with
  specification review, checkout, or release workflows.

## More Information

- ADR-0153 adopts Mintlify for the initial `agentvolumes.org` documentation site.
- Issue #29 tracks the required Agent Volumes-owned Namespace and URI
  publications.
- Mintlify's monorepo deployment model supports a dedicated documentation path
  such as `/site`.
- The organization-wide contribution guidance routes specification work to this
  repository and organization policy/governance work to `agent-volumes/.github`.
