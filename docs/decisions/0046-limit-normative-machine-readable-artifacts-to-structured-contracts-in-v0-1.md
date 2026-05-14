---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Limit normative machine-readable artifacts to structured contracts in v0.1

## Context and Problem Statement

ADR-0043 establishes that Agent Volumes v0.1 should publish normative machine-readable schema artifacts alongside the prose specification, and ADR-0045 establishes that those artifacts should align in lockstep with prose releases.

That creates a scope-boundary question: **which parts of the specification should actually receive machine-readable normative companions, and which should remain prose-first?**

If the machine-readable scope is too narrow, important structured contracts remain harder to validate automatically. If it is too broad, the spec may overfit prose-heavy or policy-oriented areas into unnatural schema forms.

## Decision Drivers

- Focus machine-readable artifacts on parts of the spec that are naturally structural and validation-oriented
- Avoid forcing prose-heavy or interpretive material into weak pseudo-schemas
- Support conformance tooling where schema artifacts provide clear practical value
- Keep the machine-readable scope broad enough to matter but bounded enough to remain maintainable

## Considered Options

- A — Limit normative machine-readable artifacts to structured contracts
- B — Use a broader machine-readable scope across much more of the spec
- C — Use a minimal machine-readable scope centered mainly on the manifest and API payloads

## Decision Outcome

Chosen option: **A — Limit normative machine-readable artifacts to structured contracts**, because it captures the areas where machine-readable form is most valuable without distorting the parts of the standard that remain fundamentally prose-driven.

Under this decision, normative machine-readable companions in v0.1 should focus on structured contracts such as:

- manifest structure
- trust/advisory API payloads
- conformance-fixture shapes

Conversely, prose-heavy or inherently interpretive areas such as the threat model remain prose-first rather than being forced into primary machine-readable representation.

### Consequences

- Good, because validation and tooling effort is focused on the most naturally machine-readable parts of the spec
- Good, because prose-heavy governance and threat-model sections are not awkwardly over-schematized
- Good, because the schema-artifact scope remains strong enough to support meaningful automation
- Neutral, because some additional structured areas could still be reconsidered later if they prove valuable to formalize further
- Bad, because some edge areas that are partly structured and partly interpretive may still require judgment about where to draw the line

### Confirmation

- Verify that all high-value structured contracts identified in the v0.1 core have corresponding machine-readable artifacts
- Verify that prose-heavy sections remain prose-first rather than being represented by weak or misleading schema approximations
- Verify that the chosen machine-readable scope remains coherent and maintainable across releases

## Pros and Cons of the Options

### A — Limit normative machine-readable artifacts to structured contracts

- Good, because it balances automation value and maintainability well
- Good, because it fits naturally with manifest/API/conformance-shape use cases
- Good, because it avoids distorting prose-heavy material into unnatural machine-readable forms
- Neutral, because future revisions may still decide to expand the structured-contract set somewhat
- Bad, because some borderline areas may still need careful editorial judgment

### B — Use a broader machine-readable scope across much more of the spec

- Good, because it could maximize automation and tooling potential in theory
- Good, because some additional structured or semi-structured areas might benefit from stronger formalization
- Neutral, because a later mature ecosystem may eventually want broader formal machine-readable coverage
- Bad, because it risks forcing prose-heavy concepts into weak machine-readable approximations
- Bad, because it expands scope and maintenance burden more aggressively than needed for v0.1

### C — Use a minimal machine-readable scope centered mainly on the manifest and API payloads

- Good, because it keeps the machine-readable publication burden smaller
- Good, because the most obvious structured contracts still get formal artifacts
- Neutral, because some ecosystems may prefer to start with only the most obvious structured surfaces
- Bad, because it undercuts the stronger conformance-fixture direction already chosen in v0.1
- Bad, because it leaves some valuable structured validation surfaces outside the normative schema scope unnecessarily
