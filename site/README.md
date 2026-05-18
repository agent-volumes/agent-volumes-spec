# Agent Volumes public documentation site

This subtree contains the Mintlify source for the public `agentvolumes.org` documentation site.

The site is a publication layer for the Agent Volumes specification repository. The canonical sources remain:

- `../agent-volumes-spec.md`
- `../schemas/`
- `../openapi/bibliotheca.openapi.yaml`
- `../conformance/`
- `../docs/decisions/`

## Development

Install dependencies at the repository root and in this subtree. The root package owns repository-wide validation and OpenAPI artifact generation; `site/package.json` declares the local Mintlify CLI dependency, and `site/bun.lock` pins the resolved version.

```bash
bun install
(cd site && bun install)
bun run build:site:openapi
bun run site:dev
```

View the local preview at `http://localhost:3000`.

## Validation

Run the public-site validation from the repository root:

```bash
bun run build:site:openapi
bun run lint:site
```

`build:site:openapi` creates `site/api-reference/bibliotheca.openapi.json` from the canonical OpenAPI contract. `lint:site` delegates to the local `mint` dependency declared in `site/package.json`. Treat the generated JSON file as a derived publication artifact, not as the source of truth.

## Publishing changes

Mintlify should be configured as a monorepo deployment with `/site` as the documentation path. Changes deploy after they are pushed to the configured branch and the Mintlify GitHub App can access this repository.

## Release evidence

For release candidates and stable releases, record Namespace and URI publication evidence in the release evidence issue created from `../.github/ISSUE_TEMPLATE/release-evidence.md`.

## Resources

- [Mintlify documentation](https://mintlify.com/docs)
- [Issue #29](https://github.com/agent-volumes/agent-volumes-spec/issues/29)
- [ADR-0153](../docs/decisions/0153-adopt-mintlify-for-agentvolumes-org-documentation-site.md)
- [ADR-0154](../docs/decisions/0154-manage-mintlify-site-in-spec-repository-site-subtree.md)
