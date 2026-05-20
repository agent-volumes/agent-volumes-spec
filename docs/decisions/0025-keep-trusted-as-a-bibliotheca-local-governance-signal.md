---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Keep `trusted` as a bibliotheca-local governance signal in v0.1

## Context and Problem Statement

ADR-0024 establishes a portable minimum proof floor for the `verified` publisher level in v0.1. That leaves a related question for the higher publisher tier: **should `trusted` also gain a portable normative meaning, or should it remain primarily a registry-local governance signal?**

The current draft already hints that `trusted` is more policy-heavy than `verified`, but it does not yet define how strongly that meaning should be standardized across bibliothecas.

## Decision Drivers

- Preserve a clear distinction between a portable proof baseline and a more policy-heavy trust tier
- Avoid over-standardizing governance semantics in the first interoperable draft
- Retain a way for curated or security-vetted bibliothecas to communicate stronger local trust posture
- Keep the publisher-level model stable without forcing premature cross-registry normalization of `trusted`

## Considered Options

- A — Keep `trusted` as a bibliotheca-local governance signal
- B — Define normative minimum criteria for `trusted`
- C — Remove `trusted` from the v0.1 core model

## Decision Outcome

Chosen option: **A — Keep `trusted` as a bibliotheca-local governance signal**, because `trusted` is more policy-heavy and less portable than the proof-oriented `verified` baseline and should not be over-normalized in v0.1.

Under this decision:

- `verified` retains the stronger cross-bibliotheca baseline meaning defined by its minimum common proof set
- `trusted` remains a bibliotheca-local governance, curation, or security-vetting signal
- bibliothecas MAY define stronger local semantics for `trusted`, but those do not become part of the portable v0.1 baseline

### Consequences

- Good, because the specification preserves a clean distinction between proof-based verification and local trust governance
- Good, because curated bibliothecas retain flexibility to express stronger local trust tiers
- Good, because v0.1 avoids prematurely standardizing policy-heavy semantics that are likely to vary by registry
- Neutral, because future profiles or versions may still choose to define a more portable `trusted` meaning
- Bad, because cross-bibliotheca comparability of `trusted` remains limited

### Confirmation

- Verify that the spec distinguishes clearly between the portable baseline meaning of `verified` and the local governance meaning of `trusted`
- Verify that clients are not forced to treat `trusted` as a portable proof-level signal across bibliothecas
- Verify that bibliothecas can still use `trusted` for curated or vetted publisher communication without destabilizing the baseline model

## Pros and Cons of the Options

### A — Keep `trusted` as a bibliotheca-local governance signal

- Good, because it preserves flexibility for curated registries and local security programs
- Good, because it avoids forcing premature standardization of policy-heavy trust semantics
- Good, because it keeps `verified` as the main portable baseline while allowing stronger local tiers
- Neutral, because some ecosystems may still want richer future normalization later
- Bad, because `trusted` remains weaker as a cross-registry comparison signal

### B — Define normative minimum criteria for `trusted`

- Good, because it could improve cross-bibliotheca consistency of the higher trust tier
- Good, because clients might gain a clearer portable interpretation of strong publisher trust
- Neutral, because a later mature ecosystem may eventually want this level of standardization
- Bad, because it would bring governance and security-policy semantics deeper into the v0.1 core
- Bad, because the criteria would likely be premature and fragile without broader implementation evidence

### C — Remove `trusted` from the v0.1 core model

- Good, because it simplifies the publisher model to a more purely proof-oriented baseline
- Good, because it avoids ambiguity about a partly portable, partly local higher tier
- Neutral, because local registries could still express stronger trust informatively outside the core model
- Bad, because it removes a useful governance signal already present in the draft
- Bad, because curated bibliothecas would lose an obvious standard-facing place to communicate stronger local trust posture
