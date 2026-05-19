# Documentation project instructions

## About this project

- This is the Mintlify source for the public `agentvolumes.org` documentation site.
- Pages are MDX files with YAML frontmatter.
- Configuration lives in `docs.json`.
- The subtree is a publication layer; `../agent-volumes-spec.md`, `../schemas/`, `../openapi/`, `../conformance/`, and `../docs/decisions/` remain canonical.
- Mintlify dependencies are isolated in `site/package.json`; run `(cd site && bun install)` before local site validation.
- `site/bun.lock` pins the local Mintlify CLI dependency; update it through the package manager, not by hand.
- `api-reference/bibliotheca.openapi.json` is generated from `../openapi/bibliotheca.openapi.yaml`; do not hand-edit it.
- Run `bun run build:site:openapi` from the repository root before validating API reference changes.
- Run `bun run lint:site` from the repository root to validate Mintlify content and links.

## Structure

- `api/`: narrative Bibliotheca API pages; canonical contract remains `../openapi/bibliotheca.openapi.yaml`.
- `api-reference/`: generated OpenAPI publication artifact consumed by `docs.json`.
- `components/`, `volumes/`, `security/`, `conformance/`: reader-facing MDX topic groups backed by the root spec and companion artifacts.
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

## Commands

```bash
bun run build:site:openapi
bun run lint:site
bun run site:dev
```

## Content boundaries

- Do not standardize implementation-local topics such as token issuance, lockfile format, registry priority, prerelease selection, advisory writes, multipart upload, or universal trust roots.
- Do not describe conformance labels as certification badges.
- Do not document unsupported artifact formats as verified.
