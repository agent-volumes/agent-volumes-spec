---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Keep the strict component naming policy in v0.1

## Context and Problem Statement

The current Agent Volumes draft uses a fairly strict component naming policy, centered on lowercase ASCII names with alphanumeric and hyphen characters and bounded length.

As the specification grows to include more component-aware advisory and dependency semantics, it becomes worth re-evaluating whether that strict naming model should remain in place or be relaxed for broader ecosystem compatibility.

## Decision Drivers

- Preserve stable and predictable component identifiers
- Keep purl subpath use, tooling, and file-layout expectations simple and consistent
- Avoid unnecessary identifier ambiguity in the first interoperable baseline
- Maintain a clean naming hygiene model across the component ecosystem

## Considered Options

- A — Keep the strict component naming policy
- B — Relax the naming policy slightly
- C — Keep it for now but explicitly mark it for later reconsideration

## Decision Outcome

Chosen option: **A — Keep the strict component naming policy**, because the current identifier constraints provide a cleaner and more interoperable baseline than a more permissive naming model would.

Under this decision:

- component names remain constrained to the current strict baseline rules
- the specification does not broaden the component character set in v0.1
- the stricter naming policy continues to serve as the baseline for purl subpaths, manifest declarations, and related tooling expectations

### Consequences

- Good, because component identifiers remain clean and predictable
- Good, because the naming model stays well aligned with purl subpath use and common tooling expectations
- Good, because ambiguity and normalization burden stay low
- Neutral, because future versions could still revisit the policy if compelling evidence emerges
- Bad, because some ecosystems with more permissive legacy naming conventions may need adaptation or renaming at packaging boundaries

### Confirmation

- Verify that component identifiers remain easy to use consistently across manifests, references, and tooling
- Verify that the strict policy does not create avoidable ambiguity or normalization requirements in the v0.1 ecosystem
- Verify that the component naming rules remain consistent with the broader identifier strategy of the specification

## Pros and Cons of the Options

### A — Keep the strict component naming policy

- Good, because it maximizes identifier hygiene and predictability
- Good, because it fits cleanly with purl subpaths and related structured tooling use
- Good, because it minimizes normalization and escaping concerns in the baseline model
- Neutral, because future versions may still revisit the policy if strong migration pressure emerges
- Bad, because it is less permissive for some existing naming conventions outside the spec

### B — Relax the naming policy slightly

- Good, because it could make adoption easier for some ecosystems with pre-existing naming conventions
- Good, because it might reduce renaming friction for some packaged components
- Neutral, because some future ecosystem may decide the stricter policy is more limiting than beneficial
- Bad, because it weakens the simplicity and cleanliness of the identifier model
- Bad, because it introduces more room for ambiguity, escaping, or normalization concerns

### C — Keep it for now but explicitly mark it for later reconsideration

- Good, because it avoids immediate change while acknowledging potential future pressure
- Good, because it could make later discussion easier if naming pressure grows
- Neutral, because some specifications do intentionally leave identifier-policy questions more visibly provisional
- Bad, because it weakens confidence in a baseline naming policy that is currently serving a clear interoperability purpose
- Bad, because it can introduce unnecessary doubt about the stability of the current identifier strategy
