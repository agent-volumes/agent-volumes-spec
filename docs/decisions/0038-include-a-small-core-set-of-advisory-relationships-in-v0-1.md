---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Include a small core set of advisory relationships in v0.1

## Context and Problem Statement

The Agent Volumes advisory model now includes concrete identity, severity, lifecycle timing, and withdrawal-state semantics. However, real advisory lifecycles also involve relationships between advisories, such as supersession, related disclosures, or duplicate/merged records.

That creates a schema question: **should the v0.1 advisory model standardize advisory-to-advisory relationships, and if so, how much of that relationship vocabulary belongs in the core?**

Without at least some relationship semantics, advisory evolution may remain harder to represent clearly even after lifecycle-state improvements.

## Decision Drivers

- Represent advisory evolution and linkage more clearly than lifecycle timestamps alone allow
- Keep the v0.1 advisory schema practical rather than excessively large
- Support client interpretation of superseded, related, or merged disclosures
- Improve interoperability of advisory chains and correlation workflows

## Considered Options

- A — Include a small core set of advisory relationships
- B — Include only supersession in the core
- C — Defer advisory relationships to later profiles or RFCs

## Decision Outcome

Chosen option: **A — Include a small core set of advisory relationships**, because the advisory model is now concrete enough that a small relationship vocabulary adds significant clarity without making the schema too heavy.

Under this decision, the v0.1 advisory schema should support a small core set of advisory-to-advisory relationships, including at least:

- `supersedes`
- `related`
- an optional duplicate-style relation such as `duplicate-of` or equivalent

This relationship set is intended to support advisory evolution and correlation while remaining significantly lighter than a broad graph model.

### Consequences

- Good, because advisory evolution can be represented more clearly than with timestamps and withdrawal state alone
- Good, because clients gain a portable way to understand supersession and related disclosure chains
- Good, because external correlation and future advisory workflows gain a stronger baseline
- Neutral, because later profiles may still choose to add richer relationship vocabularies
- Bad, because the advisory schema becomes somewhat more structured and relational than a minimal flat model

### Confirmation

- Verify that advisory payloads can represent supersession and relatedness consistently across bibliothecas
- Verify that clients can distinguish a withdrawn advisory from one that is superseded or otherwise related to another disclosure
- Verify that the small relationship set is sufficient for baseline v0.1 advisory evolution use cases

## Pros and Cons of the Options

### A — Include a small core set of advisory relationships

- Good, because it gives the advisory model a practical baseline for evolution and linkage
- Good, because it supports common supersession and relatedness cases without overbuilding the schema
- Good, because it improves client interpretation of advisory chains and disclosure context
- Neutral, because some more specialized relationship types may still be deferred to future work
- Bad, because it makes the core advisory model more structured than a purely flat record format

### B — Include only supersession in the core

- Good, because it captures the most obviously important advisory-to-advisory lifecycle relation
- Good, because it is lighter than a broader relationship set
- Neutral, because some ecosystems may consider supersession the only essential baseline relationship
- Bad, because related or duplicate disclosures remain underspecified
- Bad, because advisory correlation still stays weaker than the increasingly concrete lifecycle model now supports

### C — Defer advisory relationships to later profiles or RFCs

- Good, because it keeps the first advisory schema simpler
- Good, because later work could refine relationships with more implementation evidence
- Neutral, because some ecosystems do start with flatter advisory records before adding graph-like linkage
- Bad, because the advisory lifecycle model remains less expressive than it now could be
- Bad, because clients would still lack a portable way to interpret common advisory evolution patterns in v0.1
