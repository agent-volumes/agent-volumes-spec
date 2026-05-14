---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Require bibliotheca-local advisory IDs while preferring external identifiers in v0.1

## Context and Problem Statement

ADR-0034 establishes that external ecosystem identifiers such as CVE, GHSA, or OSV IDs should be preferred when available for advisory identity in v0.1.

That leaves an operational schema question unresolved: **should every advisory still carry a bibliotheca-local identifier, or should local identifiers become optional or hidden once an external identifier exists?**

This affects internal registry workflow, disclosure lifecycle tracking, and how well the public advisory schema remains connected to the registry's own management model.

## Decision Drivers

- Preserve reliable registry-local lifecycle tracking for advisories
- Allow external identifiers to serve as the preferred cross-ecosystem identity without removing local traceability
- Support advisories that originate before any external identifier exists
- Keep the public advisory schema operationally usable for both registry management and cross-ecosystem correlation

## Considered Options

- A — Require a local bibliotheca advisory ID while preferring external identifiers when available
- B — Make local bibliotheca IDs optional
- C — Expose only external identifiers in the public advisory schema

## Decision Outcome

Chosen option: **A — Require a local bibliotheca advisory ID while preferring external identifiers when available**, because it best supports both registry-local operations and cross-ecosystem interoperability.

Under this decision:

- every advisory in the v0.1 schema carries a bibliotheca-local identifier
- when external ecosystem identifiers are available, they are preferred for broader public and interoperability-facing identity purposes
- the local bibliotheca ID remains part of the normative advisory schema for traceability and lifecycle management

### Consequences

- Good, because registries retain a stable local reference for disclosure and workflow management
- Good, because advisories can exist cleanly even before an external ecosystem identifier is assigned
- Good, because the schema supports both local traceability and broader ecosystem correlation
- Neutral, because clients may choose to emphasize external IDs in user-facing displays while still preserving local references
- Bad, because advisory identity remains a little more complex than a single-identifier model

### Confirmation

- Verify that advisories can be tracked consistently through local registry workflows even when external identifiers are absent or late
- Verify that the schema can expose both local and preferred external identifiers without ambiguity
- Verify that clients can preserve local traceability while still preferring external identifiers for broader ecosystem correlation

## Pros and Cons of the Options

### A — Require a local bibliotheca advisory ID while preferring external identifiers when available

- Good, because it preserves registry-local traceability and workflow stability
- Good, because it works well for both early local disclosures and later external identifier assignment
- Good, because it aligns operational registry needs with broader interoperability goals
- Neutral, because user-facing clients may still choose to foreground external IDs over local IDs
- Bad, because the advisory identity model is slightly more complex than a single-ID design

### B — Make local bibliotheca IDs optional

- Good, because the public schema could be somewhat simpler when external identifiers already exist
- Good, because some registries may prefer to rely mostly on external ecosystem IDs
- Neutral, because optionality may seem attractive in ecosystems with strong external-ID coverage
- Bad, because registry-local lifecycle traceability becomes weaker or less uniform
- Bad, because advisories without immediate external IDs become harder to model consistently

### C — Expose only external identifiers in the public advisory schema

- Good, because the public-facing identity model appears cleaner and more externally aligned
- Good, because clients would not need to interpret both local and external IDs in the public contract
- Neutral, because some downstream consumers may primarily care only about external IDs anyway
- Bad, because the schema loses an explicit connection to registry-local workflow identity
- Bad, because advisories lacking external identifiers would fit poorly in the baseline model
