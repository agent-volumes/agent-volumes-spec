---
status: accepted
date: 12026-05-11
decision-makers: Yunseo Kim
---

# Treat superseded trust attachments as stale current evidence in v0.1

## Context and Problem Statement

ADR-0022 establishes that release-scoped trust attachments are append-only.
ADR-0023 establishes current-state trust discovery with revision metadata.
ADR-0026 requires invalid, superseded, and revoked trust attachments to remain in
the append-only record through explicit lifecycle status metadata rather than
silent deletion. ADR-0027 then defines the baseline client trust-consumption rule:
digest mismatch, subject mismatch, inconsistent trust binding, revoked trust
attachments, and invalid trust attachments fail by default.

That leaves one trust lifecycle state underspecified: **when a trust attachment is
marked `superseded`, should it still satisfy current trust requirements, should it
warn, should it fail like revoked or invalid evidence, or should it be used only
for historical and audit evaluation?**

The distinction is security-sensitive. If superseded evidence continues to satisfy
current trust requirements, clients may accept stale BOMs, provenance statements,
or signatures even after a bibliotheca has published replacement evidence. If
superseded evidence fails like revoked evidence, the model conflates replacement
with invalidity and weakens audit reproducibility.

## Decision Drivers

- Preserve the append-only trust attachment record for transparency and audit.
- Keep `superseded` distinct from `revoked` and `invalid`.
- Prevent downgrade-by-stale-evidence in current-state trust decisions.
- Allow historical and audit workflows to reproduce past trust evaluations.
- Keep baseline client behavior deterministic enough for conformance fixtures.
- Avoid treating replacement as proof that the old evidence was compromised or
  cryptographically invalid.
- Provide clear diagnostics when only stale evidence is available.

## Considered Options

- Treat superseded attachments as fully valid evidence.
- Treat superseded attachments as warning-level evidence that may still satisfy
  current requirements.
- Treat superseded attachments as hard failures like revoked or invalid evidence.
- Exclude superseded attachments from current trust decisions while preserving
  them for historical and audit evaluation.
- Leave superseded handling entirely to local client policy.

## Decision Outcome

Chosen option: **Exclude superseded attachments from current trust decisions while
preserving them for historical and audit evaluation**, because `superseded` is a
freshness and replacement state, not an invalidity or revocation state.

Under this decision, a trust attachment whose lifecycle status is `superseded`:

- remains part of the append-only trust record
- remains discoverable through trust detail or audit-oriented views
- MUST NOT be silently deleted, rewritten, or reinterpreted as if it were the
  replacement attachment
- MUST NOT satisfy required evidence in the baseline current-state trust
  evaluation
- MAY be used by historical, audit, or reproducibility workflows when the workflow
  is explicitly evaluating the trust state at a past observation time or under a
  local stale-evidence policy
- MUST produce a distinct diagnostic from `revoked` or `invalid` when it affects a
  current trust decision

This means baseline current-state trust evaluation uses non-superseded current
evidence to satisfy required BOM, provenance, signature, or related trust evidence
requirements. If a release has only superseded evidence for a required trust
category, the baseline current-state result is not “revoked” or “invalid”; it is a
stale or insufficient-current-evidence condition.

Recommended portable diagnostic categories include:

- `stale-trust-evidence-only`
- `insufficient-current-trust-evidence`

The exact diagnostic vocabulary may be integrated into the warning, problem, or
conformance artifacts, but clients MUST keep it semantically distinct from:

- `revoked`, which means the trust attachment was explicitly withdrawn from trust
- `invalid`, which means the trust attachment failed validation or was found
  incorrect
- missing evidence, which means no relevant trust attachment is present

Future schemas or profiles MAY add structured replacement metadata such as:

- `supersededBy`
- `supersededAt`
- `reason`

Those fields can improve deterministic replacement selection and audit UX, but
the v0.1 baseline semantics do not depend on them.

## Consequences

- Good, because stale evidence cannot satisfy current trust requirements by
  default.
- Good, because `superseded` remains semantically distinct from `revoked` and
  `invalid`.
- Good, because append-only trust history remains available for auditing,
  debugging, and reproducibility.
- Good, because clients can produce actionable diagnostics when a release has only
  stale trust evidence.
- Good, because the model matches external trust systems that prefer newer
  evidence while preserving older records for history.
- Neutral, because stricter deployments may still choose to fail closed on
  superseded evidence through local policy.
- Neutral, because permissive or historical workflows may still evaluate
  superseded evidence explicitly.
- Bad, because clients need to distinguish current-state trust evaluation from
  historical or audit evaluation.
- Bad, because conformance fixtures need a new stale-evidence outcome rather than
  reusing revoked or invalid failure categories.
- Bad, because replacement metadata would make the model clearer, but is not yet
  required in the v0.1 baseline.

## Confirmation

- Verify that prose distinguishes `superseded` from `revoked` and `invalid`.
- Verify that baseline current-state trust evaluation does not use superseded
  attachments to satisfy required evidence.
- Verify that historical or audit workflows can still inspect and evaluate
  superseded attachments under an explicit historical context.
- Verify that conformance fixtures include a case where only superseded evidence is
  present and the expected current-state outcome is stale or insufficient current
  evidence, not revoked or invalid.
- Verify that revoked and invalid attachments continue to fail by default under
  ADR-0027.
- Verify that trust detail views preserve superseded attachments in the append-only
  record rather than silently hiding or replacing them.
- Verify that future replacement metadata can be added without changing the core
  distinction between current-state and historical evaluation.

## Pros and Cons of the Options

### Treat superseded attachments as fully valid evidence

- Good, because it maximizes compatibility with previously published trust
  evidence.
- Good, because historical and current evaluation can share the same simple rule.
- Neutral, because some low-assurance clients may prefer this behavior locally.
- Bad, because stale or replaced evidence can satisfy current trust requirements.
- Bad, because an attacker or compromised projection layer could attempt a
  downgrade by surfacing older evidence instead of replacement evidence.
- Bad, because the `superseded` state becomes weakly meaningful.

### Treat superseded attachments as warning-level evidence

- Good, because it gives users visibility into stale evidence without forcing hard
  failure.
- Good, because it eases migration when replacement evidence is still rolling out.
- Neutral, because it resembles package deprecation or yanking models in some
  ecosystems.
- Bad, because warnings are often ignored.
- Bad, because stale evidence can still satisfy current requirements in baseline
  mode.
- Bad, because high-assurance clients need a stronger freshness boundary.

### Treat superseded attachments as hard failures like revoked or invalid evidence

- Good, because it strongly prevents stale evidence from being used.
- Good, because current-state client behavior is simple.
- Neutral, because stricter environments may choose this as a local policy.
- Bad, because replacement is not the same as revocation or validation failure.
- Bad, because the model would falsely imply that superseded evidence is unsafe or
  incorrect.
- Bad, because historical audit and reproducibility workflows become harder.

### Exclude superseded attachments from current trust decisions while preserving them for historical and audit evaluation

- Good, because it prevents current downgrade-by-stale-evidence.
- Good, because it preserves auditability and append-only history.
- Good, because it maintains a clear distinction between freshness, revocation, and
  validation failure.
- Good, because stale-only current trust states can be reported with a precise
  diagnostic.
- Neutral, because clients need a current-versus-historical evaluation mode
  distinction.
- Bad, because it adds one more lifecycle branch to baseline trust evaluation.

### Leave superseded handling entirely to local client policy

- Good, because it gives implementations maximum flexibility.
- Good, because v0.1 would avoid adding one more normative trust-consumption rule.
- Neutral, because local policy remains useful for stricter or more permissive
  environments.
- Bad, because portable trust semantics remain incomplete for a security-sensitive
  state.
- Bad, because independent clients may disagree about whether a release is
  currently verified.
- Bad, because conformance fixtures cannot define a deterministic outcome for
  superseded evidence.
