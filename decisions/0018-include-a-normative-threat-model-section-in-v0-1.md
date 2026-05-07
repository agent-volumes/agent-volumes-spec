---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Include a normative threat model section in v0.1

## Context and Problem Statement

The current draft makes strong trust, integrity, provenance, and advisory claims, but it does not yet explicitly define the threat model that those mechanisms are meant to address.

Without an explicit threat model, it is harder to judge whether the chosen trust mechanisms are sufficient, how conformance language should be interpreted, and which attack classes are intentionally out of scope.

## Decision Drivers

- Make the trust model's security goals explicit rather than implied
- Help implementers understand why particular mechanisms are mandatory or recommended
- Improve consistency of future conformance, review, and profile work
- Prevent confusion about what Agent Volumes does and does not claim to defend against in v0.1

## Considered Options

- A — Normative threat model section
- B — Informative security considerations only
- C — Defer threat modeling to a later RFC

## Decision Outcome

Chosen option: **A — Normative threat model section**, because the trust architecture in v0.1 is now concrete enough that leaving its threat assumptions implicit would create more ambiguity than value.

Under this decision, v0.1 MUST include a threat model section that identifies at least:

- in-scope threats
- out-of-scope threats
- the mechanism(s) intended to mitigate each in-scope threat

The in-scope set is expected to include at least classes such as:

- mutable Git references or tags
- substituted CDN artifacts
- mismatched trust attachments
- malicious or compromised publishers
- stale or replayed trust metadata
- compromised bibliotheca projection behavior

## Consequences

- Good, because the security purpose of integrity, provenance, signatures, and trust discovery becomes much clearer
- Good, because later conformance and profile work can refer to an explicit baseline threat model
- Good, because the spec's security claims become easier to evaluate rigorously
- Neutral, because some threat classes may later need refinement or expansion
- Bad, because the spec must now carry explicit security-boundary language rather than leaving it implicit

## Confirmation

- Verify that each major trust mechanism in the spec can be traced to a documented threat-model purpose
- Verify that the threat model distinguishes in-scope and out-of-scope attack classes clearly
- Verify that the threat model does not accidentally promise guarantees the rest of the spec does not provide

## Pros and Cons of the Options

### A — Normative threat model section

- Good, because the security goals of the trust architecture become explicit
- Good, because implementers can understand why specific mechanisms are required or recommended
- Good, because later conformance and profile work gain a clearer baseline
- Neutral, because future versions may still refine the threat set over time
- Bad, because the draft must now carry more explicit security-boundary language

### B — Informative security considerations only

- Good, because the draft can discuss security concerns without fully freezing a threat contract
- Good, because it keeps the normative surface smaller
- Neutral, because it may be enough for a less trust-centric specification
- Bad, because it leaves too much ambiguity about what the trust model is actually defending against
- Bad, because it weakens the interpretability of existing MUST/SHOULD security language

### C — Defer threat modeling to a later RFC

- Good, because it reduces immediate draft scope
- Good, because later work could incorporate more implementation experience
- Neutral, because some ecosystems do postpone explicit threat modeling until later maturity
- Bad, because the current draft already makes strong trust and integrity claims that need a threat frame
- Bad, because leaving the threat model implicit increases ambiguity now, not later
