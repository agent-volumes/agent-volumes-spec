# Validation and Conformance Policy

This policy describes the checks expected for Agent Volumes specification
changes. It is the repository-specific testing policy for a spec repository.

## Validation commands

Run these commands from the repository root:

```bash
bun run format:check
bun run changelog:check
bun run lint:md
bun run lint:openapi
bun run validate:artifacts
```

Equivalent package-manager invocations are acceptable when they run the same
scripts from [`package.json`](../../package.json).

## Required checks by change type

| Change type                   | Required local checks                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------- |
| Markdown-only process docs    | `bun run format:check`, `bun run lint:md`                                                    |
| Specification prose           | `bun run format:check`, `bun run lint:md`, `bun run validate:artifacts`                      |
| JSON Schema or fixture        | `bun run format:check`, `bun run validate:artifacts`                                         |
| OpenAPI contract              | `bun run format:check`, `bun run lint:openapi`, `bun run validate:artifacts`                 |
| Changelog or release process  | `bun run changelog:check`, `bun run format:check`, `bun run lint:md`                         |
| Workflow or dependency config | `bun run format:check`, `bun run changelog:check`, plus relevant CI checks after PR creation |

`bun run validate:artifacts` includes targeted OpenAPI/schema/fixture alignment
checks, but it is not a substitute for the endpoint-level prose/OpenAPI drift
audit. OpenAPI contract changes and release-freeze work still require updating
[`../../openapi/PROSE-DRIFT-AUDIT.md`](../../openapi/PROSE-DRIFT-AUDIT.md)
when the checklist status or evidence changes.

## Coverage expectations

Major new deterministic behavior is expected to add or update conformance
coverage. Reviewers check for one of these outcomes:

1. A schema update covers the new structure.
2. A fixture or fixture case covers the deterministic behavior.
3. `conformance/fixtures/conformance-coverage.json` maps the affected `AV-*`
   requirement to the appropriate fixture family.
4. `conformance/REQUIREMENTS.md` explains why the behavior is prose-boundary,
   local policy, or intentionally deferred.

## Regression expectations

When a bug is fixed in the specification, schema, OpenAPI, fixture corpus, or
validation script, the fix is expected to include a regression artifact when the
failure is deterministic. Suitable regression artifacts include:

- a new fixture case;
- a schema example or validation case;
- a problem details case;
- an OpenAPI/prose drift checklist update; or
- a documented prose-boundary explanation when no deterministic offline vector
  is appropriate.

## CI expectations

Pull requests that touch Markdown, JSON, YAML, scripts, schemas, OpenAPI, or
conformance fixtures run the repository lint and artifact validation workflow.
Dependency Review, OSV Scanner, and OpenSSF Scorecard run through organization
reusable workflows.

Changelog changes are validated for Keep a Changelog structure and release-tag
coverage with `bun run changelog:check`. The check confirms that tracked release
tags have corresponding `CHANGELOG.md` sections; maintainers still curate the
generated text for clarity before tagging.

Maintainers treat failing required checks as blockers unless the failure is
confirmed to be unrelated infrastructure flakiness and is documented in the PR.
