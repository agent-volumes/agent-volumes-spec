# Release Process

This document describes how Agent Volumes specification releases are prepared,
reviewed, tagged, and announced.

## Release types

| Release type      | Meaning                                                              |
| ----------------- | -------------------------------------------------------------------- |
| Working draft     | Active development state on `main`; breaking changes are expected.   |
| Draft release     | Versioned snapshot such as `v0.1.0-draft.5` for implementer review.  |
| Release candidate | Feature-complete candidate for a stable line, such as `v1.0.0-rc.1`. |
| Stable release    | Compatibility target for independent implementations.                |
| Patch release     | Backwards-compatible correction to a stable line.                    |

## Versioning and tags

Agent Volumes uses SemVer-style identifiers for published specification
versions. Draft and release-candidate identifiers use SemVer prerelease syntax.

Release tags use the version string, for example `v0.1.0-draft.5` or `v1.0.0`.
Important release tags are expected to be signed once signed-release operations
are available for the project.

## Release-freeze checklist

Before tagging a draft, release candidate, or stable release:

1. Confirm `agent-volumes-spec.md` has the intended version and status.
2. Confirm schema `$id` values match the release version.
3. Run `bun run format:check`.
4. Run `bun run lint:md`.
5. Run `bun run lint:openapi`.
6. Run `bun run validate:artifacts`.
7. Complete the OpenAPI/prose drift audit in
   [`../openapi/PROSE-DRIFT-AUDIT.md`](../openapi/PROSE-DRIFT-AUDIT.md).
8. Confirm `conformance/fixtures/conformance-coverage.json` covers the intended
   role-scoped requirements.
9. Confirm deferred and local-policy topics remain documented in
   [`../conformance/REQUIREMENTS.md`](../conformance/REQUIREMENTS.md).
10. Prepare human-readable release notes.

## Release notes

Release notes summarize major changes for implementers. They include:

- release version and date;
- major normative changes;
- schema, OpenAPI, and conformance fixture changes;
- compatibility or migration notes;
- known limitations and deferred topics;
- publicly known vulnerabilities fixed in the release, when any exist;
- verification evidence or CI links.

Release notes are not raw git history.

## Vulnerability fixes

If a release fixes a publicly known vulnerability affecting project results, the
release notes identify the vulnerability, affected versions, and advisory link
when public disclosure is appropriate. Private reports follow
[`security/vulnerability-response.md`](security/vulnerability-response.md).

## Future release integrity

The current repository primarily publishes specification and documentation
artifacts. For future software artifacts, conformance tools, or broad-use stable
releases, the project aims to provide signed releases and verification guidance,
including public key or Sigstore verification instructions.
