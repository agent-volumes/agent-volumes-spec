---
status: accepted
date: 12026-05-07
decision-makers: Yunseo Kim
---

# Return `200 OK` with empty artifact sets when no trust artifacts exist for a release

## Context and Problem Statement

ADR-0016 requires the v0.1 core to define absent-artifact behavior concretely for trust metadata APIs. The current trust model already distinguishes:

- the existence of a release
- the release subject to which trust artifacts may bind
- the current-state discovery of any attached trust artifacts

That leaves a specific API-semantics question unresolved: **when a release exists but no trust artifacts have yet been attached, should the trust metadata surface return success with an empty artifact set, or should it signal absence as a not-found or other error condition?**

## Decision Drivers

- Keep release existence separate from trust-artifact presence
- Make trust discovery predictable and easy for clients to consume
- Avoid conflating “release exists but no trust artifacts yet” with “release does not exist”
- Satisfy ADR-0016's requirement for concrete absent-artifact behavior

## Considered Options

- Return `200 OK` with an empty artifact set when the release exists but no trust artifacts are present
- Return `404 Not Found` when no trust artifacts are present
- Use different absence behaviors across summary and detail views

## Decision Outcome

Chosen option: **Return `200 OK` with an empty artifact set when the release exists but no trust artifacts are present**, because it most cleanly separates release existence from trust-artifact presence while keeping client behavior simple and explicit.

Under this decision:

- if the release exists, the trust summary/detail surfaces return success semantics even when no trust artifacts are yet attached
- the success payload indicates trust-artifact absence by returning an empty artifact collection rather than a not-found error
- revision/current-state metadata MAY still be present where applicable
- `404` remains available for true missing-resource cases rather than ordinary trust-artifact absence

## Consequences

- Good, because clients can distinguish release existence from trust-artifact absence without error-code ambiguity
- Good, because polling, audit, and UI workflows become simpler and more stable
- Good, because absent-artifact behavior becomes concrete in the way ADR-0016 requires
- Neutral, because some implementations may still choose to expose richer local diagnostics alongside the empty baseline payload
- Bad, because the absence signal is somewhat softer than an error-style response
- Bad, because some readers may initially expect “no trust data” to map to a missing-resource status code

## Confirmation

- Verify that trust summary/detail prose, schemas, and fixtures can represent empty artifact sets cleanly
- Verify that `404` remains reserved for genuine missing-resource cases rather than ordinary trust-artifact absence
- Verify that clients can implement stable discovery behavior without special-case error parsing for no-artifact states

## Pros and Cons of the Options

### Return `200 OK` with an empty artifact set when the release exists but no trust artifacts are present

- Good, because it preserves a clean distinction between subject existence and attachment presence
- Good, because clients can treat no-artifact cases as ordinary discovery results rather than exceptional control flow
- Good, because it fits append-only trust attachment growth well over time
- Neutral, because richer optional diagnostics may still be layered on locally
- Bad, because the absence signal is less forceful than an explicit error code

### Return `404 Not Found` when no trust artifacts are present

- Good, because it provides a strong absence signal
- Good, because some API designers find resource-absence semantics intuitive at first glance
- Neutral, because some ecosystems do use `404` for not-yet-created derived views
- Bad, because it conflates “release exists but no trust attachments yet” with true missing-resource states
- Bad, because clients would need more branching logic to interpret common no-artifact cases safely

### Use different absence behaviors across summary and detail views

- Good, because it could provide nuanced control over different trust views
- Good, because one view could stay simple while another becomes more expressive
- Neutral, because some APIs do treat overview and detail endpoints differently
- Bad, because it complicates the model without strong evidence that v0.1 needs that complexity
- Bad, because it makes baseline client behavior harder to explain and test
