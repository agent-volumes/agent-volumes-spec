---
status: accepted
date: 12026-05-07
decision-makers: Yunseo Kim
---

# Assign client hard failure and bibliotheca blocking roles for permission escalation in v0.1

## Context and Problem Statement

The v0.1 draft already defines a monotonic permission rule for manifests: component-level permissions may narrow the parent volume permissions, but they may not broaden them.

That leaves an enforcement-ownership question unresolved: **when permission escalation is present, which actor must detect it and what action must each actor take?**

Several competing pressures must be balanced:

- clients are an enforcement point during publish, consume, install, and load workflows, and remain the final runtime-facing safety boundary for installed artifacts
- bibliothecas can improve ecosystem hygiene by blocking known-bad artifacts before they continue to spread
- requiring every bibliotheca to perform mandatory permission-escalation validation on every publish may increase operational and implementation burden in ways that are not strictly necessary for the portable v0.1 baseline
- the draft already distinguishes hard-failure safety conditions from warning-level extensibility cases such as unknown manifest structure and bridge-period compatibility aliases

The specification therefore needs to decide whether permission-escalation enforcement belongs primarily to the client, primarily to the bibliotheca, or to both with different responsibilities.

## Decision Drivers

- Preserve a portable hard-failure baseline at the point where artifacts are actually consumed
- Keep the final safety boundary with the actor that performs install/load decisions
- Allow bibliothecas to block known-bad artifacts without forcing a heavy mandatory per-publish validation burden on every implementation
- Avoid confusing semantic rule violations with warning-oriented extensibility cases
- Improve ecosystem hygiene without making registry-side enforcement the only protection

## Considered Options

- A — Bibliotheca-only enforcement
- B — Client-only enforcement
- C — Bibliotheca and client both MUST enforce, including mandatory per-publish bibliotheca validation
- D — Client MUST hard-fail on publish/consume/install/load; bibliotheca MUST block when permission escalation is discovered, but bibliotheca is not required to perform mandatory direct validation on every publish

## Decision Outcome

Chosen option: **D — Client MUST hard-fail on publish/consume/install/load; bibliotheca MUST block when permission escalation is discovered, but bibliotheca is not required to perform mandatory direct validation on every publish**, because it preserves the client as the portable enforcement baseline across authoring and consumption workflows while still giving bibliothecas a clear responsibility to stop distributing known-bad artifacts once they become aware of them.

Under this decision:

- conforming clients must treat permission escalation as a hard-failure condition during publish, consume, install, or load workflows
- this hard-failure rule applies when a component declares permissions broader than its parent volume permits
- bibliothecas are responsible for blocking artifacts with permission escalation once the problem is discovered through any suitable path, such as publisher correction, vulnerability reporting, operator review, automated inspection, or equivalent local mechanisms
- bibliothecas are not required by the v0.1 baseline to perform mandatory direct permission-escalation validation on every individual publish attempt
- bibliothecas may still choose to perform stricter publish-time validation or rejection as a stronger local policy

### Consequences

- Good, because the portable enforcement baseline remains with the client across both publish-time and consume-time workflows
- Good, because bibliothecas still have a clear responsibility to stop serving known-bad artifacts once permission escalation is discovered
- Good, because the baseline avoids forcing every bibliotheca to pay the operational cost of mandatory per-publish escalation checking
- Good, because the rule stays aligned with the broader v0.1 pattern in which true semantic safety violations are hard failures, while unknown/extensible structures can remain warning-oriented
- Neutral, because bibliothecas may differ in how quickly and by which mechanism they detect escalation, as long as discovered cases are blocked
- Bad, because invalid manifests may still be published temporarily by bibliothecas that do not perform proactive validation before the issue is later discovered
- Bad, because some readers may initially expect symmetrical mandatory enforcement at both publish time and consume time

### Confirmation

- Verify that a conforming client always fails when a component declares permissions broader than its parent volume permits during publish, consume, install, or load workflows
- Verify that bibliotheca behavior for discovered escalation results in blocking or equivalent distribution prevention rather than silent continued service
- Verify that the baseline does not accidentally require mandatory per-publish direct escalation analysis for every bibliotheca implementation
- Verify that warning-oriented ADRs for unknown manifest structure, capability evolution, and bridge-period compatibility are not accidentally reinterpreted as hard-failure permission rules

## Pros and Cons of the Options

### A — Bibliotheca-only enforcement

- Good, because bad artifacts can be rejected before reaching many users
- Good, because client implementations could remain simpler
- Bad, because clients would no longer be the portable final safety boundary
- Bad, because artifacts obtained outside a strict bibliotheca path could bypass the only mandated protection

### B — Client-only enforcement

- Good, because publish and consume/install/load workflows remain protected regardless of artifact source
- Good, because bibliothecas can stay operationally lighter
- Bad, because known-bad artifacts may remain published and continue to circulate longer than necessary
- Bad, because ecosystem hygiene depends too heavily on downstream clients noticing the same violation repeatedly

### C — Bibliotheca and client both MUST enforce, including mandatory per-publish bibliotheca validation

- Good, because it provides the strongest defense in depth
- Good, because invalid manifests are more likely to be stopped both before and during consumption
- Bad, because it imposes a stronger mandatory operational burden on every bibliotheca implementation than the v0.1 baseline needs
- Bad, because it makes publish-time registry behavior heavier even though the final safety guarantee still needs the client-side hard-failure rule anyway

### D — Client MUST hard-fail on publish/consume/install/load; bibliotheca MUST block when permission escalation is discovered, but bibliotheca is not required to perform mandatory direct validation on every publish

- Good, because it keeps the client as the universal final enforcement point
- Good, because bibliothecas still have an explicit duty to act once they know an artifact is bad
- Good, because it balances ecosystem hygiene with practical registry-side operational cost
- Neutral, because bibliothecas may still choose stronger proactive validation locally
- Bad, because some invalid artifacts may exist briefly before discovery and blocking occur
