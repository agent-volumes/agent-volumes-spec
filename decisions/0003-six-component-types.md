---
status: accepted
date: 12026-03-13
decision-makers: Yunseo Kim
---

# Define six component types

## Context and Problem Statement

The Agent Volumes standard needs a finite set of component types to classify what volumes export. The type system must be precise enough for runtime loading decisions while remaining stable across ecosystem evolution. The original draft proposed 8 types; the current system has 5.

## Decision Drivers

- Each type must have clearly distinct semantics (no overlap)
- Types must cover existing catalog content (110+ skills, plus agents, commands, hooks, MCP)
- Types should be stable — adding types later is easier than removing them
- Runtime loading behavior differs by type (the type must inform how a runtime uses the component)

## Considered Options

- 5 types (current system: skill, agent, command, hook, mcp)
- 6 types (add Tool, keep Command)
- 8 types (draft: add Tool, Workflow, Policy, Prompt Asset; drop Command)

## Decision Outcome

Chosen option: "6 types", because it adds the essential Tool type (function-call semantics invoked by agents) while preserving Command (user-invoked slash commands) and excluding Workflow/Policy/Prompt Asset which lack concrete format standards.

The six types: **Agent, Skill, Command, Tool, Hook, MCP Server**.

### Consequences

- Good, because Tool vs Command distinction maps cleanly to who invokes: agent (Tool) vs user (Command)
- Good, because all 6 types have concrete, implementable entrypoint formats
- Good, because Workflow/Policy/Prompt Asset can be added in future spec versions once formats stabilize
- Neutral, because 6 types is a manageable taxonomy for runtime implementers
- Bad, because Workflow and Policy use cases must be modeled as combinations of existing types until dedicated types exist

### Confirmation

Verify that every item in the existing agent-toolbox catalog can be classified under exactly one of the six types without ambiguity.

## Pros and Cons of the Options

### 5 types (current)

- Good, because proven by existing catalog
- Bad, because no Tool type — function-call components must be modeled as Commands, losing semantic precision
- Bad, because runtimes cannot distinguish user-invoked vs agent-invoked components

### 6 types

- Good, because Tool vs Command distinction is semantically precise
- Good, because all types have concrete format specifications
- Good, because backward-compatible with current 5-type system (Tool is additive)
- Neutral, because Command could theoretically be modeled as a specialized Tool (but the invocation model differs enough to warrant separation)

### 8 types (draft)

- Good, because most comprehensive coverage
- Bad, because Workflow has no standard format (YAML? JSON? DSL?)
- Bad, because Policy overlaps with the permissions system in the manifest
- Bad, because Prompt Asset is underspecified (any .md file is effectively a prompt asset)
- Bad, because adding underspecified types creates implementation ambiguity
