<div align="center">

<img src="logo/agent-volumes-logo-banner.svg" alt="Agent Volumes" width="100%">

[![Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-97ca00)](LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-3.0-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![GitHub issues](https://img.shields.io/badge/issue_tracking-GitHub-blue.svg)](https://github.com/agent-volumes/agent-volumes-spec/issues)

An open specification for packaging, distributing, and verifying components for AI agent runtimes.

</div>

# Agent Volumes

## Overview

**Agent Volumes** defines a packaging and distribution standard for the AI agent component ecosystem — analogous to npm for JavaScript, PyPI for Python, or crates.io for Rust — but specialized for **AI agent systems**.

AI agent runtimes — Claude Code, Codex, Gemini CLI, and others — increasingly rely on skills, tools, hooks, and MCP servers. But the ecosystem currently lacks a standard way to package and distribute these components. Runtimes define incompatible layouts, agent components have no shared identity or versioning model, and there is no mechanism for dependency resolution or supply chain verification. Agent Volumes addresses these gaps.

The distribution unit is a **volume**: a versioned package that exports one or more agent components.
Registries that host and serve volumes are called **bibliothecas**.

| Concept | Name | Description |
| ------- | ---- | ----------- |
| Standard | **Agent Volumes** | This specification. |
| Distribution unit | **Volume** | A versioned package of agent components. |
| Package manifest | **volume.toml** | Package-level metadata, like `package.json` or `Cargo.toml`. |
| Registry | **Bibliotheca** | Any registry that hosts and serves volumes. |
| Identity scheme | **pkg:shelf/…** | [purl](https://github.com/package-url/purl-spec)-compatible identifiers for supply chain interoperability. |

This specification is intended for developers building agent runtimes, registries, package managers, and related tooling. End users who consume agent components interact with the standard through client tools such as the `shelf` CLI.

Agent Volumes is designed to be runtime-neutral, enabling interoperability across different agent systems and tooling ecosystems.

## Why Agent Volumes

The AI agent component ecosystem faces three structural risks that a shared standard can address:

- **Fragmentation.** Each runtime defines its own component layout. Developers write the same skill, tool, or MCP server multiple times for different runtimes. This duplication slows ecosystem growth and fragments quality assurance.

- **No supply chain identity.** Agent components have no standard identifier, no versioning model, and no provenance chain. Organizations cannot audit what runs inside their agent systems.

- **No shared trust model.** Without content integrity verification or publisher identity, every component installation is an implicit trust decision with no mechanism for revocation or advisory.

Agent Volumes defines a common packaging standard so that runtimes can interoperate, components can be verified, and the ecosystem can grow safely.

## Component Types

Volumes export six component types:

| Type | Semantics | Invoked by |
| ---- | --------- | ---------- |
| **Agent** | Autonomous agent with system prompt and tool bindings | Runtime |
| **Skill** | Instructional knowledge loaded into agent context | Agent |
| **Command** | User-invoked slash commands | User |
| **Tool** | Function-call endpoints for agent use | Agent |
| **Hook** | Lifecycle event handlers | Runtime events |
| **MCP Server** | Model Context Protocol service endpoints | Runtime / Agent |

## Quick Example

A minimal `volume.toml` declaring three components:

```toml
[volume]
schema = 1
name = "research-agent-pack"
version = "1.4.0"
description = "Research assistant with literature analysis tools"
license = "Apache-2.0"

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
entrypoint = "./mcp/research-server.json"
```

This volume is identified as `pkg:shelf/research-agent-pack@1.4.0`, and individual components are addressable — for example, `pkg:shelf/research-agent-pack@1.4.0#tool/arxiv-search`.

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

| Document | Version | Status |
| -------- | ------- | ------ |
| [Agent Volumes Specification](agent-volumes-spec.md) | v0.1.0-draft.3 | Working Draft |

### Roadmap

| Milestone | Target | Description |
| --------- | ------ | ----------- |
| v0.1.0 | Q2 2026 | Feature-complete draft for public review |
| Experimental implementations | Q2 2026 | Reference client (`shelf`) and bibliotheca (`Alexandria`) prototypes |
| Early adopters | Q3–Q4 2026 | Runtime and tooling integration feedback |
| v0.x.y | Q4 2026 | Stabilization before release |
| v1.0.0 | Q1 2027 | Stable release after ecosystem validation |

Feedback is welcome via [GitHub Issues](https://github.com/agent-volumes/agent-volumes-spec/issues) and [Discussions](https://github.com/agent-volumes/agent-volumes-spec/discussions).

## Governance

Agent Volumes is governed by the Agent Volumes Organization, an independent, vendor-neutral standards body.

Specification development is guided by a Technical Steering Committee (TSC) that operates under the [project charter](https://github.com/agent-volumes/.github/blob/main/CHARTER.md). The TSC follows a consensus-seeking decision process documented in the [governance policy](https://github.com/agent-volumes/.github/blob/main/GOVERNANCE.md).

| Resource | Link |
| -------- | ---- |
| Charter | [CHARTER.md](https://github.com/agent-volumes/.github/blob/main/CHARTER.md) |
| Governance process | [GOVERNANCE.md](https://github.com/agent-volumes/.github/blob/main/GOVERNANCE.md) |
| Security policy | [SECURITY.md](https://github.com/agent-volumes/.github/blob/main/SECURITY.md) |
| Code of Conduct | [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) |

Governance participation is open to all contributors. Organizations interested in joining the TSC or supporting the standard's development should open an issue or reach out via [governance@agentvolumes.org](mailto:governance@agentvolumes.org).

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

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines and the [Code of Conduct](CODE_OF_CONDUCT.md).

## Adopters

Organizations and projects evaluating or adopting Agent Volumes are listed in [ADOPTERS.md](ADOPTERS.md).

If your organization is using or evaluating the standard, consider adding it to the list.

## Specification Contents

The full specification covers:

1. **Introduction** — Purpose, scope, and relationship to existing standards
2. **Package Identity Scheme** — purl-aligned globally unique identifiers
3. **Volume Manifest** — `volume.toml` schema and validation rules
4. **Component Types** — Six types with precise semantics
5. **Component Export System** — Standardized discovery and loading
6. **Cross-Runtime Compatibility Model** — Runtime, protocol, and environment declarations
7. **Content Integrity** — SHA-256 content-hash construction and verification
8. **Trust and Supply Chain Model** — Publisher identity, provenance, permissions, security advisories
9. **Registry API** — HTTP API for conforming bibliothecas
10. **Package Roles** — Component, plugin, provider, and meta roles
11. **Conformance** — Requirements for conforming registries and clients
12. **Design Principles** — Seven guiding principles

**[Read the full specification →](agent-volumes-spec.md)**

## Architecture Decision Records

| ADR | Decision |
| --- | -------- |
| [ADR-0001](decisions/0001-purl-aligned-identity-scheme.md) | Use purl-aligned identity scheme with `shelf` type |
| [ADR-0002](decisions/0002-toml-volume-manifest.md) | Use TOML for volume manifest format |
| [ADR-0003](decisions/0003-six-component-types.md) | Define six component types |
| [ADR-0004](decisions/0004-hybrid-registry-architecture.md) | Use hybrid content delivery architecture for bibliothecas |

## Related Standards

| Standard | Relationship |
| -------- | ------------ |
| [Agent Skills Specification](https://agentskills.io/specification.md) | Component-level manifests (SKILL.md frontmatter) remain compliant. `volume.toml` is a package-level addition. |
| [Package URL (purl)](https://github.com/package-url/purl-spec) | Volume identifiers are purl-compatible via the `shelf` type. |
| [Semantic Versioning 2.0.0](https://semver.org/) | All volume versions follow SemVer. |
| [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) | MCP Server is a first-class component type. |
| [SPDX License List](https://spdx.org/licenses/) | License identifiers use SPDX expressions. |

## Background

The Agent Volumes specification draws on operational experience from [agent-toolbox](https://github.com/yunseo-kim/agent-toolbox), a cross-runtime distribution system for AI agent skills. Lessons from building and operating a catalog of 110+ curated components across five runtimes — including cross-runtime adapter architecture and automated security scanning — informed the design of this standard.

The specification was initiated by [Yunseo Kim](https://github.com/yunseo-kim) and is now developed under the Agent Volumes Organization, an independent, vendor-neutral standards body. Development infrastructure is provided by Windlass, which operates the [Alexandria](https://github.com/agent-volumes) reference registry as a non-exclusive implementation.

## License

This specification is released under the [Apache License 2.0](LICENSE).

Copyright 12026 HE The Agent Volumes Organization and contributors.
