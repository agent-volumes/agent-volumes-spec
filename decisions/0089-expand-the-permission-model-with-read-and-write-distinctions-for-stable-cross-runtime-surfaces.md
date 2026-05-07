---
status: accepted
date: 12026-05-07
decision-makers: Yunseo Kim
---

# Expand the permission model with read and write distinctions for stable cross-runtime surfaces

## Context and Problem Statement

The current Agent Volumes permission model uses a coarse boolean surface: `network`, `filesystem`, `shell`, and `browser`.

That baseline was simple, but follow-up work on portable tool capability classes exposed a limitation: some capabilities map cleanly to stable cross-runtime action distinctions such as **read** versus **write/edit**, while the current boolean model cannot express that difference.

The specification therefore needs to decide whether to keep the coarse boolean model, to move toward a more action-aware permission model for stable surfaces, or to attempt a much more granular tool- or runtime-specific permission taxonomy.

## Decision Drivers

- Improve least-privilege expressiveness without overfitting to runtime-specific tool names
- Align the permission model more closely with portable capability classes such as file read and file write/edit
- Preserve a small, implementation-friendly v0.1 baseline
- Avoid false precision where runtime behavior is too inconsistent for reliable cross-runtime standardization
- Keep the monotonic permission-escalation rule understandable and enforceable

## Considered Options

- Keep the existing boolean permission model
- Split stable surfaces into read/write distinctions while keeping unstable surfaces coarse
- Adopt a more granular tool- or verb-specific permission taxonomy

## Decision Outcome

Chosen option: **Split stable surfaces into read/write distinctions while keeping unstable surfaces coarse**, because it provides the best balance between stronger least-privilege signaling and runtime-neutral portability.

Under this decision:

- `filesystem`, `network`, and `browser` use the shared action vocabulary `deny`, `read`, `write`, `read-write`
- `shell` remains intentionally coarse in v0.1 and uses `deny` or `allow`
- portable capability classes and permission fields remain related but not identical concepts
- implementations should prefer read/write distinctions where the semantics remain stable across runtimes
- finer-grained splits such as `create` vs `modify` vs `delete`, per-tool permissions, or shell submodes are deferred

### Consequences

- Good, because the model can distinguish read-only from mutating access for the most stable cross-runtime surfaces
- Good, because filesystem read versus write/edit now maps more naturally to the portable capability-class layer
- Good, because the permission model remains small enough for validation, policy, and UI work in v0.1
- Neutral, because capability classes still need interpretation guidance rather than strict 1:1 mappings
- Bad, because the model becomes slightly more complex than the old boolean baseline
- Bad, because some readers may expect every permission surface to receive the same level of granularity immediately

### Confirmation

- Verify that spec prose, examples, and schema all use the new permission vocabulary consistently
- Verify that the monotonic permission-escalation rule remains understandable under the expanded vocabulary
- Verify that the capability-class guidance in the spec can refer to read/write distinctions without depending on runtime-specific tool names

## Pros and Cons of the Options

### Keep the existing boolean permission model

- Good, because it preserves the simplest possible baseline
- Good, because validators and clients remain trivial to implement
- Neutral, because some ecosystems may still choose to layer richer policy locally
- Bad, because it cannot distinguish read-only from mutating access on stable surfaces such as the filesystem
- Bad, because it underuses the new portable capability-class framing where stronger distinctions are already possible

### Split stable surfaces into read/write distinctions while keeping unstable surfaces coarse

- Good, because it improves least-privilege precision where the semantics are portable enough to standardize
- Good, because it avoids dragging the model toward per-tool or per-runtime naming
- Good, because it allows `shell` to remain coarse where finer classification is not yet robust enough
- Neutral, because some future revisions may still decide to extend or refine the model further
- Bad, because it introduces mixed shapes across permission fields rather than one uniform structure everywhere

### Adopt a more granular tool- or verb-specific permission taxonomy

- Good, because it could express policy in much finer detail
- Good, because some runtime-specific implementations might find that locally useful
- Neutral, because future versions may revisit selected granular splits once more evidence exists
- Bad, because it risks false precision and portability loss in the v0.1 baseline
- Bad, because it would make policy, validation, and compatibility mapping significantly more complex too early

## More Information

The following areas should be reconsidered in a future revision only if strong cross-runtime evidence emerges:

- filesystem sub-splits such as `create`, `modify`, `delete`, or `execute`
- network sub-splits beyond the shared read/write distinction
- browser sub-splits beyond the shared read/write distinction
- shell submodes such as "read-only shell" versus "mutating shell"
- tool-name-specific permission categories
