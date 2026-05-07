---
status: accepted
date: 12026-05-05
decision-makers: Yunseo Kim
---

# Use a dual-view trust metadata API with summary and raw locator views

## Context and Problem Statement

ADR-0008 established a dual-layer trust discovery model for Agent Volumes:

- canonical trust semantics live at the attachment/binding layer
- bibliothecas expose a package-facing discovery API derived from that canonical binding

That still leaves one important API design question unresolved: **how much of the underlying trust metadata should a bibliotheca expose directly to clients?**

Possible extremes are both unsatisfactory:

- A purely summary-oriented API is easy for clients to consume, but it risks making the bibliotheca an opaque trust oracle.
- A purely raw-locator-oriented API is transparent and tool-friendly, but it places too much burden on ordinary clients and weakens the value of a package-oriented registry interface.

This is especially important because Agent Volumes is expected to prioritize git-backed/community volumes, where backend/storage diversity is real and where the bibliotheca's projection layer needs to smooth over implementation differences without altering trust semantics.

The standard therefore needs to decide whether the discovery API should expose:

- only summary trust status
- only raw trust artifact locators
- or both

## Decision Drivers

- Keep ordinary client workflows simple and package-oriented
- Avoid turning the bibliotheca into an opaque trust oracle with no inspectable evidence path
- Support advanced clients, auditors, and security tooling that need direct access to raw trust artifact locations and binding details
- Preserve compatibility with ADR-0008's dual-layer model
- Work well for git-backed/community-first delivery while remaining compatible with richer backend attachment models
- Provide a stable base for later work on verification policy, offline verification, scanner integration, and advisory linkage

## Considered Options

- A — Status-only API: expose summary trust results without raw trust artifact locators
- B — Locator-only API: expose raw trust artifact locators and binding details without a package-friendly summary view
- C — Dual-view API: expose both a summary view and a raw locator/detail view
- D — Progressive disclosure: start with summary-only behavior and defer raw locator/detail standardization to a later phase

## Decision Outcome

Chosen option: "C", because it preserves the usability of a package-oriented bibliotheca API while still exposing enough underlying evidence for independent verification, advanced tooling, and future policy-driven workflows.

Under this approach:

- A bibliotheca's trust discovery API provides a **summary view** suitable for ordinary clients and user interfaces.
- The same API surface, or a closely related subordinate surface, also provides a **raw locator/detail view** for advanced clients and tooling.
- The summary view is derived from the canonical trust binding layer defined by ADR-0008.
- The raw locator/detail view exposes sufficient binding and artifact-location information to allow independent inspection, retrieval, and verification.
- The specification should distinguish clearly between convenience summaries and evidence-bearing trust metadata.

### Consequences

- Good, because common clients can consume simple package-facing trust information without having to understand every backend/storage nuance
- Good, because security tooling and advanced clients can still retrieve raw evidence and binding details for independent verification
- Good, because the standard keeps registry projection useful without making it a black box
- Good, because this fits naturally with git-backed/community-first design while still supporting richer attachment ecosystems
- Good, because later strict-mode, audit, export, and offline verification workflows have a clean place to attach
- Neutral, because the specification must define where the summary view ends and the detail view begins
- Bad, because bibliothecas must implement and maintain two related but distinct trust-metadata representations
- Bad, because poor specification wording could let implementations drift into inconsistent summary semantics

### Confirmation

- Verify that a conforming client can obtain high-level trust status without needing raw artifact traversal
- Verify that a conforming advanced client can discover raw trust artifact locators and binding details for independent validation
- Verify that the summary view remains traceable to canonical trust metadata rather than registry-local reinterpretation
- Verify that both views can be supported consistently for git-backed and OCI-backed releases

## Pros and Cons of the Options

### A

- Good, because it is easy for ordinary clients and user interfaces to consume
- Good, because it hides backend/storage diversity effectively
- Bad, because it makes independent verification and external tooling harder
- Bad, because it risks making registry trust judgments too opaque

### B

- Good, because it is maximally transparent and tool-friendly
- Good, because it preserves direct access to underlying evidence
- Bad, because it makes the package-facing API too raw and difficult for ordinary clients
- Bad, because it weakens the ergonomic value of the bibliotheca projection layer

### C

- Good, because it combines a usable default client experience with an inspectable evidence path
- Good, because it supports both lightweight consumers and high-assurance workflows
- Good, because it aligns well with the broader hybrid trust-discovery direction established in ADR-0008
- Neutral, because it requires explicit specification of summary versus detail responsibilities
- Bad, because bibliothecas must support two complementary trust-data views

### D

- Good, because it simplifies early implementation and keeps the draft smaller in the short term
- Good, because it lets the ecosystem gather experience before standardizing more detail
- Bad, because it postpones an important interoperability decision and risks divergent ad hoc detail APIs
- Bad, because future expansion may be more disruptive if raw locator/detail semantics are not designed early
