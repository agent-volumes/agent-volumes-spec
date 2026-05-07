---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Define a canonical dedicated endpoint family for trust discovery in v0.1

## Context and Problem Statement

The current draft allows the trust metadata discovery surface to be exposed as a dedicated endpoint, a subordinate release resource, or another closely related HTTP representation.

That flexibility was acceptable when trust discovery was still mostly semantic. However, the v0.1 decisions have now made trust discovery substantially more concrete: the API contract is explicit, append-only lifecycle semantics are defined, revision-style metadata is required, and revocation state is represented as metadata rather than deletion.

This creates an API-topology question: **should the core spec now define a canonical trust-discovery endpoint family, or continue leaving endpoint topology mostly open?**

## Decision Drivers

- Make trust discovery easier for independent clients to implement predictably
- Give the concrete trust API contract a stable and discoverable endpoint shape
- Support summary/detail, revision-state, and lifecycle semantics without topology ambiguity
- Reduce interoperability friction in the conformance surface

## Considered Options

- A — Define a canonical dedicated trust-discovery endpoint family
- B — Require trust discovery only as a subordinate release resource
- C — Keep endpoint-family topology open while fixing only the payload contract

## Decision Outcome

Chosen option: **A — Define a canonical dedicated trust-discovery endpoint family**, because the trust API has now become specific enough that leaving topology too open would create avoidable client complexity and interoperability ambiguity.

Under this decision:

- the v0.1 core spec should define a canonical trust-discovery endpoint family
- that endpoint family should be the primary standardized location for trust summary/detail, revision-style metadata, and lifecycle status semantics
- the specification may still allow links or references from release resources, but the canonical trust-discovery topology itself is no longer left open-ended

### Consequences

- Good, because independent clients gain one predictable place to discover trust state
- Good, because summary/detail/revision/lifecycle semantics can be organized more clearly in the API surface
- Good, because conformance fixtures and examples become easier to define consistently
- Neutral, because release resources may still reference or link to the canonical trust-discovery surface
- Bad, because bibliothecas lose some freedom to invent their own trust-endpoint topology in the baseline contract

### Confirmation

- Verify that the canonical endpoint family is sufficient to carry trust summary, detail, revision, and lifecycle semantics coherently
- Verify that independent clients can discover trust information without topology-specific custom logic
- Verify that release resources can still remain meaningfully linked to trust discovery without becoming the canonical trust-discovery topology themselves

## Pros and Cons of the Options

### A — Define a canonical dedicated trust-discovery endpoint family

- Good, because it gives the concrete trust API one predictable discovery surface
- Good, because it reduces client-side topology guessing and special-case logic
- Good, because it fits the stronger conformance direction of the current draft
- Neutral, because release resources may still expose navigational linkage to the canonical trust surface
- Bad, because it is less flexible for bibliothecas that would prefer a different API layout

### B — Require trust discovery only as a subordinate release resource

- Good, because the relationship between releases and trust metadata remains visually direct
- Good, because it may feel conceptually compact for simple registries
- Neutral, because some ecosystems do prefer resource nesting around a primary release object
- Bad, because it gives less room for the growing independent complexity of the trust-discovery surface
- Bad, because it may scale less cleanly for revision and lifecycle-oriented trust APIs

### C — Keep endpoint-family topology open while fixing only the payload contract

- Good, because bibliothecas would retain more layout freedom
- Good, because the core spec would avoid one more API-structure commitment
- Neutral, because some implementations could still converge informally on similar topologies anyway
- Bad, because clients would still need extra logic to locate equivalent trust surfaces across registries
- Bad, because it cuts against the broader direction of making the trust layer concretely interoperable in v0.1
