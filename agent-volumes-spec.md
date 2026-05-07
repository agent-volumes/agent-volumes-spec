![The Agent Volumes Organization Logo](https://raw.githubusercontent.com/agent-volumes/.github/refs/heads/main/assets/logo/banner/light-theme-without-bg/agent-volumes-logo-banner-light-theme-without-bg-4-1.svg)

# Agent Volumes Specification

**Version:** 0.1.0-draft.4  
**Status:** Draft  
**Date:** 12026-05-06  
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
13. [Appendix A: Manifest Model and Schema Boundary](#appendix-a-manifest-model-and-schema-boundary)
14. [Appendix B: Machine-Readable Companion Artifacts](#appendix-b-machine-readable-companion-artifacts)
15. [Appendix C: Conformance Fixtures and Mapping Matrix](#appendix-c-conformance-fixtures-and-mapping-matrix)
16. [Appendix D: Glossary](#appendix-d-glossary)

---

## 1. Introduction

### 1.1 Purpose

This document defines **Agent Volumes**, a standard for packaging, distributing, verifying, and discovering components for AI agent runtimes.

Agent Volumes functions analogously to established package ecosystems — npm for JavaScript, PyPI for Python, crates.io for Rust — but is specialized for **AI agent systems**. The distribution unit is a **volume**: a versioned package that exports one or more agent components. Registries that host and serve volumes are called **bibliothecas**.

### 1.2 Naming

| Concept             | Name              | Description                                                       |
| ------------------- | ----------------- | ----------------------------------------------------------------- |
| Protocol / Standard | **Agent Volumes** | This specification. Abbreviated as **volumes** where unambiguous. |
| Distribution unit   | **Volume**        | A versioned package of agent components.                          |
| Registry            | **Bibliotheca**   | Any registry that hosts and serves volumes.                       |
| purl type           | `volume`          | Package URL type identifier for supply chain interoperability.    |

> **Note:** The **shelf** CLI is the Windlass-maintained reference client implementation of the Agent Volumes standard. **Alexandria** is the Windlass-maintained reference bibliotheca implementation. These are downstream implementation projects, not governance artifacts of the Agent Volumes Organization, and they do not define the standard or its governance.

### 1.3 Scope

This specification defines:

| System                      | Coverage                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| Package Identity Scheme     | Globally unique identifiers for volumes and components                                         |
| Volume Manifest             | `volume.toml` authoring format and canonical parsed-data validation model                      |
| Component Type System       | Seven component types with precise semantics                                                   |
| Component Export System     | Standardized discovery and loading of exported components                                      |
| Cross-Runtime Compatibility | Declarations for runtime, protocol, provider, and environment compatibility                    |
| Content Integrity           | Normalized-file-tree digest construction and verification                                      |
| Trust and Supply Chain      | Publisher identity, trust attachments, provenance, signatures, threat model, advisories        |
| Registry API                | HTTP API for package operations, trust discovery, advisories, and capability metadata          |
| Conformance                 | Requirements plus normative fixtures and vectors for independent interoperability              |
| Companion Artifacts         | Normative machine-readable artifacts for structured contracts where prose-only would be weaker |

This specification does **NOT** define:

- CLI command syntax or workflows
- lockfile format or registry-priority policy semantics beyond the minimal interoperability boundary
- specific registry operations policies such as moderation, curation, or pricing
- runtime execution semantics for how agent components are executed internally

### 1.4 Relationship to Existing Standards

<!-- markdownlint-disable MD060 -->

| Standard                                                                                | Relationship                                                                                                                                                                             |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Agent Skills Specification](https://agentskills.io/specification.md)                   | Component-level manifests (SKILL.md frontmatter) remain compliant. `volume.toml` is a package-level addition, not a replacement.                                                         |
| [Package URL (purl)](https://github.com/package-url/purl-spec)                          | Volume identifiers are purl-compatible. The `volume` type aligns with the standard's distribution-unit terminology and common singular package-ecosystem naming conventions.             |
| [Semantic Versioning 2.0.0](https://semver.org/)                                        | All volume versions follow SemVer.                                                                                                                                                       |
| [CycloneDX](https://cyclonedx.org/)                                                     | CycloneDX is the normative BOM exchange format for Agent Volumes interoperability. Agent Volumes semantics remain canonical and are exported through controlled mappings and extensions. |
| [SPDX](https://spdx.dev/)                                                               | License identifiers use SPDX expressions. SPDX is a secondary export and reference-compatibility target for archival, graph-oriented, and compliance-oriented exchange use cases.        |
| [SLSA](https://slsa.dev/)                                                               | SLSA provenance is the baseline provenance model for Agent Volumes publish and verification workflows.                                                                                   |
| [Sigstore](https://www.sigstore.dev/)                                                   | Sigstore-family signing and verification is the baseline trust mechanism for provenance-attached artifacts.                                                                              |
| [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)                        | MCP Server is a first-class component type. Protocol compatibility declarations reference MCP versions.                                                                                  |
| [Language Server Protocol (LSP)](https://microsoft.github.io/language-server-protocol/) | LSP Server is a first-class component type. Protocol compatibility declarations reference LSP versions where applicable.                                                                 |

<!-- markdownlint-restore MD060 -->

### 1.5 Normative Source Hierarchy

Agent Volumes v0.1 publishes both prose and machine-readable companion artifacts.

1. The **prose specification** is the final normative authority.
2. Machine-readable companion artifacts are **normative companions** for structured contracts.
3. If prose and a companion artifact appear to conflict, the prose specification wins.

### 1.6 Companion Artifact Scope

Normative machine-readable artifacts are limited to **structured contracts** in v0.1. This includes:

- manifest structure and validation boundaries
- trust and advisory API contracts
- capability metadata contracts
- conformance fixture shapes and related reserved-name artifacts

Prose-heavy or interpretive material such as governance narrative or the threat model remains prose-first.

### 1.7 Terminology

See [Appendix D: Glossary](#appendix-d-glossary) for the complete list. Key terms:

| Term                           | Definition                                                                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Volume**                     | The distribution unit. A versioned package that exports one or more agent components.                                              |
| **Component**                  | A functional unit executed by an agent runtime. One of seven defined types.                                                        |
| **Bibliotheca**                | A registry that indexes, hosts, and serves volumes.                                                                                |
| **Runtime**                    | A system capable of executing agent components (e.g., Claude Code, Cursor, Gemini CLI).                                            |
| **Publisher**                  | An entity (individual or organization) that publishes volumes to a bibliotheca.                                                    |
| **Scope**                      | A publisher namespace (e.g., `@acme`). Bibliothecas define their own scope policies.                                               |
| **Logical identity**           | The package-facing release identity expressed as `pkg:volume/...@version`.                                                         |
| **Immutable content identity** | The resolved `sha256:...` digest of a normalized file tree for a published release.                                                |
| **Trust attachment**           | A release-scoped trust artifact such as a BOM, provenance attestations, signature, or related metadata.                            |
| **Derived judgment**           | A bibliotheca-produced assessment such as a verification label or policy outcome. Derived judgments are not canonical trust facts. |

### 1.8 Notational Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

TOML examples use [TOML v1.0.0](https://toml.io/en/v1.0.0) syntax.

---

## 2. Package Identity Scheme

All volumes and components MUST be globally identifiable. The identity scheme is aligned with the [Package URL (purl) specification](https://github.com/package-url/purl-spec) for interoperability with existing supply chain security tooling.

### 2.1 Volume Identifier

**Scopeless identifier** (when the bibliotheca supports scopeless names):

```text
pkg:volume/<name>
```

**Scoped identifier:**

```text
pkg:volume/%40<scope>/<name>
```

The `%40` is the URL-encoded form of `@`, per purl encoding rules. In user-facing contexts, the decoded form `@scope/name` is used.

| Field   | Description         | Constraints                                         | Required               |
| ------- | ------------------- | --------------------------------------------------- | ---------------------- |
| `scope` | Publisher namespace | Lowercase alphanumeric + hyphens. 1-64 characters.  | Per bibliotheca policy |
| `name`  | Volume name         | Lowercase alphanumeric + hyphens. 1-128 characters. | Always                 |

Bibliothecas define their own scope-governance policies. Those governance policies remain local, but the high-level shape of scope/scopeless support is discoverable through capability metadata.

### 2.2 Version Identifier

Versioned volumes follow [Semantic Versioning 2.0.0](https://semver.org/).

```text
pkg:volume/<name>@<version>
pkg:volume/%40<scope>/<name>@<version>
```

### 2.3 Component Identifier

Components exported from a volume are addressable via the purl subpath field.

```text
pkg:volume/<name>#<type>/<componentName>
pkg:volume/%40<scope>/<name>#<type>/<componentName>
```

<!-- markdownlint-disable MD060 -->

| Field           | Description    | Constraints                                                                     |
| --------------- | -------------- | ------------------------------------------------------------------------------- |
| `type`          | Component type | One of: `agent`, `skill`, `command`, `tool`, `hook`, `mcp-server`, `lsp-server` |
| `componentName` | Component name | Lowercase alphanumeric + hyphens. 1-128 characters.                             |

<!-- markdownlint-restore MD060 -->

### 2.4 Naming Policy

The v0.1 baseline keeps maximum practical symmetry across scope, volume, and component identifier policies.

1. Names MUST consist only of lowercase ASCII letters, digits, and hyphens.
2. Names MUST NOT start or end with a hyphen.
3. Names MUST NOT contain consecutive hyphens.
4. Scoped names MUST be unique within their scope.
5. Component names MUST be unique within a volume across all component types.

### 2.5 purl Integration

| purl field   | Mapping                                               |
| ------------ | ----------------------------------------------------- |
| `type`       | `volume`                                              |
| `namespace`  | `%40<scope>` when scoped; absent when scopeless       |
| `name`       | Volume name                                           |
| `version`    | SemVer version string                                 |
| `qualifiers` | Reserved for future use (e.g., `?repository_url=...`) |
| `subpath`    | `<type>/<componentName>` for component references     |

For trust and supply chain workflows, `pkg:volume/...@version` is the release's **logical identity**. It is paired with the **immutable content identity** from [Section 7](#7-content-integrity).

### 2.6 Identifier Resolution Order

The minimal interoperability contract for dependency interpretation is:

1. **Lockfile** — if present, use pinned versions.
2. **Volume manifest** — interpret version constraints and component references.
3. **Configured bibliothecas** — discover eligible versions.

The v0.1 core does **not** standardize registry-priority policy across independently configured bibliothecas.

---

## 3. Volume Manifest

Every volume MUST contain a `volume.toml` file at its root. `volume.toml` is the normative **human authoring and serialization form** of the manifest.

The normative machine-readable validation contract is defined against a **canonical parsed data model** derived from valid TOML input. Appendix A defines that boundary and [Appendix B](#appendix-b-machine-readable-companion-artifacts) identifies the companion schema artifact, including [`schemas/volume.schema.json`](schemas/volume.schema.json).

### 3.1 Schema Version

```toml
[volume]
schema = 1
```

The `schema` field is a positive integer indicating the manifest schema version. Tooling MUST reject manifests with unrecognized schema versions.

### 3.2 Authored TOML and Canonical Parsed Data Model

The v0.1 manifest model distinguishes three layers:

1. authored TOML source
2. typed TOML parser output
3. canonical parsed data model used for validation and machine-readable schema matching

The baseline uses **minimal normalization**:

- key ordering is not semantically significant
- ambiguous shapes are invalid rather than coerced
- singleton-to-list and similar semantic coercions are not part of the baseline model
- specification-defined defaults are semantic assumptions, not silent mutation of normalized output

### 3.3 Package Metadata

```toml
[volume]
schema = 1
name = "@acme/research-agent-pack"
version = "1.4.0"
description = "Research assistant plugin with literature analysis tools"
license = "Apache-2.0"
homepage = "https://github.com/acme/research-agent-pack"
repository = "https://github.com/acme/research-agent-pack"
documentation = "https://docs.acme.ai/research-pack"
keywords = ["research", "literature", "arxiv"]
role = "plugin"
secondary-roles = ["provider"]
providers = ["github", "arxiv"]
```

**Required fields:**

| Field         | Type    | Description                                                           |
| ------------- | ------- | --------------------------------------------------------------------- |
| `schema`      | integer | Manifest schema version. Currently `1`.                               |
| `name`        | string  | Volume identifier. Scopeless or `@scope/name` per bibliotheca policy. |
| `version`     | string  | SemVer version string.                                                |
| `description` | string  | Summary. Max 256 characters.                                          |
| `license`     | string  | SPDX license expression.                                              |
| `role`        | string  | Primary role. One of: `component`, `plugin`, `provider`, `meta`.      |

**Optional fields:**

| Field             | Type             | Description                                         |
| ----------------- | ---------------- | --------------------------------------------------- |
| `homepage`        | string           | URL to the volume's homepage or documentation site. |
| `repository`      | string           | URL to the source repository.                       |
| `documentation`   | string           | URL to extended documentation.                      |
| `keywords`        | array of strings | Freeform keywords for search discovery.             |
| `secondary-roles` | array of strings | Additional package roles.                           |
| `providers`       | array of strings | External services the volume integrates with.       |

### 3.4 Publisher Information

```toml
[publisher]
id = "acme"
```

| Field | Type   | Description                                                                                                                            |
| ----- | ------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `id`  | string | Publisher identifier. For scopeless volumes, identifies the owner of the volume name. For scoped volumes, identifies the owning scope. |

Publisher verification status is managed by the bibliotheca, not declared in the manifest.

See [Section 8.2](#82-publisher-identity).

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
entrypoint = "./.mcp.json"
description = "MCP server providing research tool endpoints"

[[components]]
type = "lsp-server"
name = "research-lsp"
entrypoint = "./.lsp.json"
description = "LSP server configuration for research-oriented code intelligence"
```

**Required fields per component:**

<!-- markdownlint-disable MD060 -->

| Field        | Type   | Description                                                                      |
| ------------ | ------ | -------------------------------------------------------------------------------- |
| `type`       | string | One of: `agent`, `skill`, `command`, `tool`, `hook`, `mcp-server`, `lsp-server`. |
| `name`       | string | Component name. Lowercase alphanumeric + hyphens. Unique within the volume.      |
| `entrypoint` | string | Relative path from volume root to the component's entry file.                    |

<!-- markdownlint-restore MD060 -->

**Optional fields per component:**

| Field         | Type             | Description                                    |
| ------------- | ---------------- | ---------------------------------------------- |
| `description` | string           | One-line description.                          |
| `providers`   | array of strings | External services integrated by the component. |
| `permissions` | table            | Component-specific permission overrides.       |

### 3.6 Dependency Declarations

#### 3.6.1 Volume-Level Dependencies

```toml
[dependencies]
"search-toolkit" = "^2.0.0"
"@acme/github-provider" = ">=1.5.0, <3.0.0"
```

The key is the volume identifier (scopeless name or `@scope/name`); the value is a version constraint string.

#### 3.6.2 Component-Level Dependencies

```toml
[component-dependencies]
"review-agent" = [
  "pkg:volume/github-provider#tool/read-pr",
  "pkg:volume/github-provider#tool/comment-pr",
  "pkg:volume/%40acme/search-pack#skill/code-search",
]
```

Component-level dependencies imply the parent volume dependency. After volume resolution, the client verifies that all referenced components exist in the resolved volume version.

#### 3.6.3 Single-Version Enforcement

A dependency graph MUST NOT contain multiple versions of the same volume. Conforming clients MUST reject irreconcilable version constraints rather than allowing version duplication.

### 3.7 Runtime Compatibility

```toml
[[runtimes]]
name = "claude-code"
compatibility = "^1.0"
```

If the `runtimes` array is omitted, the volume makes no runtime-specific compatibility claim.

See [Section 6.1](#61-runtime-definitions) for the current runtime identifier set and compatibility context.

### 3.8 Protocol Compatibility

```toml
[[protocols]]
name = "mcp"
version = ">=2025.02"

[[protocols]]
name = "lsp"
version = ">=3.17"
```

See [Section 6.2](#62-protocol-compatibility) for the current protocol compatibility model.

### 3.9 Provider Declarations

```toml
[volume]
providers = ["github", "arxiv", "semantic-scholar"]
```

Providers are external services that the volume integrates with. They are freeform discovery-oriented identifiers used for search, filtering, and compatibility signaling.

At the v0.1 core level:

- provider declarations are package metadata, not dependency declarations
- providers MAY appear at the volume level and at individual component declarations
- provider strings are used as compatibility and discovery hints rather than as a normative external-service identity registry

Common providers include `github`, `gitlab`, `slack`, `discord`, `linear`, `jira`, `notion`, `postgres`, `docker`, `kubernetes`, `aws`, `gcp`, `azure`, `openai`, `anthropic`, `filesystem`, and `browser`.

See [Section 6.3](#63-provider-compatibility) for the cross-runtime provider compatibility context.

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

Permission escalation is a semantic validity failure. Clients performing publish, consume, install, or load workflows MUST fail when a component declares permissions broader than its parent volume permits.

Bibliothecas MUST block artifacts with discovered permission escalation from continued distribution, but the v0.1 baseline does not require every bibliotheca to perform mandatory direct escalation validation on every publish attempt.

Defaults are semantic assumptions. Validators and parsers are not required to materialize omitted permission fields into normalized output.

### 3.11 Environment Requirements

```toml
[environment]
runtimes = ["node", "python", "bun"]
os = ["linux", "macos"]
arch = ["x64", "arm64"]
```

All fields are optional. Omission means no restriction.

See [Section 6.4](#64-environment-requirements) for the baseline runtime, OS, and architecture value set.

### 3.12 Provenance Metadata

```toml
[provenance]
source-repo = "https://github.com/acme/research-agent-pack"

[provenance.build]
system = "github-actions"
workflow = "release.yml"
signed = true
```

Manifest-level provenance metadata is declarative package metadata. External trust attachments such as BOMs, provenance statements, and signatures remain associated with the release subject defined in [Section 7.5](#75-release-subject-identity).

The baseline provenance model and signing / verification interoperability policy for Agent Volumes are defined in [Section 8.1](#81-core-trust-baseline).

### 3.13 Unknown Fields and Warning Behavior

For `volume.toml` validation:

- unknown fields and tables MAY be accepted in the v0.1 baseline
- when accepted, they MUST surface an explicit warning
- warning handling MUST use structured warning categories rather than free text alone when a machine-readable diagnostic form is exposed

This rule applies to manifest structure. It does **not** imply the same behavior for all other artifact families.

### 3.14 Complete Example

```toml
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
entrypoint = "./.mcp.json"
description = "MCP server providing research tool endpoints"

[[components]]
type = "lsp-server"
name = "research-lsp"
entrypoint = "./.lsp.json"
description = "LSP server configuration for repository-aware code intelligence"

# --- Compatibility ---

[[runtimes]]
name = "claude-code"
compatibility = "^1.0"

[[protocols]]
name = "mcp"
version = ">=2025.02"

[[protocols]]
name = "lsp"
version = ">=3.17"

# --- Dependencies ---

[dependencies]
"search-toolkit" = "^2.0.0"

[component-dependencies]
"literature-reviewer" = [
  "pkg:volume/research-agent-pack#tool/arxiv-search",
  "pkg:volume/research-agent-pack#skill/summarize-paper",
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
```

---

## 4. Component Types

Agent Volumes defines seven component types. Each type has distinct semantics and manifest conventions.

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

**Lifecycle events:** `SessionStart`, `SessionEnd`, `Setup`, `UserPromptSubmit`, `Stop`, `StopFailure`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PostToolBatch`, `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `InstructionsLoaded`, `ConfigChange`, `CwdChanged`, `FileChanged`, `PreCompact`, `PostCompact`.

The canonical hook event vocabulary is chosen for interoperability with established runtime conventions. These identifiers are implementation-facing discovery names; the semantics and conformance expectations remain defined by this specification.

**Hook types:** `command` (shell), `script` (executable), `module` (Node.js/Python).

### 4.6 MCP Server

An **MCP Server** is a service endpoint implementing the [Model Context Protocol](https://modelcontextprotocol.io/).

<!-- markdownlint-disable MD060 -->

| Property             | Value                                                                        |
| -------------------- | ---------------------------------------------------------------------------- |
| Type identifier      | `mcp-server`                                                                 |
| Entrypoint format    | JSON configuration, canonically discoverable as `.mcp.json`                  |
| Execution model      | Long-running process. Communicates via `stdio`, `sse`, or `streamable-http`. |
| Distinguishing trait | Protocol-based service. Runs as a separate process.                          |

<!-- markdownlint-restore MD060 -->

JSON is the canonical and only v0.1 baseline format for MCP server configuration in Agent Volumes. This should be understood as an interoperability convention rather than a protocol-level requirement inherited from MCP itself.

### 4.7 LSP Server

An **LSP Server** is a service endpoint implementing the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/).

<!-- markdownlint-disable MD060 -->

| Property             | Value                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Type identifier      | `lsp-server`                                                                                                   |
| Entrypoint format    | JSON configuration, canonically discoverable as `.lsp.json`                                                    |
| Execution model      | Long-running process. Typically communicates over `stdio` or a socket transport supported by the host runtime. |
| Distinguishing trait | Code intelligence service. Provides editor/runtime integration for language-aware operations.                  |

<!-- markdownlint-restore MD060 -->

### 4.8 Component Type Summary

| Type       | Invoked by           | Execution                | State             | Primary format      |
| ---------- | -------------------- | ------------------------ | ----------------- | ------------------- |
| Agent      | Runtime              | Autonomous, long-running | Stateful          | Markdown            |
| Skill      | Runtime (contextual) | Loaded into context      | N/A (knowledge)   | Markdown (SKILL.md) |
| Command    | User (explicit)      | Trigger-based workflow   | Per-invocation    | Markdown            |
| Tool       | Agent (programmatic) | Function call            | Stateless         | JSON/YAML/Script    |
| Hook       | Runtime (event)      | Event-driven             | Stateless         | YAML/Script         |
| MCP Server | Runtime (process)    | Long-running service     | Stateful (server) | JSON config         |
| LSP Server | Runtime (process)    | Long-running service     | Stateful (server) | JSON config         |

---

## 5. Component Export System

### 5.1 Export Model

A volume exports components by declaring them in `volume.toml` and placing their entrypoint files at the declared paths.

1. Every exported component MUST be listed in `volume.toml` under `[[components]]`.
2. Every declared component MUST have a valid entrypoint file at the specified path.
3. Component names MUST be unique within a volume across all component types.

### 5.2 Directory Convention

Recommended layout:

```text
volume-root/
├── volume.toml
├── README.md
├── LICENSE
├── agents/
├── skills/
├── commands/
├── tools/
├── hooks/
├── .mcp.json
├── .lsp.json
└── scripts/
```

### 5.3 Entrypoint Resolution

| Field source                         | Precedence                                                  |
| ------------------------------------ | ----------------------------------------------------------- |
| `volume.toml` `[[components]]` entry | Highest — authoritative for package-level metadata          |
| Entrypoint frontmatter               | Second — authoritative for component-level content metadata |
| Inferred defaults                    | Lowest                                                      |

### 5.4 Single-Component Volumes

Volumes that export exactly one component still use the same manifest model. They are not a distinct schema profile.

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

### 6.2 Protocol Compatibility

`mcp` and `lsp` are the core protocol identifiers in v0.1.

See [Section 3.8](#38-protocol-compatibility).

| Protocol ID | Description              |
| ----------- | ------------------------ |
| `mcp`       | Model Context Protocol   |
| `lsp`       | Language Server Protocol |

### 6.3 Provider Compatibility

See [Section 3.9](#39-provider-declarations). Common providers include `github`, `gitlab`, `slack`, `discord`, `linear`, `jira`, `notion`, `postgres`, `docker`, `kubernetes`, `aws`, `gcp`, `azure`, `openai`, `anthropic`, `filesystem`, and `browser`.

### 6.4 Environment Requirements

See [Section 3.11](#311-environment-requirements).

| Field      | Valid values                                          |
| ---------- | ----------------------------------------------------- |
| `runtimes` | `node`, `bun`, `deno`, `python`, `ruby`, `go`, `rust` |
| `os`       | `linux`, `macos`, `windows`                           |
| `arch`     | `x64`, `arm64`, `x86`                                 |

### 6.5 Runtime Compatibility Profiles

The runtime-neutral core may be supplemented by runtime compatibility profiles for ecosystems whose packaging and lifecycle conventions are important enough to warrant structured interoperability guidance.

Profiles do not replace the core model. They document compatibility affordances such as discovery filenames, hook event vocabulary alignment, and expected component packaging surfaces while leaving the underlying semantics defined by Agent Volumes.

#### 6.5.1 Claude Code compatibility profile

The Claude Code compatibility profile exists to reduce migration friction from an established runtime ecosystem without making Claude Code the conceptual center of the specification.

At minimum, this profile assumes:

- MCP server configuration is canonically packaged as `.mcp.json`
- LSP server configuration is canonically packaged as `.lsp.json`
- hook event identifiers align with the canonical runtime-facing vocabulary listed in [Section 4.5](#45-hook)
- `command`, `hook`, `mcp-server`, and `lsp-server` components can be mapped into familiar Claude Code-style extension surfaces

These identifiers and filenames should be read as interoperability-facing conventions rather than as evidence that Agent Volumes inherits Claude Code semantics wholesale.

#### 6.5.2 Portable tool capability classes

When discussing tool surfaces across runtimes, Agent Volumes distinguishes between **portable capability classes** and **runtime-specific tool names**.

Portable capability classes are the stable cross-runtime concepts that profiles, permissions guidance, and interoperability notes should prefer when possible. Examples include:

- shell execution
- file read
- file write or edit
- file discovery
- content search
- web fetch
- web search
- MCP or external tool bridge
- delegation or subagent execution
- planning and task tracking
- code intelligence

Runtime-specific tool names such as `Bash`, `WebFetch`, `run_shell_command`, or `webfetch` remain profile-facing or implementation-facing examples rather than normative core taxonomy terms.

---

## 7. Content Integrity

### 7.1 Integrity Subject

Every published release is associated with an `integrity` value expressed as a `sha256:<hex>` digest.

`integrity` is the digest of a **normalized file tree**, not of arbitrary transport bytes.

The normalized file tree is the canonical release subject for trust workflows. Delivery artifacts such as tarballs remain useful transport containers, but they are not themselves the normative trust subject unless they are faithful serializations of that normalized file tree.

### 7.2 Normalized File Tree Construction

The canonical subject is constructed from the logical file tree of the release, not from a particular archive container.

At minimum, implementations MUST:

1. collect the published release files that are part of the release subject
2. exclude non-release transport/container metadata and implementation-local transient material
3. normalize paths to a stable relative-rooted form
4. sort entries lexicographically by normalized path
5. hash the stable sequence of normalized path + file-content pairs using SHA-256

The exact normalization contract is defined by the v0.1 conformance vectors in [Appendix C](#appendix-c-conformance-fixtures-and-mapping-matrix).

### 7.3 Verification

After download or source material resolution, clients MUST compute the integrity digest of the normalized file tree and compare it against the release's published `integrity` value.

If the computed digest does not match, the release MUST be rejected.

Bibliothecas MUST compute and store the integrity value at publish time.

If a tarball URL, Git reference, tag, or other delivery reference resolves to content whose normalized-file-tree digest disagrees with the release's immutable content identity, the release MUST be rejected as inconsistent.

### 7.4 Hash Format

Content hashes are represented as `sha256:<hex>` strings:

```text
sha256:a3f2b8c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2
```

### 7.5 Release Subject Identity

Every published release has two required, complementary identities:

1. a **logical identity** expressed as `pkg:volume/...@version`
2. an **immutable content identity** expressed as the resolved `sha256:...` digest of the normalized file tree

These two identities together define the published release subject for Agent Volumes trust workflows.

Trust attachments associated with a release MUST remain losslessly mappable to both identities.

### 7.6 Conformance Vectors

The v0.1 core requires normative digest vectors for normalized-file-tree hashing. Those vectors are part of the interoperability contract and are listed in [Appendix C](#appendix-c-conformance-fixtures-and-mapping-matrix).

---

## 8. Trust and Supply Chain Model

### 8.1 Core Trust Baseline

The v0.1 core trust baseline is:

- CycloneDX as the normative BOM exchange format
- SPDX as a secondary export and reference-compatibility target
- SLSA provenance as the baseline provenance model
- Sigstore-family signature and verification interoperability as the baseline signing and verification stack

Scanner-finding interchange is deferred from the normative v0.1 trust baseline.

### 8.2 Publisher Identity

Publishers register with a bibliotheca and own one or more scopes (or scopeless names, per registry policy).

**Verification levels:**

| Level        | Requirements                                              | Badge    |
| ------------ | --------------------------------------------------------- | -------- |
| `unverified` | Email confirmed.                                          | None     |
| `verified`   | GitHub account linked OR domain DNS TXT record confirmed. | Verified |
| `trusted`    | Bibliotheca-local governance signal layered over verified | Trusted  |

`trusted` is a bibliotheca-local governance signal. It is not itself a canonical release-scoped trust fact.

### 8.3 Trust Attachment Subject Binding

Trust attachments for a published release MUST be normatively about the release subject defined in [Section 7.5](#75-release-subject-identity).

This requirement applies across release-bound trust attachments including BOMs, provenance statements, signatures, and related release metadata.

Conforming bibliothecas and clients MUST preserve a lossless mapping between:

- the package-facing logical identity `pkg:volume/...@version`
- the immutable content identity `sha256:...`

If multiple trust attachments claim incompatible logical identities, incompatible immutable identities, or both, the release metadata MUST be treated as inconsistent and rejected.

### 8.4 Threat Model

The v0.1 threat model MUST identify at least:

- in-scope threats
- out-of-scope threats
- the mechanism(s) intended to mitigate each in-scope threat

#### 8.4.1 In-Scope Threats

The baseline trust architecture is intended to mitigate at least:

- mutable Git references or tags resolving to unexpected release content
- substituted CDN artifacts
- mismatched trust attachments
- malicious or compromised publishers
- malicious skill instructions distributed as trusted-looking package content
- prompt injection embedded in reusable components
- tool permission overreach beyond declared or expected capability boundaries
- MCP server impersonation or substitution
- dependency confusion across bibliothecas
- unsigned or unverifiable releases
- poisoned updates published under an expected package identity
- hidden network, filesystem, shell, or browser access not disclosed through manifest and runtime permission surfaces
- vulnerable or compromised provider integrations distributed through a volume
- stale or replayed trust metadata
- compromised bibliotheca projection behavior that misstates release trust facts

#### 8.4.2 Out-of-Scope Threats

The v0.1 baseline does not claim to solve all possible threats. At minimum, the following remain outside the guaranteed baseline:

- endpoint compromise on the consumer side after trusted installation
- arbitrary runtime sandbox escape not covered by runtime-specific enforcement
- universal trust-root agreement across independent bibliothecas
- generalized malware or vulnerability scanning result normalization across all scanners

#### 8.4.3 Threat-to-Mechanism Mapping

The baseline mechanisms map to threats as follows:

| Threat                                   | Primary mitigation(s)                                                   |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| Mutable Git references or tags           | normalized-file-tree integrity, dual subject identity                   |
| Substituted CDN artifacts                | integrity verification, release rejection on mismatch                   |
| Mismatched trust attachments             | dual subject binding, trust detail view, conformance fixtures           |
| Malicious or compromised publishers      | publisher verification, provenance, signatures, advisories              |
| Malicious skill instructions             | publisher identity, advisories, explicit component typing               |
| Prompt injection in reusable components  | component transparency, advisories, permission boundaries               |
| Tool permission overreach                | manifest permissions, narrower component overrides, runtime enforcement |
| MCP server impersonation or substitution | protocol declarations, integrity verification, trust attachments        |
| Dependency confusion across bibliothecas | scoped identity model, lockfiles, explicit configured bibliothecas      |
| Unsigned or unverifiable releases        | baseline provenance and Sigstore-family verification workflows          |
| Poisoned updates                         | immutable versioning, integrity verification, advisories                |
| Hidden privileged access                 | permission declarations, runtime enforcement, component inspection      |
| Vulnerable provider integrations         | provider declarations, advisories, provenance and publisher identity    |
| Stale or replayed trust metadata         | revision metadata, current-state trust discovery, status semantics      |
| Compromised bibliotheca projection layer | fact-first trust views, raw locator/detail view, independent retrieval  |

### 8.5 Trust Attachment Lifecycle

Release-scoped trust attachments are **append-only**.

- the published release content identity remains immutable
- new trust attachments MAY be added after publication
- previously published trust attachments MUST NOT be silently replaced, rewritten, or reinterpreted as if they were the original artifacts

Trust discovery exposes the **current state** together with **revision metadata**.

If a trust attachment later becomes invalid, superseded, or revoked, it remains part of the append-only record and is represented through **status metadata**, not silent deletion.

### 8.6 Client Trust Consumption Baseline

At minimum:

- digest or subject-binding mismatch MUST fail
- explicit revocation or invalidation MUST fail by default unless an implementation applies an explicit non-baseline override
- simple absence of optional trust evidence is weaker than explicit invalidation

### 8.7 Security Advisories

Security advisories are package-facing records expressed in terms of **volume identity** and **affected version history**.

Advisories are **not** release-bound trust attachments.

The v0.1 advisory baseline includes:

- a required bibliotheca-local advisory ID
- preferred external ecosystem identifiers when available
- a structured source/ecosystem field
- required `published` and `updated` lifecycle fields
- explicit withdrawal lifecycle semantics
- a small core severity vocabulary
- a small core set of advisory relationships
- a full event model for affected version semantics
- optional informational component-impact metadata

Advisory targeting remains **volume-level only** in v0.1.

The normative machine-readable advisory contract is published in [`schemas/advisory.schema.json`](schemas/advisory.schema.json), with a corresponding example fixture in [`conformance/fixtures/advisory.json`](conformance/fixtures/advisory.json).

---

## 9. Registry API

### 9.1 Architecture

A conforming bibliotheca exposes an HTTP API for package operations and discovery surfaces.

The machine-readable API contract is published as a normative companion artifact listed in [Appendix B](#appendix-b-machine-readable-companion-artifacts), including [`openapi/bibliotheca.openapi.yaml`](openapi/bibliotheca.openapi.yaml).

Bibliothecas MAY deliver release content via CDN, Git-backed references, or both. However, backend delivery choices do not change the canonical release subject or the API semantics defined here.

### 9.2 Package Operations

#### 9.2.1 Publish

```http
POST /api/v1/volumes/{name}
POST /api/v1/volumes/@{scope}/{name}
Authorization: Bearer <token>
Content-Type: application/octet-stream
```

Publisher must own the target namespace. Version numbers are immutable once published. The bibliotheca computes `integrity` server-side.

Clients publishing artifacts MUST fail before submission when a component declares permissions broader than its parent volume permits.

Bibliothecas that discover permission escalation through publish-time validation, operator review, vulnerability reporting, automated inspection, or equivalent local mechanisms MUST block the affected artifact from continued distribution. The v0.1 baseline does not require every bibliotheca to perform mandatory direct permission-escalation validation on every publish attempt.

#### 9.2.2 Fetch

```http
GET /api/v1/volumes/{name}/{version}
GET /api/v1/volumes/@{scope}/{name}/{version}
```

The fetch response identifies a release by both package-facing metadata and immutable content identity. Example:

```json
{
  "name": "research-agent-pack",
  "version": "1.4.0",
  "integrity": "sha256:a3f2b8c4...",
  "dist": {
    "source": "cdn",
    "tarball": "https://cdn.example.com/volumes/research-agent-pack/1.4.0.tar.gz"
  }
}
```

#### 9.2.3 Unpublish

A bibliotheca SHOULD allow unpublishing within a grace window if local policy permits it. Unpublished version numbers SHOULD be tombstoned.

### 9.3 Search API

The v0.1 core includes a query-based catalog search surface for discovering matching volumes by metadata and compatibility-oriented filters.

Example topology:

```http
GET /api/v1/search?q=<query>&type=<component-type>&runtime=<runtime>&provider=<provider>&keyword=<keyword>&publisher=<publisher>&limit=20&offset=0
```

At minimum, the search API SHOULD support filtering by:

- freeform query text
- component type
- runtime compatibility
- provider declaration
- keyword
- publisher
- pagination controls

The machine-readable API contract for this surface is part of [`openapi/bibliotheca.openapi.yaml`](openapi/bibliotheca.openapi.yaml).

### 9.4 Trust Metadata API

The v0.1 core requires a **canonical dedicated endpoint family** for trust discovery. The exact path shape is defined by the machine-readable API contract, but the prose semantics are normative here.

At minimum, the trust metadata API MUST support:

- a summary view
- a raw locator/detail view
- current-state semantics with revision metadata
- release-subject binding information
- trust attachment status metadata

#### 9.4.1 Summary View

The normative core of the summary view is **fact-first**.

Required summary semantics MUST be limited to observable trust facts such as:

- whether release trust attachments are present
- which trust artifact categories are available
- which release subject the attachments bind to

Bibliothecas MAY expose optional derived judgments such as verification labels, trust labels, or policy outcomes. Those derived judgments are not canonical truth.

#### 9.4.2 Detail View

The raw locator/detail view MUST expose sufficient information to allow independent retrieval, inspection, and verification of available trust attachments.

When trust attachments are present, the detail view MUST preserve enough information to identify:

- the bound release subject
- the trust artifact category
- format identity information for the artifact
- where the artifact can be retrieved, or an equivalent embedded representation
- lifecycle/status metadata and revision metadata when applicable

The companion payload schemas for these views are [`schemas/trust-summary.schema.json`](schemas/trust-summary.schema.json) and [`schemas/trust-detail.schema.json`](schemas/trust-detail.schema.json).

### 9.5 Security Advisory API

The advisory API is a distinct package-facing discovery surface. Example topology:

```http
GET /api/v1/advisories?volume={name}
GET /api/v1/advisories/{advisoryId}
POST /api/v1/advisories
```

The machine-readable advisory contract MUST be JSON-based and follow the companion schema.

At minimum, advisory payloads MUST include:

- local advisory ID
- preferred external IDs when available
- source/ecosystem
- severity
- `published`
- `updated`
- withdrawal metadata when applicable
- affected volume identity and event-based version semantics

### 9.6 Bibliotheca Capability Metadata API

The v0.1 core requires a **dedicated registry-level endpoint** for bibliotheca capability metadata.

That endpoint is the primary structured discovery surface for registry-wide facts such as:

- scope/scopeless policy shape
- delivery modes
- trust metadata API availability
- advisory API availability

The capability metadata document MUST:

- include self-describing version fields
- use a narrow operational core
- allow forward-compatible extension through a reserved extension container
- be cacheable with minimal cache-safety guidance

Unknown capability fields or values MUST be ignored by baseline clients.

The machine-readable capability metadata contract is published in [`schemas/capability-metadata.schema.json`](schemas/capability-metadata.schema.json).

### 9.7 Capability Extensions and Bridge Semantics

The capability metadata document uses a **reserved extension container** for non-core capability fields.

#### 9.7.1 Reserved Extension Container

Non-core capability fields MUST be placed under a reserved extension container rather than appearing as ordinary peer fields to the core model.

Inside that container:

- extension data is partitioned by **first-level namespace keys**
- namespace keys use a simple slug-like identifier policy
- a small set of spec-owned-looking namespace keys is reserved and unavailable for ordinary extension use

The machine-readable reserved namespace list is published as the companion artifact [`schemas/reserved-extension-namespaces.json`](schemas/reserved-extension-namespaces.json).

#### 9.7.2 Extension-to-Core Bridge Semantics

When an extension field is promoted into the core model, the migration path MUST include a **compatibility bridge period**.

During that bridge period:

- the old extension form and the new core form MAY both be accepted
- the new core form is the canonical representation
- the old extension form is a compatibility alias rather than an equally canonical peer

Bridge signaling MUST be represented through structured metadata and warnings. That metadata SHOULD live as close as practical to the affected artifact, schema surface, or capability document.

Bridge metadata MUST communicate at least:

- that a bridge is active
- the canonical target form
- end-state or removal-target semantics sufficient to avoid indefinite ambiguity

The machine-readable bridge metadata contract is published in [`schemas/bridge-metadata.schema.json`](schemas/bridge-metadata.schema.json), with a corresponding fixture in [`conformance/fixtures/bridge-metadata.json`](conformance/fixtures/bridge-metadata.json).

Rewrite-capable tooling SHOULD emit the new core form during the bridge period.

If tooling accepts the old extension form as input during the bridge period, it MUST surface a migration warning.

### 9.8 Authentication

| Operation           | Auth required               |
| ------------------- | --------------------------- |
| Search, fetch       | No                          |
| Download            | No                          |
| Publish             | Yes (Bearer token)          |
| Unpublish           | Yes (Bearer + ownership)    |
| Advisories (write)  | Yes (admin or local policy) |
| Capability metadata | No                          |
| Trust metadata      | No                          |

### 9.9 Rate Limiting

Conforming bibliothecas SHOULD implement rate limiting. Recommended tiers:

| Tier          | Limit        |
| ------------- | ------------ |
| Anonymous     | 60 req/min   |
| Authenticated | 300 req/min  |
| CI tokens     | 1000 req/min |

### 9.10 Machine-Readable API Contract

The normative HTTP contract companion may use OpenAPI together with appropriate schema components where useful. Mixed-format companion publication is intentional: HTTP API topology and payloads need different artifact technologies than manifest structure or fixture shapes.

---

## 10. Package Roles

### 10.1 Component Package

`role = "component"` — one primary component.

### 10.2 Plugin Package

`role = "plugin"` — multiple components extending a runtime in a specific domain.

### 10.3 Provider Package

`role = "provider"` — integrations with external services.

### 10.4 Meta Package

`role = "meta"` — dependency bundle with no required exported components.

---

## 11. Conformance

### 11.1 Core and Future Profiles

This specification distinguishes between the **v0.1 core baseline** and future profiles or extensions.

The v0.1 core is the minimum interoperable contract. Profiles MAY add stricter or richer behavior later, but they do not weaken the core.

### 11.2 Conforming Bibliotheca

A conforming bibliotheca MUST:

1. Accept and serve volumes with valid `volume.toml` manifests ([Section 3](#3-volume-manifest)).
2. Block continued distribution of artifacts with discovered permission escalation, even though the v0.1 baseline does not require mandatory direct escalation validation on every publish attempt ([Section 3.10](#310-permissions)).
3. Implement the package operations API ([Section 9.2](#92-package-operations)).
4. Enforce version immutability — once published, a version's content MUST NOT change ([Section 9.2.1](#921-publish)).
5. Compute and store normalized-file-tree integrity digests ([Section 7](#7-content-integrity)).
6. Support the package identity scheme ([Section 2](#2-package-identity-scheme)).
7. Expose the query-based catalog search API ([Section 9.3](#93-search-api)).
8. Treat `pkg:volume/...@version` as logical identity and the resolved `sha256:...` value as immutable content identity ([Section 7.5](#75-release-subject-identity)).
9. Reject inconsistent release metadata or trust metadata when logical identity and immutable content identity cannot be losslessly reconciled ([Section 8.3](#83-trust-attachment-subject-binding)).
10. Expose the trust metadata API with summary and detail views ([Section 9.4](#94-trust-metadata-api)).
11. Expose the advisory API ([Section 9.5](#95-security-advisory-api)).
12. Expose a dedicated capability metadata endpoint ([Section 9.6](#96-bibliotheca-capability-metadata-api)).
13. Preserve append-only trust attachment behavior and status/revision metadata semantics ([Section 8.5](#85-trust-attachment-lifecycle)).
14. Publish the required machine-readable companion artifacts or equivalent normatively referenced artifacts for the structured contracts the bibliotheca claims to implement ([Appendix B](#appendix-b-machine-readable-companion-artifacts)).

A conforming bibliotheca SHOULD:

1. Support baseline provenance discovery and verification workflows using SLSA provenance and Sigstore-family tooling ([Section 8.1](#81-core-trust-baseline)).
2. Expose SPDX-compatible export where needed ([Section 8.1](#81-core-trust-baseline)).
3. Enforce publisher verification policy ([Section 8.2](#82-publisher-identity)).
4. Implement rate limiting ([Section 9.9](#99-rate-limiting)).

### 11.3 Conforming Client

A conforming client MUST:

1. Parse `volume.toml` and validate against the canonical parsed-data model rules ([Section 3](#3-volume-manifest)).
2. Fail on permission escalation during publish, consume, install, or load workflows when a component declares broader permissions than its parent volume permits ([Section 3.10](#310-permissions)).
3. Enforce single-version resolution — reject dependency graphs requiring multiple versions of the same volume ([Section 3.6.3](#363-single-version-enforcement)).
4. Verify normalized-file-tree integrity after download or source resolution ([Section 7](#7-content-integrity)).
5. Support both scoped and scopeless volume identifiers ([Section 2](#2-package-identity-scheme)).
6. Treat `pkg:volume/...@version` as the logical identity of a release and the resolved digest as its immutable content identity when validating trust metadata ([Section 7.5](#75-release-subject-identity)).
7. Reject subject-binding or digest mismatches ([Section 8.6](#86-client-trust-consumption-baseline)).
8. Distinguish canonical trust facts from optional derived judgments when consuming trust metadata ([Section 9.4.1](#941-summary-view)).
9. Treat explicit trust invalidation or revocation as failure by default ([Section 8.6](#86-client-trust-consumption-baseline)).
10. Consume the capability metadata endpoint without failing solely on unknown fields or values ([Section 9.6](#96-bibliotheca-capability-metadata-api)).
11. Surface required migration warnings when bridge-period old forms are accepted and the client rewrites or validates those artifacts ([Section 9.7.2](#972-extension-to-core-bridge-semantics)).

A conforming client SHOULD:

1. Produce a lockfile for reproducible installs ([Section 2.6](#26-identifier-resolution-order)).
2. Check security advisories on install ([Section 8.7](#87-security-advisories)).
3. Support baseline SLSA and Sigstore-family trust workflows ([Section 8.1](#81-core-trust-baseline)).
4. Support frozen installs for CI environments ([Section 2.6](#26-identifier-resolution-order)).

### 11.4 Normative Fixtures and Vectors

The v0.1 core requires normative conformance fixtures and vectors for at least:

- normalized file tree digest golden vectors
- trust metadata summary/detail payload fixtures
- advisory payload fixtures
- BOM/provenance mapping sample fixtures
- dependency-resolution accept/reject cases

These fixtures are part of the interoperability contract. They are not merely illustrative examples.

---

## 12. Design Principles

1. **Runtime neutrality** — no specific agent framework is assumed or privileged.
2. **Component-centric discovery** — search for components by capability, not packages by name.
3. **Strong identity model** — every volume and component has a globally unique, purl-compatible identifier.
4. **Supply chain integrity** — content integrity, trust attachments, advisories, and verification are first-class.
5. **Cross-runtime interoperability** — compatibility metadata enables ecosystem portability.
6. **Pragmatic simplicity** — single-version resolution, TOML authoring, and narrowly scoped structured contracts are preferred over heavier general-purpose models.
7. **Incremental adoption** — a single SKILL.md plus minimal `volume.toml` remains a valid baseline volume.

---

## Appendix A: Manifest Model and Schema Boundary

### A.1 Top-Level Tables

| Table                      | Required          | Description                                                           |
| -------------------------- | ----------------- | --------------------------------------------------------------------- |
| `[volume]`                 | Yes               | Package metadata and identity.                                        |
| `[publisher]`              | Yes               | Publisher identity.                                                   |
| `[[components]]`           | Yes (except meta) | Exported components.                                                  |
| `[dependencies]`           | No                | Volume-level dependencies.                                            |
| `[component-dependencies]` | No                | Component-level dependencies.                                         |
| `[[runtimes]]`             | No                | Runtime compatibility.                                                |
| `[[protocols]]`            | No                | Protocol compatibility.                                               |
| `[permissions]`            | No                | Required permissions.                                                 |
| `[environment]`            | No                | Environment requirements.                                             |
| `[provenance]`             | No                | Declarative source and build context metadata for release provenance. |

### A.2 Canonical Parsed-Data Model Rules

1. The typed output of the TOML parser is the baseline input to the canonical parsed-data model.
2. Key ordering is not semantically significant.
3. Ambiguous shapes are invalid rather than coerced.
4. Specification-defined defaults are interpretive semantics, not required injected normalized output.
5. Unknown manifest structure MAY be accepted in the baseline only with explicit warnings.

### A.3 Validation Rules

1. `volume.schema` MUST be a recognized schema version.
2. `volume.name` MUST match `^(@[a-z0-9-]+/)?[a-z0-9-]+$`.
3. `volume.version` MUST be a valid SemVer string.
4. `volume.license` MUST be a valid SPDX expression.
5. `volume.role` MUST be one of: `component`, `plugin`, `provider`, `meta`.
6. `components[].type` MUST be one of: `agent`, `skill`, `command`, `tool`, `hook`, `mcp-server`, `lsp-server`.
7. `components[].name` MUST be unique across all components in the volume.
8. `components[].entrypoint` MUST reference an existing file.
9. `permissions.*` MUST be boolean.
10. Component permissions MUST NOT exceed volume-level permissions.

`[provenance]` metadata describes package-declared source and build context. It does not replace external trust artifacts such as provenance attestations, BOMs, or signatures associated with the published release subject.

### A.4 Warning Model

The warning model uses a small structured core category set with extension hooks.

The v0.1 core warning categories are:

- `unknown-field`
- `deprecated`
- `migration`

Implementations MAY add extension warning categories, but baseline clients can rely on the core set.

---

## Appendix B: Machine-Readable Companion Artifacts

### B.1 Artifact Families

The v0.1 draft publishes or normatively references the following artifact families:

| Family                  | Purpose                                               | Format family |
| ----------------------- | ----------------------------------------------------- | ------------- |
| Manifest schema         | Canonical parsed-data validation contract             | JSON Schema   |
| Trust/advisory schemas  | Structured payload contracts                          | JSON Schema   |
| Capability metadata     | Registry-wide capability discovery contract           | JSON Schema   |
| HTTP API contract       | Endpoint topology and request/response contract       | OpenAPI       |
| Conformance fixtures    | Executable interoperability vectors and test payloads | JSON          |
| Reserved-name artifacts | Machine-readable reserved extension namespace list    | JSON          |

### B.2 Repository Locations

The draft companion artifacts are organized as follows:

- `schemas/`
- `openapi/`
- `conformance/fixtures/`

### B.3 Lockstep Versioning

Companion artifacts are version-aligned with the prose release. The artifact set for `0.1.0-draft.4` is part of the same draft release surface as this specification.

### B.4 Artifact Inventory

The draft companion artifact inventory includes at least:

- [`schemas/volume.schema.json`](schemas/volume.schema.json)
- [`schemas/trust-summary.schema.json`](schemas/trust-summary.schema.json)
- [`schemas/trust-detail.schema.json`](schemas/trust-detail.schema.json)
- [`schemas/advisory.schema.json`](schemas/advisory.schema.json)
- [`schemas/capability-metadata.schema.json`](schemas/capability-metadata.schema.json)
- [`schemas/bridge-metadata.schema.json`](schemas/bridge-metadata.schema.json)
- [`schemas/reserved-extension-namespaces.json`](schemas/reserved-extension-namespaces.json)
- [`openapi/bibliotheca.openapi.yaml`](openapi/bibliotheca.openapi.yaml)
- [`conformance/fixtures/`](conformance/fixtures/)

---

## Appendix C: Conformance Fixtures and Mapping Matrix

### C.1 Normative Fixture Set

The v0.1 fixture set includes at least:

- digest vectors for normalized file trees
- trust summary/detail payload fixtures
- advisory payload fixtures
- bridge-metadata fixtures
- resolver accept/reject fixtures
- BOM/provenance mapping fixtures

### C.2 Mapping Matrix Requirement

The v0.1 core MUST include a normative field-by-field mapping matrix or equivalent artifact for BOM and provenance exports.

At minimum, that mapping material must identify:

- which Agent Volumes fields map natively to CycloneDX or SPDX
- which mappings require controlled extensions
- which mappings are intentionally lossy
- how provenance-related fields map into the baseline provenance model

### C.3 Fixture Governance

Fixture updates that materially change interoperability expectations are normative changes. Fixture suites are versioned along with the prose release.

---

## Appendix D: Glossary

| Term                           | Definition                                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent Volumes**              | The standard defined by this specification.                                                                                            |
| **Volume**                     | A versioned distribution unit that exports one or more agent components.                                                               |
| **Component**                  | A functional unit executed by an agent runtime. One of: Agent, Skill, Command, Tool, Hook, MCP Server, LSP Server.                     |
| **Bibliotheca**                | A registry that indexes, hosts, and serves volumes.                                                                                    |
| **Runtime**                    | A system capable of executing agent components.                                                                                        |
| **Publisher**                  | An entity that publishes volumes to a bibliotheca.                                                                                     |
| **Scope**                      | A namespace prefix (`@scope`) for publisher identity within a bibliotheca.                                                             |
| **Logical identity**           | The package-facing release identity expressed as `pkg:volume/...@version`.                                                             |
| **Immutable content identity** | The resolved `sha256:...` digest of a published release's normalized file tree.                                                        |
| **purl**                       | Package URL — standardized identifier. Agent Volumes uses type `volume`.                                                               |
| **Entrypoint**                 | The primary file of a component, referenced by `entrypoint` in `volume.toml`.                                                          |
| **Manifest**                   | `volume.toml` — package-level metadata. Distinct from component-level manifests or entrypoint metadata such as `SKILL.md` frontmatter. |
| **Advisory**                   | Security notice about a known vulnerability in a published volume.                                                                     |
| **Integrity**                  | The release digest computed over the canonical normalized file tree.                                                                   |
| **Trust attachment**           | A release-scoped trust artifact such as a BOM, provenance statement, signature, or related metadata.                                   |
| **Summary view**               | A fact-first trust metadata representation for ordinary clients and user interfaces.                                                   |
| **Detail view**                | A trust metadata representation exposing artifact locations, binding details, revision metadata, and status semantics.                 |
| **Derived judgment**           | A bibliotheca-produced assessment such as a verification label or policy outcome. Derived judgments are not canonical trust facts.     |
| **Capability metadata**        | Registry-wide structured metadata describing operational bibliotheca capabilities and policy shape.                                    |
| **Extension container**        | Reserved capability metadata field that holds non-core extension data under first-level namespace keys.                                |
| **Bridge period**              | A compatibility period during which an extension form and its promoted core form may coexist under explicit migration metadata.        |
| **Migration warning**          | Required warning surfaced when tooling accepts an old bridge-period form that remains a compatibility alias.                           |

---

End of Agent Volumes Specification v0.1.0-draft.4
