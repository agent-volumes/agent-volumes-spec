---
status: accepted
date: 12026-05-09
decision-makers: Yunseo Kim
---

# Use available-only resolution with pinned yanked exceptions for version lifecycle states

## Context and Problem Statement

ADR-0097 adopts a Cargo-style version index row model and requires lifecycle/status
metadata needed to exclude unavailable versions from ordinary resolution. The
current version index row schema includes `available`, `yanked`, `tombstoned`,
`blocked`, and `unavailable` states, and the resolver fixtures already exercise
one case where a yanked candidate is skipped during ordinary resolution.

That still leaves a client-behavior question: **how should conforming clients
interpret these lifecycle states during ordinary dependency resolution, exact
version fetches, and installs based on already-pinned reproducibility inputs?**

This decision does not standardize a lockfile file format. However, the core
specification already recognizes lockfiles as client-local reproducibility inputs
that take precedence during identifier resolution. Therefore this decision may
normatively describe behavior for installs based on existing lock/pin inputs
without defining the lockfile syntax itself.

Comparable package ecosystems distinguish several lifecycle patterns:

- Cargo and PyPI-style yanking/retraction excludes versions from new resolution
  while preserving existing pinned or locked installs.
- npm-style deprecation is warning-only and remains installable.
- npm/RubyGems-style unpublish or yank removal can break fresh installs.
- Maven Central-style immutability avoids deletion and requires corrected
  releases to use new versions.

Agent Volumes has an immutable release identity and strong supply-chain integrity
model, so it needs to preserve reproducibility where safe while still giving
bibliothecas a hard-stop mechanism for unsafe or policy-prohibited releases.

## Decision Drivers

- Preserve reproducibility for versions that were previously selected and pinned
  before a later lifecycle change.
- Prevent ordinary resolution from newly selecting versions that a bibliotheca no
  longer recommends.
- Distinguish warning-level lifecycle changes from hard security or policy
  blocks.
- Keep unpublish compatible with version immutability by preserving version
  identity and preventing silent version reuse.
- Avoid reopening the deferred lockfile file-format decision.
- Avoid defining a full resolver or registry-priority policy beyond the existing
  minimal interoperability contract.

## Considered Options

- Available-only resolution with pinned yanked exceptions.
- Strict fail-closed behavior for every non-`available` state.
- Removal-oriented behavior where yanked or tombstoned versions are no longer
  fetchable.
- Split lifecycle state and policy-block state into separate fields.

## Decision Outcome

Chosen option: **Available-only resolution with pinned yanked exceptions**,
because it best balances new-install safety with reproducibility for existing
consumers.

Under this decision, ordinary dependency resolution means selection of a version
candidate from dependency constraints and version index rows when the version was
not already fixed by an exact user request, an existing lockfile, or an
equivalent client-local reproducibility input.

Client behavior for v0.1 version lifecycle states is:

| State         | Ordinary resolution | Exact pinned fetch / install                                             | Existing lock-based install                                                          | Client UX                                              |
| ------------- | ------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `available`   | Allowed             | Allowed                                                                  | Allowed                                                                              | Normal                                                 |
| `yanked`      | Excluded            | Allowed with warning                                                     | Allowed with warning                                                                 | Warning that the version is yanked                     |
| `tombstoned`  | Excluded            | Fails                                                                    | Fails unless using an implementation-local cache-only mode outside the v0.1 baseline | Removal/unpublish error                                |
| `blocked`     | Excluded            | Fails                                                                    | Fails                                                                                | Hard security, policy, or governance error             |
| `unavailable` | Excluded            | Fails or reports a retryable registry/artifact-state error as applicable | Fails unless the implementation has a non-baseline offline/cache policy              | Availability or inconsistent-registry-state diagnostic |

More specifically:

- clients MUST NOT select `yanked`, `tombstoned`, `blocked`, or `unavailable`
  versions during ordinary dependency resolution
- clients MAY install a `yanked` version when that exact version was explicitly
  requested, already pinned, or selected by an existing lockfile or equivalent
  reproducibility input
- clients MUST surface a warning when installing a `yanked` version
- clients MUST NOT install `blocked` versions by default, including when the
  version is exactly pinned or present in an existing lockfile
- clients MUST treat `tombstoned` as a preserved version identity whose artifact
  is no longer installable in the portable v0.1 baseline
- clients MUST treat `unavailable` as excluded from ordinary resolution and as a
  non-security availability, registry-state, or artifact-state failure rather
  than as a security block
- clients MUST fail closed for unrecognized lifecycle states unless a future
  specification or profile defines their meaning
- bibliothecas MUST NOT reuse a version number after it has been published,
  yanked, tombstoned, blocked, or otherwise lifecycle-marked

This decision intentionally does not standardize:

- lockfile syntax
- cache storage format
- offline install semantics
- registry priority or source selection behavior
- a full dependency solving or backtracking algorithm
- advisory write workflows

## Consequences

- Good, because ordinary resolution avoids versions that the bibliotheca no
  longer considers eligible.
- Good, because yanked versions remain available for reproducibility when a
  consumer already has an exact pin or lock-based reproducibility input.
- Good, because `blocked` has a clear hard-failure meaning distinct from
  warning-level yanking.
- Good, because `tombstoned` preserves version immutability and prevents version
  reuse without promising artifact availability.
- Good, because `unavailable` remains distinguishable from security or policy
  blocking.
- Neutral, because clients must implement state-specific warning and failure
  behavior.
- Neutral, because implementations may still provide non-baseline offline/cache
  behavior if they make it explicit locally.
- Bad, because allowing pinned installs of yanked versions can preserve use of
  releases that a bibliotheca no longer recommends.
- Bad, because the lifecycle matrix is more nuanced than a single non-available
  hard-fail rule.

## Confirmation

- Verify that ordinary resolver fixtures exclude non-`available` candidates,
  including at least a yanked candidate.
- Verify that conformance fixtures distinguish yanked exact/pinned behavior from
  ordinary resolution behavior.
- Verify that `blocked` produces a hard client failure even for exact or
  lock-based installs.
- Verify that `tombstoned` preserves version identity and prevents version reuse
  without requiring artifact access.
- Verify that `unavailable` is presented as an availability or registry-state
  condition rather than a security block.
- Verify that this decision does not define a lockfile file format.

## Pros and Cons of the Options

### Available-only resolution with pinned yanked exceptions

- Good, because it matches the Cargo/PyPI pattern of avoiding bad versions in new
  resolution while preserving reproducibility.
- Good, because it cleanly separates ordinary candidate selection from exact
  reproducibility inputs.
- Good, because it lets `blocked` carry a stronger hard-stop meaning than
  `yanked`.
- Neutral, because clients must expose warning behavior for yanked pinned
  installs.
- Bad, because a yanked version can still be installed when pinned.

### Strict fail-closed behavior for every non-`available` state

- Good, because it is the simplest and most conservative client rule.
- Good, because it avoids continuing to install releases that have been marked
  problematic.
- Neutral, because high-assurance deployments may choose this stricter posture
  locally.
- Bad, because it breaks reproducibility for existing consumers after non-security
  yanking.
- Bad, because it makes `yanked`, `tombstoned`, `blocked`, and `unavailable`
  nearly equivalent from a client perspective.

### Removal-oriented behavior where yanked or tombstoned versions are no longer fetchable

- Good, because it strongly limits continued distribution of bad artifacts.
- Good, because it aligns with ecosystems where yanking is primarily a removal
  primitive.
- Neutral, because cache-local installs could still exist as implementation-local
  behavior.
- Bad, because it weakens reproducibility and auditability.
- Bad, because it conflicts with Agent Volumes' emphasis on immutable release
  identity and explicit lifecycle metadata.

### Split lifecycle state and policy-block state into separate fields

- Good, because it can represent combinations such as yanked-and-blocked more
  precisely.
- Good, because it separates release lifecycle from registry governance policy.
- Neutral, because this may become useful in a later, richer lifecycle model.
- Bad, because it adds schema and client complexity to the v0.1 baseline.
- Bad, because the existing version-index row model already has a compact state
  vocabulary sufficient for the current decision.
