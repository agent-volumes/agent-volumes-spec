---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Reserve a small set of spec-owned-looking extension namespace keys in v0.1

## Context and Problem Statement

ADR-0069 and ADR-0070 establish that non-core capability fields live under a reserved extension container and that the container is partitioned by first-level namespace keys. That still leaves a governance-hygiene question unresolved: **even inside the extension container, should some namespace keys that look spec-owned or core-authoritative be disallowed?**

Technically, being inside the extension container already marks data as non-core. However, names such as `agent-volumes`, `core`, or `spec` may still create authority confusion or future governance collisions if used freely by ordinary extensions.

## Decision Drivers

- Prevent extension namespaces from appearing to impersonate core or spec-owned authority
- Preserve future room for official spec-owned extension or profile spaces if needed
- Keep the extension model clear enough for users and implementers to interpret without governance ambiguity
- Maintain extension hygiene beyond mere structural separation

## Considered Options

- A — Reserve a small set of spec-owned-looking extension namespace keys
- B — Treat the extension container boundary as sufficient without extra reserved names
- C — Defer reserved-name policy to later work

## Decision Outcome

Chosen option: **A — Reserve a small set of spec-owned-looking extension namespace keys**, because it helps avoid authority confusion and future governance collisions without imposing a broad or heavy namespace regime.

Under this decision:

- a small set of namespace keys that strongly imply spec-owned or core-authoritative meaning should be reserved and unavailable for ordinary extension use
- the extension container remains the primary boundary between core and non-core data, but reserved names provide an additional governance-hygiene safeguard
- this is a targeted protection mechanism rather than a broad attempt to police all extension naming aggressively

### Consequences

- Good, because extensions are less likely to appear to impersonate the standard or future official spaces
- Good, because future core/profile-owned namespace evolution retains clearer naming room
- Good, because the extension model becomes cleaner from a governance-signaling perspective
- Neutral, because the exact reserved-name list still needs to remain intentionally small and disciplined
- Bad, because some otherwise-usable names become unavailable for ordinary extension authors

### Confirmation

- Verify that the reserved-name policy prevents the most obvious spec-owned-looking namespace collisions
- Verify that extension authors can still use the extension model effectively without a large reserved-name burden
- Verify that the policy improves authority clarity rather than creating unnecessary naming bureaucracy

## Pros and Cons of the Options

### A — Reserve a small set of spec-owned-looking extension namespace keys

- Good, because it protects against authority confusion in the extension space
- Good, because it preserves flexibility for future spec-owned namespace evolution
- Good, because it adds governance hygiene without requiring a heavy namespace system
- Neutral, because some names that seem attractive to extension authors will still need to remain off-limits
- Bad, because it introduces one more naming rule extension authors must learn

### B — Treat the extension container boundary as sufficient without extra reserved names

- Good, because it keeps the extension model simpler and less restrictive
- Good, because the container already provides a structural non-core boundary
- Neutral, because some ecosystems may be comfortable relying entirely on the container boundary to signal non-official status
- Bad, because spec-owned-looking names can still create authority confusion even inside a non-core container
- Bad, because future official namespace evolution may face avoidable naming collisions or migration ambiguity

### C — Defer reserved-name policy to later work

- Good, because it reduces immediate namespace-governance work
- Good, because later revisions could respond based on actual observed confusion rather than anticipation
- Neutral, because some ecosystems do leave this kind of governance hygiene to mature later if needed
- Bad, because preventable namespace-authority confusion remains possible in the meantime
- Bad, because future spec-owned namespace planning would proceed with less protected naming room in v0.1
