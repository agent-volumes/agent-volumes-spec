---
status: accepted
date: 12026-05-07
decision-makers: Yunseo Kim
---

# Keep advisory write semantics bibliotheca-local in v0.1

## Context and Problem Statement

Agent Volumes v0.1 already includes a package-facing advisory discovery model with concrete schema work, severity vocabulary, lifecycle fields, relationships, and event-based affected-version semantics. That makes advisory **read/discovery** behavior part of the interoperability surface.

The remaining question is whether v0.1 should also standardize **advisory write behavior** such as create, update, and withdrawal workflows across bibliothecas, or whether write behavior should remain local policy while read/discovery stays portable.

## Decision Drivers

- Preserve a stable interoperable advisory discovery surface in v0.1
- Avoid expanding the first interoperable draft into a governance-heavy advisory authoring standard
- Keep registry-local moderation, authority, and workflow decisions out of the core baseline where possible
- Prevent incomplete write-path standardization from being mistaken for a mature interoperable contract

## Considered Options

- Standardize create/update/withdraw advisory write operations in v0.1
- Standardize only advisory creation and leave the rest local
- Keep advisory write semantics bibliotheca-local and standardize read/discovery only

## Decision Outcome

Chosen option: **Keep advisory write semantics bibliotheca-local and standardize read/discovery only**, because it preserves the most important cross-implementation advisory interoperability surface without overloading v0.1 with governance-sensitive authoring behavior.

Under this decision:

- advisory read/discovery behavior remains part of the v0.1 core interoperability contract
- advisory write operations such as create, update, withdrawal, moderation, and related policy workflows are bibliotheca-local in v0.1
- the specification MAY mention advisory write authorization or local policy context informatively, but write-path interoperability is not claimed by the v0.1 core
- the machine-readable API contract for v0.1 therefore needs to cover advisory read/discovery endpoints, not a mandatory portable write surface

## Consequences

- Good, because v0.1 retains a useful interoperable advisory surface without prematurely standardizing registry governance workflows
- Good, because bibliothecas remain free to implement different advisory-authoring authority and moderation models
- Good, because the spec can tighten advisory schema and read/discovery semantics without taking on too much operational scope
- Neutral, because future work may still define a richer advisory authoring profile if there is clear demand
- Bad, because write-path tooling interoperability remains limited across bibliothecas in v0.1
- Bad, because some readers may initially expect advisory APIs to imply fully portable authoring workflows as well as discovery

## Confirmation

- Verify that the prose and OpenAPI artifacts clearly distinguish advisory read/discovery from local write behavior
- Verify that v0.1 conformance claims do not imply portable create/update/withdraw workflows
- Verify that the advisory schema and read APIs remain fully usable without standardizing authoring workflows

## Pros and Cons of the Options

### Standardize create/update/withdraw advisory write operations in v0.1

- Good, because it would maximize cross-bibliotheca tooling interoperability
- Good, because clients and automation could rely on one portable write path
- Neutral, because some ecosystems eventually may want this level of standardization
- Bad, because it introduces governance-heavy operational scope too early
- Bad, because different bibliotheca authority models are not yet mature enough to freeze cleanly in v0.1

### Standardize only advisory creation and leave the rest local

- Good, because it provides some portable authoring surface without fully standardizing lifecycle workflows
- Good, because it may fit some simpler early implementations
- Neutral, because it could serve as a partial bridge if broader standardization is deferred
- Bad, because it creates an awkward half-standardized write model
- Bad, because creation without standardized update/withdraw semantics still leaves major interoperability gaps

### Keep advisory write semantics bibliotheca-local and standardize read/discovery only

- Good, because it keeps the first interoperable advisory baseline focused and realistic
- Good, because it avoids prematurely freezing governance-sensitive workflows
- Good, because it aligns with the stronger immediate need for install-time and audit-time advisory consumption interoperability
- Neutral, because later profiles or versions may still revisit portable write semantics if operational demand becomes clear
- Bad, because advisory-authoring tooling will remain more registry-specific in the short term
