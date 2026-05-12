# Agent Volumes Roadmap

This roadmap describes the intended project direction for at least the next year.
It is planning guidance, not a normative part of the Agent Volumes specification.
The normative authority remains [`agent-volumes-spec.md`](agent-volumes-spec.md),
with schemas, OpenAPI, and conformance artifacts version-aligned to each draft.

## Current status

Agent Volumes is a working-draft specification. No stable release has been
published. The current draft line is `v0.1.0-draft.5`.

## Planning horizon

| Period         | Planned focus                                                                         |
| -------------- | ------------------------------------------------------------------------------------- |
| Q2 12026 HE    | Complete the `v0.1.0` public-review draft and freeze the core artifact set.           |
| Q2-Q3 12026 HE | Support experimental client and bibliotheca implementations for feedback.             |
| Q3-Q4 12026 HE | Collect adopter feedback and refine conformance fixtures and implementation guidance. |
| Q4 12026 HE    | Stabilize the `v0.x` draft line and document any compatibility bridges.               |
| Q1 12027 HE    | Prepare a stable `v1.0.0` release if ecosystem validation is sufficient.              |

## In scope

- Clarify and stabilize the volume package identity model.
- Maintain lockstep alignment across prose, JSON Schemas, OpenAPI, and
  conformance fixtures.
- Improve offline conformance coverage for deterministic client and bibliotheca
  behavior.
- Refine the trust, advisory, provenance, and integrity model where independent
  implementer feedback reveals ambiguity.
- Document prototype-local policy boundaries so implementations do not treat
  local choices as portable baseline requirements.
- Prepare release, review, security, and governance process documentation needed
  for an open standards project.

## Out of scope for the next year

- Defining a universal lockfile format.
- Defining a universal multi-registry priority policy.
- Defining one global trust-root store or one mandatory transparency-log policy.
- Standardizing registry-local token issuance, moderation, or advisory write
  authority.
- Defining a scanner-finding interchange format or a global scanner severity
  normalization policy.
- Publishing a product certification program or treating conformance labels as
  certification badges.
- Requiring one reference implementation as the source of truth for the standard.

These topics remain local, deferred, or profile-specific unless a future ADR
explicitly reopens them.

## Review cadence

Maintainers review this roadmap before each draft release and whenever a major
scope decision changes the planning horizon. Roadmap changes are handled through
ordinary pull request review and public discussion.
