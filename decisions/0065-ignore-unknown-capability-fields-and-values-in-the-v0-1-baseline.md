---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Ignore unknown capability fields and values in the v0.1 baseline

## Context and Problem Statement

ADR-0061 through ADR-0064 establish a structured but intentionally bounded capability-metadata model for bibliothecas, exposed through a dedicated registry-level endpoint with self-description and minimal cache guidance.

That still leaves one important forward-compatibility question unresolved: **how should baseline clients behave when capability metadata contains fields or values they do not recognize?**

Because capability metadata is expected to evolve over time, this decision directly affects whether the capability surface can grow without breaking older clients.

## Decision Drivers

- Preserve forward compatibility for capability-metadata evolution
- Keep baseline client behavior practical and robust
- Avoid making capability discovery brittle when registries add new capability signals later
- Ensure clients can still rely safely on the core capability fields they understand

## Considered Options

- A — Ignore unknown capability fields and values
- B — Warn on unknown capability fields and values
- C — Fail on unknown capability fields and values

## Decision Outcome

Chosen option: **A — Ignore unknown capability fields and values**, because it best supports forward-compatible capability-metadata evolution while keeping baseline clients usable.

Under this decision:

- baseline clients do not fail solely because a capability document contains unknown fields or values
- clients rely on the core capability fields and values they understand
- unknown capability information is ignored unless a stricter implementation policy chooses otherwise outside the baseline

### Consequences

- Good, because capability metadata can evolve without breaking older baseline clients
- Good, because clients can still act safely on the capabilities they do understand
- Good, because the capability endpoint becomes more forward-compatible and easier to extend
- Neutral, because stricter or more diagnostic-oriented implementations may still choose additional local behavior outside the baseline
- Bad, because clients may miss meaning carried by newer capability extensions until they are upgraded

### Confirmation

- Verify that older baseline clients can continue to consume newer capability documents as long as the core fields they depend on remain intact
- Verify that unknown capability data does not cause avoidable failures in ordinary capability discovery
- Verify that the core capability contract remains sufficient for baseline client behavior even when extensions appear

## Pros and Cons of the Options

### A — Ignore unknown capability fields and values

- Good, because it provides the best forward-compatibility behavior for evolving capability metadata
- Good, because it avoids brittle negotiation failures for older clients
- Good, because it fits the bounded-but-extensible capability model chosen elsewhere in the spec
- Neutral, because stricter implementations can still layer additional warnings or policy locally if desired
- Bad, because some newer capability semantics may be silently unused by older clients

### B — Warn on unknown capability fields and values

- Good, because it gives operators more visibility into capability-model evolution
- Good, because it can help identify when a client may be missing useful newer metadata
- Neutral, because some implementations may still prefer warning-heavy behavior locally
- Bad, because frequent warnings can become noisy in a model designed for forward-compatible extension
- Bad, because it makes the baseline more operationally intrusive than necessary for ordinary capability evolution

### C — Fail on unknown capability fields and values

- Good, because it is the strictest possible interpretation of capability metadata
- Good, because it forces clients to upgrade before consuming newer capability documents fully
- Neutral, because some highly controlled environments may prefer very strict compatibility discipline
- Bad, because it makes capability metadata evolution unnecessarily brittle
- Bad, because it conflicts with the practical extensibility goals of the capability model in v0.1
