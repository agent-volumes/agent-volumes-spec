# OpenAPI / Prose Drift Audit Workflow

Use this reference when reviewing `openapi/PROSE-DRIFT-AUDIT.md`, OpenAPI
contract changes, Registry API prose changes, or release-freeze readiness for an
HTTP API specification.

## Scope

Review alignment across these sources:

- normative API prose, especially Registry API and conformance sections;
- OpenAPI path/method/operation definitions;
- standalone JSON Schemas and OpenAPI component schemas;
- conformance fixtures and coverage mapping;
- release-freeze audit evidence and prose-boundary/deferred-topic notes.

For this repository, the canonical files are:

- `agent-volumes-spec.md` §9 and §11;
- `openapi/bibliotheca.openapi.yaml`;
- `openapi/PROSE-DRIFT-AUDIT.md`;
- `schemas/`;
- `conformance/README.md`;
- `conformance/REQUIREMENTS.md`;
- `conformance/fixtures/conformance-coverage.json`.

## Mandatory context gathering

Gather evidence before judging the checklist:

1. Enumerate every OpenAPI path/method/`operationId`.
2. Map each operation to exactly one endpoint family in the audit matrix.
3. Read the matching prose section for each endpoint family.
4. Read the referenced schemas and fixture families.
5. Check conformance requirement IDs (`AV-BIB-*`, `AV-CLI-*`) that the row claims
   to cover.
6. Check documented prose-boundary and deferred-topic notes before calling a gap
   release-blocking.

Do not evaluate only the status column. A row can have the right status but still
have weak or stale checklist content.

## Endpoint-family checks

For each endpoint family, verify:

- **Route topology**: prose examples and OpenAPI paths match, including scoped
  and scopeless variants.
- **Operation coverage**: every OpenAPI operation appears in exactly one audit
  row; no row points to removed or renamed operations.
- **Request contract parity**: path/query/header parameters, request bodies,
  media types, required fields, defaults, bounds, enum values, and idempotency
  semantics match prose.
- **Success response parity**: status code, media type, schema `$ref`, required
  fields, empty-list or empty-collection semantics, cache headers, and examples
  match prose.
- **Auth boundary parity**: protected writes declare bearer auth; public read
  surfaces remain unauthenticated; `401` and `403` semantics are distinct.
- **Error contract parity**: expected problem slugs, HTTP status codes,
  `application/problem+json`, and examples match the closed problem set.
- **Fixture parity**: deterministic behavior has named fixture evidence or a
  prose-boundary note.
- **Policy boundary parity**: local choices are not implied as portable baseline
  behavior.

## Common release-freeze invariants

A release-freeze audit should require all of these:

1. All OpenAPI operations are mapped exactly once.
2. OpenAPI `info.version`, route family (`/api/v1`), spec draft, schema `$id`s,
   and capability metadata version fields are in lockstep.
3. Expected endpoint problem slugs are operation-appropriate. Avoid family-level
   unions that hide differences between search/list and detail/fetch operations.
4. Shared OpenAPI response components are traced to operation-specific expected
   slugs; shared components alone are not sufficient evidence.
5. Deterministic behavior links to exact fixture files or fixture case names when
   lifecycle fixtures contain many cases.
6. Release cannot freeze with unresolved release-blocking drift. Deferred or
   prose-boundary items may remain only when explicitly documented as non-blocking.
7. Evidence includes reviewer/date, command or CI output, related PR/commit, and
   fixture or prose-boundary links.

## Agent delegation pattern

For independent review, run at least two reviewers with non-overlapping focus:

### Endpoint coverage reviewer

```text
1. TASK: Verify OpenAPI operation coverage and endpoint-family mapping.
2. EXPECTED OUTCOME: List missing, duplicate, stale, or mis-scoped operation rows.
3. REQUIRED TOOLS: Read, Grep, Glob. No edits.
4. MUST DO: Compare OpenAPI paths/methods/operationIds to the audit matrix and
   prose §9 endpoint topology.
5. MUST NOT DO: Do not judge status values except when they conflict with evidence.
6. CONTEXT: Ignore whether rows are checked/pending; evaluate checklist structure.
```

### Error/auth/request reviewer

```text
1. TASK: Verify request contracts, auth boundaries, and endpoint-specific problem
   slug expectations in the drift audit.
2. EXPECTED OUTCOME: Prioritized blockers, should-fix items, and nice-to-haves.
3. REQUIRED TOOLS: Read, Grep. No edits.
4. MUST DO: Check path/query/header/body semantics, `Idempotency-Key`, bearer auth,
   public endpoints, `401`/`403`, status codes, media types, and fixtures.
5. MUST NOT DO: Do not propose implementation-local requirements outside the
   portable baseline.
6. CONTEXT: Cross-check prose §9.8-§9.10, OpenAPI responses, and fixture families.
```

### Oracle-style final reviewer

```text
1. TASK: Independently assess whether the drift audit is release-freeze ready.
2. EXPECTED OUTCOME: Blockers, should-fix, nice-to-have, plus a coverage
   confirmation table.
3. REQUIRED TOOLS: Read-only repository inspection.
4. MUST DO: Look for overclaiming, incorrect expected problem slugs, incorrect
   auth expectations, missing endpoint families, ambiguous freeze gate wording,
   and weak evidence semantics.
5. MUST NOT DO: Do not edit files or focus on status values unless status/evidence
   semantics contradict the checklist itself.
6. CONTEXT: Human and agent reviews should be cross-checkable from evidence.
```

## Human / agent cross-validation workflow

1. Human reviewer fills or updates the audit matrix with evidence.
2. Endpoint coverage reviewer checks operation mapping independently.
3. Error/auth/request reviewer checks semantic correctness independently.
4. Oracle-style final reviewer checks freeze gate and overclaiming.
5. Human compares findings, resolves contradictions, and records final evidence.
6. Release-freeze signoff proceeds only when unresolved drift is `none`, except
   explicitly non-blocking deferred or prose-boundary items.

## Report template

```markdown
## OpenAPI / Prose Drift Audit Review

### Verdict

[READY / NOT READY / PARTIAL] - [one-sentence reason]

### Coverage confirmation

| Area                    | Status | Evidence |
| ----------------------- | ------ | -------- |
| Operation coverage      | ✅/❌  | ...      |
| Request contract parity | ✅/❌  | ...      |
| Success response parity | ✅/❌  | ...      |
| Error contract parity   | ✅/❌  | ...      |
| Auth boundary parity    | ✅/❌  | ...      |
| Version lockstep        | ✅/❌  | ...      |
| Fixture parity          | ✅/❌  | ...      |
| Local policy boundary   | ✅/❌  | ...      |
| Freeze gate             | ✅/❌  | ...      |

### Blockers

- [Finding with file/section evidence]

### Should-fix

- [Finding with file/section evidence]

### Nice-to-have

- [Finding with file/section evidence]

### Cross-review notes

- Human reviewer:
- Agent reviewer(s):
- Disagreements resolved:
```

## Common false positives

- Do not require standardizing token issuance, registry priority, lockfiles,
  prerelease selection, advisory writes, scanner interchange, multipart upload,
  or universal trust roots when the prose marks them local or deferred.
- Do not treat lack of live service tests as a fixture gap when the behavior is
  explicitly outside deterministic offline conformance.

## Do not overclaim evidence

- Do not treat wildcard fixture anchors as sufficient evidence when a multi-case
  fixture needs operation-specific case coverage.
- Do not accept a shared problem response component as proof that an operation
  exposes the correct endpoint-specific problem slugs.
