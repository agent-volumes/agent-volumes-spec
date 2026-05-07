---
status: accepted
date: 12026-05-07
decision-makers: Yunseo Kim
supersedes: 0003-six-component-types
---

# Expand the component taxonomy from six to seven types by adding `lsp-server`

## Context and Problem Statement

ADR-0003 defined six component types: Agent, Skill, Command, Tool, Hook, and MCP Server.

That taxonomy resolved an important earlier gap by adding Tool while preserving Command. However, subsequent interoperability work has made another gap more visible: Language Server Protocol integrations are now common enough in agent tooling ecosystems that treating them as an unnamed side case is no longer ideal.

The specification therefore needs to decide whether LSP server configuration should remain implicit, be treated as ordinary tooling metadata, or become a first-class component type.

## Decision Drivers

- Cover a common integration surface already used in agent tooling ecosystems
- Keep the type system concrete enough for runtime loading and packaging decisions
- Avoid forcing LSP integrations into semantically awkward component categories
- Preserve portability by giving clients and registries a stable identifier for LSP-oriented packages
- Keep the taxonomy explicit even when it grows modestly

## Considered Options

- Keep six component types and leave LSP support implicit or implementation-defined
- Model LSP configuration as a subtype or convention under `tool`
- Expand the taxonomy to seven component types by adding `lsp-server`

## Decision Outcome

Chosen option: **Expand the taxonomy to seven component types by adding `lsp-server`**, because LSP integrations are semantically distinct enough to deserve first-class treatment and common enough to justify that addition in the baseline.

Under this decision:

- `lsp-server` becomes a normative component type alongside `agent`, `skill`, `command`, `tool`, `hook`, and `mcp-server`
- Agent Volumes may define dedicated examples and conventions such as `.lsp.json` for this component type
- runtime and registry tooling can search, classify, and validate LSP-oriented packages directly rather than inferring them from a looser category
- ADR-0003 remains historically important but is superseded by the expanded taxonomy decision

### Consequences

- Good, because the specification now covers another important real-world integration surface directly
- Good, because LSP packaging no longer needs to be awkwardly modeled as a generic tool or out-of-band convention
- Good, because registry search and manifest validation gain a stable category for LSP integrations
- Neutral, because the taxonomy grows from six to seven types without otherwise changing the overall component model
- Bad, because every place that enumerates component types must be updated in prose, schema, and API artifacts
- Bad, because adding a new type increases the long-term responsibility to keep its semantics precise and non-overlapping

### Confirmation

- Verify that all component-type enumerations across prose, schema, and API artifacts include `lsp-server`
- Verify that representative LSP examples can be expressed cleanly without overloading other component types
- Verify that registry search and validation surfaces can distinguish `lsp-server` from `tool` and `mcp-server` consistently

## Pros and Cons of the Options

### Keep six component types and leave LSP support implicit or implementation-defined

- Good, because it avoids taxonomy growth
- Good, because existing six-type wording could remain untouched
- Neutral, because some implementations might still support LSP through local conventions
- Bad, because an important integration surface would remain under-specified
- Bad, because portability and discoverability would depend too heavily on local interpretation

### Model LSP configuration as a subtype or convention under `tool`

- Good, because it avoids increasing the headline number of component types
- Good, because LSP-related packages do expose capabilities to runtimes in a broad sense
- Neutral, because some minimal implementations might be satisfied with a looser categorization
- Bad, because the semantics of an LSP server are meaningfully different from an ordinary callable tool
- Bad, because search, validation, and package intent would remain less precise than necessary

### Expand the taxonomy to seven component types by adding `lsp-server`

- Good, because it gives LSP integrations a precise semantic home
- Good, because it improves manifest clarity, searchability, and future compatibility work
- Good, because it aligns with the specification's existing preference for concrete component semantics
- Neutral, because the taxonomy still remains small and manageable
- Bad, because it supersedes ADR-0003 and requires coordinated updates across the draft

## More Information

This decision does not require every runtime to implement LSP integration. It only makes `lsp-server` a first-class portable packaging concept so that runtimes, registries, and migration tooling can reason about it explicitly.
