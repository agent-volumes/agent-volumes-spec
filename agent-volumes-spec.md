# Agent Volumes Specification

**Version:** 0.1.0-draft.3  
**Status:** Draft  
**Date:** 12026-03-14  
**Authors:** Yunseo Kim

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Package Identity Scheme](#2-package-identity-scheme)
3. [Volume Manifest](#3-volume-manifest)
4. [Component Types](#4-component-types)
5. [Component Export System](#5-component-export-system)
6. [Cross-Runtime Compatibility Model](#6-cross-runtime-compatibility-model)
7. [Content Integrity](#7-content-integrity)
8. [Trust and Supply Chain Model](#8-trust-and-supply-chain-model)
9. [Registry API](#9-registry-api)
10. [Package Roles](#10-package-roles)
11. [Conformance](#11-conformance)
12. [Design Principles](#12-design-principles)
13. [Appendix A: TOML Schema Reference](#appendix-a-toml-schema-reference)
14. [Appendix B: Glossary](#appendix-b-glossary)

---

## 1. Introduction

### 1.1 Purpose

This document defines **Agent Volumes**, a standard for packaging, distributing, and installing components for AI agent runtimes.

Agent Volumes functions analogously to established package ecosystems — npm for JavaScript, PyPI for Python, crates.io for Rust — but is specialized for **AI agent systems**. The distribution unit is a **volume**: a versioned package that exports one or more agent components. Registries that host and serve volumes are called **bibliothecas**.

### 1.2 Naming

| Concept             | Name              | Description                                                       |
| ------------------- | ----------------- | ----------------------------------------------------------------- |
| Protocol / Standard | **Agent Volumes** | This specification. Abbreviated as **volumes** where unambiguous. |
| Distribution unit   | **Volume**        | A versioned package of agent components. Like a library volume.   |
| Registry            | **Bibliotheca**   | Any registry that hosts and serves volumes. Latin for "library."  |
| purl type           | `shelf`           | Package URL type identifier for supply chain interoperability.    |

> **Note:** The **shelf** CLI is the reference client for the Agent Volumes standard. **Alexandria** is the reference bibliotheca implementation, operated by Windlass. See the [shelf CLI Specification](shelf-spec.md) for client behavior, dependency resolution, and Alexandria-specific integration details.

### 1.3 Scope

This specification (v0.1) defines:

| System                      | Coverage                                                                          |
| --------------------------- | --------------------------------------------------------------------------------- |
| Package Identity Scheme     | Globally unique identifiers for volumes and components                            |
| Volume Manifest             | `volume.toml` schema for declaring package metadata, components, and dependencies |
| Component Type System       | Six component types with precise semantics                                        |
| Component Export System     | Standardized discovery and loading of exported components                         |
| Cross-Runtime Compatibility | Declarations for runtime, protocol, and environment compatibility                 |
| Content Integrity           | Content-hash construction and verification                                        |
| Trust and Supply Chain      | Publisher identity, provenance attestation, permission model, security advisories |
| Registry API                | HTTP API that conforming bibliothecas implement                                   |
| Conformance                 | Requirements for conforming bibliothecas and clients                              |

This specification does NOT define:

- CLI command syntax or workflows (see the [shelf CLI Specification](shelf-spec.md))
- Dependency resolution algorithms or lockfile formats (see the [shelf CLI Specification](shelf-spec.md))
- Specific registry operations policies (curation, moderation, pricing)
- Runtime execution semantics (how a runtime loads and executes components)

### 1.4 Relationship to Existing Standards

| Standard                                                              | Relationship                                                                                                                     |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [Agent Skills Specification](https://agentskills.io/specification.md) | Component-level manifests (SKILL.md frontmatter) remain compliant. `volume.toml` is a package-level addition, not a replacement. |
| [Package URL (purl)](https://github.com/package-url/purl-spec)        | Volume identifiers are purl-compatible. The `shelf` type follows CLI-name convention (like `cargo`, `npm`, `pub`).               |
| [Semantic Versioning 2.0.0](https://semver.org/)                      | All volume versions follow SemVer.                                                                                               |
| [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)      | MCP Server is a first-class component type. Protocol compatibility declarations reference MCP versions.                          |
| [SPDX License List](https://spdx.org/licenses/)                       | License identifiers use SPDX expressions.                                                                                        |

### 1.5 Terminology

See [Appendix B: Glossary](#appendix-b-glossary) for the complete list. Key terms:

| Term            | Definition                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------- |
| **Volume**      | The distribution unit. A versioned package that exports one or more agent components.         |
| **Component**   | A functional unit executed by an agent runtime. One of six defined types.                     |
| **Bibliotheca** | A registry that indexes, hosts, and serves volumes. Any conforming registry is a bibliotheca. |
| **Runtime**     | A system capable of executing agent components (e.g., Claude Code, Cursor, Gemini CLI).       |
| **Publisher**   | An entity (individual or organization) that publishes volumes to a bibliotheca.               |
| **Scope**       | A publisher namespace (e.g., `@acme`). Bibliothecas define their own scope policies.          |

### 1.6 Notational Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

TOML examples use [TOML v1.0.0](https://toml.io/en/v1.0.0) syntax.

---

## 2. Package Identity Scheme

All volumes and components MUST be globally identifiable. The identity scheme is aligned with the [Package URL (purl) specification](https://github.com/package-url/purl-spec) for interoperability with existing supply chain security tooling.

### 2.1 Volume Identifier

**Scopeless identifier** (when the bibliotheca supports scopeless names):

```
pkg:shelf/<name>
```

**Scoped identifier:**

```
pkg:shelf/%40<scope>/<name>
```

The `%40` is the URL-encoded form of `@`, per purl encoding rules. In user-facing contexts (CLI, documentation), the decoded form `@scope/name` is used.

| Field   | Description         | Constraints                                         | Required               |
| ------- | ------------------- | --------------------------------------------------- | ---------------------- |
| `scope` | Publisher namespace | Lowercase alphanumeric + hyphens. 1-64 characters.  | Per bibliotheca policy |
| `name`  | Volume name         | Lowercase alphanumeric + hyphens. 1-128 characters. | Always                 |

**Scope policy:** Bibliothecas define their own scope requirements. A bibliotheca MAY support scopeless identifiers for curated or trusted namespaces. A bibliotheca MAY require scopes for all volumes. Clients MUST support both forms.

**Examples:**

| Bibliotheca | purl form                              | User-facing form           |
| ----------- | -------------------------------------- | -------------------------- |
| Curated     | `pkg:shelf/search-toolkit`             | `search-toolkit`           |
| Curated     | `pkg:shelf/github-provider`            | `github-provider`          |
| Scoped      | `pkg:shelf/%40acme/research-pack`      | `@acme/research-pack`      |
| Scoped      | `pkg:shelf/%40yunseo-kim/arxiv-search` | `@yunseo-kim/arxiv-search` |

**Naming rules:**

1. Name MUST consist only of lowercase ASCII letters, digits, and hyphens.
2. Name MUST NOT start or end with a hyphen.
3. Name MUST NOT contain consecutive hyphens.
4. Scopeless names MUST be globally unique within the bibliotheca.
5. Scoped names MUST be unique within their scope.
6. Scope MUST be unique within the bibliotheca.

### 2.2 Version Identifier

Versioned volumes follow [Semantic Versioning 2.0.0](https://semver.org/).

**Format:**

```
pkg:shelf/<name>@<version>
pkg:shelf/%40<scope>/<name>@<version>
```

**Examples:**

```
pkg:shelf/github-provider@1.2.0
pkg:shelf/%40acme/research-pack@2.0.0-beta.1
```

### 2.3 Component Identifier

Components exported from a volume are addressable via the purl subpath field.

**Format:**

```
pkg:shelf/<name>#<type>/<componentName>
pkg:shelf/%40<scope>/<name>#<type>/<componentName>
```

| Field           | Description    | Constraints                                                       |
| --------------- | -------------- | ----------------------------------------------------------------- |
| `type`          | Component type | One of: `agent`, `skill`, `command`, `tool`, `hook`, `mcp-server` |
| `componentName` | Component name | Lowercase alphanumeric + hyphens. 1-128 characters.               |

**Examples:**

| purl form                                               | Description                                            |
| ------------------------------------------------------- | ------------------------------------------------------ |
| `pkg:shelf/github-provider#tool/create-issue`           | The `create-issue` tool from `github-provider`         |
| `pkg:shelf/%40acme/research-pack#skill/summarize-paper` | The `summarize-paper` skill from `@acme/research-pack` |

### 2.4 Fully Qualified Reference

A fully qualified reference pins both version and component.

```
pkg:shelf/github-provider@2.1.0#tool/create-issue
pkg:shelf/%40acme/research-pack@1.4.0#skill/summarize-paper
```

### 2.5 purl Integration

The `shelf` purl type is defined as follows:

| purl field   | Mapping                                               |
| ------------ | ----------------------------------------------------- |
| `type`       | `shelf`                                               |
| `namespace`  | `%40<scope>` when scoped; absent when scopeless       |
| `name`       | Volume name                                           |
| `version`    | SemVer version string                                 |
| `qualifiers` | Reserved for future use (e.g., `?repository_url=...`) |
| `subpath`    | `<type>/<componentName>` for component references     |

**Compatibility:** Shelf purl identifiers are compatible with SBOM standards (SPDX, CycloneDX), vulnerability databases (OSV, GitHub Advisory Database), and supply chain tools (Snyk, Dependabot, Grype).

### 2.6 Identifier Resolution Order

1. **Lockfile** — if present, use pinned version.
2. **Volume manifest** (`volume.toml`) — resolve version constraints.
3. **Registry index** — query configured bibliothecas in priority order.

---

## 3. Volume Manifest

Every volume MUST contain a `volume.toml` file at its root. This is the package-level manifest, analogous to `package.json` (npm), `Cargo.toml` (Rust), or `pyproject.toml` (Python).

> **Note:** Component-level manifests (e.g., SKILL.md frontmatter per the [Agent Skills specification](https://agentskills.io/specification.md)) are preserved and coexist with `volume.toml`. The volume manifest governs the package; component manifests govern individual components.

### 3.1 Schema Version

```toml
[volume]
schema = 1
```

The `schema` field is a positive integer indicating the manifest schema version. Tooling MUST reject manifests with unrecognized schema versions. Schema versions increment only on breaking changes.

### 3.2 Package Metadata

```toml
[volume]
schema = 1
name = "research-agent-pack"          # Scopeless
# name = "@acme/research-agent-pack"  # Scoped
version = "1.4.0"
description = "Research assistant plugin with literature analysis tools"
license = "Apache-2.0"
homepage = "https://github.com/acme/research-agent-pack"
repository = "https://github.com/acme/research-agent-pack"
documentation = "https://docs.acme.ai/research-pack"
keywords = ["research", "literature", "arxiv"]
```

**Required fields:**

| Field         | Type    | Description                                                                 |
| ------------- | ------- | --------------------------------------------------------------------------- |
| `schema`      | integer | Manifest schema version. Currently `1`.                                     |
| `name`        | string  | Volume identifier. Scopeless or `@scope/name` per the bibliotheca's policy. |
| `version`     | string  | SemVer version string.                                                      |
| `description` | string  | One-line summary. Max 256 characters.                                       |
| `license`     | string  | SPDX license expression.                                                    |

**Optional fields:**

| Field           | Type             | Description                                                        |
| --------------- | ---------------- | ------------------------------------------------------------------ |
| `homepage`      | string           | URL to the volume's homepage or documentation site.                |
| `repository`    | string           | URL to the source repository.                                      |
| `documentation` | string           | URL to extended documentation.                                     |
| `keywords`      | array of strings | Freeform keywords for search discovery. Max 16, each max 32 chars. |

### 3.3 Package Role

```toml
[volume]
role = "plugin"
secondary-roles = ["provider"]
```

| Field             | Type             | Description                                                      |
| ----------------- | ---------------- | ---------------------------------------------------------------- |
| `role`            | string           | Primary role. One of: `component`, `plugin`, `provider`, `meta`. |
| `secondary-roles` | array of strings | Additional roles. Optional.                                      |

See [Section 10: Package Roles](#10-package-roles) for definitions.

### 3.4 Publisher Information

```toml
[publisher]
id = "acme"
```

| Field | Type   | Description                                                                                        |
| ----- | ------ | -------------------------------------------------------------------------------------------------- |
| `id`  | string | Publisher identifier. For scopeless volumes, matches the volume name owner. For scoped, the scope. |

Publisher verification status is managed by the bibliotheca, not declared in the manifest. See [Section 8.1](#81-publisher-identity).

### 3.5 Component Declarations

Components are declared as an array of tables.

```toml
[[components]]
type = "skill"
name = "summarize-paper"
entrypoint = "./skills/summarize-paper/SKILL.md"
description = "Summarize academic papers with structured extraction"

[[components]]
type = "tool"
name = "arxiv-search"
entrypoint = "./tools/arxiv-search.json"
description = "Search arXiv for papers by query, author, or category"

[[components]]
type = "mcp-server"
name = "research-mcp"
entrypoint = "./mcp/research-server.json"
description = "MCP server providing research tool endpoints"
```

**Required fields per component:**

| Field        | Type   | Description                                                                 |
| ------------ | ------ | --------------------------------------------------------------------------- |
| `type`       | string | One of: `agent`, `skill`, `command`, `tool`, `hook`, `mcp-server`.          |
| `name`       | string | Component name. Lowercase alphanumeric + hyphens. Unique within the volume. |
| `entrypoint` | string | Relative path from volume root to the component's entry file.               |

**Optional fields per component:**

| Field         | Type             | Description                                                                    |
| ------------- | ---------------- | ------------------------------------------------------------------------------ |
| `description` | string           | One-line description. Max 256 characters.                                      |
| `providers`   | array of strings | External services this component integrates with.                              |
| `permissions` | table            | Component-specific permission overrides. See [Section 3.10](#310-permissions). |

### 3.6 Dependency Declarations

#### 3.6.1 Volume-Level Dependencies

```toml
[dependencies]
"search-toolkit" = "^2.0.0"                      # Scopeless volume
"@acme/github-provider" = ">=1.5.0, <3.0.0"      # Scoped volume
```

Dependencies are key-value pairs where:

- **Key:** Volume name (scopeless or `@scope/name`).
- **Value:** Version constraint string.

**Version constraint syntax:**

| Syntax              | Meaning             | Example                 |
| ------------------- | ------------------- | ----------------------- |
| `"1.2.3"`           | Exact version       | Only `1.2.3`            |
| `"^1.2.3"`          | Compatible updates  | `>=1.2.3, <2.0.0`       |
| `"~1.2.3"`          | Patch-level updates | `>=1.2.3, <1.3.0`       |
| `">=1.0.0"`         | Minimum version     | `1.0.0` or higher       |
| `">=1.0.0, <2.0.0"` | Range               | Between 1.0.0 and 2.0.0 |
| `"*"`               | Any version         | Latest compatible       |

#### 3.6.2 Component-Level Dependencies

When a component depends on specific components from another volume, declare the dependency at component granularity:

```toml
[component-dependencies]
"review-agent" = [
  "pkg:shelf/github-provider#tool/read-pr",
  "pkg:shelf/github-provider#tool/comment-pr",
  "pkg:shelf/%40acme/search-pack#skill/code-search",
]
```

- **Key:** Name of the component within this volume that has the dependency.
- **Value:** Array of component references (purl format).

**Component-level resolution semantics:**

1. Component-level dependencies imply volume-level dependencies. If component `review-agent` depends on `pkg:shelf/github-provider#tool/read-pr`, the resolver automatically adds `github-provider` as a volume dependency (if not already declared in `[dependencies]`).
2. After volume resolution, the resolver verifies that all referenced components exist in the resolved volume version. If `github-provider@2.1.0` does not export `tool/read-pr`, resolution fails with an error.
3. Component-level dependencies are **transitive verification checkpoints**: the resolver ensures the full component dependency chain is satisfiable, but does not resolve component versions independently of their parent volumes.

#### 3.6.3 Single-Version Enforcement

Agent components are loaded into a shared runtime context. Two versions of the same volume would produce conflicting instructions and behaviors. Therefore:

**A dependency graph MUST NOT contain multiple versions of the same volume.** Conforming clients MUST reject irreconcilable version constraints rather than allowing version duplication.

### 3.7 Runtime Compatibility

```toml
[[runtimes]]
name = "claude-code"
compatibility = "^1.0"

[[runtimes]]
name = "opencode"
compatibility = "^0.9"
```

| Field           | Type   | Description                                                     |
| --------------- | ------ | --------------------------------------------------------------- |
| `name`          | string | Runtime identifier. See [Section 6.1](#61-runtime-definitions). |
| `compatibility` | string | Version constraint for the runtime.                             |

If the `runtimes` array is omitted, the volume is assumed to be runtime-agnostic.

### 3.8 Protocol Compatibility

```toml
[[protocols]]
name = "mcp"
version = ">=2025.02"
```

### 3.9 Provider Declarations

```toml
[volume]
providers = ["github", "arxiv", "semantic-scholar"]
```

Providers are external services that the volume integrates with. Freeform strings for discovery and filtering.

### 3.10 Permissions

```toml
[permissions]
network = true
filesystem = false
shell = false
browser = false
```

| Permission   | Type    | Default | Description                          |
| ------------ | ------- | ------- | ------------------------------------ |
| `network`    | boolean | `false` | May access network resources.        |
| `filesystem` | boolean | `false` | May read/write the local filesystem. |
| `shell`      | boolean | `false` | May execute shell commands.          |
| `browser`    | boolean | `false` | May control a browser instance.      |

Permissions declared at the volume level apply to all components. Components MAY override with narrower (not broader) permissions.

### 3.11 Environment Requirements

```toml
[environment]
runtimes = ["node", "python", "bun"]
os = ["linux", "macos"]
arch = ["x64", "arm64"]
```

All fields OPTIONAL. Omission means no restriction.

### 3.12 Provenance

```toml
[provenance]
source-repo = "https://github.com/acme/research-agent-pack"

[provenance.build]
system = "github-actions"
workflow = "release.yml"
signed = true
```

### 3.13 Complete Example

```toml
# Agent Volumes — Volume Manifest

[volume]
schema = 1
name = "research-agent-pack"
version = "1.4.0"
description = "Research assistant plugin with literature analysis tools"
license = "Apache-2.0"
homepage = "https://github.com/example/research-agent-pack"
repository = "https://github.com/example/research-agent-pack"
keywords = ["research", "literature", "arxiv", "academic"]
role = "plugin"
secondary-roles = ["provider"]
providers = ["arxiv", "semantic-scholar"]

[publisher]
id = "example"

# --- Components ---

[[components]]
type = "agent"
name = "literature-reviewer"
entrypoint = "./agents/literature-reviewer/AGENT.md"
description = "Autonomous literature review agent"

[[components]]
type = "skill"
name = "summarize-paper"
entrypoint = "./skills/summarize-paper/SKILL.md"
description = "Summarize academic papers with structured extraction"

[[components]]
type = "tool"
name = "arxiv-search"
entrypoint = "./tools/arxiv-search.json"
description = "Search arXiv for papers by query, author, or category"

[[components]]
type = "mcp-server"
name = "research-mcp"
entrypoint = "./mcp/research-server.json"
description = "MCP server providing research tool endpoints"

# --- Compatibility ---

[[runtimes]]
name = "claude-code"
compatibility = "^1.0"

[[runtimes]]
name = "opencode"
compatibility = "^0.9"

[[protocols]]
name = "mcp"
version = ">=2025.02"

# --- Dependencies ---

[dependencies]
"search-toolkit" = "^2.0.0"

[component-dependencies]
"literature-reviewer" = [
  "pkg:shelf/research-agent-pack#tool/arxiv-search",
  "pkg:shelf/research-agent-pack#skill/summarize-paper",
]

# --- Permissions ---

[permissions]
network = true
filesystem = false
shell = false

# --- Environment ---

[environment]
runtimes = ["node", "bun"]
os = ["linux", "macos", "windows"]

# --- Provenance ---

[provenance]
source-repo = "https://github.com/example/research-agent-pack"

[provenance.build]
system = "github-actions"
workflow = "release.yml"
signed = true
```

---

## 4. Component Types

Agent Volumes defines six component types. Each type has distinct semantics, execution models, and manifest conventions.

### 4.1 Agent

An **Agent** is an autonomous runtime actor capable of independent decision-making, tool use, and multi-step task execution.

| Property             | Value                                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| Type identifier      | `agent`                                                                    |
| Entrypoint format    | Markdown (`.md`) or YAML (`.yaml`)                                         |
| Execution model      | Long-running, autonomous. Invoked by a runtime and operates independently. |
| Distinguishing trait | Has a goal, can use tools and skills, makes decisions about next actions.  |

**Semantics:**

- An agent receives a goal or task and autonomously determines how to accomplish it.
- An agent MAY invoke tools, skills, and other agents during execution.
- An agent MAY maintain state across interactions within a session.
- An agent's behavior is defined by its system prompt, available tools, and configured policies.

### 4.2 Skill

A **Skill** is a reusable task capability that teaches an agent runtime how to perform a specific task.

| Property             | Value                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| Type identifier      | `skill`                                                                                                 |
| Entrypoint format    | Markdown (`.md`) with YAML frontmatter per [Agent Skills spec](https://agentskills.io/specification.md) |
| Execution model      | Loaded into agent context. Activated when the runtime determines relevance.                             |
| Distinguishing trait | Instructions/knowledge, not executable code. The runtime interprets and applies the skill.              |

**Semantics:**

- A skill provides structured instructions, patterns, or knowledge that an agent runtime loads into its context.
- A skill does NOT execute independently — it augments an agent's capabilities.
- A skill MAY include reference materials, templates, and example outputs.

### 4.3 Command

A **Command** is a user-invokable action triggered by a slash command or explicit invocation pattern.

| Property             | Value                                                                   |
| -------------------- | ----------------------------------------------------------------------- |
| Type identifier      | `command`                                                               |
| Entrypoint format    | Markdown (`.md`) with YAML frontmatter                                  |
| Execution model      | Explicitly invoked by the user via a trigger pattern (e.g., `/review`). |
| Distinguishing trait | User-initiated, trigger-based. Has a defined invocation syntax.         |

**Required frontmatter:** `trigger` field matching `^\/[a-z0-9-]+$`.

### 4.4 Tool

A **Tool** is a function or API capability that an agent can call to perform a specific action or retrieve information.

| Property             | Value                                                                |
| -------------------- | -------------------------------------------------------------------- |
| Type identifier      | `tool`                                                               |
| Entrypoint format    | JSON (`.json`), YAML (`.yaml`), or executable script                 |
| Execution model      | Invoked by an agent during task execution. Stateless per invocation. |
| Distinguishing trait | Function-call semantics. Has defined inputs and outputs. Executable. |

**Distinction from Command:**

|              | Command                     | Tool                     |
| ------------ | --------------------------- | ------------------------ |
| Invoked by   | User (explicitly)           | Agent (programmatically) |
| Trigger      | Slash command pattern       | Function call by agent   |
| Input        | User-provided context       | Structured parameters    |
| Statefulness | May maintain workflow state | Stateless per call       |

### 4.5 Hook

A **Hook** is a runtime event interception that executes logic in response to agent lifecycle events.

| Property             | Value                                                                              |
| -------------------- | ---------------------------------------------------------------------------------- |
| Type identifier      | `hook`                                                                             |
| Entrypoint format    | Markdown (`.md`), YAML (`.yaml`), or executable script                             |
| Execution model      | Event-driven. Triggered automatically by the runtime at specific lifecycle points. |
| Distinguishing trait | Reactive, not invoked directly. Responds to runtime events.                        |

**Lifecycle events:** `SessionStart`, `SessionEnd`, `BeforeTool`, `AfterTool`, `BeforeModel`, `AfterModel`, `Notification`, `SubagentStart`, `SubagentEnd`.

**Hook types:** `command` (shell), `script` (executable), `module` (Node.js/Python).

### 4.6 MCP Server

An **MCP Server** is a service endpoint implementing the [Model Context Protocol](https://modelcontextprotocol.io/).

| Property             | Value                                                                        |
| -------------------- | ---------------------------------------------------------------------------- |
| Type identifier      | `mcp-server`                                                                 |
| Entrypoint format    | JSON (`.json`) or YAML (`.yaml`) configuration                               |
| Execution model      | Long-running process. Communicates via `stdio`, `sse`, or `streamable-http`. |
| Distinguishing trait | Protocol-based service. Runs as a separate process.                          |

### 4.7 Component Type Summary

| Type       | Invoked by           | Execution                | State             | Primary format      |
| ---------- | -------------------- | ------------------------ | ----------------- | ------------------- |
| Agent      | Runtime              | Autonomous, long-running | Stateful          | Markdown            |
| Skill      | Runtime (contextual) | Loaded into context      | N/A (knowledge)   | Markdown (SKILL.md) |
| Command    | User (explicit)      | Trigger-based workflow   | Per-invocation    | Markdown            |
| Tool       | Agent (programmatic) | Function call            | Stateless         | JSON/YAML/Script    |
| Hook       | Runtime (event)      | Event-driven             | Stateless         | YAML/Script         |
| MCP Server | Runtime (process)    | Long-running service     | Stateful (server) | JSON/YAML config    |

---

## 5. Component Export System

### 5.1 Export Model

A volume exports components by declaring them in `volume.toml` (Section 3.5) and placing their entrypoint files at the declared paths.

**Rules:**

1. Every exported component MUST be listed in `volume.toml` under `[[components]]`.
2. Every declared component MUST have a valid entrypoint file at the specified path.
3. Component names MUST be unique within a volume (across all types).

### 5.2 Directory Convention

RECOMMENDED layout:

```
volume-root/
├── volume.toml
├── README.md
├── LICENSE
├── agents/
├── skills/
├── commands/
├── tools/
├── hooks/
├── mcp/
└── scripts/
```

### 5.3 Entrypoint Resolution

**Precedence rules:**

| Field source                         | Precedence                                                  |
| ------------------------------------ | ----------------------------------------------------------- |
| `volume.toml` `[[components]]` entry | Highest — authoritative for package-level metadata          |
| Entrypoint frontmatter               | Second — authoritative for component-level content metadata |
| Inferred defaults                    | Lowest                                                      |

### 5.4 Single-Component Volumes

For volumes that export exactly one component:

```toml
[volume]
schema = 1
name = "git-master"
version = "1.0.0"
description = "Advanced Git workflows"
license = "MIT"
role = "component"

[[components]]
type = "skill"
name = "git-master"
entrypoint = "./SKILL.md"
```

---

## 6. Cross-Runtime Compatibility Model

### 6.1 Runtime Definitions

| Runtime ID      | Description                       |
| --------------- | --------------------------------- |
| `claude-code`   | Anthropic's Claude Code CLI agent |
| `opencode`      | OpenCode CLI agent                |
| `cursor`        | Cursor AI editor                  |
| `codex`         | OpenAI Codex CLI agent            |
| `gemini`        | Google Gemini CLI agent           |
| `openai-agents` | OpenAI Agents SDK                 |
| `generic-mcp`   | Any MCP-compatible client         |
| `generic-cli`   | Any CLI-based agent runtime       |

New runtime identifiers MAY be added without a spec revision. The registry maintains the authoritative list.

### 6.2 Runtime Compatibility Declaration

See [Section 3.7](#37-runtime-compatibility). If absent, the volume makes no compatibility claims.

### 6.3 Protocol Compatibility

See [Section 3.8](#38-protocol-compatibility).

| Protocol ID | Description            |
| ----------- | ---------------------- |
| `mcp`       | Model Context Protocol |

### 6.4 Provider Compatibility

See [Section 3.9](#39-provider-declarations). Common providers: `github`, `gitlab`, `slack`, `discord`, `linear`, `jira`, `notion`, `postgres`, `docker`, `kubernetes`, `aws`, `gcp`, `azure`, `openai`, `anthropic`, `filesystem`, `browser`.

### 6.5 Environment Requirements

See [Section 3.11](#311-environment-requirements).

| Field      | Valid values                                          |
| ---------- | ----------------------------------------------------- |
| `runtimes` | `node`, `bun`, `deno`, `python`, `ruby`, `go`, `rust` |
| `os`       | `linux`, `macos`, `windows`                           |
| `arch`     | `x64`, `arm64`, `x86`                                 |

---

## 7. Content Integrity

### 7.1 Content Hash

Every volume version is associated with a **content hash** — a SHA-256 digest of the volume's canonical archive.

### 7.2 Canonical Archive Construction

1. Collect all files (excluding `.git/`, `node_modules/`, ignored patterns).
2. Sort files lexicographically by path.
3. Compute SHA-256 of the concatenated `{path}:{sha256(content)}` entries.

The resulting digest is the volume's content hash.

### 7.3 Verification

After download, clients MUST compute the content hash and compare against the registry-provided value. If the hashes do not match, the volume MUST be rejected.

Bibliothecas MUST compute and store the content hash server-side at publish time.

### 7.4 Hash Format

Content hashes are represented as `sha256:<hex>` strings:

```
sha256:a3f2b8c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2
```

---

## 8. Trust and Supply Chain Model

### 8.1 Publisher Identity

Publishers register with a bibliotheca and own one or more scopes (or scopeless names, per registry policy).

**Verification levels:**

| Level        | Requirements                                              | Badge    |
| ------------ | --------------------------------------------------------- | -------- |
| `unverified` | Email confirmed.                                          | None     |
| `verified`   | GitHub account linked OR domain DNS TXT record confirmed. | Verified |
| `trusted`    | Verified + 6-month history + security track record.       | Trusted  |

A bibliotheca MAY automatically assign `trusted` status to curated volumes that have undergone security vetting.

### 8.2 Provenance Attestation

Volumes SHOULD include build provenance per [Section 3.12](#312-provenance). The bibliotheca MAY verify via CI OIDC tokens, cryptographic signatures, and source-commit cross-referencing.

### 8.3 Permission Model

See [Section 3.10](#310-permissions).

**Enforcement:** Runtimes SHOULD block unauthorized actions and prompt for user approval.

**Permission escalation:** Components MUST NOT declare broader permissions than their parent volume.

### 8.4 Security Advisories

```toml
[advisory]
id = "BIBSEC-2026-001"
severity = "high"
published = "2026-03-10T00:00:00Z"

[advisory.affected]
volume = "github-provider"
versions = "<2.1.0"

[advisory.description]
title = "Prompt injection in GitHub issue parser"

[advisory.resolution]
fixed-in = "2.1.0"
```

---

## 9. Registry API

### 9.1 Architecture

A conforming bibliotheca exposes an HTTP API for volume operations. Bibliothecas MAY deliver content via CDN (for curated, immutable volumes) or via Git references (for community-hosted volumes).

```
                        ┌──────────────────────────────┐
                        │  Bibliotheca (Registry)      │
                        │  metadata, search, advisories│
                        └──────────────┬───────────────┘
                                       │
                       ┌───────────────┼───────────────┐
                       ▼                               ▼
             ┌──────────────────┐           ┌───────────────────────┐
             │  CDN Content     │           │  Git-Backed Content   │
             │  (immutable)     │           │  (community)          │
             └──────────────────┘           └───────────────────────┘
```

**Content delivery models:**

| Model          | Description                                                  | Integrity             | Use case                |
| -------------- | ------------------------------------------------------------ | --------------------- | ----------------------- |
| **CDN**        | Registry-hosted immutable archives                           | Registry-guaranteed   | Curated, vetted volumes |
| **Git-backed** | Content hosted in Git repositories, referenced by tag or SHA | Content-hash verified | Community contributions |

### 9.2 Package Operations

#### 9.2.1 Publish

```
POST /api/v1/volumes/{name}
POST /api/v1/volumes/@{scope}/{name}
Authorization: Bearer <token>
Content-Type: application/octet-stream
```

**Requirements:** Publisher owns scope/name. Version immutable once published. Content hash computed server-side.

#### 9.2.2 Fetch

```
GET /api/v1/volumes/{name}/{version}
GET /api/v1/volumes/@{scope}/{name}/{version}
```

**Response:**

```json
{
  "name": "research-agent-pack",
  "version": "1.4.0",
  "integrity": "sha256:a3f2b8c...",
  "dist": {
    "tarball": "https://cdn.example.com/volumes/research-agent-pack/1.4.0.tar.gz",
    "source": "cdn"
  }
}
```

For Git-backed volumes:

```json
{
  "name": "@acme/my-skill",
  "version": "0.5.0",
  "integrity": "sha256:9d1e4f7...",
  "dist": {
    "git": "https://github.com/acme/my-skill.git",
    "ref": "v0.5.0",
    "source": "git"
  }
}
```

#### 9.2.3 Unpublish

A bibliotheca SHOULD allow unpublishing within a grace window (RECOMMENDED: 72 hours) if no dependents exist. After the grace window, removal SHOULD require a security advisory (admin action). Unpublished version numbers SHOULD be tombstoned (reserved, cannot reuse).

### 9.3 Search and Discovery

```
GET /api/v1/search?q=<query>&type=<component-type>&runtime=<runtime>&provider=<provider>&domain=<domain>&keyword=<keyword>&publisher=<publisher>&limit=20&offset=0
```

### 9.4 Security Advisory API

```
GET /api/v1/advisories?volume={name}
GET /api/v1/advisories/{advisory-id}
POST /api/v1/advisories                    (admin only)
```

### 9.5 Authentication

| Operation          | Auth required            |
| ------------------ | ------------------------ |
| Search, fetch      | No                       |
| Download           | No                       |
| Publish            | Yes (Bearer token)       |
| Unpublish          | Yes (Bearer + ownership) |
| Advisories (write) | Yes (admin)              |

### 9.6 Rate Limiting

Conforming bibliothecas SHOULD implement rate limiting. RECOMMENDED tiers:

| Tier          | Limit        |
| ------------- | ------------ |
| Anonymous     | 60 req/min   |
| Authenticated | 300 req/min  |
| CI tokens     | 1000 req/min |

---

## 10. Package Roles

### 10.1 Component Package

`role = "component"` — One primary component. Most common type. Example: a single-skill volume like `git-master`.

### 10.2 Plugin Package

`role = "plugin"` — Multiple components extending a runtime in a specific domain. Example: `research-agent-pack`.

### 10.3 Provider Package

`role = "provider"` — Integrations with external services. Example: `github-provider` (tools + MCP for GitHub).

### 10.4 Meta Package

`role = "meta"` — Dependency bundle, no components. Example: `devops-essentials` (depends on git-master, ci-triage, code-reviewer).

---

## 11. Conformance

### 11.1 Conforming Bibliotheca

A conforming bibliotheca MUST:

1. Accept and serve volumes with valid `volume.toml` manifests (§3).
2. Implement the Registry API endpoints (§9.2).
3. Enforce version immutability — once published, a version's content MUST NOT change.
4. Compute and store content hashes (SHA-256) for all published volumes (§7).
5. Support the package identity scheme (§2) — both scoped and scopeless identifiers.
6. Expose search and discovery endpoints (§9.3).

A conforming bibliotheca SHOULD:

1. Implement security advisory tracking (§9.4).
2. Support provenance attestation verification (§8.2).
3. Enforce publisher verification levels (§8.1).
4. Implement rate limiting (§9.6).

A conforming bibliotheca MAY:

1. Support scopeless identifiers for curated namespaces.
2. Automatically assign `trusted` status to curated volumes.
3. Serve content via CDN in addition to or instead of Git references.
4. Define additional metadata fields beyond those specified here.

### 11.2 Conforming Client

A conforming client MUST:

1. Parse `volume.toml` manifests (§3).
2. Enforce single-version resolution — reject dependency graphs requiring multiple versions of the same volume (§3.6.3).
3. Verify content hashes after download (§7.3).
4. Support both CDN and Git-backed content delivery.
5. Support both scoped and scopeless volume identifiers.

A conforming client SHOULD:

1. Produce a lockfile for reproducible installations.
2. Check security advisories on install.
3. Warn on permission escalation.
4. Support frozen installs for CI environments.

---

## 12. Design Principles

1. **Runtime neutrality** — No specific agent framework is assumed or privileged.
2. **Component-centric discovery** — Search for components by capability, not packages by name.
3. **Strong identity model** — Every volume and component has a globally unique, purl-compatible identifier.
4. **Supply chain integrity** — Content hashing, publisher verification, and security advisories are first-class.
5. **Cross-runtime interoperability** — Compatibility metadata enables ecosystem portability.
6. **Pragmatic simplicity** — Single-version resolution over npm-style trees. TOML over more complex formats.
7. **Incremental adoption** — A single SKILL.md + minimal volume.toml is a valid volume.

---

## Appendix A: TOML Schema Reference

### A.1 Top-Level Tables

| Table                      | Required          | Description                    |
| -------------------------- | ----------------- | ------------------------------ |
| `[volume]`                 | Yes               | Package metadata and identity. |
| `[publisher]`              | Yes               | Publisher identity.            |
| `[[components]]`           | Yes (except meta) | Exported components.           |
| `[dependencies]`           | No                | Volume-level dependencies.     |
| `[component-dependencies]` | No                | Component-level dependencies.  |
| `[[runtimes]]`             | No                | Runtime compatibility.         |
| `[[protocols]]`            | No                | Protocol compatibility.        |
| `[permissions]`            | No                | Required permissions.          |
| `[environment]`            | No                | Environment requirements.      |
| `[provenance]`             | No                | Build provenance.              |

### A.2 Validation Rules

1. `volume.schema` MUST be a recognized schema version.
2. `volume.name` MUST match `^(@[a-z0-9-]+/)?[a-z0-9-]+$` (optional scope prefix).
3. `volume.version` MUST be a valid SemVer string.
4. `volume.license` MUST be a valid SPDX expression.
5. `volume.role` MUST be one of: `component`, `plugin`, `provider`, `meta`.
6. `components[].type` MUST be one of: `agent`, `skill`, `command`, `tool`, `hook`, `mcp-server`.
7. `components[].name` MUST be unique across all components in the volume.
8. `components[].entrypoint` MUST reference an existing file.
9. `permissions.*` MUST be boolean.
10. Component permissions MUST NOT exceed volume-level permissions.

---

## Appendix B: Glossary

| Term              | Definition                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| **Agent Volumes** | The standard defined by this specification. Abbreviated as **volumes** where unambiguous.       |
| **Volume**        | A versioned distribution unit that exports one or more agent components.                        |
| **Component**     | A functional unit executed by an agent runtime. One of: Agent, Skill, Command, Tool, Hook, MCP. |
| **Bibliotheca**   | A registry that indexes, hosts, and serves volumes. Any conforming registry is a bibliotheca.   |
| **Runtime**       | A system capable of executing agent components (e.g., Claude Code, Cursor, Gemini CLI).         |
| **Publisher**     | An entity that publishes volumes to a bibliotheca.                                              |
| **Scope**         | A namespace prefix (`@scope`) for publisher identity within a bibliotheca.                      |
| **Content Hash**  | SHA-256 digest of a volume's canonical archive, used for integrity verification.                |
| **purl**          | Package URL — standardized identifier. Agent Volumes uses type `shelf`.                         |
| **Entrypoint**    | The primary file of a component, referenced by `entrypoint` in `volume.toml`.                   |
| **Manifest**      | `volume.toml` — package-level metadata. Distinct from component manifests (SKILL.md).           |
| **Advisory**      | Security notice about a known vulnerability in a published volume.                              |

---

_End of Agent Volumes Specification v0.1.0-draft.3_
