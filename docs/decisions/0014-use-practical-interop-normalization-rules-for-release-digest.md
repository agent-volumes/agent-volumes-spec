---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use a practical interoperability normalization rule set for the normalized file tree digest

## Context and Problem Statement

ADR-0013 establishes that `integrity` hashes a normalized file tree rather than transport bytes. That still leaves an important design question unresolved: **how strong should the normalization rule set be?**

If normalization is too weak, independent implementations may compute different digests for the same release content because of checkout, filesystem, or platform differences. If normalization is too strict, the draft may overfit edge cases too early and create unnecessary implementation burden.

## Decision Drivers

- Independent implementations must be able to compute the same digest for the same release
- The rule set should address the most likely sources of digest drift
- The draft should stay implementable without over-specifying rare edge cases prematurely
- Git-backed and CDN-hosted releases must remain reconcilable under one digest model

## Considered Options

- A — Minimal rule set
- B — Practical interoperability rule set
- C — Strict rule set

## Decision Outcome

Chosen option: **B — Practical interoperability rule set**, because it provides enough determinism for interoperable implementations without making v0.1 excessively heavy.

Under this decision, the normalization rules for the canonical file tree MUST normatively define at least:

- the authoritative include/exclude rule source
- path normalization rules
- symlink policy
- executable-bit handling policy
- line-ending policy
- Unicode path policy
- submodule and generated-file handling
- golden test vectors for conformance

## Consequences

- Good, because the most important digest drift risks are handled explicitly
- Good, because conformance testing can be anchored in golden test vectors
- Good, because the rule set is strong enough for independent implementation work
- Neutral, because some low-level edge cases may still need future refinement
- Bad, because the digest section and conformance material must grow to describe these rules clearly

## Confirmation

- Produce golden test vectors that at least cover path normalization, symlink behavior, executable-bit policy, and include/exclude behavior
- Verify that independent implementations produce the same digest on those vectors
- Verify that the normalization rule set is sufficient for both Git-backed and CDN-hosted releases

## Pros and Cons of the Options

### A — Minimal rule set

- Good, because it keeps the draft smaller and easier to write initially
- Good, because it leaves more room for implementations to evolve early behavior
- Neutral, because it may be sufficient for tightly controlled single-implementation ecosystems
- Bad, because independent implementations are more likely to compute different digests for the same content
- Bad, because it leaves too many common filesystem and checkout differences unresolved

### B — Practical interoperability rule set

- Good, because it addresses the most likely digest drift risks directly
- Good, because it supports conformance testing through golden vectors
- Good, because it is strong enough for independent implementation without being maximalist
- Neutral, because some rare edge cases may still need future refinement
- Bad, because the digest section and conformance material must become more detailed

### C — Strict rule set

- Good, because it maximizes determinism across platforms and toolchains
- Good, because it reduces long-term ambiguity for edge cases
- Neutral, because some ecosystems may prefer this rigor once implementations mature
- Bad, because it increases implementation burden for v0.1
- Bad, because it risks over-specifying low-frequency edge cases before enough field experience exists
