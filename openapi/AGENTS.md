# OPENAPI CONTRACT

Bibliotheca Registry API contract plus release-freeze drift audit. The prose specification remains the normative source; this subtree keeps API shape, schemas, fixtures, and evidence aligned.

## STRUCTURE

```text
openapi/
├── bibliotheca.openapi.yaml  # OpenAPI 3.1.1 contract (~1.3k lines)
└── PROSE-DRIFT-AUDIT.md      # Endpoint-family parity checklist
```

## WHERE TO LOOK

| Task                         | File                       | Notes                                     |
| ---------------------------- | -------------------------- | ----------------------------------------- |
| Change API path/operation    | `bibliotheca.openapi.yaml` | Update operation matrix in drift audit    |
| Change endpoint semantics    | `PROSE-DRIFT-AUDIT.md`     | Link prose, schema, fixture, evidence     |
| Change error/problem mapping | Both files                 | Keep closed RFC 9457 problem set aligned  |
| Change schema reference      | `bibliotheca.openapi.yaml` | Check matching `../schemas/*.schema.json` |
| Release-freeze review        | `PROSE-DRIFT-AUDIT.md`     | Evidence cells point to release issue     |

## CONVENTIONS

- OpenAPI version is 3.1.1 with JSON Schema 2020-12 dialect.
- Public read operations keep `security: []`; protected write operations declare `bearerAuth`.
- Scoped and scopeless route variants stay semantically equivalent where both exist.
- Request/response contracts use external schema refs when a companion schema exists.
- Error responses use `application/problem+json` and the closed problem slug/status set in the audit.
- `Idempotency-Key` header/body equivalence matters for upload operations.

## ANTI-PATTERNS

- Do **not** add, remove, or rename `path`, method, or `operationId` without updating `PROSE-DRIFT-AUDIT.md`.
- Do **not** imply local policy topics as portable requirements: token issuance, advisory writes, multipart upload, universal trust roots, registry priority, or prerelease policy.
- Do **not** rely on shared problem components alone as evidence; operation-specific problem slugs must stay traceable.

## COMMANDS

```bash
bun run lint:openapi
bun run validate:artifacts
```
