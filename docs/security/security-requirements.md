# Security Requirements and Threat Model

This document summarizes what users and implementers can expect from Agent
Volumes security work, and what remains outside the portable specification.

The normative trust and supply-chain model is in
[`../../agent-volumes-spec.md`](../../agent-volumes-spec.md). This document is a
project-level assurance and review aid.

## Security goals

Agent Volumes is designed to help implementations:

- identify packages and components consistently;
- verify release content integrity;
- represent publisher identity and provenance facts;
- expose trust artifacts and advisory metadata in structured form;
- detect permission escalation against declared component capabilities;
- distinguish objective trust facts from registry-local judgments.

## Security non-goals

Agent Volumes does not define:

- one global trust-root store;
- one universal registry-priority policy;
- one token issuance or revocation system;
- one advisory moderation workflow;
- one scanner severity normalization model;
- runtime-specific sandboxing, allowlists, or execution policy;
- product certification for implementations.

These are implementation-local, profile-local, or deferred topics unless a
future ADR changes their status.

## Trust boundaries

| Boundary                            | Security expectation                                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Package author to bibliotheca       | Bibliothecas validate identity, archive shape, release metadata, and integrity before publication.    |
| Bibliotheca to client               | Clients verify exact release metadata, lifecycle state, distribution metadata, and content integrity. |
| Trust artifact producer to consumer | Consumers validate objective artifact facts and apply local trust-root policy separately.             |
| Client to runtime adapter           | Portable validation stops at the load boundary; runtime execution policy remains local.               |
| Advisory producer to consumer       | Advisory read/discovery is portable; advisory write authority and moderation are local policy.        |

## Threats and mitigations

| Threat                                            | Mitigation surface                                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Package identity confusion                        | purl-aligned identity, scoped naming rules, canonical serialization.                               |
| Content tampering                                 | Normalized-file-tree digest construction and exact release metadata.                               |
| Permission escalation                             | Component permission validation and escalation fixtures.                                           |
| Stale or revoked trust evidence                   | Trust attachment status, revision metadata, and failure behavior for revoked or invalid artifacts. |
| Ambiguous advisory targeting                      | Volume-level advisory targeting and structured affected-version events.                            |
| API error ambiguity                               | Closed RFC 9457 problem type set and OpenAPI alignment.                                            |
| Local policy being mistaken for portable behavior | Deferred-topic inventory and explicit prose-boundary documentation.                                |

## Assurance case

The project argues that these security goals are met through:

1. normative prose in the trust, integrity, advisory, and conformance sections;
2. machine-readable schemas for structured trust, advisory, release, and problem
   details artifacts;
3. deterministic conformance fixtures for portable behavior;
4. ADRs documenting rejected or deferred security design alternatives;
5. CI validation for schema, fixture, OpenAPI, lint, and formatting drift;
6. organization-wide vulnerability reporting and supply-chain hardening policy.

Open risks are tracked as issues, ADR follow-ups, or deferred topics in
[`../../conformance/REQUIREMENTS.md`](../../conformance/REQUIREMENTS.md).
