---
name: Release evidence
about: Track per-version release-freeze evidence for OpenAPI/prose drift and artifact validation.
title: '[release-evidence] v0.1.0-draft.N'
labels: documentation
assignees: ''
---

## Release evidence for `v0.1.0-draft.N`

Use this issue as the canonical evidence ledger for one draft, release-candidate,
or stable release. Human-readable dates in this issue use Human Era / Holocene
Era (HE) notation, for example `12026-05-18 HE`.

## Scope

- Version under review:
- Target tag:
- Evidence issue date (`YYYYY-MM-DD HE`):
- Release manager:
- Drift audit:
  [`openapi/PROSE-DRIFT-AUDIT.md`](https://github.com/agent-volumes/agent-volumes-spec/blob/main/openapi/PROSE-DRIFT-AUDIT.md)
- Release process:
  [`docs/release-process.md`](https://github.com/agent-volumes/agent-volumes-spec/blob/main/docs/release-process.md)

## Global validation evidence

- [ ] `bun run format:check`
  - Evidence:
- [ ] `bun run lint:md`
  - Evidence:
- [ ] `bun run lint:openapi`
  - Evidence:
- [ ] `bun run validate:artifacts`
  - Evidence:
- [ ] `bun run changelog:check`
  - Evidence:

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

### Catalog search

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Catalog search
- Related changes:
- Fixture evidence:
- Remaining drift:

### Release upload intent

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Release upload intent
- Related changes:
- Fixture evidence:
- Remaining drift:

### Release upload finalize

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Release upload finalize
- Related changes:
- Fixture evidence:
- Remaining drift:

### Exact release metadata

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Exact release metadata
- Related changes:
- Fixture evidence:
- Remaining drift:

### Unpublish / lifecycle mutation

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Unpublish / lifecycle mutation
- Related changes:
- Fixture evidence:
- Remaining drift:

### Version index

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Version index
- Related changes:
- Fixture evidence:
- Remaining drift:

### Trust summary

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Trust summary
- Related changes:
- Fixture evidence:
- Remaining drift:

### Trust detail

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Trust detail
- Related changes:
- Fixture evidence:
- Remaining drift:

### Trust upload intent

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Trust upload intent
- Related changes:
- Fixture evidence:
- Remaining drift:

### Trust upload finalize

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Trust upload finalize
- Related changes:
- Fixture evidence:
- Remaining drift:

### Advisory search

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Advisory search
- Related changes:
- Fixture evidence:
- Remaining drift:

### Advisory detail

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Advisory detail
- Related changes:
- Fixture evidence:
- Remaining drift:

### Capability metadata

- Reviewer/date (`@handle`, `YYYYY-MM-DD HE`):
- Commands/CI:
- Rows reviewed: Capability metadata
- Related changes:
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
