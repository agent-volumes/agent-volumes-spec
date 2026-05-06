---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Classify new reserved extension-namespace names as breaking changes in v0.1+

## Context and Problem Statement

ADR-0072 establishes that a small set of spec-owned-looking extension namespace keys should be reserved, and ADR-0073 establishes that this reserved-name set should be present in machine-readable companion artifacts as well as prose.

That creates an evolution-governance question: **if the reserved-name set grows later, how should that change be classified?**

Because reserving a previously permitted namespace can invalidate existing extension usage, the answer matters directly for compatibility promises.

## Decision Drivers

- Protect extension authors and implementers from silent namespace invalidation
- Keep change classification aligned with real compatibility impact
- Preserve trust in the extension-governance model
- Make future reserved-name expansion discipline explicit and conservative

## Considered Options

- A — Classify new reserved names as breaking changes
- B — Allow some reserved-name additions to be non-breaking
- C — Defer reserved-name change classification to later governance work

## Decision Outcome

Chosen option: **A — Classify new reserved names as breaking changes**, because newly reserving a previously valid namespace key can invalidate existing extension usage and therefore has real compatibility impact.

Under this decision:

- adding a new reserved extension-namespace name after the baseline is established is treated as a breaking change
- reserved-name set growth is expected to be conservative and deliberate
- compatibility promises for extension authors are stronger because namespace invalidation is not treated lightly

### Consequences

- Good, because extension namespace stability becomes more trustworthy
- Good, because governance is pushed to be cautious before reserving additional names
- Good, because change classification matches the actual risk of invalidating existing extension data
- Neutral, because future versions can still add reserved names when truly necessary, but only with the appropriate change severity
- Bad, because governance flexibility for expanding the reserved-name set becomes more constrained

### Confirmation

- Verify that compatibility policy and release classification treat newly reserved names as breaking when they would invalidate previously valid extension keys
- Verify that the reserved-name governance process remains conservative and well justified
- Verify that extension authors can rely on stronger namespace stability expectations under the chosen rule

## Pros and Cons of the Options

### A — Classify new reserved names as breaking changes

- Good, because it reflects the real compatibility impact on existing extensions
- Good, because it encourages careful governance and stronger namespace stability
- Good, because it gives extension authors a clearer expectation about future breakage risk
- Neutral, because exceptional cases can still be handled through a future major-version process when necessary
- Bad, because it reduces governance flexibility for expanding the reserved-name set quickly

### B — Allow some reserved-name additions to be non-breaking

- Good, because it gives governance more flexibility to respond to emerging naming needs
- Good, because some additions might in practice affect no known real usage
- Neutral, because a very active governance process might be able to evaluate such cases carefully
- Bad, because it weakens the predictability of the extension compatibility model
- Bad, because judgments about “unused” names can still be wrong or incomplete

### C — Defer reserved-name change classification to later governance work

- Good, because it reduces immediate governance-specification effort
- Good, because later versions could refine the policy with more ecosystem experience
- Neutral, because some specifications do postpone this kind of change-classification detail until later maturity
- Bad, because extension authors lack a clear compatibility expectation in the meantime
- Bad, because a key extension-governance rule remains under-specified even after introducing reserved names formally
