---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Require `published` and `updated` as core advisory lifecycle fields in v0.1

## Context and Problem Statement

The advisory schema in Agent Volumes is becoming more structured, and advisory identity, severity, and lifecycle handling are now being clarified. That creates a schema-timing question: **which temporal lifecycle fields should be part of the v0.1 core advisory contract?**

If the lifecycle model is too small, clients cannot reason well about freshness or advisory evolution. If it is too large, the first interoperable advisory baseline may become unnecessarily heavy.

## Decision Drivers

- Give clients a practical baseline for advisory freshness and update tracking
- Keep the v0.1 advisory schema lightweight enough to implement widely
- Support withdrawal or later lifecycle expansion without overloading the initial core model
- Make advisory payload evolution more intelligible than a `published`-only schema would allow

## Considered Options

- A — Require `published` and `updated`, with optional `withdrawn`-style lifecycle fields
- B — Require only `published` in the core schema
- C — Standardize a broader lifecycle timing set in the v0.1 core

## Decision Outcome

Chosen option: **A — Require `published` and `updated`, with optional `withdrawn`-style lifecycle fields**, because it gives the first advisory baseline enough lifecycle utility without making the schema significantly heavier.

Under this decision:

- `published` is a required core advisory lifecycle field
- `updated` is a required core advisory lifecycle field
- `withdrawn` or equivalent lifecycle metadata may be included optionally when relevant

### Consequences

- Good, because clients can reason about both initial publication and later advisory freshness
- Good, because the baseline schema remains practical and not overly heavy
- Good, because future withdrawal or lifecycle-expansion work still has a natural place to attach
- Neutral, because later profiles may still add richer lifecycle timing if justified
- Bad, because some deeper lifecycle semantics remain outside the initial core model

### Confirmation

- Verify that advisory payloads can represent both publication time and last-update time consistently
- Verify that clients can use the baseline lifecycle fields to reason about freshness without requiring a larger timing model
- Verify that optional withdrawal-style fields can coexist cleanly with the core lifecycle pair

## Pros and Cons of the Options

### A — Require `published` and `updated`, with optional `withdrawn`-style lifecycle fields

- Good, because it provides a practical advisory lifecycle baseline
- Good, because it supports freshness-aware client behavior better than a `published`-only model
- Good, because it stays lighter than a broad lifecycle timing schema
- Neutral, because some ecosystems may later need more lifecycle depth than the baseline provides
- Bad, because it still leaves some lifecycle nuance for future work

### B — Require only `published` in the core schema

- Good, because it minimizes the immediate advisory schema surface
- Good, because it keeps the first baseline very simple
- Neutral, because some simple advisories may not need more than an initial publication timestamp
- Bad, because clients cannot reason well about advisory freshness or later changes
- Bad, because the model is too weak for a more concrete interoperable advisory contract

### C — Standardize a broader lifecycle timing set in the v0.1 core

- Good, because it would give clients richer advisory lifecycle information from the start
- Good, because more detailed workflows might be easier to support later without schema expansion
- Neutral, because a more mature future advisory ecosystem may eventually want these richer fields
- Bad, because it makes the first advisory baseline heavier than necessary
- Bad, because it risks overcommitting to timing semantics before enough implementation evidence exists
