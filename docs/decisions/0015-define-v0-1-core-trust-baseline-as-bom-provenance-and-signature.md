---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Define the v0.1 core trust baseline as BOM, provenance, and signature interoperability; defer scanner-finding interchange

## Context and Problem Statement

The draft already positions trust metadata broadly to include BOMs, provenance attestations, signatures, scanner findings, and related release metadata. However, not all of those areas are equally mature or equally necessary for a stable v0.1 interoperability baseline.

The standard needs to decide what belongs in the **core interoperable trust baseline** for v0.1.

## Decision Drivers

- Align v0.1 with the most mature and already-usable interoperability targets
- Avoid overloading the first implementable baseline with unstable or source-dependent finding exchange semantics
- Preserve a clear path for later scanner integration work without weakening the core trust story
- Keep BOM/provenance/signature interoperability as the center of gravity for release trust

## Considered Options

- A — BOM + provenance + signature core; scanner-finding interchange deferred
- B — BOM + provenance + signature + scanner findings all in the v0.1 core
- C — BOM-only core

## Decision Outcome

Chosen option: **A — BOM + provenance + signature core; scanner-finding interchange deferred**, because it captures the mature trust interoperability surface needed now without forcing premature standardization of scanner-result interchange.

Under this decision, the v0.1 core trust baseline includes:

- CycloneDX as the normative BOM exchange format
- SPDX as a secondary export / reference-compatibility target
- SLSA provenance as the baseline provenance model
- Sigstore-family signature / bundle interoperability as the baseline signing and verification stack

Under this decision, **scanner findings are not part of the normative v0.1 interchange contract**. They may remain in the broader conceptual trust-metadata model, but their concrete interchange vocabulary and contract are deferred to a later profile or RFC.

## Consequences

- Good, because the core trust baseline now aligns with mature external interoperability targets
- Good, because v0.1 remains implementable without first solving cross-scanner result normalization
- Good, because later scanner work can build on a stable release-subject and trust-artifact foundation
- Neutral, because the draft must clarify that scanner findings are deferred from the normative interchange layer even if referenced conceptually elsewhere
- Bad, because some readers may expect scanner-finding interchange sooner and will need explicit defer language

## Confirmation

- Verify that a conforming implementation can exchange BOM, provenance, and signature artifacts under the v0.1 baseline without scanner-result normalization
- Verify that scanner-finding references in the draft do not accidentally imply a normative interchange contract
- Verify that future scanner work can attach cleanly to the established trust baseline without revising the release-subject model

## Pros and Cons of the Options

### A — BOM + provenance + signature core; scanner-finding interchange deferred

- Good, because the v0.1 baseline aligns with the most mature external interoperability targets
- Good, because it keeps the first interoperable trust profile implementable
- Good, because later scanner work can build on a stable trust-artifact foundation
- Neutral, because the draft must clarify that scanner findings remain conceptually relevant while interchange is deferred
- Bad, because some users may expect scanner-result exchange sooner than v0.1 provides

### B — BOM + provenance + signature + scanner findings all in the v0.1 core

- Good, because it would provide a more end-to-end security workflow from the start
- Good, because trust metadata would cover both artifact lineage and scan outputs uniformly
- Neutral, because it could reduce future profiling work if the first design is correct
- Bad, because scanner-result schemas and severity vocabularies are less mature and more source-dependent
- Bad, because it would make the v0.1 baseline substantially heavier and riskier

### C — BOM-only core

- Good, because it would simplify the first interoperability target significantly
- Good, because BOM export is the most immediately recognizable artifact class for many consumers
- Neutral, because provenance/signature work could still be added later
- Bad, because it weakens the trust model too much relative to the current draft direction
- Bad, because it conflicts with the already chosen SLSA and Sigstore baseline direction
