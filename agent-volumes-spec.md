![The Agent Volumes Organization Logo](https://raw.githubusercontent.com/agent-volumes/.github/refs/heads/main/assets/logo/banner/light-theme-without-bg/agent-volumes-logo-banner-light-theme-without-bg-4-1.svg)

# Agent Volumes Specification

**Version:** 0.1.0-draft.5  
**Status:** Draft  
**Date:** 12026-05-09  
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

| System                      | Coverage                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Package Identity Scheme     | Globally unique identifiers for volumes and components                                                              |
| Volume Manifest             | `volume.toml` authoring format and canonical parsed-data validation model                                           |
| Component Type System       | Seven component types with precise semantics                                                                        |
| Component Export System     | Standardized discovery and loading of exported components                                                           |
| Cross-Runtime Compatibility | Declarations for runtime, protocol, provider, and environment compatibility                                         |
| Content Integrity           | Normalized-file-tree digest construction and verification                                                           |
| Trust and Supply Chain      | Publisher identity, trust attachments, provenance, signatures, threat model, advisories                             |
| Registry API                | HTTP API for package operations, version discovery, trust discovery and upload, advisories, and capability metadata |
| Conformance                 | Requirements plus normative fixtures and vectors for independent interoperability                                   |
| Companion Artifacts         | Normative machine-readable artifacts for structured contracts where prose-only would be weaker                      |

This specification does **NOT** define:

- CLI command syntax or workflows
- lockfile format or registry-priority policy semantics beyond the minimal interoperability boundary
- specific registry operations policies such as moderation, curation, or pricing
- runtime execution semantics for how agent components are executed internally

### 1.4 Relationship to Existing Standards

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

| Term                           | Definition                                                                                                                                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Volume**                     | The distribution unit. A versioned package that exports one or more agent components.                                                                                                              |
| **Component**                  | A functional unit executed by an agent runtime. One of seven defined types.                                                                                                                        |
| **Bibliotheca**                | A registry that indexes, hosts, and serves volumes.                                                                                                                                                |
| **Runtime**                    | A host, client, SDK, or harness capable of executing agent components (e.g., Claude Code, Cursor, Gemini CLI). Runtime identity does not identify the underlying AI model selected by that system. |
| **Publisher**                  | An entity (individual or organization) that publishes volumes to a bibliotheca.                                                                                                                    |
| **Scope**                      | A publisher namespace (e.g., `@acme`). Bibliothecas define their own scope policies.                                                                                                               |
| **Logical identity**           | The package-facing release identity expressed as `pkg:volume/...@version`.                                                                                                                         |
| **Immutable content identity** | The resolved `sha256:...` digest of a normalized file tree for a published release.                                                                                                                |
| **Trust attachment**           | A release-scoped trust artifact such as a BOM, provenance attestations, signature, or related metadata.                                                                                            |
| **Derived judgment**           | A bibliotheca-produced assessment such as a verification label or policy outcome. Derived judgments are not canonical trust facts.                                                                 |

### 1.8 Notational Conventions

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" are to be interpreted as described in [RFC 2119](https://www.ietf.org/rfc/rfc2119.txt).

TOML examples use [TOML v1.1.0](https://toml.io/en/v1.1.0) syntax.

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

| Field   | Description         | Constraints                                                                                                             | Required               |
| ------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| `scope` | Publisher namespace | Lowercase alphanumeric + hyphens. 1-64 characters. Must not start or end with a hyphen or contain consecutive hyphens.  | Per bibliotheca policy |
| `name`  | Volume name         | Lowercase alphanumeric + hyphens. 1-128 characters. Must not start or end with a hyphen or contain consecutive hyphens. | Always                 |

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

| Field           | Description    | Constraints                                                                     |
| --------------- | -------------- | ------------------------------------------------------------------------------- |
| `type`          | Component type | One of: `agent`, `skill`, `command`, `tool`, `hook`, `mcp-server`, `lsp-server` |
| `componentName` | Component name | Lowercase alphanumeric + hyphens. 1-128 characters.                             |

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

### 2.5.1 Canonical purl Serialization

Portable v0.1 payloads that carry package-facing logical identities MUST use the canonical Package URL serialization defined by this section.

For scoped volumes, the purl namespace segment uses the URL-encoded scope marker `%40`:

```text
pkg:volume/%40<scope>/<name>@<version>
```

The decoded form `@scope/name` remains the canonical user-facing volume name in manifests, route-derived release metadata, search results, and display contexts. Clients and bibliothecas MUST NOT treat decoded user-facing names and encoded purl strings as byte-for-byte interchangeable. When comparing release subjects, implementations compare the canonical purl string after parsing and validating the purl fields against the v0.1 identity grammar.

Component purls use the purl subpath field:

```text
pkg:volume/<name>@<version>#<type>/<componentName>
pkg:volume/%40<scope>/<name>@<version>#<type>/<componentName>
```

Component dependency references MAY omit the version in authoring contexts where the parent volume dependency constraint determines the resolved version, but resolved component references used for trust, lock-like reproducibility inputs, or exact component identity SHOULD include the resolved version.

### 2.6 Identifier Resolution Order

The minimal interoperability contract for dependency interpretation is:

1. **Lockfile** — if present, use pinned versions and resolved source metadata.
2. **Volume manifest** — interpret dependency constraints and component references.
3. **Configured bibliothecas** — use package-scoped version indexes to discover eligible version candidates when available.
4. **Exact release metadata** — fetch the authoritative release metadata before installation or trust evaluation.

The v0.1 core does **not** standardize registry-priority policy across independently configured bibliothecas.

The v0.1 core also does **not** standardize a lockfile file format. A lockfile, when present, is a client-local reproducibility input that pins resolved versions and source metadata. It does not replace exact release metadata retrieval, normalized-file-tree integrity verification, or trust metadata validation unless a future specification defines a stronger frozen-install profile.

The v0.1 core also does **not** standardize one universal prerelease-selection policy across conforming clients. Clients MAY apply local prerelease-selection behavior or UX policy, and prerelease handling therefore remains outside the portable v0.1 resolver baseline.

Package-scoped version indexes are resolver inputs, not lockfiles, search rankings, or complete release records. If version index data conflicts with exact release metadata, clients and bibliothecas MUST treat the result as an inconsistent registry state rather than silently preferring either representation.

Ordinary dependency resolution means selection of a version candidate from dependency constraints and version index rows when the version was not already fixed by an exact user request, an existing lockfile, or an equivalent client-local reproducibility input. Conforming clients MUST NOT select `yanked`, `tombstoned`, `blocked`, or `unavailable` versions during ordinary dependency resolution.

Clients MAY install a `yanked` version when that exact version was explicitly requested, already pinned, or selected by an existing lockfile or equivalent reproducibility input. Clients MUST surface a warning when installing a `yanked` version.

Clients MUST NOT install `blocked` versions by default, including when the version is exactly pinned or present in an existing lockfile. Clients MUST treat `tombstoned` as a preserved version identity whose artifact is no longer installable in the portable v0.1 baseline. Clients MUST treat `unavailable` as excluded from ordinary resolution and as a non-security availability, registry-state, or artifact-state failure rather than as a security block.

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

| Field        | Type   | Description                                                                      |
| ------------ | ------ | -------------------------------------------------------------------------------- |
| `type`       | string | One of: `agent`, `skill`, `command`, `tool`, `hook`, `mcp-server`, `lsp-server`. |
| `name`       | string | Component name. Lowercase alphanumeric + hyphens. Unique within the volume.      |
| `entrypoint` | string | Relative path from volume root to the component's entry file.                    |

The manifest schema validates the structural path shape of `entrypoint`. Entrypoint existence and type-specific content validation require validator logic beyond JSON Schema and are summarized in [Section 5.3](#53-entrypoint-resolution-and-load-boundary).

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

Portable v0.1 dependency constraints use a constrained npm-like SemVer range grammar. The grammar applies to dependency constraints in manifests and to resolver-facing dependency constraints carried in version index rows. It does not redefine the validity of a volume's own `volume.version` SemVer string.

The portable grammar includes:

- exact full SemVer operands, such as `1.2.3`
- caret ranges over full SemVer operands, such as `^1.2.3`
- tilde ranges over full SemVer operands, such as `~1.2.3`
- comparator terms using `<`, `<=`, `>`, `>=`, or `=` with full SemVer operands
- comma conjunction and whitespace conjunction, such as `>=1.5.0, <3.0.0`

The portable grammar excludes:

- OR/disjunction syntax such as `||`
- wildcard and partial-version syntax such as `*`, `1.x`, `1.*`, `1`, or `1.2`
- hyphen ranges such as `1.0.0 - 2.0.0`
- aliases or tags such as `latest`
- registry-specific selector syntax, channels, tracks, or dist-tags
- build metadata in range operands, such as `1.2.3+build.1`

Full SemVer operands in dependency range expressions are three-component SemVer versions with optional prerelease identifiers and without build metadata. Build metadata may remain valid where this specification separately allows SemVer version strings, but it is not part of the portable v0.1 range operand grammar.

`=1.2.3` is equivalent to the exact version range `1.2.3`. `^X.Y.Z` means versions greater than or equal to `X.Y.Z` and less than the next breaking boundary according to SemVer-compatible caret semantics. `~X.Y.Z` means versions greater than or equal to `X.Y.Z` and less than `X.(Y + 1).0`. Multiple comparator terms joined by comma and/or whitespace are interpreted as logical AND.

Prerelease operands MAY be parsed as valid full SemVer operands, but prerelease candidate-selection behavior remains client-local in v0.1 unless a later specification release changes that policy.

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
compatibility = "^1.0.0"
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
filesystem = "read"
network = "deny"
shell = "deny"
browser = "deny"
```

| Permission   | Type                                     | Default | Description                                                                        |
| ------------ | ---------------------------------------- | ------- | ---------------------------------------------------------------------------------- |
| `filesystem` | `deny` / `read` / `write` / `read-write` | `deny`  | Controls local filesystem inspection and mutation surfaces.                        |
| `network`    | `deny` / `read` / `write` / `read-write` | `deny`  | Controls network inspection/fetch and mutating network interactions.               |
| `browser`    | `deny` / `read` / `write` / `read-write` | `deny`  | Controls browser observation/navigation and browser-driven side-effecting actions. |
| `shell`      | `deny` / `allow`                         | `deny`  | Controls shell command execution as a coarse-grained permission surface.           |

Permissions declared at the volume level apply to all components. Components MAY override with narrower (not broader) permissions.

For `filesystem`, `network`, and `browser`, the shared action vocabulary is interpreted as follows:

- `deny` — no access
- `read` — inspect, list, search, fetch, or observe without intended side effects
- `write` — create, modify, delete, submit, or otherwise trigger side effects
- `read-write` — both read and write behavior are permitted

For `shell`, the v0.1 baseline intentionally remains coarse: `allow` or `deny`.

Permissions and portable capability classes are related but not identical:

- portable capability classes describe a tool surface by role
- permissions describe what kinds of actions within that surface are allowed

One capability class MAY depend on one or more permission fields depending on runtime design. For example:

- `file read` commonly maps to `filesystem = "read"`
- `file write/edit` commonly maps to `filesystem = "write"` or `"read-write"`
- `web fetch` and `web search` commonly map to `network = "read"`
- `code intel` commonly depends on `filesystem = "read"`, but does not require a dedicated top-level permission field in the baseline
- `external bridge` MAY involve `network`, `shell`, or both depending on transport and host behavior

Permission escalation is a semantic validity failure. Clients performing publish, consume, install, or load workflows MUST fail when a component declares permissions broader than its parent volume permits.

For `filesystem`, `network`, and `browser`, permission narrowing uses this partial order:

```text
deny < read < read-write
deny < write < read-write
```

`read` and `write` are sibling permissions: neither is narrower than the other. A component MAY omit a permission field to inherit the corresponding volume-level permission. If a component declares a permission field, the declared value MUST be less than or equal to the parent volume permission under the partial order above. A component declaration of `write` is therefore not a valid narrowing of a parent declaration of `read`, and a declaration of `read` is not a valid narrowing of a parent declaration of `write`.

For `shell`, `deny < allow`. A component MAY omit `shell` to inherit the parent volume shell permission.

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

The JSON Schema companion artifact validates the structural subset of the canonical parsed-data model that is expressible in JSON Schema. Some normative validation requirements, including SPDX expression validation, entrypoint existence checks, component-name uniqueness, dependency-graph validation, and permission-escalation checks, require validator logic in addition to schema evaluation.

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
compatibility = "^1.0.0"

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
filesystem = "read"
network = "read"
shell = "deny"
browser = "deny"

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

When discussing tool surfaces across runtimes, Agent Volumes distinguishes between **portable capability classes** and **runtime-specific tool names**.

- portable capability classes describe a tool surface by role, such as `shell execution`, `file read`, `file write/edit`, or `code intel`
- runtime-specific tool names describe how a particular runtime exposes that surface locally

The core specification prefers capability-class reasoning where possible. Runtime-specific tool names remain profile-facing or implementation-facing examples rather than normative core taxonomy terms.

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

| Property             | Value                                                                        |
| -------------------- | ---------------------------------------------------------------------------- |
| Type identifier      | `mcp-server`                                                                 |
| Entrypoint format    | JSON configuration, canonically discoverable as `.mcp.json`                  |
| Execution model      | Long-running process. Communicates via `stdio`, `sse`, or `streamable-http`. |
| Distinguishing trait | Protocol-based service. Runs as a separate process.                          |

JSON is the canonical and only v0.1 baseline format for MCP server configuration in Agent Volumes. This should be understood as an interoperability convention rather than a protocol-level requirement inherited from MCP itself.

### 4.7 LSP Server

An **LSP Server** is a service endpoint implementing the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/).

| Property             | Value                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| Type identifier      | `lsp-server`                                                                                                   |
| Entrypoint format    | JSON configuration, canonically discoverable as `.lsp.json`                                                    |
| Execution model      | Long-running process. Typically communicates over `stdio` or a socket transport supported by the host runtime. |
| Distinguishing trait | Code intelligence service. Provides editor/runtime integration for language-aware operations.                  |

### 4.8 Component Type Summary

| Type       | Invoked by           | Execution                | State             | Primary format       |
| ---------- | -------------------- | ------------------------ | ----------------- | -------------------- |
| Agent      | Runtime              | Autonomous, long-running | Stateful          | Markdown             |
| Skill      | Runtime (contextual) | Loaded into context      | N/A (knowledge)   | Markdown (SKILL.md)  |
| Command    | User (explicit)      | Trigger-based workflow   | Per-invocation    | Markdown             |
| Tool       | Agent (programmatic) | Function call            | Stateless         | JSON/YAML/Script     |
| Hook       | Runtime (event)      | Event-driven             | Stateless         | Markdown/YAML/Script |
| MCP Server | Runtime (process)    | Long-running service     | Stateful (server) | JSON config          |
| LSP Server | Runtime (process)    | Long-running service     | Stateful (server) | JSON config          |

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

### 5.3 Entrypoint Resolution and Load Boundary

| Field source                         | Precedence                                                  |
| ------------------------------------ | ----------------------------------------------------------- |
| `volume.toml` `[[components]]` entry | Highest — authoritative for package-level metadata          |
| Entrypoint frontmatter               | Second — authoritative for component-level content metadata |
| Inferred defaults                    | Lowest                                                      |

Baseline entrypoint contracts are type-specific. They define the minimum information a portable validator can check before handing a component to a runtime adapter. They do not define every runtime-local execution policy.

| Type         | Baseline entrypoint contract                                                                                                     | Portable validation minimum                                                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent`      | Markdown (`.md`) or YAML (`.yaml`) agent definition.                                                                             | Entrypoint file exists and has a supported extension. YAML entrypoints MUST parse as YAML.                                                                                 |
| `skill`      | Markdown skill definition with Agent Skills-compatible frontmatter.                                                              | Entrypoint file exists, is Markdown, and exposes Agent Skills-compatible frontmatter sufficient for discovery.                                                             |
| `command`    | Markdown command definition with `trigger` frontmatter matching `^/[a-z0-9-]+$`.                                                 | Entrypoint file exists, is Markdown, and declares a valid `trigger`.                                                                                                       |
| `tool`       | JSON/YAML function description or executable script as declared by the package.                                                  | JSON and YAML descriptor entrypoints MUST parse. Script entrypoints MUST be regular files; host executability and local policy are load-time checks.                       |
| `hook`       | Markdown/YAML/script hook definition that declares or implies one of the canonical lifecycle events and hook types.              | Entrypoint file exists and declares or implies a canonical lifecycle event from [Section 4.5](#45-hook) and one of the baseline hook types: `command`, `script`, `module`. |
| `mcp-server` | JSON MCP server configuration, canonically discoverable as `.mcp.json`; JSON is the only v0.1 baseline MCP configuration format. | Entrypoint file exists, is JSON, and parses to a JSON object. Runtime-specific server launch, approval, and allow/deny policy are load-time checks.                        |
| `lsp-server` | JSON LSP server configuration, canonically discoverable as `.lsp.json`; JSON is the only v0.1 baseline LSP configuration format. | Entrypoint file exists, is JSON, and parses to a JSON object. Runtime-specific server launch, approval, and allow/deny policy are load-time checks.                        |

Conforming validators MUST verify that declared entrypoint files exist and are regular files in the normalized release subject. They MUST reject a component declaration during manifest, publish, install, or pre-load validation when the component fails the portable validation minimum for its declared type.

The following conditions are portable validation failures in the v0.1 baseline:

- the `entrypoint` path is absolute, escapes the volume root, contains a `..` segment, normalizes to an empty path or `.` path, resolves to a non-regular file, or is absent from the release subject
- the entrypoint's file type is incompatible with the declared component `type`
- a parseable descriptor is required by the declared component `type`, but the descriptor cannot be parsed
- a `command` entrypoint omits `trigger` frontmatter or declares a `trigger` that does not match `^/[a-z0-9-]+$`
- a `hook` entrypoint declares a lifecycle event outside the canonical event vocabulary in [Section 4.5](#45-hook) or a hook type outside `command`, `script`, and `module`
- an `mcp-server` or `lsp-server` entrypoint is not JSON, or does not parse to a JSON object

Warnings are appropriate when the portable component remains loadable but the package uses a non-canonical or profile-sensitive convention. For example, an MCP server configuration at `./config/research-mcp.json` can be structurally valid while still producing a `noncanonical-entrypoint` warning because `.mcp.json` is the canonical discovery filename. Unknown manifest structure remains governed by [Section 3.13](#313-unknown-fields-and-warning-behavior).

Load-time failure is distinct from portable validation failure. A runtime adapter MAY fail to load an otherwise valid component because local policy denies it, an administrator-managed allowlist blocks it, the host platform lacks an execution environment, a server cannot be launched, or a runtime-specific profile rejects a convention that the v0.1 core only warns about. Such failures MUST NOT be reported as successful loads, but they do not retroactively make the manifest structurally invalid.

This boundary follows established agent-runtime practice: malformed configuration is rejected early, ambiguous but understood compatibility conventions produce visible diagnostics, and host-specific policy gates fail closed at load or execution time.

### 5.4 Single-Component Volumes

Volumes that export exactly one component still use the same manifest model. They are not a distinct schema profile.

---

## 6. Cross-Runtime Compatibility Model

### 6.1 Runtime Definitions

A runtime identifier describes the agent execution host, client, SDK, or harness that loads and executes Agent Volumes components. It does not identify the underlying AI model selected by that runtime. Model/provider compatibility and observed model usage are intentionally outside the v0.1 core runtime identifier model and may be addressed by future profiles or extension metadata.

Adding a new runtime identifier to this list is an additive, non-breaking specification update when it does not redefine, remove, or invalidate an existing runtime identifier. Such additions still require a new specification release so that the prose specification and companion artifacts remain aligned.

| Runtime ID        | Description                       |
| ----------------- | --------------------------------- |
| `aider`           | Aider CLI coding agent            |
| `claude-code`     | Anthropic's Claude Code CLI agent |
| `cline`           | Cline IDE and CLI agent           |
| `codex`           | OpenAI Codex CLI agent            |
| `continue`        | Continue IDE and CLI agent        |
| `cursor`          | Cursor AI editor                  |
| `crewai`          | CrewAI agent framework            |
| `gemini`          | Google Gemini CLI agent           |
| `generic-cli`     | Any CLI-based agent runtime       |
| `generic-mcp`     | Any MCP-compatible client         |
| `goose`           | Goose desktop and CLI agent       |
| `hermes-agent`    | Hermes Agent autonomous runtime   |
| `langgraph`       | LangGraph agent runtime SDK       |
| `openai-agents`   | OpenAI Agents SDK                 |
| `openclaw`        | OpenClaw autonomous agent runtime |
| `opencode`        | OpenCode CLI agent                |
| `pi-agent`        | Pi coding agent runtime           |
| `semantic-kernel` | Microsoft Semantic Kernel SDK     |

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
- runtime-local tool names should be interpreted through portable capability classes where possible, such as `shell execution`, `file read`, `file write/edit`, `web fetch`, `web search`, and `code intel`

These identifiers and filenames should be read as interoperability-facing conventions rather than as evidence that Agent Volumes inherits Claude Code semantics wholesale.

#### 6.5.2 Portable tool capability classes

When discussing tool surfaces across runtimes, Agent Volumes distinguishes between **portable capability classes** and **runtime-specific tool names**.

Portable capability classes are the stable cross-runtime concepts that profiles, permissions guidance, and interoperability notes should prefer when possible. Examples include:

- shell execution
- file read
- file write/edit
- file discovery
- content search
- web fetch
- web search
- external bridge
- delegation
- planning
- code intel

These classes are portable semantic categories rather than permission fields. Permission guidance should prefer stable action distinctions such as read versus write where those distinctions remain portable across runtimes.

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

The v0.1 practical interoperability rule set further requires:

- for hosted archive releases, the release subject is the set of valid regular-file entries in the submitted `.tar.gz` archive after applying the hosted archive transport profile in [Section 9.2.1](#921-publish)
- for Git-backed releases, the release subject is the set of valid regular files materialized from the concrete Git reference identified by exact release metadata, excluding VCS administrative directories and implementation-local transient files
- archive/container metadata, VCS administrative directories, and implementation-local transient files are never part of the normalized file tree
- normalized paths use forward slashes, are relative to the volume root, MUST NOT be absolute, and MUST NOT contain `.` or `..` path segments after normalization
- duplicate normalized paths are invalid
- file entries are sorted lexicographically by normalized path before hashing
- line endings are hashed exactly as present in the normalized release file content; implementations MUST NOT rewrite line endings as part of digest construction
- Unicode path strings are interpreted as UTF-8 and MUST NOT be silently normalized between Unicode normalization forms during digest construction
- executable-bit state is part of the normalized file metadata for conformance vectors, while other platform-specific mode bits, ownership, timestamps, extended attributes, and archive header metadata are excluded
- symlinks, hardlinks, Git submodules, device nodes, sockets, and other non-regular-file entries are outside the v0.1 portable release subject unless a future profile defines their handling; baseline digest construction MUST reject non-regular-file entries rather than silently following, dereferencing, or omitting them
- generated files are included only when they are part of the published release subject; generated local build outputs that are not part of the release subject are excluded

The canonical byte stream for digest construction is the direct concatenation of one record per sorted file entry. Each record is encoded as:

```text
file <normalized-path> <executable-flag> <byte-length>\n<raw-content-bytes>
```

`<executable-flag>` is `1` when the normalized file entry is executable and `0` otherwise. `<byte-length>` is the decimal byte length of `<raw-content-bytes>`, not a character count. The newline after `<byte-length>` is a single LF byte. The file content bytes are appended exactly as present in the normalized release subject, including binary bytes and line endings. Implementations MUST reject invalid normalized paths, duplicate normalized paths, and non-regular-file entries before constructing this byte stream.

The v0.1 conformance fixtures in [Appendix C](#appendix-c-conformance-fixtures-and-mapping-matrix) provide executable positive and negative vectors for this encoding. Implementations MUST produce the expected digest for those vectors.

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

The v0.1 core does **not** claim one stronger AI-BOM or ML-BOM profile commitment beyond that generic CycloneDX baseline. AI-specific BOM representation MAY be refined later through profiles, mappings, or extensions without changing the core BOM strategy.

Scanner-finding interchange is **non-normative in v0.1**. Scanner results MAY inform local bibliotheca policy, local derived judgments, vulnerability triage, or future profiles, but v0.1 does not define a portable scanner-finding schema, scanner-result API, scanner severity normalization, or cross-scanner result interchange contract.

The baseline provenance/signing attachment model uses release-subject binding rather than registry-local labels as the interoperability anchor. For SLSA provenance attachments, the baseline predicate type is `https://slsa.dev/provenance/v1`. Provenance and signature artifacts SHOULD be carried in an in-toto/Sigstore-family form that lets a verifier identify the signed subject digest, the logical package identity when present, the builder identity, and the signature or bundle material needed for independent verification.

The v0.1 verifier validates objective artifact facts while leaving broader trust policy local. Conforming clients and bibliothecas MUST perform layered artifact verification:

1. Resolve and validate the release subject: package-facing identity `pkg:volume/...@version` plus normalized-file-tree `sha256` integrity.
2. Discover trust summary and detail metadata for the release.
3. Ignore absent optional trust artifacts as missing evidence rather than an automatic baseline hard failure.
4. Exclude or fail on trust attachments whose lifecycle status is `revoked` or `invalid`.
5. Validate trust artifact format identity against the baseline category and format conventions.
6. Retrieve or inspect the trust artifact bytes or embedded representation.
7. Validate release-subject binding for each artifact against both logical identity and immutable content identity.
8. For Sigstore-family signatures or bundles, verify the cryptographic signature, signing certificate or key material, bundled transparency or timestamp evidence when present in the supported bundle profile, and the signed subject digest.
9. For SLSA provenance, verify the attestation envelope, require the baseline predicate type `https://slsa.dev/provenance/v1`, and validate that the provenance subject digest matches the release integrity.
10. For CycloneDX BOMs, validate the BOM structure and schema/profile identity, and validate the mapped package identity and SHA-256 hash fields when present.

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
- portable scanner-finding interchange or scanner severity normalization

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

Write-capable bibliothecas expose release-scoped trust attachment uploads through a two-phase lifecycle:

1. create an upload intent for a trust attachment bound to a release subject
2. upload the attachment bytes using the upload instructions returned by the bibliotheca
3. finalize the upload so the bibliotheca can verify digest, size, subject binding, and metadata consistency
4. expose the resulting attachment through the existing trust discovery model once it becomes available

The upload instructions returned by a bibliotheca are opaque interoperability data. They MAY identify an internal API endpoint, a time-limited object-storage URL, a backend-specific staging area, or another implementation-local upload target. The portable contract is the intent and finalize lifecycle plus the resulting standard trust attachment record, not the storage backend or byte-transfer protocol.

A bibliotheca MUST NOT mark an uploaded trust attachment as available until it verifies that uploaded bytes match the declared digest and that the attachment metadata binds to the intended release subject. Failed, expired, conflicting, or invalid uploads MUST NOT silently create active trust attachments.

Pending upload state is write-side state. The baseline trust summary and detail discovery views expose finalized available attachments and their current lifecycle status; they do not expose pending upload intents unless a future profile or extension defines such discovery.

### 8.6 Client Trust Consumption Baseline

At minimum:

- digest or subject-binding mismatch MUST fail
- explicit revocation or invalidation MUST fail by default unless an implementation applies an explicit non-baseline override
- simple absence of optional trust evidence is weaker than explicit invalidation

The v0.1 verifier SHOULD report objective verification facts and failures separately from local policy judgments. Absence of baseline trust artifacts, builder identity allowlists, and vulnerability blocking policy remain local policy inputs rather than v0.1 core hard failures by themselves.

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

The v0.1 core severity vocabulary is `critical`, `high`, `medium`, and `low`. The v0.1 core advisory source ecosystem vocabulary is `cve`, `ghsa`, `osv`, `bibliotheca`, and `other`. Advisory relationships use `supersedes`, `superseded-by`, `related`, and `duplicate-of`.

Advisory targeting remains **volume-level only** in v0.1.

Affected-version semantics use an event-style read model compatible with OSV-style range/event interpretation. The v0.1 advisory read contract represents affected history as one or more SemVer ranges containing ordered events such as `introduced`, `fixed`, `lastAffected`, and `limit`. `introduced = "0"` is the beginning-of-time sentinel; other event values use full SemVer strings. When `withdrawn` metadata is present, it MUST include an `at` timestamp. Component-impact metadata remains informational only and MUST NOT be interpreted as changing the normative volume-level target.

Scanner findings are not advisory records by themselves in v0.1. A bibliotheca MAY create or update an advisory based on scanner information under local policy, but the portable contract is the advisory read/discovery model, not scanner-result interchange.

The normative machine-readable advisory contract is published in [`schemas/advisory.schema.json`](schemas/advisory.schema.json), with a corresponding example fixture in [`conformance/fixtures/advisory.json`](conformance/fixtures/advisory.json).

---

## 9. Registry API

### 9.1 Architecture

A conforming bibliotheca exposes an HTTP API for package operations and discovery surfaces.

The machine-readable API contract is published as a normative companion artifact listed in [Appendix B](#appendix-b-machine-readable-companion-artifacts), including [`openapi/bibliotheca.openapi.yaml`](openapi/bibliotheca.openapi.yaml).

Bibliothecas MAY deliver release content via CDN, Git-backed references, or both. However, backend delivery choices do not change the canonical release subject or the API semantics defined here. Version indexes and trust upload instructions are likewise API contracts over logical resources; their physical storage, replication, and byte-transfer mechanisms remain implementation-local unless explicitly defined by this specification.

### 9.2 Package Operations

#### 9.2.1 Publish

Write-capable bibliothecas expose hosted archive publishing through a two-phase upload lifecycle:

1. Create a release upload intent for a target volume identity and version.
2. Upload the `.tar.gz` release bytes using the upload instructions returned by the bibliotheca.
3. Finalize the upload so the bibliotheca can validate the archive, manifest identity, authorization, version conflict state, permission model, and normalized-file-tree integrity.
4. Expose the resulting release metadata and distribution metadata only after the release is accepted.

The target volume identity is route-derived. For `POST /api/v1/volumes/{name}`, the target identity is the path `name`; for `POST /api/v1/volumes/@{scope}/{name}`, it is `@scope/name`. The upload intent request body supplies the target `version` and upload constraints, not an alternate package name. A bibliotheca MUST reject an upload intent or finalization when the route-derived target identity, request body version, uploaded `volume.toml` identity, or finalized release metadata cannot be reconciled to the same release subject.

The portable lifecycle for a hosted release upload intent is limited to `pending-upload`, `uploading`, `uploaded`, `expired`, and `failed`. Only an upload intent whose bytes are available for finalization can be finalized successfully. Finalizing an expired, failed, already-finalized-with-conflicting-input, or otherwise non-finalizable upload intent is an invalid upload state or idempotency conflict as appropriate under [Section 9.10](#910-machine-readable-api-contract).

For hosted archive workflows, the release transport is a gzip-compressed tar archive (`.tar.gz`). This transport container is a packaging convention for upload/download interoperability; it does **not** replace the normalized file tree as the canonical release subject for trust workflows.

Hosted archive payloads follow the v0.1 archive transport profile:

- the payload is gzip-compressed tar content
- archive entries are interpreted relative to one volume root
- absolute paths, parent-directory traversal, duplicate normalized paths, and entries that normalize to `.` or contain `.` / `..` segments are invalid
- regular files are the only portable baseline entry type; symlinks, hardlinks, device nodes, sockets, and other non-regular entries are invalid unless a future profile defines them
- archive timestamps, ownership, extended attributes, platform-specific mode bits, and container metadata are not part of the release subject
- the executable bit is the only archive mode-derived metadata preserved into normalized file tree digest construction

Publisher must own the target namespace. Version numbers are immutable once published. The bibliotheca MUST compute the authoritative normalized-file-tree `integrity` value during finalize before the release becomes available.

Clients publishing artifacts MUST fail before submission when a component declares permissions broader than its parent volume permits.

Bibliothecas that discover permission escalation through publish-time validation, operator review, vulnerability reporting, automated inspection, or equivalent local mechanisms MUST block the affected artifact from continued distribution. The v0.1 baseline does not require every bibliotheca to perform mandatory direct permission-escalation validation on every publish attempt.

The bibliotheca MUST NOT make a release available until finalize succeeds. During finalize, the bibliotheca MUST verify that uploaded bytes match any declared digest and size constraints, the archive is valid, manifest identity is consistent, the version is not already lifecycle-marked, the caller remains authorized, and integrity can be computed.

Successful release finalization creates or preserves exactly one lifecycle-marked version identity. A version number that has been published, yanked, tombstoned, blocked, unavailable, or otherwise lifecycle-marked MUST NOT be reused for different release content.

The upload instructions returned by a bibliotheca MAY identify an internal API endpoint, a time-limited object-storage URL, a backend-specific staging area, a direct upload target, or another implementation-local upload target. Direct binary upload remains an implementation strategy behind those instructions, but direct binary `POST` of release bytes is not the portable hosted release publishing boundary.

Publish conflicts MUST be reported when the target version already exists, when the uploaded package identity disagrees with the target path, or when release metadata cannot be reconciled with the computed normalized-file-tree digest. Validation failures, including malformed archives or invalid manifests, use the baseline problem-details error contract described in [Section 9.10](#910-machine-readable-api-contract).

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
  "status": {
    "state": "available"
  },
  "dist": {
    "source": "cdn",
    "mediaType": "application/gzip",
    "url": "https://cdn.example.com/volumes/research-agent-pack/1.4.0.tar.gz"
  }
}
```

The `name` field in release metadata is the canonical full user-facing volume name: scopeless releases use `name`, and scoped releases use `@scope/name`. The request path is a routing input; exact release metadata is authoritative for the package identity it reports. A scoped fetch response for `@acme/research-agent-pack` therefore reports `"name": "@acme/research-agent-pack"`. Clients and bibliothecas MUST treat a mismatch between the requested route identity and the release metadata identity as inconsistent release metadata.

Exact release metadata includes lifecycle `status` metadata using the same portable state vocabulary as version index rows: `available`, `yanked`, `tombstoned`, `blocked`, and `unavailable`. Successful exact metadata responses for `available` and `yanked` releases MUST include `dist` metadata. A successful exact metadata response for a `yanked` release is permitted for exact pinned fetch/install behavior, but clients MUST surface a `yanked-version` warning before installing it.

For `blocked`, `tombstoned`, or `unavailable` releases, a bibliotheca MUST NOT provide a portable installable `dist` response as if the release were available. It SHOULD return an RFC 7807 Problem Details response instead: `blocked` releases use an authorization, policy, validation, or registry-state failure appropriate to the bibliotheca; `tombstoned` releases use `not-found` or another non-installable tombstone response that preserves version non-reuse; `unavailable` releases use `not-found` or `inconsistent-registry-state` depending on whether the condition is ordinary absence or registry inconsistency. If a bibliotheca exposes non-installable release metadata for audit purposes, clients MUST still fail portable exact fetch/install for `blocked`, `tombstoned`, and `unavailable` states.

For `dist` metadata in v0.1:

- `source = "cdn"` identifies a hosted archive delivery path and MUST expose a `.tar.gz` URL plus the transport media type
- `source = "git"` identifies a Git-backed delivery path and MUST expose the source repository URL together with a concrete Git reference suitable for reproducible source resolution
- delivery metadata remains subordinate to the release's immutable content identity; if the resolved delivery content disagrees with the normalized-file-tree digest, the release MUST be rejected as inconsistent

For `source = "cdn"`, `dist.url` is the portable download locator for the hosted archive bytes. The URL MAY point at a bibliotheca endpoint, CDN, object-storage URL, or signed temporary URL. Clients MUST treat the URL as an opaque retrieval target, MUST require the response bytes to be a gzip-compressed tar archive compatible with the hosted archive transport profile, and MUST verify the normalized-file-tree digest against `integrity` before install or trust evaluation. HTTP redirects, caches, and backend storage choices do not change the release subject, lifecycle status, or digest verification requirement.

Fetch responses expose release metadata, not a resolver policy. Registry priority, source selection across multiple configured bibliothecas, and prerelease-selection behavior remain outside the portable v0.1 API baseline.

#### 9.2.3 Unpublish

A bibliotheca SHOULD allow unpublishing within a grace window if local policy permits it. Unpublished version numbers SHOULD be tombstoned. If a tombstoned version is requested, a bibliotheca SHOULD report the version as unavailable while preserving enough metadata to prevent silent reuse of the same version number.

Yanking, tombstoning, blocking, and unavailability are lifecycle changes to an existing version identity. They do not create a new release subject and do not permit version reuse. Bibliothecas MUST keep exact release metadata, version index rows, and trust/advisory discovery surfaces consistent with the current lifecycle state they expose.

#### 9.2.4 Version Index

The v0.1 core defines a package-scoped version index read surface for each volume identity.

Example topology:

```http
GET /api/v1/index/volumes/{name}
GET /api/v1/index/volumes/@{scope}/{name}
```

The version index is a machine-facing resolver input. It is distinct from catalog search: search ranking and ordering are bibliotheca-local, while version index entries are package-scoped candidate records.

Each version index entry represents one published version row. A row SHOULD include at least:

- the SemVer version string
- the release's normalized-file-tree `integrity` value when available
- the version's volume-level dependency declarations needed for candidate pruning
- lifecycle/status information needed to exclude unavailable versions from ordinary resolution, such as yanked, tombstoned, blocked, or unavailable states when such states are represented by the bibliotheca
- a pointer to the authoritative exact release metadata endpoint

Clients MAY use the version index to choose candidate versions before fetching exact release metadata. Among eligible stable candidates that satisfy the applicable constraints and are not excluded by lifecycle/status metadata, clients SHOULD prefer the candidate with the highest SemVer precedence. Clients MUST still fetch exact release metadata before installation or trust evaluation. Exact release metadata and normalized-file-tree integrity remain authoritative for release validation.

Version index lifecycle states carry the following portable client behavior:

| State         | Ordinary resolution | Exact pinned fetch / install                                             |
| ------------- | ------------------- | ------------------------------------------------------------------------ |
| `available`   | Allowed             | Allowed                                                                  |
| `yanked`      | Excluded            | Allowed with warning                                                     |
| `tombstoned`  | Excluded            | Fails unless using non-baseline implementation-local cache-only behavior |
| `blocked`     | Excluded            | Fails                                                                    |
| `unavailable` | Excluded            | Fails or reports an availability or inconsistent-registry-state error    |

If version index data conflicts with exact release metadata, clients and bibliothecas MUST treat that as an inconsistent registry state rather than silently preferring the index.

Bibliothecas are expected to update the version index promptly when publish, unpublish, yank, tombstone, blocking, or equivalent version-state changes occur.

The v0.1 core MUST NOT require Cargo's physical index layout, path sharding algorithm, Git-backed index storage, sparse-index URL layout, append-only file format, or replication protocol. Bibliothecas MAY implement the version index using database queries, generated JSON documents, static files, CDN-backed sparse indexes, Git-backed indexes, or other local storage mechanisms as long as the normative API contract and conformance behavior are preserved.

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

Search result ordering, ranking, and text relevance are bibliotheca-local. `limit` and `offset` are zero-based catalog pagination controls in the baseline API contract, not resolver inputs or freshness guarantees. Clients MUST NOT infer a stable global ordering across bibliothecas unless a specific bibliotheca documents one locally. Search responses MAY be cached under ordinary HTTP semantics, but clients MUST NOT use search results as a substitute for package-scoped version indexes or exact release metadata during resolution, installation, or trust evaluation.

The machine-readable API contract for this surface is part of [`openapi/bibliotheca.openapi.yaml`](openapi/bibliotheca.openapi.yaml).

### 9.4 Trust Metadata API

The v0.1 core requires a **canonical dedicated endpoint family** for trust discovery. The exact path shape is defined by the machine-readable API contract, but the prose semantics are normative here.

At minimum, the trust metadata API MUST support:

- a summary view
- a raw locator/detail view
- current-state semantics with revision metadata
- release-subject binding information
- trust attachment status metadata

If the release exists but no trust artifacts have yet been attached, the trust metadata surfaces MUST return `200 OK` success semantics with an empty artifact collection rather than treating ordinary trust-artifact absence as a missing-resource error.

Such an empty success response states only that the release exists and that no trust artifacts are currently attached. It MUST NOT by itself be interpreted as successful verification, trusted status, or policy compliance.

#### 9.4.1 Summary View

The normative core of the summary view is **fact-first**.

Required summary semantics MUST be limited to observable trust facts such as:

- whether release trust attachments are present
- which trust artifact categories are available
- which release subject the attachments bind to

Bibliothecas MAY expose optional derived judgments such as verification labels, trust labels, or policy outcomes. Those derived judgments are not canonical truth.

When no trust artifacts are present for an existing release, the summary view returns an empty `artifacts` array.

#### 9.4.2 Detail View

The raw locator/detail view MUST expose sufficient information to allow independent retrieval, inspection, and verification of available trust attachments.

When trust attachments are present, the detail view MUST preserve enough information to identify:

- the bound release subject
- the trust artifact category
- format identity information for the artifact
- byte identity for the finalized trust attachment artifact, including at least the artifact digest and declared size when available
- where the artifact can be retrieved, or an equivalent embedded representation
- lifecycle/status metadata and revision metadata when applicable

When no trust artifacts are present for an existing release, the detail view returns an empty attachment collection together with the ordinary bound subject and revision/current-state metadata.

The companion payload schemas for these views are [`schemas/trust-summary.schema.json`](schemas/trust-summary.schema.json) and [`schemas/trust-detail.schema.json`](schemas/trust-detail.schema.json).

The v0.1 baseline trust format profiles use the following format identity conventions:

| Category     | `format.family`   | Key format fields                                                                                  |
| ------------ | ----------------- | -------------------------------------------------------------------------------------------------- |
| `bom`        | `cyclonedx`       | `mediaType = "application/vnd.cyclonedx+json"`; `version` identifies the CycloneDX schema version  |
| `provenance` | `slsa-provenance` | `mediaType = "application/vnd.in-toto+json"`; `predicateType = "https://slsa.dev/provenance/v1"`   |
| `signature`  | `sigstore-bundle` | `mediaType` identifies the Sigstore bundle representation; `version` identifies the bundle profile |

Other format families MAY be represented through the same fields, but the table above is the portable v0.1 baseline vocabulary for dispatching common trust artifacts.

The byte identity of a trust attachment is distinct from the release subject identity. A trust attachment's `artifactDigest` identifies the exact uploaded attachment bytes after finalization. Clients that retrieve an attachment through a locator SHOULD verify those bytes against `artifactDigest` before interpreting the attachment's contents. The release subject remains the logical purl plus normalized-file-tree digest defined in [Section 7.5](#75-release-subject-identity).

#### 9.4.3 Trust Attachment Upload

Write-capable bibliothecas MUST expose a two-phase trust attachment upload lifecycle for release-scoped trust attachments.

Example topology:

```http
POST /api/v1/volumes/{name}/{version}/trust/uploads
POST /api/v1/volumes/{name}/{version}/trust/uploads/{uploadId}/finalize

POST /api/v1/volumes/@{scope}/{name}/{version}/trust/uploads
POST /api/v1/volumes/@{scope}/{name}/{version}/trust/uploads/{uploadId}/finalize
```

The upload intent request identifies the target release subject, trust attachment category, format metadata, declared uploaded-byte digest, declared size when available, and idempotency information when supplied by the client. The response returns an upload identifier, expiration metadata, and opaque upload instructions for transferring bytes.

The finalize request commits the upload attempt. A bibliotheca MUST verify the uploaded bytes against the declared digest, declared size when present, release-subject binding, and attachment metadata before making the attachment available through trust discovery.

Successful finalization MUST preserve the verified uploaded-byte digest in the resulting trust attachment record. If the uploaded-byte digest later cannot be reconciled with the bytes retrievable from the detail locator, clients and bibliothecas MUST treat the attachment as invalid for baseline verification.

The upload API MUST define standard behavior for expired uploads, digest mismatch, payload too large, unsupported media type, invalid state, authorization failure, missing uploaded bytes, subject-binding mismatch, and idempotency conflicts. These failures use the baseline RFC 7807 Problem Details error contract described in [Section 9.10](#910-machine-readable-api-contract).

Successful finalization results in a trust attachment record whose lifecycle state is represented through the same `active`, `revoked`, `superseded`, and `invalid` status model used by the trust detail view. Revocation and supersession remain status changes, not deletion or replacement.

### 9.5 Security Advisory API

The advisory API is a distinct package-facing discovery surface. Example topology:

```http
GET /api/v1/advisories?volume={name}
GET /api/v1/advisories/{advisoryId}
```

The machine-readable advisory contract MUST be JSON-based and follow the companion schema.

Advisory read/discovery behavior is part of the v0.1 core interoperability contract. Advisory write operations such as create, update, withdrawal, moderation, and related authority workflows remain bibliotheca-local in v0.1.

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
- version index API availability
- release upload API availability
- trust attachment upload API availability
- advisory API availability

The capability metadata document MUST:

- include self-describing version fields
- use a narrow operational core
- allow forward-compatible extension through a reserved extension container
- be cacheable with minimal cache-safety guidance

Unknown capability fields or values MUST be ignored by baseline clients. Implementations MAY surface diagnostics for observability, but a baseline client MUST NOT reject a capability metadata document solely because it contains unknown capability fields or values.

Capability metadata is a narrow discovery surface, not a full negotiation framework. It identifies scope policy shape, supported delivery modes, and availability of version index, trust, advisory, release upload, and trust upload surfaces; richer trust-profile, scanner-profile, or upload-mode negotiation remains outside the v0.1 core. The known v0.1 baseline `deliveryModes` values are `cdn` for hosted archive delivery and `git` for Git-backed source delivery. Unknown delivery modes are ignored by baseline clients under the same unknown-value tolerance rule.

The machine-readable capability metadata contract is published in [`schemas/capability-metadata.schema.json`](schemas/capability-metadata.schema.json).

### 9.7 Capability Extensions and Bridge Semantics

The capability metadata document uses a **reserved extension container** for non-core capability fields.

#### 9.7.1 Reserved Extension Container

Non-core capability fields intended for portable extension use MUST be placed under a reserved extension container rather than appearing as ordinary peer fields to the core model. Baseline clients still tolerate unknown peer fields for forward compatibility, but such fields are not the canonical extension mechanism and MUST NOT be required for baseline behavior.

Inside that container:

- extension data is partitioned by **first-level namespace keys**
- namespace keys use the same strict slug-like identifier policy as Agent Volumes name segments: lowercase ASCII letters, digits, and hyphens, with no leading hyphen, trailing hyphen, or consecutive hyphens
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

The v0.1 registry API uses registry-local resource-scoped bearer token semantics for protected writes. Bearer tokens remain opaque to clients. A bibliotheca derives authorization decisions from registry-local state based on the token subject, the requested action, and the target resource.

| Operation           | Auth required      | Portable authorization semantics                              |
| ------------------- | ------------------ | ------------------------------------------------------------- |
| Search, fetch       | No                 | N/A                                                           |
| Download            | No                 | N/A                                                           |
| Publish             | Yes (Bearer token) | Authorized to publish the volume identity or namespace.       |
| Unpublish           | Yes (Bearer token) | Authorized to unpublish the volume identity or exact release. |
| Capability metadata | No                 | N/A                                                           |
| Trust metadata      | No                 | N/A                                                           |
| Trust upload        | Yes (Bearer token) | Authorized to add trust attachments for the exact release.    |

Ownership is evaluated by the bibliotheca. A token subject may act on behalf of a publisher namespace, volume, or release only when the bibliotheca's local policy authorizes that relationship.

Missing, malformed, unknown, expired, or revoked bearer tokens are authentication failures and use `401 Unauthorized`. A valid token that lacks the required action or resource authorization is an authorization failure and uses `403 Forbidden`.

Error payloads for the HTTP API use RFC 7807 Problem Details with `application/problem+json` as the baseline machine-readable error format.

### 9.9 Rate Limiting

Conforming bibliothecas SHOULD implement rate limiting. Recommended tiers:

| Tier          | Limit        |
| ------------- | ------------ |
| Anonymous     | 60 req/min   |
| Authenticated | 300 req/min  |
| CI tokens     | 1000 req/min |

### 9.10 Machine-Readable API Contract

The normative HTTP contract companion may use OpenAPI together with appropriate schema components where useful. Mixed-format companion publication is intentional: HTTP API topology and payloads need different artifact technologies than manifest structure or fixture shapes.

The baseline machine-readable API contract MUST declare bearer authentication for protected operations and use RFC 7807 Problem Details for common failure surfaces such as authentication failure, authorization failure, missing resources, validation failure, conflicts, and rate limiting.

Agent Volumes baseline problem `type` URIs use the form `https://agentvolumes.org/problems/<slug>`. The following core problem types are reserved for portable clients:

| Problem type slug             | Typical status | Meaning                                                                 |
| ----------------------------- | -------------- | ----------------------------------------------------------------------- |
| `authentication-required`     | `401`          | Bearer authentication is missing or invalid.                            |
| `authorization-failed`        | `403`          | The authenticated caller is not authorized for the requested operation. |
| `not-found`                   | `404`          | The requested resource does not exist or is not visible to the caller.  |
| `validation-failed`           | `400`          | Request payload, parameters, manifest, or metadata failed validation.   |
| `invalid-manifest`            | `400`          | A submitted `volume.toml` is structurally or semantically invalid.      |
| `invalid-archive`             | `400`          | A submitted hosted archive violates the v0.1 archive transport profile. |
| `identity-mismatch`           | `409`          | A package identity disagrees with its route, manifest, or metadata.     |
| `version-conflict`            | `409`          | The target version already exists or cannot be reused.                  |
| `digest-mismatch`             | `400`          | Submitted or resolved bytes do not match the declared digest.           |
| `subject-binding-mismatch`    | `400`          | A trust artifact does not bind to the intended release subject.         |
| `inconsistent-registry-state` | `409`          | Index, exact metadata, or trust metadata cannot be reconciled.          |
| `upload-expired`              | `410`          | An upload intent expired before finalization.                           |
| `missing-uploaded-bytes`      | `400`          | Finalization was requested before upload bytes were available.          |
| `invalid-upload-state`        | `409`          | The upload intent is not in a state that can be finalized.              |
| `idempotency-conflict`        | `409`          | A reused idempotency key conflicts with an earlier request.             |
| `payload-too-large`           | `413`          | The submitted payload exceeds the bibliotheca's accepted limit.         |
| `unsupported-media-type`      | `415`          | The submitted payload media type is not supported.                      |
| `permission-escalation`       | `400`          | Component permissions exceed the parent volume permission boundary.     |
| `rate-limited`                | `429`          | The request was rate limited.                                           |

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

In the v0.1 core baseline, a meta package is a lightweight dependency-bundle role. It does **not** assign special normative semantics to the full transitive dependency closure beyond ordinary dependency resolution behavior.

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
4. Enforce version immutability: once published, a version number MUST NOT be reused after it has been published, yanked, tombstoned, blocked, or otherwise lifecycle-marked ([Section 9.2.1](#921-publish)).
5. Compute the authoritative normalized-file-tree `integrity` value during finalize before a release becomes available ([Section 9.2.1](#921-publish)).
6. Support the package identity scheme ([Section 2](#2-package-identity-scheme)).
7. Expose the query-based catalog search API ([Section 9.3](#93-search-api)).
8. Expose the package-scoped version index API and keep version index rows synchronized with release lifecycle changes ([Section 9.2.4](#924-version-index)).
9. Treat `pkg:volume/...@version` as logical identity and the resolved `sha256:...` value as immutable content identity ([Section 7.5](#75-release-subject-identity)).
10. Reject inconsistent release metadata, version index metadata, or trust metadata when logical identity and immutable content identity cannot be losslessly reconciled ([Section 8.3](#83-trust-attachment-subject-binding)).
11. Expose the trust metadata API with summary and detail views ([Section 9.4](#94-trust-metadata-api)).
12. For write-capable bibliothecas, expose the two-phase release upload API and the two-phase trust attachment upload API, verifying digest, size, subject binding, and metadata consistency before activation ([Section 9.2.1](#921-publish), [Section 9.4.3](#943-trust-attachment-upload)).
13. Expose the advisory API ([Section 9.5](#95-security-advisory-api)).
14. Expose a dedicated capability metadata endpoint ([Section 9.6](#96-bibliotheca-capability-metadata-api)).
15. Preserve append-only trust attachment behavior and status/revision metadata semantics ([Section 8.5](#85-trust-attachment-lifecycle)).
16. Publish the required machine-readable companion artifacts or equivalent normatively referenced artifacts for the structured contracts the bibliotheca claims to implement ([Appendix B](#appendix-b-machine-readable-companion-artifacts)).

A conforming bibliotheca SHOULD:

1. Support baseline provenance discovery and verification workflows using SLSA provenance and Sigstore-family tooling ([Section 8.1](#81-core-trust-baseline)).
2. Expose SPDX-compatible export where needed ([Section 8.1](#81-core-trust-baseline)).
3. Enforce publisher verification policy ([Section 8.2](#82-publisher-identity)).
4. Implement rate limiting ([Section 9.9](#99-rate-limiting)).

### 11.3 Conforming Client

A conforming client MUST:

1. Parse `volume.toml` and validate against the canonical parsed-data model rules ([Section 3](#3-volume-manifest)).
2. Parse portable dependency range expressions using the constrained v0.1 SemVer range grammar ([Section 3.6.1](#361-volume-level-dependencies)).
3. Fail on permission escalation during publish, consume, install, or load workflows when a component declares broader permissions than its parent volume permits ([Section 3.10](#310-permissions)).
4. Enforce single-version resolution — reject dependency graphs requiring multiple versions of the same volume ([Section 3.6.3](#363-single-version-enforcement)).
5. Apply version lifecycle semantics during ordinary resolution, exact pinned fetches, and lock-based installs: ordinary resolution selects only `available` versions, exact pinned `yanked` installs warn, and `blocked`, `tombstoned`, or `unavailable` versions fail in the portable baseline ([Section 2.6](#26-identifier-resolution-order), [Section 9.2.4](#924-version-index)).
6. Fetch exact release metadata before installation or trust evaluation, even when version index rows are used for candidate pruning ([Section 9.2.4](#924-version-index)).
7. Verify normalized-file-tree integrity after download or source resolution ([Section 7](#7-content-integrity)).
8. Support both scoped and scopeless volume identifiers ([Section 2](#2-package-identity-scheme)).
9. Treat `pkg:volume/...@version` as the logical identity of a release and the resolved digest as its immutable content identity when validating trust metadata ([Section 7.5](#75-release-subject-identity)).
10. Reject subject-binding, version-index/exact-metadata, or digest mismatches ([Section 8.6](#86-client-trust-consumption-baseline)).
11. Distinguish canonical trust facts from optional derived judgments when consuming trust metadata ([Section 9.4.1](#941-summary-view)).
12. Treat explicit trust invalidation or revocation as failure by default ([Section 8.6](#86-client-trust-consumption-baseline)).
13. Implement layered artifact verification for available trust artifacts, standardizing objective trust-artifact validity while leaving broader trust policy local ([Section 8.1](#81-core-trust-baseline)).
14. Consume the capability metadata endpoint without failing solely on unknown fields or values ([Section 9.6](#96-bibliotheca-capability-metadata-api)).
15. Surface required migration warnings when bridge-period old forms are accepted and the client rewrites or validates those artifacts ([Section 9.7.2](#972-extension-to-core-bridge-semantics)).

A conforming client SHOULD:

1. Produce a lockfile for reproducible installs ([Section 2.6](#26-identifier-resolution-order)).
2. Check security advisories on install ([Section 8.7](#87-security-advisories)).
3. Support baseline SLSA and Sigstore-family trust workflows ([Section 8.1](#81-core-trust-baseline)).
4. Support frozen installs for CI environments ([Section 2.6](#26-identifier-resolution-order)).

### 11.4 Normative Fixtures and Vectors

The v0.1 core requires normative conformance fixtures and vectors for at least:

- manifest valid/invalid/warning behavior, including unknown-field warnings
- component entrypoint semantic validation, including missing files, wrong formats, missing command triggers, unsupported hook events, and non-canonical entrypoint warnings
- normalized file tree digest golden vectors
- trust metadata summary/detail payload fixtures
- version index row fixtures
- SemVer range grammar accept/reject fixtures
- trust attachment upload lifecycle fixtures
- problem details taxonomy fixtures
- advisory payload fixtures
- capability metadata payload fixtures
- BOM/provenance mapping sample fixtures
- dependency-resolution accept/reject cases
- permission-escalation rejection cases

These fixtures are part of the interoperability contract. They are not merely illustrative examples.

Where behavior is explicitly outside the portable v0.1 baseline, such as client-local prerelease-selection policy, the fixture corpus MAY include labeled informational cases that document the exclusion boundary without imposing one required outcome.

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
2. `volume.name` MUST satisfy the naming policy in [Section 2.4](#24-naming-policy), with optional `@scope/` prefix for scoped names.
3. `volume.version` MUST be a valid SemVer string.
4. `volume.license` MUST be a valid SPDX expression.
5. `volume.role` MUST be one of: `component`, `plugin`, `provider`, `meta`.
6. `components[].type` MUST be one of: `agent`, `skill`, `command`, `tool`, `hook`, `mcp-server`, `lsp-server`.
7. `components[].name` MUST be unique across all components in the volume.
8. `components[].entrypoint` MUST reference an existing file.
9. `permissions.filesystem`, `permissions.network`, and `permissions.browser` MUST be one of `deny`, `read`, `write`, or `read-write`.
10. `permissions.shell` MUST be `deny` or `allow`.
11. Component permissions MUST NOT exceed volume-level permissions.

`[provenance]` metadata describes package-declared source and build context. It does not replace external trust artifacts such as provenance attestations, BOMs, or signatures associated with the published release subject.

### A.4 Warning Model

The warning model uses a small structured core category set with extension hooks.

The v0.1 core warning categories are:

- `unknown-field`
- `deprecated`
- `migration`
- `unknown-capability-field`
- `unknown-capability-value`
- `yanked-version`
- `noncanonical-entrypoint`

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

Companion artifacts are version-aligned with the prose release. The artifact set for `0.1.0-draft.5` is part of the same draft release surface as this specification.

### B.4 Artifact Inventory

The draft companion artifact inventory includes at least:

- [`schemas/volume.schema.json`](schemas/volume.schema.json)
- [`schemas/trust-summary.schema.json`](schemas/trust-summary.schema.json)
- [`schemas/trust-detail.schema.json`](schemas/trust-detail.schema.json)
- [`schemas/advisory.schema.json`](schemas/advisory.schema.json)
- [`schemas/advisory-validation-case.schema.json`](schemas/advisory-validation-case.schema.json)
- [`schemas/capability-metadata.schema.json`](schemas/capability-metadata.schema.json)
- [`schemas/version-index-row.schema.json`](schemas/version-index-row.schema.json)
- [`schemas/release-upload-intent.schema.json`](schemas/release-upload-intent.schema.json)
- [`schemas/release-upload-finalize.schema.json`](schemas/release-upload-finalize.schema.json)
- [`schemas/release-metadata.schema.json`](schemas/release-metadata.schema.json)
- [`schemas/exact-release-metadata-case.schema.json`](schemas/exact-release-metadata-case.schema.json)
- [`schemas/trust-upload-intent.schema.json`](schemas/trust-upload-intent.schema.json)
- [`schemas/trust-upload-finalize.schema.json`](schemas/trust-upload-finalize.schema.json)
- [`schemas/trust-artifact-verification-case.schema.json`](schemas/trust-artifact-verification-case.schema.json)
- [`schemas/bridge-metadata.schema.json`](schemas/bridge-metadata.schema.json)
- [`schemas/problem-details.schema.json`](schemas/problem-details.schema.json)
- [`schemas/warning.schema.json`](schemas/warning.schema.json)
- [`schemas/component-dependency-validation-case.schema.json`](schemas/component-dependency-validation-case.schema.json)
- [`schemas/semantic-validation-case.schema.json`](schemas/semantic-validation-case.schema.json)
- [`schemas/mapping-matrix.schema.json`](schemas/mapping-matrix.schema.json)
- [`schemas/reserved-extension-namespaces.json`](schemas/reserved-extension-namespaces.json)
- [`openapi/bibliotheca.openapi.yaml`](openapi/bibliotheca.openapi.yaml)
- [`conformance/fixtures/`](conformance/fixtures/)

---

## Appendix C: Conformance Fixtures and Mapping Matrix

### C.1 Normative Fixture Set

The v0.1 fixture set includes at least:

- manifest accept/reject/warning fixtures, including unknown-field warning behavior
- digest vectors and negative digest construction cases for normalized file trees
- hosted archive transport profile cases for `.tar.gz` publish/download workflows
- trust summary/detail payload fixtures
- version index row fixtures, including yanked, tombstoned, blocked, and unavailable states
- exact release metadata lifecycle fixtures, including CDN, Git, yanked warning, and non-installable blocked, tombstoned, and unavailable states
- SemVer range grammar fixtures
- release upload lifecycle fixtures
- trust attachment upload lifecycle fixtures
- layered trust artifact verification fixtures for BOM, SLSA provenance, and Sigstore-family signature facts
- explicit trust attachment lifecycle-status verification fixtures, including revoked and invalid default-failure behavior
- problem details taxonomy fixtures
- advisory payload and advisory validation fixtures
- capability metadata fixtures, including unknown field/value tolerance behavior
- bridge-metadata fixtures
- resolver accept/reject fixtures
- purl canonicalization fixtures
- component dependency semantic-validation fixtures
- semantic-validation fixtures for schema-adjacent rules that require validator logic
- permission-escalation rejection fixtures
- BOM/provenance mapping matrix and sample fixtures

Layered trust artifact verification fixtures define deterministic checks over objective artifact facts: declared format family, media type, predicate or signature format, release-subject purl, release-subject integrity, and trust attachment lifecycle status. These fixtures intentionally do not standardize one global trust-root store, online transparency-log policy, or bibliotheca-local acceptance judgment. Implementations that perform cryptographic SLSA or Sigstore validation MUST still bind the verified artifact facts back to the release subject and lifecycle vectors represented by these fixtures.

### C.2 Mapping Matrix Requirement

The v0.1 core MUST include a normative field-by-field mapping matrix or equivalent artifact for BOM and provenance exports.

At minimum, that mapping material must identify:

- which Agent Volumes fields map natively to CycloneDX or SPDX
- which mappings require controlled extensions
- which mappings are intentionally lossy
- how provenance-related fields map into the baseline provenance model

The mapping matrix fixture MUST be serialized as a canonical JSON fixture object with `specVersion` and `entries` fields. `entries` MUST be ordered lexicographically by `agentVolumesField` for stable review diffs and deterministic conformance checks. Each entry MUST use stable target-family keys (`cyclonedx`, `spdx`, and `slsa`) when a mapping exists for that family, and each family mapping MUST classify its `kind` as exactly one of `native`, `extension`, or `lossy`.

Mappings with `kind = "extension"` MUST name the controlled Agent Volumes extension namespace used for serialization. Mappings with `kind = "lossy"` MUST explain the lost semantics so implementations do not treat the target as round-trip-safe. Mapping targets MAY use family-native path notation, but extension property names and lossiness explanations MUST remain stable across fixture updates unless the prose release intentionally changes the interoperability contract.

The v0.1 core does not require one narrower AI-specific BOM profile commitment beyond the generic CycloneDX baseline. Where AI-specific semantics need richer exchange treatment, the mapping material MAY identify profile-oriented or extension-oriented paths without implying that the core already guarantees a complete canonical AI-BOM crosswalk.

### C.3 Fixture Governance

Fixture updates that materially change interoperability expectations are normative changes. Fixture suites are versioned along with the prose release.

---

## Appendix D: Glossary

| Term                           | Definition                                                                                                                                                                            |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agent Volumes**              | The standard defined by this specification.                                                                                                                                           |
| **Volume**                     | A versioned distribution unit that exports one or more agent components.                                                                                                              |
| **Component**                  | A functional unit executed by an agent runtime. One of: Agent, Skill, Command, Tool, Hook, MCP Server, LSP Server.                                                                    |
| **Bibliotheca**                | A registry that indexes, hosts, and serves volumes.                                                                                                                                   |
| **Runtime**                    | A host, client, SDK, or harness capable of executing agent components. Runtime identity does not identify the underlying AI model selected by that system.                            |
| **Publisher**                  | An entity that publishes volumes to a bibliotheca.                                                                                                                                    |
| **Scope**                      | A namespace prefix (`@scope`) for publisher identity within a bibliotheca.                                                                                                            |
| **Logical identity**           | The package-facing release identity expressed as `pkg:volume/...@version`.                                                                                                            |
| **Immutable content identity** | The resolved `sha256:...` digest of a published release's normalized file tree.                                                                                                       |
| **purl**                       | Package URL — standardized identifier. Agent Volumes uses type `volume`.                                                                                                              |
| **Entrypoint**                 | The primary file of a component, referenced by `entrypoint` in `volume.toml`.                                                                                                         |
| **Manifest**                   | `volume.toml` — package-level metadata. Distinct from component-level manifests or entrypoint metadata such as `SKILL.md` frontmatter.                                                |
| **Advisory**                   | Security notice about a known vulnerability in a published volume.                                                                                                                    |
| **Integrity**                  | The release digest computed over the canonical normalized file tree.                                                                                                                  |
| **Version index**              | A package-scoped resolver-facing collection of version rows used for candidate discovery before exact release metadata is fetched.                                                    |
| **Version index row**          | One resolver-facing metadata record for a published volume version, including version, integrity when available, dependency declarations, status, and exact release metadata pointer. |
| **Trust attachment**           | A release-scoped trust artifact such as a BOM, provenance statement, signature, or related metadata.                                                                                  |
| **Yanked**                     | A lifecycle state excluded from ordinary resolution while remaining installable with warning when exactly requested or already pinned.                                                |
| **Tombstoned**                 | A preserved version identity whose artifact is no longer installable in the portable v0.1 baseline and whose version number cannot be reused.                                         |
| **Blocked**                    | A hard lifecycle state for security, policy, or governance failures that prevents installation even for exact or lock-based requests by default.                                      |
| **Unavailable**                | A non-security availability, registry-state, or artifact-state condition excluded from ordinary resolution and treated as a fetch/install failure in the portable baseline.           |
| **Upload intent**              | Write-side release or trust attachment upload state created before bytes are uploaded and finalized.                                                                                  |
| **Summary view**               | A fact-first trust metadata representation for ordinary clients and user interfaces.                                                                                                  |
| **Detail view**                | A trust metadata representation exposing artifact locations, binding details, revision metadata, and status semantics.                                                                |
| **Derived judgment**           | A bibliotheca-produced assessment such as a verification label or policy outcome. Derived judgments are not canonical trust facts.                                                    |
| **Capability metadata**        | Registry-wide structured metadata describing operational bibliotheca capabilities and policy shape.                                                                                   |
| **Portable capability class**  | A runtime-neutral category used to describe a tool surface by role rather than by a runtime-specific tool name.                                                                       |
| **Runtime-specific tool name** | A concrete tool identifier exposed by a particular runtime or host environment. These names may map to shared portable capability classes.                                            |
| **Extension container**        | Reserved capability metadata field that holds non-core extension data under first-level namespace keys.                                                                               |
| **Bridge period**              | A compatibility period during which an extension form and its promoted core form may coexist under explicit migration metadata.                                                       |
| **Migration warning**          | Required warning surfaced when tooling accepts an old bridge-period form that remains a compatibility alias.                                                                          |

---

End of Agent Volumes Specification v0.1.0-draft.5
