---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Standardize a core field set for trust-artifact format identity in v0.1

## Context and Problem Statement

ADR-0031 establishes that the trust-discovery API should use a small shared top-level vocabulary for trust artifact categories.

That leaves a closely related follow-up question: **how much of the concrete artifact format identity should also be standardized?**

If only the top-level category is standardized, clients may still receive concrete trust artifacts with too little common structure to compare, filter, or validate them consistently across bibliothecas.

## Decision Drivers

- Make the top-level category vocabulary practically usable in clients and conformance tooling
- Give clients a common way to understand concrete artifact format identity
- Reduce bibliotheca-specific interpretation of format names and specification versions
- Support filtering, validation, and user-facing display of trust artifacts consistently

## Considered Options

- A — Standardize a core field set for concrete trust-artifact identity
- B — Standardize only a `format` field beyond the top-level category
- C — Leave most format/subtype structure implementation-defined

## Decision Outcome

Chosen option: **A — Standardize a core field set for concrete trust-artifact identity**, because the category vocabulary alone is not sufficient to make the trust-discovery API meaningfully interoperable.

Under this decision, the v0.1 trust-discovery API should standardize a common field structure sufficient to express at least:

- top-level artifact category
- concrete artifact format identity
- relevant format or specification version identity
- when useful, media-type or equivalent transport/representation identity

This field set is intended to work together with the shared category vocabulary rather than replace it.

### Consequences

- Good, because clients gain a common way to reason about concrete trust-artifact identity
- Good, because filtering, validation, and display become more portable across bibliothecas
- Good, because conformance fixtures can express more precise artifact expectations
- Neutral, because exact field naming and shape still need to be integrated into the concrete API contract text
- Bad, because the trust-discovery API becomes more structured and slightly heavier than a looser format model

### Confirmation

- Verify that clients can distinguish category, format, and format-version identity consistently across bibliothecas
- Verify that conformance fixtures can specify expected artifact identity without registry-specific conventions
- Verify that the field set is sufficient for the baseline BOM/provenance/signature artifact classes in v0.1

## Pros and Cons of the Options

### A — Standardize a core field set for concrete trust-artifact identity

- Good, because it makes the shared category vocabulary practically useful
- Good, because it improves client filtering and validation behavior substantially
- Good, because it supports a stronger wire-level interoperability contract for trust discovery
- Neutral, because some highly specific artifact families may still need additional fields beyond the shared core
- Bad, because it requires more explicit API structure in the baseline spec

### B — Standardize only a `format` field beyond the top-level category

- Good, because it gives clients some extra artifact identity information with less structural overhead
- Good, because it may feel lighter-weight than a fuller field set
- Neutral, because some simple workflows may only need category plus format
- Bad, because version/media-type interpretation may still drift too much across implementations
- Bad, because clients would still have a weaker basis for comparison and validation than the strengthened trust model now expects

### C — Leave most format/subtype structure implementation-defined

- Good, because bibliothecas retain maximum flexibility in describing trust artifacts
- Good, because the spec avoids one more layer of API structure
- Neutral, because some ecosystems might still converge informally on common patterns
- Bad, because clients would need too much registry-specific logic for concrete artifact identity
- Bad, because it undermines the stronger interoperability direction already chosen for trust discovery in v0.1
