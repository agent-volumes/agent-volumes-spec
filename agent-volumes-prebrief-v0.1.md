# Agent Volumes — Pre-Launch Technical Brief

## What is Agent Volumes?

Agent Volumes is an open specification for packaging, distributing, verifying, and discovering AI agent components.

The project is designed as a supply-chain and package ecosystem layer for agent systems — analogous to how npm, PyPI, Cargo, and OCI function for conventional software ecosystems.

A versioned package unit is called a **volume**. Registries serving volumes are called **bibliothecas**.

---

## Why This Exists

Current AI agent ecosystems increasingly rely on reusable:

- skills
- tools
- hooks
- commands
- MCP servers
- runtime integrations

However, these components currently lack:

- a unified package identity model
- interoperable dependency semantics
- provenance and integrity guarantees
- standardized advisory workflows
- cross-runtime compatibility metadata
- portable supply-chain tooling compatibility

Agent Volumes attempts to provide this missing package and trust layer.

---

## Core Design Goals

### Runtime-neutral packaging

Agent Volumes is intentionally runtime-neutral.

The spec does not assume or privilege a single runtime ecosystem and instead defines portable component abstractions for:

- agents
- skills
- tools
- hooks
- MCP servers
- LSP servers

---

### Supply-chain integrity first

The spec treats trust and verification as first-class concepts.

Core mechanisms include:

- purl-compatible identities
- immutable content digests
- normalized file-tree hashing
- provenance metadata
- Sigstore/SLSA-aligned workflows
- advisory metadata
- trust attachment discovery APIs

---

### Cross-runtime interoperability

The compatibility model supports:

- Claude Code
- OpenAI Agents SDK
- Codex
- Cursor
- Continue
- LangGraph
- MCP-compatible runtimes
- future runtime profiles

---

## Reference Implementations

- **shelf** — reference CLI client
- **Alexandria** — reference bibliotheca implementation

These are implementation projects, not governance artifacts.
