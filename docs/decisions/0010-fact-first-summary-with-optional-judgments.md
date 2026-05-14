---
status: accepted
date: 12026-05-05
decision-makers: Yunseo Kim
---

# Use fact-first summary semantics with optional derived judgments

## Context and Problem Statement

ADR-0009 established that bibliothecas expose a dual-view trust metadata API:

- a summary view for ordinary clients and user interfaces
- a raw locator/detail view for advanced clients and independent verification workflows

That still leaves an important semantic question unresolved: **what kind of information should the summary view be allowed to express normatively?**

Two extremes are problematic:

- If the summary view contains only registry-local trust judgments such as `verified`, `trustedPublisher`, or `policyCompliant`, then the bibliotheca risks becoming an opaque trust oracle whose outputs are hard to compare across implementations.
- If the summary view excludes any derived assessments entirely, then ordinary clients may lose much of the usability benefit that motivated the summary view in the first place.

Because Agent Volumes is designed to support heterogeneous backends and a git-backed/community-first ecosystem, it is especially important that canonical semantics remain portable across bibliothecas and do not collapse into registry-specific trust interpretations.

The standard therefore needs to decide whether the normative core of the summary view should be:

- fact-only
- judgment-rich
- or a hybrid with a clear distinction between canonical facts and optional derived assessments

## Decision Drivers

- Preserve cross-bibliotheca interoperability for the summary view
- Keep canonical semantics aligned with the underlying trust binding layer rather than registry-local trust policy
- Retain a usable, ergonomic surface for ordinary clients and user interfaces
- Avoid forcing all clients to understand raw trust artifact details
- Allow bibliothecas to provide value-added trust judgments without turning them into normative truth
- Maintain consistency with ADR-0008 and ADR-0009

## Considered Options

- A — Fact-only summary: the summary view exposes only observable trust facts
- B — Judgment-rich summary: the summary view normatively includes registry-derived verification and policy conclusions
- C — Fact-first summary with optional derived judgments
- D — Policy-profiled summary semantics: summary meaning changes by profile or policy mode

## Decision Outcome

Chosen option: "C", because it preserves a stable and portable normative core for the summary view while still allowing bibliothecas to expose helpful derived judgments as clearly non-canonical information.

Under this approach:

- The **normative core** of the summary view is **fact-first**.
- Required summary semantics should be limited to observable trust facts such as the presence of trust artifacts, available artifact/predicate types, subject linkage, and similar canonical metadata.
- Bibliothecas MAY expose additional **derived judgments** such as verification status, trust labels, or policy outcomes.
- Those derived judgments are **not canonical truth**; they are bibliotheca-produced assessments derived from facts, local trust roots, local policy, or local verification configuration.
- The specification should clearly separate required fact fields from optional judgment fields.

### Consequences

- Good, because the summary view remains portable across bibliothecas even when trust roots and policy interpretations differ
- Good, because ordinary clients can rely on a stable, low-complexity fact surface
- Good, because bibliothecas can still provide useful higher-level trust judgments to users and lightweight clients
- Good, because raw locator/detail views remain available for independent verification and audit workflows
- Neutral, because the specification must be explicit about which fields are canonical facts and which are derived assessments
- Bad, because some clients may misinterpret optional judgment fields as normative truth unless the standard is very clear
- Bad, because bibliothecas may diverge in judgment behavior even when they agree on canonical facts

### Confirmation

- Verify that two conforming bibliothecas can present the same canonical trust facts even if their optional judgment outputs differ
- Verify that an ordinary client can consume required summary facts without understanding registry-local policy semantics
- Verify that advanced clients can ignore derived judgments and still reconstruct independent trust conclusions from the raw locator/detail view
- Verify that optional judgment fields can be omitted entirely without breaking interoperability

## Pros and Cons of the Options

### A

- Good, because it is maximally portable and registry-neutral
- Good, because it minimizes ambiguity about canonical truth
- Bad, because it may leave the summary view too bare for common user-facing and lightweight-client use cases
- Bad, because it gives bibliothecas no standard room for useful trust assessments

### B

- Good, because it gives users and simple clients highly convenient trust answers
- Good, because it can make the registry experience feel more security-aware and informative
- Bad, because registry-local judgments are difficult to standardize cleanly across implementations
- Bad, because it risks making bibliotheca-specific trust interpretation look like canonical truth

### C

- Good, because it preserves a stable canonical fact layer while still permitting helpful registry-derived judgments
- Good, because it balances interoperability, usability, and extensibility
- Good, because it aligns naturally with the dual-view model established in ADR-0009
- Neutral, because the specification must carefully define the boundary between facts and judgments
- Bad, because clients and implementers must understand that some summary fields are canonical while others are not

### D

- Good, because it could eventually support richer policy-sensitive summary semantics for enterprise or strict profiles
- Good, because it may fit future profile-based conformance work
- Bad, because it introduces complexity too early
- Bad, because it makes the semantics of the summary view depend on profiles before the baseline model is sufficiently stable
