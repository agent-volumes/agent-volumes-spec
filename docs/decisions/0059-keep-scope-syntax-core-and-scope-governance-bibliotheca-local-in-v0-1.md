---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Keep scope syntax in the core and scope governance bibliotheca-local in v0.1

## Context and Problem Statement

ADR-0058 establishes that the identifier character-policy model should remain as symmetrical as practical across scopes, volume names, and component names. Even so, scopes are still more governance-laden than other identifier kinds because they are tied directly to namespace allocation, ownership, and registry policy.

That creates a boundary question: **how much of scope governance should be standardized in the v0.1 core spec, beyond syntax and basic uniqueness rules?**

If the spec standardizes too much governance behavior too early, the first interoperable baseline may become weighed down by policy and operational assumptions that are better handled locally.

## Decision Drivers

- Preserve a clear and portable scope syntax and identifier discipline
- Avoid over-expanding the core spec into detailed namespace-governance policy
- Leave operational namespace management flexibility to bibliothecas
- Keep the boundary between identifier syntax and registry governance clearer

## Considered Options

- A — Keep scope syntax in the core and scope governance bibliotheca-local
- B — Standardize a broader scope-governance baseline in the core spec
- C — Keep the scope model more loosely standardized overall

## Decision Outcome

Chosen option: **A — Keep scope syntax in the core and scope governance bibliotheca-local**, because it preserves identifier consistency without overloading v0.1 with registry-governance policy.

Under this decision:

- the core spec standardizes scope syntax and basic uniqueness expectations
- governance matters such as reservation, transfer, dispute handling, or related namespace policy remain bibliotheca-local
- the v0.1 core does not attempt to define a broad portable scope-governance framework beyond the identifier-level baseline

### Consequences

- Good, because scope syntax and identifier portability remain clear
- Good, because bibliothecas retain operational freedom over namespace governance
- Good, because the core spec stays more focused on interoperability than on registry policy administration
- Neutral, because cross-registry governance differences will still remain in operational practice
- Bad, because users may still encounter different namespace-management policies across bibliothecas

### Confirmation

- Verify that scope syntax and uniqueness rules remain clear and portable across implementations
- Verify that the core spec does not accidentally imply stronger portable scope-governance policy than intended
- Verify that bibliothecas can manage reservation, transfer, and dispute policy locally without conflicting with the identifier baseline

## Pros and Cons of the Options

### A — Keep scope syntax in the core and scope governance bibliotheca-local

- Good, because it draws a clean line between identifier structure and registry governance policy
- Good, because it keeps the v0.1 core from becoming overly governance-heavy
- Good, because it preserves portability where the spec is strongest while leaving operational flexibility locally
- Neutral, because different bibliothecas may still implement noticeably different namespace-governance rules
- Bad, because users do not get a strongly standardized cross-registry scope-governance experience

### B — Standardize a broader scope-governance baseline in the core spec

- Good, because it could increase predictability across registries for namespace operations
- Good, because some users may appreciate more portable governance expectations
- Neutral, because a mature multi-registry ecosystem might eventually want stronger governance harmonization
- Bad, because it would expand v0.1 into policy-heavy territory too early
- Bad, because registry operational differences are likely too significant to normalize cleanly in the initial baseline

### C — Keep the scope model more loosely standardized overall

- Good, because it gives registries maximum flexibility in namespace design
- Good, because it avoids locking in syntax assumptions too tightly if the ecosystem is still fluid
- Neutral, because some experimental ecosystems do keep namespace models deliberately loose in early drafts
- Bad, because it weakens identifier consistency and predictability
- Bad, because it undermines the stronger identifier-discipline direction the draft has otherwise chosen
