<div align="center">

<img src="https://raw.githubusercontent.com/agent-volumes/.github/refs/heads/main/assets/logo/banner/solid-bg/agent-volumes-logo-banner-with-bg-4-1.svg" alt="Agent Volumes" width="100%">

[![Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-97ca00)](LICENSE)
[![SemVer Versioning](https://img.shields.io/badge/version_scheme-SemVer-0097a7)](https://semver.org/)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-3.0-4baaaa.svg)](https://github.com/agent-volumes/.github/blob/main/CODE_OF_CONDUCT.md)
[![GitHub issues](https://img.shields.io/badge/issue_tracking-GitHub-blue.svg)](https://github.com/agent-volumes/agent-volumes-spec/issues)

[![Specification Lint and Format](https://github.com/agent-volumes/agent-volumes-spec/actions/workflows/spec-lint-and-format.yml/badge.svg)](https://github.com/agent-volumes/agent-volumes-spec/actions/workflows/spec-lint-and-format.yml)
[![CodeQL](https://github.com/agent-volumes/agent-volumes-spec/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/agent-volumes/agent-volumes-spec/actions/workflows/github-code-scanning/codeql)
[![OSV Scanner Full](https://github.com/agent-volumes/agent-volumes-spec/actions/workflows/osv-scanner-full.yml/badge.svg)](https://github.com/agent-volumes/agent-volumes-spec/actions/workflows/osv-scanner-full.yml)
[![Dependency Review](https://github.com/agent-volumes/agent-volumes-spec/actions/workflows/dependency-review.yml/badge.svg)](https://github.com/agent-volumes/agent-volumes-spec/actions/workflows/dependency-review.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/agent-volumes/agent-volumes-spec/badge)](https://scorecard.dev/viewer/?uri=github.com/agent-volumes/agent-volumes-spec)

An open specification for packaging, distributing, and verifying components for AI agent runtimes.

</div>

# Agent Volumes

## Overview

**Agent Volumes** defines a packaging and distribution standard for the AI agent component ecosystem — analogous to npm for JavaScript, PyPI for Python, or crates.io for Rust — but specialized for **AI agent systems**.

AI agent runtimes — Claude Code, Codex, Gemini CLI, and others — increasingly rely on skills, tools, hooks, MCP servers, and LSP servers. But the ecosystem currently lacks a standard way to package and distribute these components. Runtimes define incompatible layouts, agent components have no shared identity or versioning model, and there is no mechanism for dependency resolution or supply chain verification. Agent Volumes addresses these gaps.

The distribution unit is a **volume**: a versioned package that exports one or more agent components.
Registries that host and serve volumes are called **bibliothecas**.

| Concept           | Name              | Description                                                                                                |
| ----------------- | ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Standard          | **Agent Volumes** | This specification.                                                                                        |
| Distribution unit | **Volume**        | A versioned package of agent components.                                                                   |
| Package manifest  | **volume.toml**   | Package-level metadata, like `package.json` or `Cargo.toml`.                                               |
| Registry          | **Bibliotheca**   | Any registry that hosts and serves volumes.                                                                |
| Identity scheme   | **pkg:volume/…**  | [purl](https://github.com/package-url/purl-spec)-compatible identifiers for supply chain interoperability. |

This specification is intended for developers building agent runtimes, registries, package managers, and related tooling. End users who consume agent components interact with the standard through client tools such as the `shelf` CLI.

Agent Volumes is designed to be runtime-neutral, enabling interoperability across different agent systems and tooling ecosystems.

## Why Agent Volumes

The AI agent component ecosystem faces three structural risks that a shared standard can address:

- **Fragmentation.** Each runtime defines its own component layout. Developers write the same skill, tool, MCP server, or LSP server multiple times for different runtimes. This duplication slows ecosystem growth and fragments quality assurance.

- **No supply chain identity.** Agent components have no standard identifier, no versioning model, and no provenance chain. Organizations cannot audit what runs inside their agent systems.

- **No shared trust model.** Without content integrity verification or publisher identity, every component installation is an implicit trust decision with no mechanism for revocation or advisory.

Agent Volumes defines a common packaging standard so that runtimes can interoperate, components can be verified, and the ecosystem can grow safely.

## Component Types

Volumes export seven component types:

| Type           | Semantics                                             | Invoked by      |
| -------------- | ----------------------------------------------------- | --------------- |
| **Agent**      | Autonomous agent with system prompt and tool bindings | Runtime         |
| **Skill**      | Instructional knowledge loaded into agent context     | Agent           |
| **Command**    | User-invoked slash commands                           | User            |
| **Tool**       | Function-call endpoints for agent use                 | Agent           |
| **Hook**       | Lifecycle event handlers                              | Runtime events  |
| **MCP Server** | Model Context Protocol service endpoints              | Runtime / Agent |
| **LSP Server** | Language Server Protocol service endpoints            | Runtime / Agent |

## Quick Example

A minimal `volume.toml` declaring four components:

```toml
[volume]
schema = 1
name = "research-agent-pack"
version = "1.4.0"
description = "Research assistant with literature analysis tools"
license = "Apache-2.0"
role = "plugin"

[publisher]
id = "acme"

[[components]]
type = "skill"
name = "summarize-paper"
entrypoint = "./skills/summarize-paper/SKILL.md"

[[components]]
type = "tool"
name = "arxiv-search"
entrypoint = "./tools/arxiv-search.json"

[[components]]
type = "mcp-server"
name = "research-mcp"
entrypoint = "./.mcp.json"

[[components]]
type = "lsp-server"
name = "research-lsp"
entrypoint = "./.lsp.json"
```

This volume is identified as `pkg:volume/research-agent-pack@1.4.0`, and individual components are addressable — for example, `pkg:volume/research-agent-pack@1.4.0#tool/arxiv-search`.

Install with a compatible client:

```bash
shelf add research-agent-pack
```

## Supply Chain Security

Agent Volumes treats supply chain integrity as a first-class concern. The specification defines:

- **Content integrity** via SHA-256 content-hash construction and verification
- **Publisher identity** with cryptographic attestation
- **Provenance tracking** for component origin and build process
- **Permission model** for component capability declarations
- **Security advisories** for vulnerability disclosure and response

See [§8 Trust and Supply Chain Model](agent-volumes-spec.md#8-trust-and-supply-chain-model) in the full specification.

## Status

This repository contains the **working draft** of the Agent Volumes specification. No stable version has been released.

| Document                                             | Version        | Status        |
| ---------------------------------------------------- | -------------- | ------------- |
| [Agent Volumes Specification](agent-volumes-spec.md) | v0.1.0-draft.5 | Working Draft |

### Roadmap

| Milestone                    | Target     | Description                                                                          |
| ---------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| v0.1.0                       | Q2 2026    | Feature-complete draft for public review                                             |
| Experimental implementations | Q2 2026    | Windlass-maintained reference `shelf` client and `Alexandria` bibliotheca prototypes |
| Early adopters               | Q3–Q4 2026 | Runtime and tooling integration feedback                                             |
| v0.x.y                       | Q4 2026    | Stabilization before release                                                         |
| v1.0.0                       | Q1 2027    | Stable release after ecosystem validation                                            |

See [`ROADMAP.md`](ROADMAP.md) for the one-year roadmap, explicit out-of-scope
items, and review cadence.

Feedback is welcome via [GitHub Issues](https://github.com/agent-volumes/agent-volumes-spec/issues) and [Discussions](https://github.com/agent-volumes/agent-volumes-spec/discussions).

## Governance

Agent Volumes is governed by the Agent Volumes Organization, an independent, vendor-neutral standards body.

Specification development is guided by a Technical Steering Committee (TSC) that operates under the [project charter](https://github.com/agent-volumes/.github/blob/main/CHARTER.md). The TSC follows a consensus-seeking decision process documented in the [governance policy](https://github.com/agent-volumes/.github/blob/main/GOVERNANCE.md).

| Resource           | Link                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Charter            | [CHARTER.md](https://github.com/agent-volumes/.github/blob/main/CHARTER.md)                 |
| Governance process | [GOVERNANCE.md](https://github.com/agent-volumes/.github/blob/main/GOVERNANCE.md)           |
| Security policy    | [SECURITY.md](https://github.com/agent-volumes/.github/blob/main/SECURITY.md)               |
| Code of Conduct    | [CODE_OF_CONDUCT.md](https://github.com/agent-volumes/.github/blob/main/CODE_OF_CONDUCT.md) |
| Project docs       | [`docs/README.md`](docs/README.md)                                                          |

Governance participation is open to all contributors. Organizations interested in joining the TSC or supporting the standard's development are encouraged to open an issue or reach out via [governance@agentvolumes.org](mailto:governance@agentvolumes.org).

Repository-specific process documents cover the [release process](docs/release-process.md), [review policy](docs/review-policy.md), [artifact architecture](docs/architecture.md), [validation and conformance policy](docs/development/validation-and-conformance.md), [roles and continuity](docs/governance/roles-and-continuity.md), [security requirements](docs/security/security-requirements.md), [vulnerability response](docs/security/vulnerability-response.md), and [starter contribution paths](docs/development/good-first-issues.md). See [`docs/README.md`](docs/README.md) for the full documentation map.

## Get Involved

Agent Volumes is developed in the open. There are several ways to participate:

**For developers:**

- Review the [specification](agent-volumes-spec.md) and open issues for questions or suggestions
- Submit pull requests for spec clarifications or corrections
- Build tooling against the standard — runtime adapters, linters, or registry clients

**For runtime and platform teams:**

- Evaluate the [Cross-Runtime Compatibility Model](agent-volumes-spec.md#6-cross-runtime-compatibility-model) for your platform
- Join the discussion on [component type semantics](https://github.com/agent-volumes/agent-volumes-spec/discussions)
- Provide feedback on the [Registry API](agent-volumes-spec.md#9-registry-api) design

**For security and supply chain teams:**

- Review the [Trust and Supply Chain Model](agent-volumes-spec.md#8-trust-and-supply-chain-model) — including content integrity, publisher identity, and provenance attestation
- Contribute to security advisory format and vulnerability disclosure workflows

**For organizations:**

- Adopt the specification and list your organization in [ADOPTERS.md](ADOPTERS.md)
- Join the Technical Steering Committee — see the [governance policy](https://github.com/agent-volumes/.github/blob/main/GOVERNANCE.md)
- Provide financial support for specification development and infrastructure

See the organization-wide [CONTRIBUTING.md](https://github.com/agent-volumes/.github/blob/main/CONTRIBUTING.md) for contribution guidelines and the [Code of Conduct](https://github.com/agent-volumes/.github/blob/main/CODE_OF_CONDUCT.md). Those organization-wide policies apply to this repository. In particular, commits are expected to use DCO sign-off, and pull requests are expected to satisfy the repository linting, formatting, OpenAPI, and artifact validation checks documented in [`docs/development/validation-and-conformance.md`](docs/development/validation-and-conformance.md).

## Adopters

Organizations and projects evaluating or adopting Agent Volumes are listed in [ADOPTERS.md](ADOPTERS.md).

If your organization is using or evaluating the standard, consider adding it to the list.

## Specification Contents

The full specification covers:

1. **Introduction** — Purpose, scope, and relationship to existing standards
2. **Package Identity Scheme** — purl-aligned globally unique identifiers
3. **Volume Manifest** — `volume.toml` schema and validation rules
4. **Component Types** — Seven types with precise semantics
5. **Component Export System** — Standardized discovery and loading
6. **Cross-Runtime Compatibility Model** — Runtime, protocol, and environment declarations
7. **Content Integrity** — normalized-file-tree integrity construction and verification
8. **Trust and Supply Chain Model** — Publisher identity, provenance, trust attachments, threat model, security advisories
9. **Registry API** — HTTP API for package operations, trust discovery, advisories, and capability metadata
10. **Package Roles** — Component, plugin, provider, and meta roles
11. **Conformance** — Requirements, fixtures, and vectors for registries and clients
12. **Design Principles** — Seven guiding principles

The repository also publishes normative machine-readable companion artifacts under:

- [`schemas/`](schemas/)
- [`openapi/`](openapi/)
- [`conformance/fixtures/`](conformance/fixtures/)

See [`conformance/README.md`](conformance/README.md) for the offline runner contract and report schema guidance.

For prototype client and bibliotheca work, start with the [Agent Volumes v0.1 Implementers Guide](IMPLEMENTERS.md). It maps the normative artifacts to concrete implementation tasks and identifies prototype-local choices that the v0.1 core intentionally leaves outside the standard.

**[Read the full specification →](agent-volumes-spec.md)**

## Architecture Decision Records

The project's architecture decisions are recorded under [`decisions/`](decisions/). Refer to that directory for the complete ADR history, including superseded and follow-up decisions.

## Related Standards

| Standard                                                                                | Relationship                                                                                                  |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [Agent Skills Specification](https://agentskills.io/specification.md)                   | Component-level manifests (SKILL.md frontmatter) remain compliant. `volume.toml` is a package-level addition. |
| [Package URL (purl)](https://github.com/package-url/purl-spec)                          | Volume identifiers are purl-compatible via the `volume` type.                                                 |
| [Semantic Versioning 2.0.0](https://semver.org/)                                        | All volume versions follow SemVer.                                                                            |
| [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)                        | MCP Server is a first-class component type.                                                                   |
| [Language Server Protocol (LSP)](https://microsoft.github.io/language-server-protocol/) | LSP Server is a first-class component type.                                                                   |
| [SPDX License List](https://spdx.org/licenses/)                                         | License identifiers use SPDX expressions.                                                                     |

## Background

The Agent Volumes specification draws on operational experience from [agent-toolbox](https://github.com/yunseo-kim/agent-toolbox), a cross-runtime distribution system for AI agent skills. Lessons from building and operating a catalog of 110+ curated components across five runtimes — including cross-runtime adapter architecture and automated security scanning — informed the design of this standard.

The specification was initiated by [Yunseo Kim](https://github.com/yunseo-kim) and is now developed under the Agent Volumes Organization, an independent, vendor-neutral standards body. Windlass is expected to develop and maintain reference implementations based on the standard, including the `shelf` CLI and the `Alexandria` bibliotheca. These implementation projects are distinct from the standard's governance authority. Placeholder repository links: [`windlasstech/shelf`](https://github.com/windlasstech/shelf) and [`windlasstech/alexandria`](https://github.com/windlasstech/alexandria).

## License

This specification is released under the [Apache License 2.0](LICENSE).

Copyright 12026 HE The Agent Volumes Organization and contributors.
