---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Include self-describing version fields in the capability metadata document in v0.1

## Context and Problem Statement

ADR-0062 establishes that bibliotheca capability metadata should be published through a dedicated registry-level endpoint. That creates an evolution and parsing question: **should the capability metadata document identify its own schema/version and spec compatibility explicitly, or should that information remain implicit or lighter-weight?**

Without self-description, clients may find it harder to reason about capability-document evolution and compatibility over time.

## Decision Drivers

- Make capability metadata easier for clients to parse and evolve against reliably
- Support version-aware interpretation of the capability document itself
- Keep the dedicated capability endpoint self-describing rather than overly dependent on out-of-band assumptions
- Reduce ambiguity as the capability model grows over time

## Considered Options

- A — Include explicit self-describing version fields
- B — Include only an Agent Volumes spec version reference
- C — Defer explicit self-description to later work

## Decision Outcome

Chosen option: **A — Include explicit self-describing version fields**, because the dedicated capability endpoint should be self-describing enough for clients to evolve against it predictably.

Under this decision:

- the capability metadata document should include a structured field identifying its own schema/version
- the document should also include a structured reference to the relevant Agent Volumes specification compatibility or version context
- clients should not have to rely only on external prose context to determine what capability-document shape they are reading

### Consequences

- Good, because capability-document parsing and evolution become more reliable
- Good, because the dedicated endpoint is more self-describing and machine-friendly
- Good, because future evolution of the capability model gains a clearer compatibility anchor
- Neutral, because the exact field naming and versioning semantics still need to be integrated into the concrete capability schema
- Bad, because the capability document gains a bit more structural metadata overhead

### Confirmation

- Verify that clients can determine both capability-document schema version and relevant Agent Volumes spec compatibility from the document itself
- Verify that the self-description fields improve version-aware parsing and evolution handling
- Verify that the capability document remains simple enough to consume despite the extra metadata

## Pros and Cons of the Options

### A — Include explicit self-describing version fields

- Good, because it gives the capability endpoint a stronger machine-readable evolution story
- Good, because it reduces hidden assumptions in client parsing behavior
- Good, because it aligns well with the decision to expose a dedicated capability document endpoint
- Neutral, because the exact self-description field design still needs concrete schema integration
- Bad, because it adds some additional metadata structure to a relatively small document

### B — Include only an Agent Volumes spec version reference

- Good, because it keeps the document somewhat simpler
- Good, because clients still get at least some broad compatibility context
- Neutral, because some ecosystems may tolerate lighter document self-description for a while
- Bad, because the capability-document schema itself remains less explicitly versioned
- Bad, because client evolution logic may still depend too much on inference from the broader spec version alone

### C — Defer explicit self-description to later work

- Good, because it reduces immediate schema design work
- Good, because later versions could refine the approach with more implementation evidence
- Neutral, because some ecosystems do initially rely more on prose context than self-describing endpoint documents
- Bad, because the dedicated capability endpoint would be less self-describing than it should be
- Bad, because version-aware client parsing would remain weaker than necessary in v0.1
