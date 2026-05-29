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

## Machine-readable validation inputs

Automated validation uses machine-readable artifacts as its source of truth:
JSON fixtures, JSON Schemas, OpenAPI YAML, and deterministic generated/publication
artifacts. Human review documents, including
[`../../openapi/PROSE-DRIFT-AUDIT.md`](../../openapi/PROSE-DRIFT-AUDIT.md), are
not validator input contracts.

Validator assertions are labeled by validation class when reviewers discuss scope:

- **Portable conformance fixture checks** are schema checks, deterministic
  `expected` outcomes, warning/problem categories, lifecycle states, digest
  vectors, subject binding, and algorithmic fixture evaluators that independent
  runners can reproduce offline.
- **Repository artifact hygiene checks** are generated-publication drift, schema
  `$id` release alignment, OpenAPI matrix parity, problem-registry
  synchronization, fixture coverage connectivity, and other release-maintenance
  guards that prove this repository's companion artifacts agree with each other.

Only the first class is portable conformance behavior. The second class is
release evidence for this repository and must not be described as a product
conformance rule for independent implementations.

When recording review or release evidence, keep these examples in the repository
artifact hygiene class unless the same portable behavior is also backed by a
fixture, schema, or algorithmic vector:

- publication drift between canonical sources and generated/public site artifacts;
- schema `$id`, `specVersion`, OpenAPI `info.version`, and release-path lockstep;
- OpenAPI operation matrix parity, endpoint-family links, and problem response
  evidence connectivity;
- conformance coverage connectivity, including fixture existence, stable case
  names, and role-scoped `AV-*` requirement ID parity; and
- problem-registry synchronization across schemas, OpenAPI variants, examples,
  and fixtures.

Do not use those hygiene checks by themselves as proof of `client-role`,
`bibliotheca-read-role`, or `bibliotheca-write-capable-role` conformance. They
prove that this repository's release artifacts are internally aligned.

For current release alignment, the validator derives the expected specification
version from the `**Version:**` header in
[`../../agent-volumes-spec.md`](../../agent-volumes-spec.md). It checks
machine-readable release metadata such as schema `$id` prefixes, schema
`specVersion` values, OpenAPI `info.version`, capability metadata, and generated
publication artifact paths against that value. Environment overrides such as
`SPEC_VERSION` are for publication builders, not for changing validator
expectations; they are not repository configuration settings and do not replace
the prose header as the current-release validation source.

When an endpoint matrix, error mapping, or other review table needs automated
coverage, add or update a JSON fixture under `../../conformance/fixtures/` and
validate that fixture from `scripts/validate-artifacts/`. Keep the human audit
document aligned with the same semantics, but do not parse Markdown audit tables
from the validator.

## Validator change boundaries

Future validator changes must preserve the v0.1 artifact-first boundary. Do not
add automated validator checks for behavior that the portable offline harness
intentionally excludes:

- live registry behavior or deployed HTTP interoperability;
- local authorization policy, token issuance, token revocation, or publisher
  ownership checks;
- universal trust-root policy, live transparency-log policy, or online freshness
  checks;
- search ranking, relevance ordering, CDN behavior, replication, or other
  operations policy; or
- runtime adapter execution, sandboxing, allowlists, launch behavior, or UX.

New deterministic behavior needs a reviewable connection to the conformance
surface. Use one or more of these paths:

1. add or update a JSON Schema or schema validation case;
2. add or update a conformance fixture case;
3. add or update an algorithmic vector with explicit expected output;
4. map the affected role-scoped `AV-*` requirement in
   `../../conformance/fixtures/conformance-coverage.json`; or
5. document why the behavior is prose-boundary, local policy, or deferred in
   [`../../conformance/REQUIREMENTS.md`](../../conformance/REQUIREMENTS.md).

Hard-coded representative-case requirements in validator code must point back to
a durable source: the normative specification, a relevant ADR,
[`../../conformance/README.md`](../../conformance/README.md), or
[`../../conformance/REQUIREMENTS.md`](../../conformance/REQUIREMENTS.md). If a
representative case is useful only for repository hygiene, label it that way and
do not present it as product conformance evidence.

## Coverage expectations

Major new deterministic behavior is expected to add or update conformance
coverage. Reviewers check for one of these outcomes:

1. A schema update covers the new structure.
2. A fixture or fixture case covers the deterministic behavior.
3. `conformance/fixtures/conformance-coverage.json` maps the affected `AV-*`
   requirement to the appropriate fixture family.
4. `conformance/REQUIREMENTS.md` explains why the behavior is prose-boundary,
   local policy, or intentionally deferred.

Reviewers also check coverage sufficiency before accepting a new or changed
`conformance-coverage.json` mapping:

1. Confirm the coverage class is clear: schema-only structure, deterministic
   fixture behavior, algorithmic vector, OpenAPI/API matrix evidence,
   human-review release evidence, or prose/local-policy boundary.
2. Confirm each referenced fixture path exists and, when a `case` is named, that
   the case name is stable and tests the requirement's portable outcome rather
   than only fixture plumbing.
3. Confirm negative behavior is represented when the requirement defines a
   rejection, failure category, warning category, or lifecycle failure.
4. Confirm repository-hygiene checks are not counted as product conformance
   behavior unless the same portable outcome is also represented by a fixture,
   schema, or algorithmic vector.
5. Confirm intentionally uncovered behavior is listed in
   `conformance/REQUIREMENTS.md` as prose-boundary, local policy, or deferred
   rather than being silently omitted.

## Regression expectations

When a bug is fixed in the specification, schema, OpenAPI, fixture corpus, or
validation script, the fix is expected to include a regression artifact when the
failure is deterministic. Suitable regression artifacts include:

- a new fixture case;
- a schema example or validation case;
- a problem details case;
- a machine-readable OpenAPI/API fixture plus any needed human drift checklist
  update; or
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
