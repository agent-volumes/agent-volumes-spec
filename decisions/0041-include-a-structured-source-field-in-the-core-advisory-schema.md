---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Include a structured source field in the core advisory schema in v0.1

## Context and Problem Statement

The Agent Volumes advisory model now prefers external ecosystem identifiers when available, retains required bibliotheca-local IDs, and supports richer lifecycle and relationship semantics.

That creates a schema clarity question: **should the advisory model also carry a structured source/ecosystem field, or should clients infer source identity from IDs and aliases alone?**

If source/ecosystem identity is left implicit, clients may need to rely on prefix heuristics or registry-specific conventions when interpreting advisory identifiers and generating links or source-aware behavior.

## Decision Drivers

- Make advisory identity interpretation more explicit and portable
- Reduce client-side dependence on ad hoc ID-pattern inference
- Support source-aware display, linking, and policy behavior
- Keep the richer advisory identity model internally coherent

## Considered Options

- A — Include a structured source/ecosystem field in the core schema
- B — Infer source/ecosystem from IDs only
- C — Defer the source/ecosystem field to later work

## Decision Outcome

Chosen option: **A — Include a structured source/ecosystem field in the core schema**, because it makes the advisory identity model more explicit and easier for clients to interpret reliably.

Under this decision:

- the advisory schema includes a structured field that identifies advisory source or ecosystem context
- this field complements, rather than replaces, local IDs, preferred external IDs, and aliases
- clients are not expected to depend solely on identifier-shape heuristics to understand advisory origin

### Consequences

- Good, because source-aware client behavior becomes easier and more reliable
- Good, because advisory identity interpretation is less dependent on prefix parsing or heuristics
- Good, because the external-ID-preferred model gains a clearer structured complement
- Neutral, because the exact controlled vocabulary for source/ecosystem values still needs to be integrated into the concrete schema work
- Bad, because the advisory schema grows by one more explicit identity-related field

### Confirmation

- Verify that advisory payloads can identify source/ecosystem context explicitly without relying only on identifier patterns
- Verify that clients can link, display, and reason about advisories more consistently with the structured source field present
- Verify that the source field integrates cleanly with the local-ID, preferred-external-ID, and alias model

## Pros and Cons of the Options

### A — Include a structured source/ecosystem field in the core schema

- Good, because it improves advisory identity clarity and portability
- Good, because it supports source-aware linking and UI behavior better than heuristics alone
- Good, because it complements the richer advisory identity model already chosen for v0.1
- Neutral, because the exact value vocabulary may still need careful schema integration
- Bad, because it slightly increases advisory schema complexity

### B — Infer source/ecosystem from IDs only

- Good, because it keeps the schema somewhat smaller
- Good, because some identifiers already imply their source informally through naming patterns
- Neutral, because some clients might be willing to implement source inference heuristics anyway
- Bad, because heuristic inference is less portable and more error-prone
- Bad, because different registries or clients may interpret the same identifiers inconsistently

### C — Defer the source/ecosystem field to later work

- Good, because it reduces immediate schema surface area
- Good, because later work could revisit the field design with more ecosystem evidence
- Neutral, because some ecosystems may survive for a while with implicit source handling
- Bad, because the current advisory identity model would stay less explicit than it now can be
- Bad, because clients would continue to rely too much on inference rather than structured identity metadata
