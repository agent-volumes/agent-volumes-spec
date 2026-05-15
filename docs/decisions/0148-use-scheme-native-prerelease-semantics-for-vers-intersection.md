---
status: accepted
date: 12026-05-16
decision-makers: Yunseo Kim
---

# Use scheme-native prerelease semantics for VERS intersection

## Context and Problem Statement

ADR-0147 defines external dependency potential-exposure matching as a
scheme-specific VERS intersection operation with three possible results:
`intersects`, `does-not-intersect`, and `indeterminate`.

Prerelease versions are one of the highest-risk edge cases for that intersection
operation. Ecosystems do not all treat prereleases the same way. Some range
semantics exclude prereleases unless a range explicitly opts in. Others apply
PEP-style prerelease rules, resolver heuristics, or ecosystem-specific advisory
conventions. A portable Agent Volumes rule that always includes or always excludes
prereleases would therefore diverge from at least some package ecosystems.

The remaining question is: **when a declared VERS constraint or advisory affected
range involves prerelease versions, which prerelease semantics should draft 6 use
for potential-exposure matching?**

## Decision Drivers

- Potential-exposure matching should follow the same version meaning users expect
  from the relevant package ecosystem.
- Agent Volumes should not invent one universal prerelease policy that conflicts
  with npm, PyPI, Cargo, RubyGems, or other ecosystem behavior.
- Prerelease ambiguity should not be silently converted into safety or confirmed
  exposure.
- The rule should compose with ADR-0147's scheme-specific evaluator and
  `indeterminate` result model.
- Conformance fixtures should be able to show explicit prerelease-positive,
  prerelease-negative, and prerelease-indeterminate cases.

## Considered Options

- A — Use scheme-native prerelease semantics.
- B — Always include prerelease versions in VERS intersections.
- C — Always exclude prerelease versions unless both ranges explicitly mention a
  prerelease.
- D — Exclude prereleases unless the dependency constraint explicitly mentions a
  prerelease.
- E — Treat all prerelease-involving intersections as indeterminate.
- F — Leave prerelease treatment to local policy.

## Decision Outcome

Chosen option: **A — Use scheme-native prerelease semantics**, because prerelease
meaning is part of the version scheme's ordering and range-membership model rather
than an Agent Volumes-specific policy choice.

Under this decision:

- A VERS intersection evaluator must apply the prerelease semantics of the relevant
  VERS version scheme.
- When the PURL type and VERS scheme are related through a pinned compatibility
  exception, the evaluator must apply the prerelease semantics specified by that
  exception or by the selected VERS scheme if the exception does not override
  prerelease behavior.
- If the pinned evaluator can decide prerelease membership, the resulting range
  intersection returns `intersects` or `does-not-intersect` under ADR-0147.
- If prerelease behavior is not defined, not implemented, not supported by the
  pinned evaluator, or ambiguous for the input form, the matching result is
  `indeterminate` under ADR-0147.
- Agent Volumes does not define a universal fallback that always includes or always
  excludes prereleases in potential-exposure matching.
- Local policy may choose to escalate, suppress, block, or require review for
  prerelease-driven `indeterminate` results, but those outcomes are not portable
  v0.1 trust facts.

## Fixture Semantics

Potential-exposure conformance fixtures should include prerelease cases for each
scheme covered by the draft 6 portable fixture subset. For each covered scheme,
fixtures should cover at least:

- a prerelease range that intersects an advisory affected range under the scheme's
  native semantics
- a prerelease range that does not intersect under the scheme's native semantics
- a stable-version range that does not accidentally include prereleases when the
  scheme excludes them by default
- an explicit prerelease opt-in case for schemes that require such an opt-in
- an unsupported or ambiguous prerelease form that produces `indeterminate`

The fixture expectations should identify whether a result is caused by ordinary
range disjointness, prerelease exclusion, explicit prerelease inclusion, or
indeterminate prerelease semantics.

## Consequences

- Good, because Agent Volumes aligns potential-exposure matching with each package
  ecosystem's version expectations.
- Good, because prerelease behavior composes naturally with ADR-0147's
  scheme-specific evaluator model.
- Good, because unsupported prerelease behavior is visible as `indeterminate` rather
  than silently becoming a false positive or false negative.
- Good, because conformance fixtures can pin the exact prerelease behavior expected
  for each supported scheme.
- Neutral, because implementers need scheme-aware prerelease support for every
  scheme covered by portable fixtures.
- Neutral, because advisory adapters need to preserve enough normalized VERS
  information for prerelease cases to be evaluated correctly.
- Bad, because prerelease behavior may differ across ecosystems in ways that are
  harder to explain than a single Agent Volumes-wide policy.
- Bad, because adding new supported schemes requires careful prerelease fixture
  coverage.

## Confirmation

- Verify that draft 6 prose states that prerelease handling follows the relevant
  VERS version scheme during potential-exposure matching.
- Verify that the portable baseline does not define an Agent Volumes-wide
  always-include or always-exclude prerelease rule.
- Verify that unsupported or ambiguous prerelease cases produce `indeterminate`
  rather than `intersects` or `does-not-intersect`.
- Verify that fixtures cover prerelease inclusion, prerelease exclusion, explicit
  prerelease opt-in where relevant, and prerelease-driven indeterminate results for
  the supported draft 6 scheme subset.
- Verify that warning text and context do not imply confirmed vulnerability when a
  prerelease range only creates declaration-only potential exposure.

## Pros and Cons of the Options

### A — Use scheme-native prerelease semantics

- Good, because prerelease meaning stays attached to the ecosystem version scheme
  that defines ordering and range membership.
- Good, because npm, PyPI, Cargo, RubyGems, and other schemes can preserve their
  existing user expectations.
- Good, because ambiguous unsupported cases can use ADR-0147's `indeterminate`
  result.
- Bad, because implementers must understand scheme-specific prerelease behavior.

### B — Always include prerelease versions

- Good, because it is conservative from a false-negative perspective.
- Good, because it is easy to explain.
- Bad, because it over-warns in ecosystems where stable ranges do not include
  prereleases by default.
- Bad, because it conflicts with scheme-native resolver and advisory expectations.

### C — Always exclude prereleases unless both ranges explicitly mention a prerelease

- Good, because it avoids many noisy prerelease warnings.
- Good, because it resembles some SemVer-oriented expectations.
- Bad, because it can under-warn when an advisory range or ecosystem convention
  intentionally includes prerelease versions.
- Bad, because it is still an Agent Volumes-wide rule rather than scheme-native
  behavior.

### D — Exclude prereleases unless the dependency constraint explicitly mentions a prerelease

- Good, because authored dependency intent controls prerelease matching.
- Bad, because advisory affected ranges may intentionally cover prereleases even
  when the dependency constraint is broad.
- Bad, because it can diverge from ecosystem rules that include prereleases under
  different conditions.

### E — Treat all prerelease-involving intersections as indeterminate

- Good, because it avoids pretending to know scheme behavior.
- Good, because it is safe for unsupported schemes.
- Bad, because it discards useful deterministic behavior for well-understood
  schemes.
- Bad, because many practical advisories would become less actionable.

### F — Leave prerelease treatment to local policy

- Good, because implementations can tune behavior for their risk posture.
- Bad, because portable warning behavior would diverge across clients and
  conformance runners.
- Bad, because draft 6 fixtures could not reliably assert prerelease expectations.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- VERS defines a portable prerelease policy that supersedes scheme-native behavior.
- A supported ecosystem's prerelease semantics cannot be represented reliably in the
  VERS-compatible evaluator model.
- Conformance experience shows that scheme-native prerelease fixtures are too hard
  for independent implementations to reproduce.
- Users consistently misinterpret prerelease-driven potential exposure as confirmed
  vulnerability despite warning wording and context guidance.

## More Information

ADR-0113 selects VERS as the external dependency constraint language. ADR-0135
defines declaration-only potential exposure. ADR-0138 defines the structured warning
carrier and offline fixture carrier. ADR-0147 defines scheme-specific VERS
intersection and the `indeterminate` matching result used by this decision.
