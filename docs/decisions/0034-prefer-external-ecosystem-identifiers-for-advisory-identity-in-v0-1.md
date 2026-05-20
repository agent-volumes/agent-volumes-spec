---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Prefer external ecosystem identifiers for advisory identity in v0.1

## Context and Problem Statement

The Agent Volumes advisory model is becoming increasingly interoperable, but the draft still needs a clear position on advisory identity across ecosystems.

In practice, advisories may be known by local bibliotheca identifiers as well as external identifiers such as CVE, GHSA, or OSV IDs. The specification must decide whether local IDs remain primary, whether aliases are merely supplemental, or whether external ecosystem identifiers should be preferred when available.

## Decision Drivers

- Improve interoperability between Agent Volumes advisories and external vulnerability ecosystems
- Make advisory correlation easier across registries, tooling, and downstream consumers
- Avoid over-centering bibliotheca-local identifiers where better-known external identifiers already exist
- Preserve room for local identifiers where external identifiers do not yet exist

## Considered Options

- A — Local primary ID plus alias list
- B — Primary local ID only
- C — Prefer external ecosystem identifiers when available

## Decision Outcome

Chosen option: **C — Prefer external ecosystem identifiers when available**, because it best supports cross-ecosystem interoperability and reduces the risk that advisory identity becomes too registry-local.

Under this decision:

- the advisory model should prefer external ecosystem identifiers such as CVE, GHSA, or OSV IDs when they exist
- bibliotheca-local identifiers may still exist, but they are not the preferred cross-ecosystem identity when a recognized external identifier is available
- the schema should still be capable of carrying multiple identifiers or references when needed to preserve correlation and provenance of disclosure

### Consequences

- Good, because advisory identity becomes easier to correlate with the broader vulnerability ecosystem
- Good, because downstream tooling and users can rely more naturally on well-known external IDs
- Good, because the Agent Volumes advisory model avoids becoming unnecessarily isolated around bibliotheca-local identity
- Neutral, because some advisories will still originate locally before any external identifier exists
- Bad, because bibliothecas must handle cases where external identifiers are unavailable, late, or change over time relative to local disclosure flow

### Confirmation

- Verify that the advisory schema can represent preferred external identifiers cleanly when available
- Verify that bibliotheca-local identifiers can still be retained without overshadowing the preferred cross-ecosystem identity
- Verify that clients can correlate advisories across Agent Volumes and external ecosystems more easily under the chosen identity model

## Pros and Cons of the Options

### A — Local primary ID plus alias list

- Good, because it preserves a strong local disclosure identity for the bibliotheca
- Good, because it still allows cross-references to external identifiers
- Neutral, because it may feel natural for registries that primarily think in terms of their own advisory records
- Bad, because it keeps the center of gravity too local for a spec pursuing strong interoperability
- Bad, because clients and downstream tooling may still need to treat the local ID as a less useful top-level identifier than external ecosystem IDs

### B — Primary local ID only

- Good, because it is simple and keeps the advisory model tightly registry-centered
- Good, because it avoids needing to reason about multiple identifier systems in the baseline schema
- Neutral, because it may work for a purely self-contained registry ecosystem
- Bad, because it weakens correlation with external vulnerability ecosystems significantly
- Bad, because it is too isolated for the interop goals of the current draft

### C — Prefer external ecosystem identifiers when available

- Good, because it aligns the advisory model with broader vulnerability ecosystem practice
- Good, because it improves cross-tool and cross-registry correlation substantially
- Good, because it reduces the long-term burden of mapping local-only IDs outward
- Neutral, because local identifiers may still be useful as supplementary references or during early disclosure stages
- Bad, because external identifiers may not exist at the earliest point in every advisory workflow
