---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Require concrete JSON contracts for trust metadata and advisory APIs in v0.1

## Context and Problem Statement

ADR-0008, ADR-0009, ADR-0010, and ADR-0011 establish the architecture and semantics of trust discovery well, but the current draft still describes the trust metadata and advisory APIs mostly at the semantic level.

That leaves a major interoperability gap: two implementations could both claim conformance while exposing incompatible payload shapes.

The standard therefore needs to decide whether v0.1 should fix only semantic requirements, a minimal field set, or a concrete wire contract.

## Decision Drivers

- Independent client and bibliotheca implementations must interoperate without project-private agreements
- Trust discovery needs to be testable at the wire level
- Advisory handling should not remain purely conceptual if it is part of the API surface
- The draft should provide a stable base for conformance tests and example fixtures

## Considered Options

- A — Concrete JSON contract in the core spec
- B — Minimal fields only in the core spec
- C — Semantics only

## Decision Outcome

Chosen option: **A — Concrete JSON contract in the core spec**, because v0.1 is intended to be implementation-ready enough for independent interoperation.

Under this decision, the core spec MUST normatively define at least:

- trust metadata endpoint path shape
- summary view JSON fields
- raw/detail view JSON fields
- subject-binding fields for logical identity and immutable digest
- artifact/predicate type identifiers
- locator or embedded-artifact representation rules
- advisory response schema
- absent-artifact and error behavior

## Consequences

- Good, because the trust and advisory APIs become directly interoperable across implementations
- Good, because conformance suites can validate actual payloads rather than only high-level semantics
- Good, because the trust model becomes meaningfully consumable by clients, auditors, and tooling
- Neutral, because implementation-defined optional fields can still exist outside the required contract
- Bad, because the draft must now carry more concrete API detail and maintain it carefully

## Confirmation

- Produce concrete example payloads for the trust summary view, trust detail view, and advisory API
- Verify that two independent implementations can interoperate using only the normative JSON contract
- Verify that the JSON contract remains faithful to the canonical trust-binding semantics

## Pros and Cons of the Options

### A — Concrete JSON contract in the core spec

- Good, because independent implementations gain a directly interoperable wire contract
- Good, because trust and advisory behavior becomes testable at the payload level
- Good, because the API surface becomes strong enough for real client/tooling integration
- Neutral, because optional implementation-defined fields can still exist outside the required contract
- Bad, because the spec must carry and maintain more concrete API detail

### B — Minimal fields only in the core spec

- Good, because it provides some structure without fully freezing a payload contract
- Good, because the core spec remains lighter than a complete JSON contract
- Neutral, because it could work if the ecosystem were tightly coordinated outside the spec
- Bad, because too much wire-level behavior would still remain open to interpretation
- Bad, because conformance testing would still be weaker than needed for independent interop

### C — Semantics only

- Good, because it keeps the draft short and conceptually focused
- Good, because it delays hard wire-format decisions until later
- Neutral, because it may be acceptable during very early exploratory phases
- Bad, because implementations could claim conformance while remaining incompatible on the wire
- Bad, because it leaves one of the biggest current interoperability gaps unresolved
