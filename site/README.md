# Agent Volumes public documentation site

This subtree contains the Mintlify source for the public `docs.agentvolumes.org` documentation site.

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
bun run build:site:openapi -- <version>
bun run site:dev
```

View the local preview at `http://localhost:3000`.

## Validation

Run the public-site validation from the repository root:

```bash
bun run build:site:openapi -- <version>
bun run lint:site
```

`build:site:openapi` accepts a SemVer release argument and creates `site/spec/<version>/api-reference/bibliotheca.openapi.json` from the canonical OpenAPI contract. If no argument is provided, it reads the current version from `../agent-volumes-spec.md`. `lint:site` delegates to the local `mint` dependency declared in `site/package.json`. Treat generated JSON files as derived publication artifacts, not as the source of truth.

## Publishing changes

Mintlify should be configured as a monorepo deployment with `/site` as the documentation path. Changes deploy after they are pushed to the configured branch and the Mintlify GitHub App can access this repository.

The docs deployment belongs on `docs.agentvolumes.org`. The organization apex, `agentvolumes.org`, remains the canonical host for organization pages and durable specification aliases such as `agentvolumes.org/spec/*`; those aliases should redirect to the corresponding docs-host release archive page rather than serving duplicate documentation. Semantic identifier routes such as `agentvolumes.org/build/...`, `agentvolumes.org/ns/...`, `agentvolumes.org/predicates/...`, and `agentvolumes.org/problems/...` resolve to stable landing pages for the identifier itself and link to the release archives that define or clarify them. JSON-LD context routes such as `agentvolumes.org/contexts/...` resolve to stable canonical context documents, with byte-identical release archive copies under `agentvolumes.org/spec/<version>/contexts/...`.

## License

This subtree is part of the Agent Volumes specification repository and is licensed under the repository root [Apache License 2.0](../LICENSE).

## Release evidence

For release candidates and stable releases, record Namespace and URI publication evidence in the release evidence issue created from `../.github/ISSUE_TEMPLATE/release-evidence.md`.

## Resources

- [Mintlify documentation](https://mintlify.com/docs)
- [Issue #29](https://github.com/agent-volumes/agent-volumes-spec/issues/29)
- [ADR-0153](../docs/decisions/0153-adopt-mintlify-for-agentvolumes-org-documentation-site.md)
- [ADR-0154](../docs/decisions/0154-manage-mintlify-site-in-spec-repository-site-subtree.md)
- [ADR-0155](../docs/decisions/0155-use-agentvolumes-org-as-canonical-organization-host.md)
- [ADR-0156](../docs/decisions/0156-host-versioned-spec-docs-on-docs-subdomain-with-apex-spec-aliases.md)
- [ADR-0157](../docs/decisions/0157-use-hybrid-unversioned-and-versioned-docs-information-architecture.md)
- [ADR-0158](../docs/decisions/0158-separate-semantic-identifier-pages-from-release-archives.md)
