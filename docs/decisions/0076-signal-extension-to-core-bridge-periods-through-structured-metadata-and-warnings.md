---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Signal extension-to-core bridge periods through structured metadata and warnings in v0.1+

## Context and Problem Statement

ADR-0075 establishes that when an extension field is promoted into the core model, the migration path must include a compatibility bridge period rather than an abrupt cut-over.

That leaves an operational discoverability question unresolved: **how should implementers and tooling learn that such a bridge period is active?**

If bridge periods are communicated only through prose or release notes, the compatibility guarantee exists in principle but is harder for tools and users to discover reliably.

## Decision Drivers

- Make bridge periods discoverable to both humans and tooling
- Increase the practical enforceability and visibility of the compatibility-bridge rule
- Support migration-aware validation, warning, and upgrade flows
- Avoid relying solely on prose for an operational compatibility mechanism

## Considered Options

- A — Signal bridge periods through structured metadata and warnings
- B — Use prose/documentation only
- C — Defer bridge signaling to later governance work

## Decision Outcome

Chosen option: **A — Signal bridge periods through structured metadata and warnings**, because the bridge-period rule is much more valuable when clients and tooling can discover it directly rather than only through documentation.

Under this decision:

- active extension-to-core bridge periods should be represented through machine-readable migration metadata and/or warning signals
- prose documentation remains useful, but it is not the only intended discoverability mechanism
- the signaling model should help both tooling and human operators understand that both forms remain temporarily valid during a managed migration period

### Consequences

- Good, because bridge periods become operationally visible rather than merely documented
- Good, because tooling can participate in migration guidance more effectively
- Good, because the compatibility-bridge rule gains stronger practical value
- Neutral, because the exact field design for bridge signaling still needs to be integrated into the relevant schemas or metadata surfaces
- Bad, because migration governance gains some extra structured metadata complexity

### Confirmation

- Verify that active bridge periods can be detected by tooling without relying only on prose documentation
- Verify that users receive warning or migration signals when interacting with forms that are in bridge transition
- Verify that the structured signaling model supports, rather than undermines, the compatibility-bridge guarantee

## Pros and Cons of the Options

### A — Signal bridge periods through structured metadata and warnings

- Good, because it makes bridge-period compatibility operationally discoverable
- Good, because it supports migration-aware tooling and user messaging
- Good, because it raises the practical value of the compatibility-bridge rule significantly
- Neutral, because the exact metadata field placement still requires concrete design work in later drafting
- Bad, because it introduces more structured migration-governance machinery into the model

### B — Use prose/documentation only

- Good, because it keeps the migration-governance model simpler on the wire
- Good, because documentation and ADRs can explain bridge nuance richly
- Neutral, because some small ecosystems may tolerate prose-driven migration guidance for a while
- Bad, because tooling cannot discover bridge periods reliably enough
- Bad, because the compatibility-bridge rule becomes less operationally effective in practice

### C — Defer bridge signaling to later governance work

- Good, because it reduces immediate migration-governance design effort
- Good, because later versions could design signaling with more experience
- Neutral, because some ecosystems do postpone machine-readable migration signaling until later maturity
- Bad, because the newly adopted bridge-period rule remains weaker and harder to use operationally
- Bad, because migration-aware tooling and automation lose a key discoverability mechanism in the meantime
