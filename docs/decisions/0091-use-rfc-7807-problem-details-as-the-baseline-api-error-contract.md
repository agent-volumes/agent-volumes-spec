---
status: accepted, updated by ADR-0152
date: 12026-05-07
decision-makers: Yunseo Kim
---

# Use RFC 7807 Problem Details as the baseline API error contract in v0.1

## Context and Problem Statement

ADR-0016 requires Agent Volumes v0.1 to publish concrete JSON contracts for trust metadata and advisory APIs, including absent-artifact and error behavior. The current draft already defines API topology, authentication expectations, and some success payloads, but it does not yet close the machine-readable error contract well enough for interoperable client behavior.

That leaves a practical question unresolved: **should v0.1 define its own small error envelope, rely only on HTTP status codes, or adopt an existing web-standard problem format?**

## Decision Drivers

- Make error handling concrete enough for independent client implementation
- Align with existing HTTP API practice rather than inventing avoidable new surface area
- Keep the OpenAPI artifact and prose semantics mutually reinforcing
- Cover authentication, authorization, missing resources, conflicts, validation failures, and rate limits consistently
- Satisfy ADR-0016's requirement for concrete absent-artifact and error behavior

## Considered Options

- Use RFC 7807 / `application/problem+json` as the baseline error contract
- Define a small Agent Volumes-specific JSON error envelope
- Standardize only HTTP status codes and leave error bodies mostly implementation-defined

## Decision Outcome

Chosen option: **Use RFC 7807 / `application/problem+json` as the baseline error contract**, because it provides the strongest interoperability baseline with the least unnecessary invention.

Under this decision:

- bibliotheca APIs use RFC 7807 Problem Details as the baseline machine-readable error payload format in v0.1
- the OpenAPI contract MUST declare bearer authentication and associate it with the relevant protected operations
- the baseline contract MUST define at least the expected use of error responses for authentication failure, authorization failure, missing resources, conflicts, validation failure, and rate limiting
- implementations MAY include extension fields in problem-detail payloads, but such extensions do not replace the baseline format

## Consequences

- Good, because clients gain a recognizable and well-understood error envelope across the API surface
- Good, because the spec can focus on when each error class occurs rather than inventing a new payload shape
- Good, because OpenAPI and prose can now close the absent-artifact/error-behavior gap identified by ADR-0016
- Neutral, because implementations may still extend problem payloads for local diagnostics
- Bad, because v0.1 must now define more concrete status-code and error-surface expectations than a lighter draft would require
- Bad, because some implementations may prefer simpler custom error bodies locally and will need compatibility adapters to claim baseline conformance

## Confirmation

- Verify that the prose API sections and OpenAPI artifact both declare RFC 7807 as the error payload baseline
- Verify that protected operations declare bearer auth consistently in the OpenAPI contract
- Verify that absent-artifact and common failure behaviors can be expressed without implementation-private JSON envelopes

## Pros and Cons of the Options

### Use RFC 7807 / `application/problem+json` as the baseline error contract

- Good, because it provides a widely recognized interoperability target
- Good, because clients can reuse established parsing and tooling expectations
- Good, because it closes the wire-level contract more strongly than status-only semantics
- Neutral, because local extension fields can still exist where helpful
- Bad, because the spec must spell out more detailed API error expectations than before

### Define a small Agent Volumes-specific JSON error envelope

- Good, because it could be tailored exactly to the needs of the specification
- Good, because it might feel lighter than a more general web standard
- Neutral, because some ecosystems prefer project-local envelopes
- Bad, because it invents a new baseline where a mature standard already exists
- Bad, because it would increase specification and tooling burden unnecessarily

### Standardize only HTTP status codes and leave error bodies mostly implementation-defined

- Good, because it keeps the draft very light
- Good, because implementations retain maximum freedom in local API design
- Neutral, because some tightly coordinated ecosystems may tolerate that looseness
- Bad, because it does not satisfy the spirit of ADR-0016's concrete JSON contract requirement
- Bad, because independent clients would still face wire-level ambiguity for real error handling
