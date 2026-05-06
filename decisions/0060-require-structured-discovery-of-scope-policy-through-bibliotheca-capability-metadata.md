---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Require structured discovery of scope policy through bibliotheca capability metadata in v0.1

## Context and Problem Statement

ADR-0059 establishes that scope governance remains bibliotheca-local even though scope syntax and baseline identifier discipline remain part of the core specification.

That leaves a discoverability question unresolved: **if scope/scopeless policy remains local to each bibliotheca, should clients still be able to discover that policy through structured capability metadata rather than relying only on prose documentation?**

Without structured discovery, the dual scoped/scopeless model is harder for clients to use automatically and predictably.

## Decision Drivers

- Make local scope-policy differences discoverable to clients in a machine-readable way
- Improve the usability of the scoped/scopeless model in real implementations
- Reduce dependence on prose-only documentation for operational client behavior
- Keep governance policy local while still making policy shape more transparent

## Considered Options

- A — Require structured discovery of scope policy through capability metadata
- B — Leave scope/scopeless policy discoverability to documentation only
- C — Defer structured scope-policy discovery to later work

## Decision Outcome

Chosen option: **A — Require structured discovery of scope policy through capability metadata**, because it best reconciles local governance flexibility with implementation-ready client usability.

Under this decision:

- bibliothecas should expose machine-readable capability metadata describing relevant scope/scopeless policy characteristics
- this metadata should make it easier for clients to determine, for example, whether scopeless identifiers are supported, whether scopes are required, and whether any curated scopeless policy model exists
- the policy itself remains local to the bibliotheca even though its high-level shape is discoverable structurally

### Consequences

- Good, because clients can adapt to local scope-policy differences more reliably
- Good, because the scoped/scopeless model becomes much more practical in real implementations
- Good, because governance policy can remain local without becoming opaque
- Neutral, because the exact capability-metadata schema still needs to be integrated into the broader registry capability model
- Bad, because bibliothecas must expose and maintain more structured registry metadata than a documentation-only model requires

### Confirmation

- Verify that clients can determine the major scope/scopeless policy characteristics of a bibliotheca from machine-readable metadata
- Verify that structured policy discovery improves client behavior without forcing cross-registry governance uniformity
- Verify that prose documentation remains complementary rather than being the only discoverability path

## Pros and Cons of the Options

### A — Require structured discovery of scope policy through capability metadata

- Good, because it improves client automation and UX directly
- Good, because it fits the implementation-ready posture of the specification better than prose-only discovery
- Good, because it preserves local governance while reducing opacity
- Neutral, because some bibliothecas may still document richer nuance outside the capability metadata itself
- Bad, because it increases the amount of structured metadata registries must provide

### B — Leave scope/scopeless policy discoverability to documentation only

- Good, because it keeps the registry surface simpler
- Good, because bibliothecas can explain policy in rich prose without schema design work
- Neutral, because some small ecosystems may be satisfied with documentation-driven discovery for a while
- Bad, because clients cannot discover policy reliably in an automated way
- Bad, because the scoped/scopeless dual model becomes less practical for implementation-ready workflows

### C — Defer structured scope-policy discovery to later work

- Good, because it reduces immediate registry-capability specification burden
- Good, because later versions could refine the model with more implementation evidence
- Neutral, because some ecosystems do postpone machine-readable policy discovery until later maturity
- Bad, because an important usability gap remains in the scoped/scopeless model
- Bad, because client behavior would still depend too much on prose and out-of-band guidance in v0.1
