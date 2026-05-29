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

Release tags use the version string, for example `v0.1.0-rc.1` or `v1.0.0`.
Important release tags are expected to be signed once signed-release operations
are available for the project.

## Version source and derived artifacts

The current specification version is recorded in
[`../agent-volumes-spec.md`](../agent-volumes-spec.md) as the `**Version:**`
header. Treat that header as the repository-local source of truth for the
current release surface. Human-facing release tags add the `v` prefix, but
release archive paths, schema `$id` URLs, OpenAPI `info.version`, and validator
comparisons use the SemVer value without the prefix.

[`../scripts/release-version.ts`](../scripts/release-version.ts) centralizes this
version handling for repository tooling:

- artifact validation reads the prose header directly when checking current
  release alignment, so `SPEC_VERSION` does not override validator expectations;
- site publication builders accept an explicit CLI version, then `SPEC_VERSION`,
  and finally the prose header when no override is provided;
- helper-derived release paths and schema URL prefixes keep generated publication
  artifacts aligned with the same version string.

`SPEC_VERSION` is an optional environment variable consumed by
`resolveSpecVersion()` for publication builds. It is not a repository
configuration setting. CI may export it between workflow steps after deriving it
from the prose header, and local maintainers may set it temporarily when invoking
publication builders without a CLI argument.

When preparing a release, update the prose header first, then regenerate and
validate the companion artifacts. Do not hand-edit versioned publication paths or
schema identifiers to compensate for a stale prose header.

## Release-freeze checklist

Before tagging a draft, release candidate, or stable release:

1. Confirm `agent-volumes-spec.md` has the intended version and status.
2. Confirm schema `$id` values match the release version.
3. Confirm repository dependencies and isolated site dependencies are installed
   with `bun install` and `(cd site && bun install)`.
4. Run `bun run build:site:openapi -- <version>` and
   `bun run build:site:schemas -- <version>` to refresh the Mintlify publication
   copies for the release version.
5. Run the `Release Publication Artifacts` workflow manually with
   `spec-version` set to the release version. This workflow is the release-freeze
   drift gate for `site/spec/<version>/...`; normal development pull requests do
   not regenerate immutable release archives.
6. Run `bun run format:check`.
7. Run `bun run lint:md`.
8. Run `bun run lint:openapi`.
9. Run `bun run lint:site`.
10. Run `bun run validate:artifacts`. For release-freeze publication drift checks,
    use the manual workflow above or run
    `RELEASE_PUBLICATION_DRIFT_CHECK=1 bun run validate:artifacts` locally after
    regenerating publication artifacts.
11. Create a release evidence issue using
    [`../.github/ISSUE_TEMPLATE/release-evidence.md`](../.github/ISSUE_TEMPLATE/release-evidence.md)
    and record Human Era / Holocene Era (HE) dates in human-readable evidence
    fields.
12. Complete the OpenAPI/prose drift audit in
    [`../openapi/PROSE-DRIFT-AUDIT.md`](../openapi/PROSE-DRIFT-AUDIT.md).
13. Confirm `conformance/fixtures/conformance-coverage.json` covers the intended
    role-scoped requirements.
14. Confirm deferred and local-policy topics remain documented in
    [`../conformance/REQUIREMENTS.md`](../conformance/REQUIREMENTS.md).
15. Run `bun run changelog:update` or `bun run release:changelog -- <version>`
    to generate a `CHANGELOG.md` draft.
16. Curate the generated `CHANGELOG.md` entry so it is human-readable and not a
    raw git history dump.

## Release notes

Release notes are maintained in [`../CHANGELOG.md`](../CHANGELOG.md), using the
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) structure. The
`git-cliff` configuration in [`../cliff.toml`](../cliff.toml) provides a draft
from commit history and tags, but maintainers are responsible for curating the
result before tagging.

Release notes summarize major changes for implementers. They include:

- release version and Human Era / Holocene Era (HE) date;
- major normative changes;
- schema, OpenAPI, and conformance fixture changes;
- compatibility or migration notes;
- known limitations and deferred topics;
- publicly known vulnerabilities fixed in the release, when any exist;
- verification evidence or CI links.

Release notes are not raw git history. Generated entries MUST be reviewed and
edited for implementer-facing clarity before a release tag is created.

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
