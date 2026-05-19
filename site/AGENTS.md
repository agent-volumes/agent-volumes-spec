# Documentation project instructions

## About this project

- This is the Mintlify source for the public `docs.agentvolumes.org` documentation site.
- Pages are MDX files with YAML frontmatter.
- Configuration lives in `docs.json`.
- The subtree is a publication layer; `../agent-volumes-spec.md`, `../schemas/`, `../openapi/`, `../conformance/`, and `../docs/decisions/` remain canonical.
- Mintlify dependencies are isolated in `site/package.json`; run `(cd site && bun install)` before local site validation.
- `site/bun.lock` pins the local Mintlify CLI dependency; update it through the package manager, not by hand.
- Release-scoped OpenAPI publication copies such as `spec/<version>/api-reference/bibliotheca.openapi.json` are generated from `../openapi/bibliotheca.openapi.yaml`; do not hand-edit them.
- Run `bun run build:site:openapi -- <version>` from the repository root before validating API reference changes.
- Run `bun run lint:site` from the repository root to validate Mintlify content and links.

## Structure

- `spec/`: release archive selector and immutable release-specific documentation subtrees.
- Release-specific reference content belongs under `spec/<version>/...`. Do not recreate unversioned `api/`, `api-reference/`, `components/`, `volumes/`, `security/`, `conformance/`, `problems/`, or `uri-publications/` copies unless a follow-up ADR changes the IA model.
- `images/` and favicon SVGs: site assets.

## Terminology

- Use "volume" for the packaged distribution unit.
- Use "bibliotheca" for registries that host and serve volumes.
- Use `pkg:volume/...` for package identities.
- Use "Problem Details" for RFC 9457 API error payloads.

## Style preferences

- Use active voice and second person ("you")
- Keep sentences concise — one idea per sentence
- Use sentence case for headings
- Code formatting for file names, commands, paths, and code references
- Link public URI publication pages back to canonical source artifacts.
- Avoid implying that site prose overrides the specification or schema artifacts.
- Use `docs.agentvolumes.org` for rendered documentation pages. Preserve `https://agentvolumes.org/...` only for organization pages, durable specification aliases, and public identifier URIs such as schema `$id` and Problem Details type URIs.

## Commands

```bash
bun run build:site:openapi -- <version>
bun run lint:site
bun run site:dev
```

## Content boundaries

- Do not standardize implementation-local topics such as token issuance, lockfile format, registry priority, prerelease selection, advisory writes, multipart upload, or universal trust roots.
- Do not describe conformance labels as certification badges.
- Do not document unsupported artifact formats as verified.
