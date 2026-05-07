---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use a dedicated registry-level endpoint for bibliotheca capability metadata in v0.1

## Context and Problem Statement

ADR-0061 establishes that the v0.1 core should include a narrow operational capability-metadata model for bibliothecas. That leaves a discoverability-topology question unresolved: **where should clients retrieve this capability metadata?**

If capability metadata is not discoverable through a clear and consistent path, much of its practical value is lost even if the schema itself is well defined.

## Decision Drivers

- Make registry-wide capability metadata easy for clients to discover predictably
- Keep registry-level facts separate from release-level or package-level resources
- Support a clean implementation model for capability metadata without overloading unrelated endpoints
- Align capability discovery with the broader implementation-ready API direction of the spec

## Considered Options

- A — Use a dedicated registry-level capability-metadata endpoint
- B — Embed capability metadata in an existing root or index response
- C — Leave capability discovery to out-of-band mechanisms

## Decision Outcome

Chosen option: **A — Use a dedicated registry-level capability-metadata endpoint**, because it provides the clearest and most reusable discovery surface for registry-wide facts.

Under this decision:

- capability metadata is discoverable through a canonical registry-level endpoint
- that endpoint is the primary structured discovery surface for registry-wide facts such as scope policy, delivery modes, trust-discovery availability, and advisory API availability
- capability metadata does not rely solely on reuse of unrelated root/index responses or documentation-only discovery

### Consequences

- Good, because clients gain one predictable place to fetch registry-wide capability metadata
- Good, because release-independent registry facts remain cleanly separated from package or release resources
- Good, because the capability-discovery surface becomes easier to document, cache, and evolve
- Neutral, because root or index responses may still link to the dedicated endpoint if useful
- Bad, because the API surface gains another dedicated endpoint that bibliothecas must implement and document

### Confirmation

- Verify that clients can discover core capability metadata reliably from the dedicated endpoint alone
- Verify that registry-wide capability facts remain cleanly represented without depending on unrelated endpoint shapes
- Verify that the dedicated endpoint integrates coherently with the rest of the v0.1 API surface

## Pros and Cons of the Options

### A — Use a dedicated registry-level capability-metadata endpoint

- Good, because it gives capability metadata a clear and reusable home in the API
- Good, because it avoids overloading release or index surfaces with unrelated registry-wide concerns
- Good, because it supports implementation-ready client discovery well
- Neutral, because implementations may still choose to cross-link the endpoint from other surfaces
- Bad, because it modestly increases registry API surface area

### B — Embed capability metadata in an existing root or index response

- Good, because it reduces the number of top-level API endpoints
- Good, because some clients might already fetch a root or index response early in their workflow
- Neutral, because some ecosystems do favor heavier bootstrap responses
- Bad, because it overloads the semantic role of the root or index response
- Bad, because capability metadata becomes more tightly coupled to an endpoint serving other purposes

### C — Leave capability discovery to out-of-band mechanisms

- Good, because it avoids immediate API design and implementation work
- Good, because small ecosystems can sometimes survive on documentation-driven discovery for a time
- Neutral, because some registries may still publish capability descriptions informally outside the spec
- Bad, because the structured capability model becomes much less useful in practice
- Bad, because client automation and interoperability suffer when discovery is not standardized in-band
