---
status: accepted
date: 12026-05-05
decision-makers: Yunseo Kim
---

# Use CycloneDX as the normative BOM exchange format, with Agent Volumes semantics as the canonical source

## Context and Problem Statement

The Agent Volumes standard needs a BOM strategy for packaging, registry interoperability, supply chain security, and future AI-agent governance.

Several viable approaches emerged:

- Directly adopt an existing BOM standard as the normative format.
- Support more than one existing BOM standard as normative.
- Defer the normative format decision while requiring BOM attachment/discovery semantics.
- Define a new agent-specific canonical BOM and export to existing standards.

This decision must balance immediate interoperability with security tooling against the need to preserve agent-native concepts such as agents, skills, tools, hooks, MCP servers, permissions, runtime compatibility, provider bindings, and delegation-related semantics.

## Decision Drivers

- Immediate interoperability with existing supply chain and security tooling
- Minimal ecosystem adoption friction for registries, scanners, and downstream consumers
- Preservation of Agent Volumes' agent-specific domain model
- Avoidance of a second full canonical schema unless clearly necessary
- Ability to evolve richer agent-risk semantics over time
- Compatibility with SPDX-based exchange and archival use cases

## Considered Options

- A — Use CycloneDX ML-BOM + CycloneDX Attestations as the normative standard and keep SPDX as reference compatibility
- B — Treat both CycloneDX and SPDX as co-equal normative BOM standards
- C — Define attachment/discovery requirements now and defer the normative BOM format decision to a later spec or RFC
- D — Define an Agent Volumes-specific canonical BOM and export to CycloneDX and SPDX
- A+ — Keep `volume.toml` + Agent Volumes semantics as the canonical source model, use CycloneDX as the normative BOM exchange format, and provide SPDX as a secondary export

## Decision Outcome

Chosen option: "A+", because it preserves Agent Volumes' native semantic model without introducing a second standalone BOM standard, while still anchoring external interoperability in an existing market standard.

Under this approach:

- `volume.toml` and the Agent Volumes specification remain the **source of truth** for Agent Volumes packages and semantics.
- **CycloneDX** is the **normative BOM exchange format** for interoperability with registries, security tooling, and operational supply chain workflows.
- **SPDX** is a **secondary export / reference compatibility target**, especially for graph-oriented exchange, archival, and compliance-oriented use cases.
- Agent-specific concepts that do not map cleanly to CycloneDX or SPDX are modeled in Agent Volumes first, then exported through controlled mappings and extensions rather than by inventing a second public BOM envelope.

### Consequences

- Good, because external consumers can rely on a recognized BOM standard instead of learning a new Agent Volumes BOM document format
- Good, because the existing Agent Volumes package model remains canonical for agent-specific semantics
- Good, because CycloneDX's ecosystem is well-suited for operational security workflows and artifact exchange
- Good, because SPDX remains available where richer graph exchange or archival compatibility is desirable
- Neutral, because Agent Volumes still needs a normative mapping/profile document to define how its concepts are exported
- Bad, because some agent-specific semantics may require extensions or controlled lossiness when exported
- Bad, because the project must maintain mapping rules across at least two external standards families

### Confirmation

- Produce a field-by-field mapping matrix from `volume.toml` / Agent Volumes semantics to CycloneDX and SPDX
- Identify which concepts map natively, which require extensions, and which are intentionally lossy in export
- Verify that a conforming implementation can emit a CycloneDX BOM for every valid Agent Volumes package without inventing a second canonical BOM schema

## Pros and Cons of the Options

### A

- Good, because it minimizes design and adoption risk by standardizing directly on an existing BOM format
- Good, because operational security tooling can consume the output immediately
- Bad, because Agent Volumes-specific semantics risk being scattered across custom properties and weak conventions
- Bad, because it makes the external BOM format, rather than the Agent Volumes domain model, the practical center of gravity

### B

- Good, because it maximizes neutrality across the two most relevant BOM ecosystems under discussion
- Good, because it gives downstream consumers freedom to adopt the standard family that best matches their regulatory or operational environment
- Bad, because it substantially increases conformance burden by requiring two first-class normative mappings from the start
- Bad, because it forces early decisions about conflict resolution, round-tripping, and lossiness across two external standards families
- Bad, because it raises implementation cost before Agent Volumes has validated which export path real adopters need most urgently

### C

- Good, because it reduces immediate draft complexity and allows the project to standardize discovery and attachment behavior first
- Good, because it defers potentially contentious format choices until more implementation evidence is available
- Bad, because it leaves too much room for divergent trust and interoperability behavior between early implementations
- Bad, because it weakens the value of a BOM strategy decision by postponing the core exchange-format commitment
- Bad, because early adopters would likely invent incompatible conventions that the project would later need to unwind

### D

- Good, because it can represent agent-native semantics cleanly and explicitly
- Good, because it avoids forcing agent concepts into software- or model-centric shapes prematurely
- Bad, because it creates a new public schema that external consumers must learn in addition to CycloneDX and SPDX
- Bad, because it increases governance, versioning, exporter, and validation burden substantially
- Bad, because external consumers would likely still treat the exported CycloneDX/SPDX documents as the real interoperability surface

### A+

- Good, because it preserves Agent Volumes as the canonical semantic source while using an established external exchange format
- Good, because it avoids introducing a second standalone BOM document schema
- Good, because it supports both operational tooling integration and secondary standards compatibility
- Neutral, because it still requires disciplined mapping design and extension governance
- Bad, because it does not eliminate the need to define how agent-specific semantics are represented outside Agent Volumes
