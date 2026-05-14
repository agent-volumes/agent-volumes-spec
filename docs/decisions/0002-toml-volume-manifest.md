---
status: accepted
date: 12026-03-13
decision-makers: Yunseo Kim
---

# Use TOML for volume manifest format

## Context and Problem Statement

Volumes need a package-level manifest file declaring metadata, components, dependencies, and compatibility. Which file format should `volume.toml` use? The format must coexist with SKILL.md YAML frontmatter (per Agent Skills specification) at the component level.

## Decision Drivers

- Human readability and writability (manifests are hand-edited)
- Comment support (critical for documenting manifest fields)
- Ecosystem precedent for package manifests
- Tooling maturity in Node.js/Bun and Python
- Consistency with existing component-level YAML frontmatter

## Considered Options

- YAML (`volume.yaml`)
- TOML (`volume.toml`)
- JSON (`volume.json`)

## Decision Outcome

Chosen option: "TOML", because it is the format specifically designed for configuration and package manifests, validated by Cargo (Rust) and pyproject.toml (Python) — the two most modern package ecosystems. TOML's explicit typing, comment support, and clean table syntax make it optimal for package manifests.

### Consequences

- Good, because TOML is purpose-built for configuration — no ambiguity traps (unlike YAML's "Norway problem")
- Good, because Cargo.toml and pyproject.toml provide proven precedent for this exact use case
- Good, because comment support enables inline documentation of manifest fields
- Neutral, because introduces a second format alongside YAML (SKILL.md frontmatter uses YAML)
- Bad, because TOML has slightly less Node.js tooling than YAML or JSON (mitigated by `smol-toml` and similar libraries)

### Confirmation

Validate that the full `volume.toml` schema can be round-tripped (parse, modify, serialize) using `smol-toml` or equivalent in the Bun runtime without data loss.

## Pros and Cons of the Options

### YAML

- Good, because consistent with SKILL.md frontmatter format
- Good, because `yaml` package already in project dependencies
- Good, because supports comments and multi-line strings
- Bad, because indentation-sensitive (error-prone for complex manifests)
- Bad, because YAML 1.2 has notorious edge cases (`NO` → false, `3.10` → float)
- Bad, because overly permissive — multiple ways to express the same structure

### TOML

- Good, because designed for configuration files — no ambiguity
- Good, because Cargo.toml and pyproject.toml validate it for package manifests
- Good, because supports comments
- Good, because explicit about types (strings, integers, booleans, arrays, tables)
- Neutral, because `[[array_of_tables]]` syntax has a learning curve
- Bad, because deeply nested structures can be awkward (mitigated by flat manifest design)

### JSON

- Good, because universal parsing support (built-in everywhere)
- Good, because JSON Schema provides strong validation
- Bad, because no comment support (critical weakness for manifests)
- Bad, because verbose (quotes on all keys, no trailing commas)
- Bad, because npm's package.json proves the pain of comment-less manifests (frequent workarounds)
