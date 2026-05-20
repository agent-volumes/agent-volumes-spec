---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Represent trust-attachment revocation through status metadata in v0.1

## Context and Problem Statement

ADR-0022 establishes that release-scoped trust attachments are append-only, and ADR-0023 establishes that trust discovery exposes current state together with revision-style metadata.

That creates a lifecycle question for trust artifacts that later turn out to be superseded, invalid, or revoked: **should they be removed or hidden from discovery, or should they remain part of the append-only record with explicit lifecycle status metadata?**

The answer affects auditability, transparency, and client interpretation of trust discovery results.

## Decision Drivers

- Preserve append-only trust-artifact history
- Allow clients to understand lifecycle state without losing provenance of what was previously published
- Avoid silent deletion or replacement of trust evidence
- Keep the trust-discovery model transparent enough for auditing and debugging

## Considered Options

- A — Represent invalidation through status metadata
- B — Hide revoked attachments from ordinary discovery views
- C — Defer revocation semantics to later work

## Decision Outcome

Chosen option: **A — Represent invalidation through status metadata**, because it best fits the append-only trust model while preserving transparency and auditability.

Under this decision:

- trust attachments remain part of the append-only record even if they later become invalid, superseded, or revoked
- invalidation is expressed through an explicit lifecycle/status metadata layer rather than by deleting or silently replacing attachments
- clients and APIs are expected to distinguish attachment presence from current validity state

### Consequences

- Good, because trust-artifact history is preserved for auditing and debugging
- Good, because append-only semantics remain internally consistent
- Good, because clients can reason about both existence and validity state separately
- Neutral, because discovery APIs may still choose different presentation layers so long as the underlying status semantics remain preserved
- Bad, because clients must understand more lifecycle state than in a hide-or-delete model

### Confirmation

- Verify that an attachment can remain discoverable while also being marked revoked, superseded, or invalid
- Verify that discovery and conformance language distinguish clearly between artifact presence and artifact validity state
- Verify that the revocation model does not require silent mutation of prior trust artifacts

## Pros and Cons of the Options

### A — Represent invalidation through status metadata

- Good, because it preserves append-only history and auditability
- Good, because it avoids silent deletion or replacement of trust evidence
- Good, because it lets clients reason explicitly about lifecycle state
- Neutral, because API presentation details may still vary somewhat as long as the lifecycle semantics are preserved
- Bad, because lifecycle interpretation becomes more complex for clients

### B — Hide revoked attachments from ordinary discovery views

- Good, because the common client experience can remain simpler
- Good, because ordinary discovery surfaces may feel cleaner if only currently valid artifacts are shown prominently
- Neutral, because some systems do distinguish ordinary views from audit/history views
- Bad, because hiding artifacts weakens transparency and may conflict with append-only expectations
- Bad, because it makes auditing and reasoning about prior trust state harder

### C — Defer revocation semantics to later work

- Good, because it reduces immediate specification scope
- Good, because later work could incorporate more operational evidence about trust-artifact lifecycle needs
- Neutral, because some ecosystems postpone invalidation semantics until later maturity
- Bad, because append-only trust attachment growth would remain underspecified at an important lifecycle boundary
- Bad, because clients would not know how to interpret invalid or superseded trust artifacts consistently in v0.1
