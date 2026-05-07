---
status: accepted
date: 12026-05-07
decision-makers: Yunseo Kim
---

# Use `.tar.gz` as the canonical packaged release transport format in v0.1

## Context and Problem Statement

ADR-0004 establishes that Agent Volumes supports a hybrid delivery model: curated bibliothecas may serve hosted release archives, while community bibliothecas may index Git-backed releases. ADR-0013 further establishes that the canonical trust subject is the normalized file tree rather than transport bytes.

That still leaves a practical interoperability question unresolved: **when a bibliotheca uses an uploaded or downloadable packaged archive as the transport container for a hosted release, should v0.1 standardize one canonical archive format, or should archive shape remain implementation-defined?**

Without one canonical packaged transport format, independent publishers, clients, and bibliothecas may all choose different upload/download conventions even though they nominally implement the same hosted-release workflow.

## Decision Drivers

- Close the publish/fetch wire contract for hosted archive workflows
- Preserve the normalized-file-tree digest as the canonical trust subject rather than archive bytes
- Keep CDN-hosted release transport predictable for authors, clients, and bibliothecas
- Avoid making every hosted implementation invent its own archive conventions
- Preserve the separate Git-backed path established by the hybrid delivery model

## Considered Options

- Keep archive transport format implementation-defined
- Standardize one canonical packaged archive format for hosted releases
- Eliminate archive transport entirely and require only Git-backed source delivery

## Decision Outcome

Chosen option: **Standardize one canonical packaged archive format for hosted releases**, specifically **gzip-compressed tar archives (`.tar.gz`)**, because it closes the hosted publish/fetch contract while remaining compatible with the already-chosen transport-independent trust subject.

Under this decision:

- `.tar.gz` is the canonical packaged release transport format for hosted archive upload/download workflows in v0.1
- this choice applies to packaged transport containers, not to the canonical trust subject itself
- the normalized file tree remains the canonical release subject for `integrity`, provenance, signatures, and trust metadata
- Git-backed delivery remains allowed under the hybrid delivery model and is not replaced by this decision
- implementations MAY support additional non-baseline archive import/export behavior locally, but such behavior is outside the v0.1 interoperability contract

## Consequences

- Good, because hosted bibliotheca workflows now have a concrete upload/download transport convention
- Good, because clients and publisher tooling gain a clear baseline instead of inferring archive shape from examples
- Good, because the decision remains compatible with ADR-0013: archive bytes are transport, not the canonical trust subject
- Neutral, because Git-backed flows still require separate transport handling as already intended by the hybrid model
- Bad, because `.tar.gz` is more natural in Unix-like ecosystems than in some Windows-first tooling environments
- Bad, because some implementations may prefer other archive formats locally and will now need adapters to claim baseline conformance

## Confirmation

- Verify that the publish/fetch sections and OpenAPI contract consistently describe `.tar.gz` for hosted archive transport
- Verify that `integrity` calculation and trust binding remain defined over the normalized file tree rather than archive bytes
- Verify that Git-backed community-hosted releases remain valid without requiring archive repackaging

## Pros and Cons of the Options

### Keep archive transport format implementation-defined

- Good, because it maximizes implementation freedom
- Good, because different ecosystems could use different familiar archive formats locally
- Neutral, because some tightly coordinated implementations might still converge without a formal rule
- Bad, because the hosted publish/fetch contract remains too weak for independent interoperability
- Bad, because clients and publisher tooling would still need project-private agreements about upload/download containers

### Standardize one canonical packaged archive format for hosted releases

- Good, because it closes a major wire-level ambiguity for hosted bibliothecas
- Good, because examples, validation, and tooling guidance can converge on one baseline
- Good, because it still leaves the normalized-file-tree trust subject intact
- Neutral, because non-baseline local support for other archive formats can still exist
- Bad, because the chosen format inevitably privileges one packaging convention over others

### Eliminate archive transport entirely and require only Git-backed source delivery

- Good, because it would reduce archive-level wire-contract work
- Good, because the normalized-file-tree subject aligns naturally with source-oriented delivery
- Neutral, because some ecosystems may prefer Git-first workflows in any case
- Bad, because it conflicts with ADR-0004's curated hosted-archive model
- Bad, because it removes a valuable immutability and distribution path for curated bibliothecas
