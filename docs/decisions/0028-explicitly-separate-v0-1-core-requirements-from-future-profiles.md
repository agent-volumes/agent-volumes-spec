---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Explicitly separate v0.1 core requirements from future profiles in the specification

## Context and Problem Statement

The v0.1 review and decision loop has now clarified many core interoperability requirements, while also intentionally deferring several heavier or more policy-sensitive areas.

That creates a specification-structure question: **should the draft simply defer these items case by case, or should it explicitly distinguish the v0.1 core from future strict, enterprise, or other profiles/RFCs?**

Without a clear boundary, deferred concerns may repeatedly drift back into core discussions and make the first interoperable draft harder to stabilize.

## Decision Drivers

- Keep the v0.1 core stable and bounded
- Make deferred work visible rather than implicit
- Reduce repeated ambiguity about whether a topic belongs in the baseline draft or in a future profile
- Create a cleaner path for later strict, enterprise, or specialized interoperability layers

## Considered Options

- A — Explicitly separate the v0.1 core from future profiles/RFCs
- B — Mention future profiles loosely without much concrete classification
- C — Avoid strong profile layering and defer items ad hoc

## Decision Outcome

Chosen option: **A — Explicitly separate the v0.1 core from future profiles/RFCs**, because the current draft is now concrete enough that deferred work should be clearly classified rather than left as a diffuse set of future possibilities.

Under this decision:

- the specification should explicitly identify what belongs to the v0.1 core baseline
- the specification should also identify major areas intentionally deferred to future profiles, RFCs, or later versions
- this boundary is expected to apply especially to strict, enterprise, or higher-assurance features that are not required for the first interoperable baseline

### Consequences

- Good, because the v0.1 core becomes easier to stabilize and defend
- Good, because deferred topics remain visible without being mistaken for unfinished core requirements
- Good, because later profiles gain a cleaner structural entry point
- Neutral, because future work may still revisit whether particular deferred items should move into the core in later versions
- Bad, because the specification must spend more effort classifying boundaries explicitly

### Confirmation

- Verify that major deferred items are clearly identified as profile/RFC candidates rather than implicit omissions
- Verify that readers can distinguish the baseline interoperability contract from later stricter layers
- Verify that future expansion can occur without destabilizing the stated v0.1 core

## Pros and Cons of the Options

### A — Explicitly separate the v0.1 core from future profiles/RFCs

- Good, because it gives the draft a clear architectural boundary between baseline and later work
- Good, because it reduces recurring confusion about whether deferred topics are still open core blockers
- Good, because it creates a natural place for stricter or more specialized future requirements
- Neutral, because some specific deferred topics may still be reclassified later with more evidence
- Bad, because the spec must carry more explicit structure about what is not in core

### B — Mention future profiles loosely without much concrete classification

- Good, because it keeps the draft lighter and less formal
- Good, because it leaves more flexibility for future work to evolve organically
- Neutral, because this may be acceptable when a draft is still highly exploratory
- Bad, because the boundary between core and later work remains too fuzzy
- Bad, because already deferred topics may keep resurfacing as if they were still undefined core requirements

### C — Avoid strong profile layering and defer items ad hoc

- Good, because it minimizes immediate structural overhead in the document
- Good, because it avoids creating a profile vocabulary before some readers may need it
- Neutral, because some specifications do defer topics one by one without stronger layering language
- Bad, because ad hoc deferral makes the draft harder to reason about systematically
- Bad, because it weakens the long-term expansion path for strict or enterprise requirements
