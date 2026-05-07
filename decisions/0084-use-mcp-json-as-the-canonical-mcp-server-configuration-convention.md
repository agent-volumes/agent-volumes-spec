---
status: accepted
date: 12026-05-07
decision-makers: Yunseo Kim
---

# Use `.mcp.json` as the canonical MCP server configuration convention

## Context and Problem Statement

Agent Volumes needs a concrete and migration-friendly convention for packaging MCP server configuration.

The draft currently treats MCP server entrypoints generically as JSON or YAML configuration and uses directory-based examples such as `mcp/research-server.json`. That leaves two practical questions unresolved:

- what discovery filename convention should the specification recommend for MCP server configuration?
- should the v0.1 baseline keep allowing both JSON and YAML, or should it align more tightly with the currently dominant ecosystem convention?

The answer needs to preserve runtime neutrality while still reducing migration friction from existing agent tooling ecosystems.

## Decision Drivers

- Reduce migration friction from existing MCP-aware runtimes and tools
- Prefer a mature ecosystem convention over introducing unnecessary new surface area in v0.1
- Keep configuration discovery simple and predictable for authors, clients, and documentation
- Align with the currently strongest interoperability baseline in MCP client practice
- Avoid prematurely standardizing multiple authoring formats when one format is already dominant

## Considered Options

- Keep a generic MCP configuration model with directory-based examples and JSON/YAML parity
- Use `.mcp.json` as the canonical convention and keep JSON+YAML dual-format support
- Use `.mcp.json` as the canonical convention and make JSON the only v0.1 baseline format

## Decision Outcome

Chosen option: **Use `.mcp.json` as the canonical convention and make JSON the only v0.1 baseline format**, because it best matches the strongest current interoperability convention while keeping the v0.1 surface simpler and easier to validate.

Under this decision:

- `.mcp.json` becomes the canonical MCP server configuration discovery filename in Agent Volumes examples and guidance
- JSON becomes the canonical and only baseline configuration format for MCP server declarations in v0.1
- YAML support is intentionally deferred rather than kept as a co-equal baseline format
- implementations MAY experiment with non-baseline import or conversion behavior locally, but such behavior is outside the v0.1 interoperability contract

This decision should be framed as an interoperability choice rather than a vendor-specific dependency. The specification remains runtime-neutral; only the low-level discovery convention is being aligned with strong existing practice.

### Consequences

- Good, because the specification aligns with the currently dominant MCP configuration convention across major clients and examples
- Good, because `.mcp.json` is easy to recognize and supports direct migration from existing tool layouts
- Good, because JSON-only baseline behavior reduces ambiguity in schemas, examples, and validation logic
- Good, because v0.1 avoids paying complexity costs for a second authoring format before clear ecosystem demand exists
- Neutral, because some implementations may still choose to accept YAML locally as a non-baseline convenience
- Bad, because YAML-native tooling communities get less direct authoring ergonomics in the baseline
- Bad, because the chosen filename remains an ecosystem convention rather than a protocol-level MCP mandate

### Confirmation

- Verify that all normative spec examples and guidance use `.mcp.json` consistently
- Verify that the v0.1 schema and prose no longer imply YAML parity for MCP server configuration
- Verify that migration from existing JSON-based MCP configuration in major clients is straightforward without adapter-specific rewriting

## Pros and Cons of the Options

### Keep a generic MCP configuration model with directory-based examples and JSON/YAML parity

- Good, because it preserves maximum immediate format flexibility
- Good, because it avoids choosing one visible ecosystem convention over another
- Neutral, because some implementations may already support multiple formats locally
- Bad, because it leaves discovery conventions weak and migration guidance less concrete
- Bad, because it gives equal baseline weight to formats that do not appear equally mature in current practice

### Use `.mcp.json` as the canonical convention and keep JSON+YAML dual-format support

- Good, because it improves filename-level interoperability while keeping broader authoring flexibility
- Good, because YAML-friendly implementations would not need to diverge from the baseline
- Neutral, because the specification could still describe JSON as the stronger practical convention
- Bad, because the v0.1 baseline would become more complex than necessary
- Bad, because schemas, examples, and validation expectations would still need to carry dual-format ambiguity

### Use `.mcp.json` as the canonical convention and make JSON the only v0.1 baseline format

- Good, because it provides the clearest interoperability target
- Good, because it follows the strongest current ecosystem convention without over-generalizing from weaker secondary patterns
- Good, because it keeps v0.1 implementation and conformance work simpler
- Neutral, because future versions can still revisit broader authoring support if ecosystem conditions change
- Bad, because it intentionally excludes a real but currently less central YAML-based practice from the baseline

## More Information

This decision should be revisited if one or more of the following triggers occur:

- the MCP ecosystem publishes a stronger multi-format baseline or formal host-side configuration convention beyond JSON
- at least two major MCP clients adopt YAML as a first-class configuration format with stable, documented interoperability expectations
- JSON-only baseline behavior creates repeated, material migration friction for important adopters of Agent Volumes

Until those triggers are met, the v0.1 baseline should prefer convergence over optionality.
