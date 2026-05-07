---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Colocate extension-to-core bridge metadata with the affected artifact in v0.1+

## Context and Problem Statement

ADR-0076 establishes that extension-to-core bridge periods should be signaled through structured metadata and warnings. That leaves a placement question unresolved: **where should that structured bridge metadata live so that tooling and humans can find it naturally?**

If bridge metadata is too detached from the affected artifact, its practical usefulness drops even if it exists in theory.

## Decision Drivers

- Make bridge metadata easy for tooling to discover in the relevant operational context
- Keep migration signaling close to the thing actually affected by the bridge
- Avoid forcing clients to consult an unrelated central registry of migration rules for ordinary artifact handling
- Preserve practical implementation-readiness for migration-aware tooling

## Considered Options

- A — Colocate bridge metadata with the affected artifact or document
- B — Use a central migration document
- C — Leave placement open without a stronger baseline rule

## Decision Outcome

Chosen option: **A — Colocate bridge metadata with the affected artifact or document**, because migration signaling is most useful when it is directly discoverable where the affected artifact is already being processed.

Under this decision:

- bridge metadata should live as close as practical to the affected manifest, capability document, schema surface, or other impacted artifact
- clients and tooling should not have to depend primarily on a detached central migration registry just to understand a local bridge state
- the colocated model is preferred because it maximizes contextual discoverability

### Consequences

- Good, because tooling can discover bridge state directly where it is relevant
- Good, because users and implementers are less likely to miss migration signals
- Good, because the bridge model becomes easier to apply in practice than a detached central-only design
- Neutral, because some supplementary centralized documentation may still exist for overview or governance purposes
- Bad, because multiple artifacts may each need their own bridge metadata rather than relying on one single centralized location

### Confirmation

- Verify that migration-aware tooling can discover bridge state directly from the affected artifact or its adjacent metadata
- Verify that colocated signaling reduces the need for unrelated out-of-band lookups during normal processing
- Verify that the placement model remains practical across the different artifact families that may participate in extension-to-core promotion

## Pros and Cons of the Options

### A — Colocate bridge metadata with the affected artifact or document

- Good, because it maximizes local discoverability and practical tooling usability
- Good, because it keeps migration information close to the thing being interpreted or validated
- Good, because it makes the bridge-period rule easier to operationalize in normal workflows
- Neutral, because centralized overview documents may still exist as supplementary material
- Bad, because migration metadata may become distributed across multiple artifacts rather than centralized in one place

### B — Use a central migration document

- Good, because it provides one obvious place to look for migration policy overviews
- Good, because governance teams may find centralized migration tracking easier conceptually
- Neutral, because some ecosystems do prefer central migration registries for large-scale transition management
- Bad, because local tooling loses the convenience of directly contextual migration discovery
- Bad, because bridge signaling becomes easier to miss during ordinary artifact processing

### C — Leave placement open without a stronger baseline rule

- Good, because it gives implementations maximum design flexibility
- Good, because later work could still settle on a stronger pattern based on experience
- Neutral, because some ecosystems may successfully evolve with mixed placement conventions for a while
- Bad, because tooling discoverability becomes weaker and more inconsistent
- Bad, because the bridge-signaling rule loses much of its practical force without a clear placement expectation
