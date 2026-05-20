---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Limit v0.1 security advisories to volume-level targeting

## Context and Problem Statement

The Agent Volumes draft already supports component-level identity and component-level dependency declarations. That creates a natural question for the advisory model: **should security advisories be able to target individual components, or should they remain package-facing at the volume level in v0.1?**

While component-level targeting would fit the agent-native component model well, it would also make the advisory schema, client experience, and policy handling significantly more complex during the first interoperable draft.

The standard therefore needs to decide the normative advisory-targeting granularity for v0.1.

## Decision Drivers

- Keep the v0.1 advisory model simple and package-ecosystem-friendly
- Preserve compatibility with package-facing advisory workflows and installation-time checks
- Avoid introducing component-aware advisory semantics before enough implementation experience exists
- Leave room for future refinement if component targeting becomes clearly necessary

## Considered Options

- A — Volume-level targeting only
- B — Volume-level targeting with optional component-level targeting
- C — Component-level targeting as a first-class v0.1 capability

## Decision Outcome

Chosen option: **A — Volume-level targeting only**, because it provides the simplest and most stable advisory contract for the first interoperable draft while preserving the option to revisit finer-grained targeting later.

Under this decision:

- v0.1 advisories are always expressed in terms of volume identity and affected version ranges
- component-specific vulnerabilities, when represented in v0.1, are normalized into affected volume versions rather than first-class component targets
- component-level targeting is not part of the normative v0.1 advisory schema or API contract

### Consequences

- Good, because the advisory model stays simple and easy to consume for clients and registries
- Good, because package-facing advisory checks remain aligned with familiar ecosystem patterns
- Good, because the first advisory API and payload contract can stabilize without component-level policy complexity
- Neutral, because some precision is intentionally postponed in exchange for a simpler baseline
- Bad, because advisories cannot precisely point to only one affected component in v0.1

### Confirmation

- Verify that the advisory schema and API can remain volume/version-oriented throughout v0.1
- Verify that installation-time advisory checking can be implemented without component-targeting semantics
- Verify that component-specific vulnerability disclosures can still be represented operationally by affected volume ranges when needed

## Pros and Cons of the Options

### A — Volume-level targeting only

- Good, because the advisory model remains simple and package-facing
- Good, because it aligns naturally with install-time advisory checking and registry integration
- Good, because it keeps v0.1 lighter and easier to stabilize
- Neutral, because some component-specific information may still be described informatively without being part of the normative target model
- Bad, because it sacrifices some targeting precision for component-specific issues

### B — Volume-level targeting with optional component-level targeting

- Good, because it preserves a simple default while allowing more precise cases when needed
- Good, because it matches the component model better than a purely package-facing advisory system
- Neutral, because it could become an attractive future bridge option if the ecosystem needs gradual refinement
- Bad, because it complicates the schema and client UX even before it is proven necessary
- Bad, because optional component targeting would still require new policy and interpretation rules in v0.1

### C — Component-level targeting as a first-class v0.1 capability

- Good, because it offers the highest precision and best matches Agent Volumes' component identity model
- Good, because it could support future fine-grained policy workflows well
- Neutral, because a mature future ecosystem may eventually prefer this design
- Bad, because it is too heavy for the first interoperable advisory baseline
- Bad, because it would increase advisory schema, API, and install-policy complexity substantially

## More Information

This decision should be **revisited** if one or more of the following conditions becomes true:

- multiple real advisories are difficult or misleading to express as affected volume version ranges alone
- client or bibliotheca implementations demonstrate a strong operational need for component-targeted policy decisions
- downstream interoperability work shows that component-level targeting can be added without destabilizing the package-facing advisory baseline

If those triggers occur, a follow-up ADR or RFC should evaluate whether to introduce optional or first-class component-level targeting in a later profile or version.
