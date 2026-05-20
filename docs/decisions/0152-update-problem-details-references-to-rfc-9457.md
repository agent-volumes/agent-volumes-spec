---
status: accepted
date: 12026-05-17
decision-makers: Yunseo Kim
consulted: RFC 9457, RFC 7807, IANA media type registry
---

# Update Problem Details references to RFC 9457

## Context and Problem Statement

ADR-0091 chose RFC 7807 Problem Details and `application/problem+json` as the baseline API error contract for Agent Volumes v0.1. ADR-0101 reused that RFC 7807 error contract when distinguishing authentication and authorization failures for protected writes. RFC 9457 had already obsoleted RFC 7807 in July 12023, so those historical decisions and the later specification text were referencing the older RFC number rather than the current Problem Details specification.

The question is: **should Agent Volumes update only the RFC reference number to RFC 9457, or should it change the portable Problem Details model?**

## Decision Drivers

- Keep historical ADR content stable while documenting follow-up changes in a new decision record.
- Align normative prose and companion artifacts with the current Problem Details RFC.
- Preserve the existing API error contract unless the replacement RFC requires a model change.
- Avoid changing media types, problem type URIs, or field semantics unnecessarily.

## Considered Options

- Update references from RFC 7807 to RFC 9457 without changing the error model
- Keep RFC 7807 references for historical continuity
- Redesign the Agent Volumes error contract around RFC 9457-specific additions

## Decision Outcome

Chosen option: **Update references from RFC 7807 to RFC 9457 without changing the error model**, because RFC 9457 is the current Problem Details RFC while preserving the core model used by Agent Volumes.

Under this decision:

- normative prose, implementation guidance, security notes, conformance descriptions, and OpenAPI drift-check wording reference RFC 9457 when describing the current portable Problem Details baseline;
- ADR-0091 and ADR-0101 remain historical records and are not rewritten beyond status metadata pointing to this update;
- `application/problem+json` remains the correct media type for Problem Details payloads;
- existing Agent Volumes problem `type` URIs remain valid;
- existing use of `type`, `title`, and `status` remains valid without semantic changes.

### Consequences

- Good, because the specification points implementers to the current RFC.
- Good, because historical ADR content remains intact and the follow-up decision is explicit.
- Good, because clients and bibliothecas do not need to change payload media type or core field handling.
- Neutral, because the change is a reference update rather than a new API capability.
- Bad, because readers must follow ADR-0091 to this ADR to understand why the RFC number changed.

### Confirmation

- Verify that current normative and companion-artifact wording references RFC 9457 for Problem Details.
- Verify that `application/problem+json` remains unchanged in the OpenAPI contract and schema examples.
- Verify that ADR-0091 and ADR-0101 remain otherwise historical, with only status metadata updated.
- Verify that no obsolete RFC 7807 references remain outside ADR-0091 and ADR-0101 historical content or this ADR's context discussion.

## Pros and Cons of the Options

### Update references from RFC 7807 to RFC 9457 without changing the error model

- Good, because RFC 9457 explicitly obsoletes RFC 7807.
- Good, because the IANA registration for `application/problem+json` remains the correct media type registration for Problem Details and points to RFC 9457.
- Good, because the core `type`, `title`, and `status` members remain compatible with Agent Volumes' existing problem details schema and examples.
- Neutral, because RFC 9457 adds and updates surrounding registry/reference material that does not require changing the v0.1 payload shape.
- Bad, because this requires a follow-up ADR rather than simply editing ADR-0091 or ADR-0101 in place.

### Keep RFC 7807 references for historical continuity

- Good, because ADR-0091 originally made its decision against RFC 7807 and ADR-0101 reused that historical error-contract reference.
- Good, because it avoids touching established prose.
- Bad, because implementers would be pointed at an obsolete RFC when reading current normative text.
- Bad, because the OpenAPI drift checklist and implementation guidance would remain less current than the underlying standard.

### Redesign the Agent Volumes error contract around RFC 9457-specific additions

- Good, because it could adopt newer registry-related Problem Details material immediately.
- Neutral, because future drafts can still consider additional Problem Details registry integration.
- Bad, because no identified v0.1 interoperability issue requires changing the core payload model.
- Bad, because changing the media type, `type` URIs, or field semantics would create unnecessary churn for implementers.

## More Information

- RFC 9457, _Problem Details for HTTP APIs_, obsoletes RFC 7807.
- RFC 7807, _Problem Details for HTTP APIs_, is the historical RFC referenced by ADR-0091 and ADR-0101.
- IANA media type registration for `application/problem+json` identifies the Problem Details JSON media type and remains compatible with this update.
