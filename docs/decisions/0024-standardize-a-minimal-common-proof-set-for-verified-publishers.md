---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Standardize a minimal common proof set for verified publishers in v0.1

## Context and Problem Statement

The current draft already distinguishes publisher verification levels such as `unverified`, `verified`, and `trusted`. However, the draft still leaves open an important interoperability question: **how much of the proof basis for `verified` should be standardized across bibliothecas, and how much should remain registry-local policy?**

If the standard does not define a common proof floor, the meaning of `verified` may drift too far across bibliothecas. If it tries to standardize too many identity-proof methods in v0.1, the first interoperable draft may become unnecessarily heavy.

## Decision Drivers

- Preserve a portable minimum meaning for the `verified` publisher label
- Keep the initial proof baseline simple and implementable
- Allow bibliothecas to add stronger or additional verification methods later
- Avoid overcommitting to a large identity framework in the first interoperable draft

## Considered Options

- A — Minimal common proof set
- B — Broader identity-proof framework in the core spec
- C — Leave proof methods entirely to bibliotheca policy

## Decision Outcome

Chosen option: **A — Minimal common proof set**, because it provides a portable baseline meaning for `verified` without making v0.1 carry a large identity-proof framework.

Under this decision, the v0.1 core spec standardizes the following as the minimum common proof basis for `verified` publishers:

- GitHub account linkage
- domain DNS TXT proof

Under this decision, bibliothecas MAY support stronger or additional publisher-verification methods, but those do not replace the minimum common meaning of the baseline `verified` state.

### Consequences

- Good, because the `verified` label gains a portable minimum meaning across bibliothecas
- Good, because the proof baseline remains light enough for the first interoperable draft
- Good, because bibliothecas retain room to add stronger verification methods later
- Neutral, because richer identity frameworks may still be added in later profiles or versions
- Bad, because the assurance level of the minimum baseline remains intentionally limited

### Confirmation

- Verify that the spec can define `verified` consistently in terms of the minimum common proof set
- Verify that bibliothecas can add stronger proof methods without weakening the standardized baseline meaning
- Verify that clients can distinguish baseline `verified` meaning from richer bibliotheca-specific verification semantics when needed

## Pros and Cons of the Options

### A — Minimal common proof set

- Good, because it creates a common floor for `verified` semantics across registries
- Good, because it is simple enough to implement and explain in v0.1
- Good, because it leaves room for future stronger proof methods without destabilizing the baseline
- Neutral, because it does not attempt to solve every enterprise or high-assurance identity use case immediately
- Bad, because the minimum assurance level is necessarily less rich than a broader identity framework

### B — Broader identity-proof framework in the core spec

- Good, because it could support more advanced enterprise and organizational identity cases from the start
- Good, because it might reduce future restructuring if richer identity proof becomes common quickly
- Neutral, because some ecosystems may eventually want a more expressive publisher-identity framework
- Bad, because it would make the first interoperable draft substantially heavier
- Bad, because it risks premature standardization of proof methods before enough implementation evidence exists

### C — Leave proof methods entirely to bibliotheca policy

- Good, because bibliothecas would have maximum freedom to define local identity policy
- Good, because the draft would avoid committing to concrete proof methods early
- Neutral, because some registry ecosystems do rely primarily on local trust governance rather than shared identity semantics
- Bad, because the meaning of `verified` could diverge too far across bibliothecas
- Bad, because cross-registry portability of publisher-verification signals would be weaker
