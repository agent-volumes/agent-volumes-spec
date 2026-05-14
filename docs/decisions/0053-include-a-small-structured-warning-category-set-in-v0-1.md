---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Include a small structured warning category set in v0.1

## Context and Problem Statement

ADR-0052 establishes that warning-level conditions such as unknown manifest structure must be surfaced explicitly rather than remaining hidden internal diagnostics.

That creates a follow-up question for warning semantics: **should warnings remain only free-text messages, or should the baseline model also standardize a small structured category vocabulary for common warning classes?**

Without structured warning categories, tooling and UIs can still display messages, but more portable handling and conformance around warnings remains weaker.

## Decision Drivers

- Make warnings easier for tooling, CI, and UIs to handle consistently
- Preserve a lightweight but structured warning model in the baseline
- Support conformance fixtures and machine-readable diagnostic handling better than free text alone
- Avoid overbuilding a large diagnostic taxonomy in v0.1

## Considered Options

- A — Include a small structured warning category set
- B — Use free-text warnings only
- C — Defer warning taxonomy to later work

## Decision Outcome

Chosen option: **A — Include a small structured warning category set**, because it strengthens warning interoperability and tooling value without requiring a heavy diagnostic framework.

Under this decision:

- the v0.1 warning model should define a small baseline category vocabulary for common warning classes
- warnings may still include human-readable explanatory text, but warning categories should not rely on text alone
- the category set is intended to support more portable handling of conditions such as unknown structure, deprecation, or forward-compatibility issues

### Consequences

- Good, because tooling and UIs gain a more portable way to interpret warnings
- Good, because conformance fixtures can express warning expectations more clearly
- Good, because free-text diagnostic wording no longer carries all warning semantics by itself
- Neutral, because the exact category vocabulary still needs to be kept intentionally small and disciplined
- Bad, because the warning model becomes more structured than a pure text-only approach

### Confirmation

- Verify that common warning cases can be represented with the structured category set consistently across implementations
- Verify that tooling and conformance fixtures can rely on categories rather than fragile text matching alone
- Verify that the warning taxonomy remains small enough to stay practical in v0.1

## Pros and Cons of the Options

### A — Include a small structured warning category set

- Good, because it improves warning interoperability for tools and UIs
- Good, because it supports more robust conformance and automated handling than free text alone
- Good, because it stays lighter than a full diagnostic taxonomy
- Neutral, because implementations may still differ somewhat in explanatory message wording
- Bad, because it introduces more schema structure than a purely message-based model

### B — Use free-text warnings only

- Good, because it keeps the warning model very simple
- Good, because implementations can emit human-friendly messages without taxonomy coordination
- Neutral, because some lightweight tools may not need structured warning handling
- Bad, because clients and conformance tooling would need fragile text interpretation
- Bad, because warning semantics would remain less portable than the rest of the increasingly structured baseline

### C — Defer warning taxonomy to later work

- Good, because it reduces immediate diagnostic-schema scope
- Good, because later versions could design warning categories with more implementation experience
- Neutral, because some ecosystems do postpone structured diagnostics until later maturity
- Bad, because the warning model stays weaker than it now could be
- Bad, because implementations would still lack a shared portable way to classify warning conditions in v0.1
