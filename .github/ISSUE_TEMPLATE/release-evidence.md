---
name: Release evidence
about: Track per-version release-freeze evidence for OpenAPI/prose drift and artifact validation.
title: "[release-evidence] <version-or-tag>"
labels: documentation
assignees: ""
---

## Release evidence for `<version-or-tag>`

Use this issue as the canonical evidence ledger for one draft, release-candidate,
or stable release. Human-readable dates in this issue use Human Era / Holocene
Era (HE) notation using the `YYYYY-MM-DD HE` shape.

## Scope

- Version under review:
- Target tag:
- Evidence issue date (`YYYYY-MM-DD HE`):
- Release manager:
- Drift audit:
  [`openapi/PROSE-DRIFT-AUDIT.md`](https://github.com/agent-volumes/agent-volumes-spec/blob/main/openapi/PROSE-DRIFT-AUDIT.md)
- Release process:
  [`docs/release-process.md`](https://github.com/agent-volumes/agent-volumes-spec/blob/main/docs/release-process.md)
- Coverage sufficiency review:
  [`conformance/REQUIREMENTS.md#coverage-sufficiency-review`](https://github.com/agent-volumes/agent-volumes-spec/blob/main/conformance/REQUIREMENTS.md#coverage-sufficiency-review)

## Evidence classification

Use the validation classes from
[`docs/development/validation-and-conformance.md`](https://github.com/agent-volumes/agent-volumes-spec/blob/main/docs/development/validation-and-conformance.md)
when recording evidence:

- `portable-conformance-fixture` — schema checks, deterministic expected outcomes,
  warning/problem categories, lifecycle states, digest vectors, subject binding,
  or algorithmic fixture evaluators that independent offline runners can
  reproduce.
- `repository-artifact-hygiene` — release-maintenance checks proving this
  repository's companion artifacts agree with each other.
- `human-review-release-evidence` — manual review evidence that stays aligned with
  machine-readable artifacts but is not validator input.
- `deferred-or-local-policy-boundary` — intentionally out-of-scope behavior for
  the portable v0.1 fixture claim unless a future profile standardizes it.

Publication drift, schema `$id`/`specVersion`/release-path lockstep, OpenAPI
operation matrix parity, endpoint-family evidence connectivity, conformance
coverage connectivity, and problem-registry synchronization are
`repository-artifact-hygiene`. Do not record them as product conformance evidence
unless the same portable behavior is also backed by a fixture, schema, or
algorithmic vector.

## Global validation evidence

- [ ] `bun install && (cd site && bun install)`
  - Evidence:
- [ ] `bun run build:site:openapi`
  - Evidence:
- [ ] `bun run format:check`
  - Evidence:
- [ ] `bun run lint:md`
  - Evidence:
- [ ] `bun run lint:openapi`
  - Evidence:
- [ ] `bun run lint:site`
  - Evidence:
- [ ] `bun run validate:artifacts`
  - Evidence:
  - Evidence class: `portable-conformance-fixture` for deterministic fixture
    outcomes; `repository-artifact-hygiene` for publication drift, schema `$id`,
    OpenAPI matrix parity, problem-registry synchronization, and coverage
    connectivity checks.
- [ ] `bun run changelog:check`
  - Evidence:

## Namespace and URI publication evidence

Each row should name the public URL, source artifact, and evidence that the
route is immutable or intentionally redirected for this release.

| Checklist item                             | Public URL or identifier | Source artifact | Immutability / check evidence |
| ------------------------------------------ | ------------------------ | --------------- | ----------------------------- |
| SPDX extension namespace                   |                          |                 |                               |
| in-toto predicate URI                      |                          |                 |                               |
| Problem Details type URIs                  |                          |                 |                               |
| JSON Schema `$id` URLs                     |                          |                 |                               |
| SLSA build type URI                        |                          |                 |                               |
| Agent Volumes BOM/profile identifiers      |                          |                 |                               |
| External dependency declaration key syntax |                          |                 |                               |
| Capability extension reserved namespaces   |                          |                 |                               |

## Operation coverage matrix links

After this issue is created, update the Evidence column in
`openapi/PROSE-DRIFT-AUDIT.md` with compact links back to this issue.

Recommended cell shape:

```text
issue=<this issue>; evidence=<endpoint-family-anchor>; fixtures=<fixture paths or prose-boundary>; drift=<none | checked exception | needs-update>
```

Example:

```text
issue=#123; evidence=release-upload-finalize; fixtures=conformance/fixtures/release-upload-lifecycle.json; drift=none
```

## Endpoint-family evidence

For each endpoint family, record the detailed evidence block here. The audit
table should link back to the relevant endpoint family entry in this issue.
For each block, apply the
[`Coverage sufficiency review`](https://github.com/agent-volumes/agent-volumes-spec/blob/main/conformance/REQUIREMENTS.md#coverage-sufficiency-review):
confirm the evidence class, fixture/case stability, positive and negative paths,
repository-hygiene boundaries, and any prose-boundary or deferred explanation.

### Catalog search

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Catalog search
- Related changes:
- Evidence class:
- Coverage sufficiency review:
- Fixture evidence:
- Remaining drift:

### Release upload intent

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Release upload intent
- Related changes:
- Evidence class:
- Coverage sufficiency review:
- Fixture evidence:
- Remaining drift:

### Release upload finalize

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Release upload finalize
- Related changes:
- Evidence class:
- Coverage sufficiency review:
- Fixture evidence:
- Remaining drift:

### Exact release metadata

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Exact release metadata
- Related changes:
- Evidence class:
- Coverage sufficiency review:
- Fixture evidence:
- Remaining drift:

### Unpublish / lifecycle mutation

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Unpublish / lifecycle mutation
- Related changes:
- Evidence class:
- Coverage sufficiency review:
- Fixture evidence:
- Remaining drift:

### Version index

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Version index
- Related changes:
- Evidence class:
- Coverage sufficiency review:
- Fixture evidence:
- Remaining drift:

### Trust summary

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Trust summary
- Related changes:
- Evidence class:
- Coverage sufficiency review:
- Fixture evidence:
- Remaining drift:

### Trust detail

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Trust detail
- Related changes:
- Evidence class:
- Coverage sufficiency review:
- Fixture evidence:
- Remaining drift:

### Trust upload intent

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Trust upload intent
- Related changes:
- Evidence class:
- Coverage sufficiency review:
- Fixture evidence:
- Remaining drift:

### Trust upload finalize

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Trust upload finalize
- Related changes:
- Evidence class:
- Coverage sufficiency review:
- Fixture evidence:
- Remaining drift:

### Advisory search

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Advisory search
- Related changes:
- Evidence class:
- Coverage sufficiency review:
- Fixture evidence:
- Remaining drift:

### Advisory detail

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Advisory detail
- Related changes:
- Evidence class:
- Coverage sufficiency review:
- Fixture evidence:
- Remaining drift:

### Capability metadata

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Capability metadata
- Related changes:
- Evidence class:
- Coverage sufficiency review:
- Fixture evidence:
- Remaining drift:

## Release-freeze signoff

- [ ] Every OpenAPI path/method/`operationId` appears in exactly one endpoint
      family row.
- [ ] Every endpoint family in `openapi/PROSE-DRIFT-AUDIT.md` is marked
      `checked`, or every remaining `needs-update` row is documented here as a
      release-blocking exception with an owner.
- [ ] No release-blocking exception remains unresolved at freeze time.
- [ ] Every deterministic endpoint behavior has a fixture link or a documented
      prose-boundary explanation.
- [ ] Each endpoint-family evidence block records the evidence class and confirms
      the `conformance/REQUIREMENTS.md` coverage sufficiency review points.
- [ ] Repository artifact hygiene checks, including publication drift, schema `$id`
      alignment, OpenAPI matrix parity, and coverage connectivity, are not counted
      as product conformance evidence unless a portable fixture, schema, or vector
      covers the same behavior.
- [ ] Expected problem slugs, statuses, and media types align across prose,
      OpenAPI, schemas, and fixtures.
- [ ] Request contracts, response contracts, auth boundaries, and version
      lockstep invariants have evidence.
- [ ] Local-policy choices remain documented as local choices rather than
      portable requirements.
- [ ] Remaining drift is `none`, except documented deferred or prose-boundary
      items that do not block release readiness.

## Final disposition

- Freeze disposition: `ready` / `blocked`
- Final reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Release notes link:
- Changelog entry link:
