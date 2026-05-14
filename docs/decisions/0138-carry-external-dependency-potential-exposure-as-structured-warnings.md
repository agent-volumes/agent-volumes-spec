---
status: accepted
date: 12026-05-15
decision-makers: Yunseo Kim
---

# Carry external dependency potential exposure as structured warnings

## Context and Problem Statement

ADR-0135 defines intersections between declaration-plane external dependencies and
external package advisories as declaration-only potential exposure diagnostics,
not confirmed vulnerable installed-component findings. ADR-0136 exposes external
dependency declarations through exact release metadata while leaving registry-side
advisory diagnostics to a later carrier decision. ADR-0137 defines an
adapter-fed normalized PURL+VERS advisory-match input for comparing external
package advisories with declared external dependencies.

Those decisions leave a carrier question: **where should v0.1 represent the
computed potential exposure diagnostic so clients and conformance runners can
recognize it without turning it into an advisory target, release fact, scanner
finding, API requirement, or resolved-evidence assertion?**

The existing artifact set already has a structured warning shape in
`schemas/warning.schema.json`, warning arrays in validation and conformance
fixture expectations, and result-level warnings in
`schemas/conformance-report.schema.json`. The OpenAPI contract carries errors as
`application/problem+json`, and the advisory API returns volume-targeted advisory
payloads without a warning field.

## Decision Drivers

- Potential exposure diagnostics should be portable enough for clients and
  conformance runners to label the same condition consistently.
- The carrier must not imply that an external package was resolved, fetched,
  installed, bundled, executed, reachable, exploitable, or confirmed vulnerable.
- The carrier must not convert external package advisories into Agent Volumes
  advisory targets or advisory publications.
- Exact release metadata should remain a declaration carrier, not a dynamic
  advisory-matching result carrier.
- Registry-side advisory diagnostic APIs would require freshness, source trust,
  deduplication, withdrawal, severity, and policy semantics that v0.1 does not
  standardize.
- The offline conformance suite should be able to test deterministic PURL and
  VERS intersection behavior without a live bibliotheca or external advisory
  feed.
- Future API, scanner, SBOM, VEX, VDR, SPDX, or resolved-evidence profiles should
  be able to reuse or refine this diagnostic without redefining the v0.1 warning
  semantics.

## Considered Options

- A — Leave potential exposure as local CLI or UI warning text only.
- B — Extend the core warning category set and carry potential exposure as a
  structured warning.
- C — Add a dedicated offline conformance fixture family for potential exposure
  matching and expected warnings.
- D — Carry potential exposure inside Agent Volumes advisory payloads or advisory
  lists.
- E — Carry potential exposure summaries in exact release metadata.
- F — Add a dedicated registry diagnostic API for external dependency potential
  exposure.
- G — Carry potential exposure as `ProblemDetails` or an HTTP error/warning
  mechanism.
- H — Use SBOM, VEX, VDR, or SPDX security documents as the v0.1 core carrier.
- I — Combine structured warning category semantics with dedicated offline
  conformance fixtures.

## Decision Outcome

Chosen option: **I — Combine structured warning category semantics with dedicated
offline conformance fixtures**, because it gives v0.1 a portable diagnostic label
and deterministic test surface without standardizing a live registry diagnostic
API, advisory target, scanner result format, release-metadata result field, or
resolved-evidence profile.

Under this decision:

- Agent Volumes v0.1 carries declaration-only external dependency potential
  exposure as a structured warning diagnostic.
- The core warning category should be named
  `external-dependency-potential-exposure` unless draft 6 schema work adopts an
  equivalent slug with the same semantics.
- The warning may include explanatory fields identifying the affected volume or
  release, the declared external dependency PURL and VERS constraint, optional
  component scope, the normalized advisory source identifier, the advisory
  affected PURL, and the advisory affected VERS range.
- The warning must remain declaration-only. It must not claim that an external
  package was resolved, fetched, installed, bundled, executed, reachable,
  exploitable, or confirmed vulnerable.
- The warning is not an Agent Volumes advisory, not an external package advisory
  publication, not a scanner finding, not a VEX status assertion, and not resolved
  evidence.
- The portable conformance surface should include deterministic offline fixtures
  that combine exact-release external dependency declarations with normalized
  external advisory-match inputs and expected warnings.
- Exact release metadata remains an input carrier for external dependency
  declarations only. It must not become the portable carrier for computed
  potential exposure results in v0.1.
- Agent Volumes advisory payloads and advisory lists remain volume-targeted and
  must not become the v0.1 carrier for external dependency potential exposure.
- Registry-side diagnostic APIs, registry-side diagnostic search, scanner finding
  interchange, resolved external dependency evidence, and SBOM/VEX/SPDX status
  carriers remain local or future-profile surfaces.
- Local policy may choose to block, escalate, suppress, deduplicate, rank, or
  enrich potential exposure warnings, but those policy outcomes are not portable
  v0.1 trust facts.

This decision treats the warning category as the **portable diagnostic carrier**
and the offline fixture family as the **portable verification carrier**. CLI,
UI, API, registry, scanner, and export surfaces may present or transform the
warning locally, but they are not mandatory portable carriers in v0.1.

## Minimal Warning Semantics

The exact schema field names may be finalized during draft 6 artifact work, but
the portable warning semantics are fixed by this decision:

```text
warning:
  category: external-dependency-potential-exposure
  message optional
  dependency:
    purl
    constraint
    components optional
  advisoryMatch:
    sourceKind optional
    sourceId
    aliases optional
    affectedPurl
    affectedRange
  volume:
    purl or name/version optional
```

The warning category carries the normative meaning. Additional fields are
explanatory and must preserve the declaration-only nature of the diagnostic.

## Fixture Semantics

Potential-exposure fixtures should test the matching behavior rather than any
live registry or feed behavior. Fixture cases should cover at least:

- declared dependency PURL matches advisory affected PURL and VERS ranges
  intersect, producing `external-dependency-potential-exposure`
- declared dependency PURL does not match advisory affected PURL, producing no
  potential exposure warning
- declared dependency VERS constraint does not intersect the advisory affected
  range, producing no potential exposure warning
- component-scoped declaration produces a warning whose component scope is
  explanatory context only
- malformed normalized advisory-match input is rejected or categorized separately
  from a potential exposure warning
- source metadata is preserved as explanatory context without becoming portable
  enforcement policy

## Consequences

- Good, because clients and conformance runners get one portable warning category
  for the condition defined by ADR-0135.
- Good, because the model reuses the existing warning pattern instead of adding a
  new live API surface.
- Good, because offline fixtures can verify PURL equality, VERS intersection,
  non-intersection, component-scope context, and correct non-confirmed labeling.
- Good, because exact release metadata stays focused on declarations rather than
  dynamic advisory results.
- Good, because Agent Volumes advisory payloads remain volume-targeted.
- Good, because future registry, scanner, SBOM, VEX, VDR, SPDX, or
  resolved-evidence profiles can reuse the warning category or map it into richer
  carriers.
- Neutral, because `warning.schema.json` may need additional optional fields or a
  companion schema to describe structured potential-exposure context.
- Neutral, because implementers still decide how prominently to display, suppress,
  block, deduplicate, rank, or enrich warnings under local policy.
- Bad, because v0.1 does not provide a portable live API for retrieving
  registry-side potential exposure diagnostics.
- Bad, because declaration-only warnings can still be false positives when later
  resolved evidence shows the dependency was optional, overridden, unused,
  unreachable, or not installed.

## Confirmation

- Verify that draft 6 prose defines `external-dependency-potential-exposure` or
  an equivalent core warning category.
- Verify that warning prose states the diagnostic is declaration-only and is not a
  confirmed vulnerable installed-component finding.
- Verify that `warning.schema.json` or a companion diagnostic schema can carry the
  explanatory dependency, advisory-match, component-scope, and volume context
  without requiring resolved evidence.
- Verify that new conformance fixtures cover PURL match, PURL mismatch, VERS
  intersection, VERS non-intersection, component-scope context, malformed
  normalized input, and source metadata preservation.
- Verify that `conformance-report.schema.json` can report the warning in
  `results[].warnings`.
- Verify that `advisory.schema.json` and `advisory-list.schema.json` remain
  volume-targeted and do not become carriers for external dependency potential
  exposure in v0.1.
- Verify that `release-metadata.schema.json` exposes external dependency
  declarations but does not carry computed potential exposure results in the
  portable baseline.
- Verify that the OpenAPI contract does not add a required registry-side
  diagnostic API for potential exposure in v0.1.

## Pros and Cons of the Options

### A — Leave potential exposure as local CLI or UI warning text only

- Good, because it keeps the specification smallest.
- Good, because each client can choose local phrasing, severity, and display
  behavior.
- Bad, because there is no portable warning category for the same condition across
  clients.
- Bad, because conformance cannot test that declaration-only potential exposure is
  surfaced consistently.
- Bad, because local wording may overstate the result as a confirmed
  vulnerability or understate it as unimportant noise.

### B — Extend the core warning category set and carry potential exposure as a structured warning

- Good, because the repository already has `warning.schema.json`, fixture
  `expected.warnings`, and conformance report `results[].warnings`.
- Good, because warning semantics accurately fit a non-fatal, non-confirmed
  diagnostic.
- Good, because it does not add registry API requirements.
- Neutral, because additional structured fields may be needed for useful context.
- Bad, because a category alone does not fully test PURL/VERS matching behavior.

### C — Add a dedicated offline conformance fixture family for potential exposure matching and expected warnings

- Good, because fixtures can deterministically test declaration PURL and VERS range
  intersection against normalized advisory-match inputs.
- Good, because the fixture suite already avoids live registry, network, and
  universal trust-root dependencies.
- Good, because false positive and non-match cases can be specified explicitly.
- Neutral, because fixture work requires a new schema or case family.
- Bad, because fixtures alone do not give clients a reusable runtime warning
  category unless paired with structured warning semantics.

### D — Carry potential exposure inside Agent Volumes advisory payloads or advisory lists

- Good, because advisory UIs and security tooling already look at advisory
  surfaces.
- Good, because advisory source identity can be nearby.
- Bad, because it blurs volume-targeted Agent Volumes advisories with external
  package advisory matches.
- Bad, because it risks implying external package advisory authority or
  publication by the bibliotheca.
- Bad, because dynamic declaration-only matches do not belong in durable advisory
  payloads.

### E — Carry potential exposure summaries in exact release metadata

- Good, because clients already fetch exact release metadata before installation
  or trust evaluation.
- Good, because the warning can be tied directly to the affected release version.
- Bad, because exact release metadata is the declaration carrier, not a dynamic
  advisory-matching result carrier.
- Bad, because advisory feed freshness, source trust, withdrawal, deduplication,
  and policy choices can change independently of release metadata.
- Bad, because embedding diagnostics in release metadata can make them look like
  release facts or resolved evidence.

### F — Add a dedicated registry diagnostic API for external dependency potential exposure

- Good, because security tools could fetch one focused diagnostic surface.
- Good, because future registries may want server-side matching, caching, and
  sorting.
- Neutral, because this may become valuable after implementation experience.
- Bad, because it standardizes registry-side matching lifecycle, freshness,
  deduplication, trust, severity, and policy too early.
- Bad, because ADR-0136 intentionally leaves such APIs to future carrier work.

### G — Carry potential exposure as `ProblemDetails` or an HTTP error/warning mechanism

- Good, because the API already uses `application/problem+json` for closed error
  categories.
- Good, because local blocking policies can return an error when policy rejects an
  operation.
- Bad, because potential exposure is not inherently an HTTP error.
- Bad, because using error carriers can overstate declaration-only potential
  exposure as a failed validation or confirmed vulnerability.
- Bad, because successful searches, metadata fetches, and offline conformance runs
  still need non-error diagnostics.

### H — Use SBOM, VEX, VDR, or SPDX security documents as the v0.1 core carrier

- Good, because external ecosystems use these documents to communicate security
  status, exploitability, disclosure, and references.
- Good, because future export or resolved-evidence profiles can map potential
  exposure into richer supply-chain documents.
- Bad, because those carriers are too heavy for minimal declaration-plane matching.
- Bad, because VEX/VDR can imply analyzed applicability or component status beyond
  a declaration-only warning.
- Bad, because v0.1 conformance should not require SBOM/VEX/SPDX status semantics
  for this diagnostic.

### I — Combine structured warning category semantics with dedicated offline conformance fixtures

- Good, because it supplies both a runtime diagnostic label and a deterministic
  verification surface.
- Good, because it preserves advisory, release metadata, API, scanner, and
  resolved-evidence boundaries.
- Good, because it aligns with existing warning and conformance report patterns.
- Good, because future profiles can add richer carriers without invalidating the
  warning baseline.
- Neutral, because draft 6 schema work must decide the exact structured fields.
- Bad, because live registry-side diagnostics remain non-portable in v0.1.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- Multiple independent implementations expose registry-side potential exposure
  diagnostics with compatible freshness, source trust, deduplication, severity,
  and withdrawal semantics.
- Clients need a portable live API for potential exposure diagnostics before exact
  release metadata and offline matching are sufficient.
- The structured warning category proves too weak to carry dependency, advisory,
  component-scope, or volume context without ambiguity.
- Agent Volumes defines a resolved-evidence profile that can upgrade
  declaration-only warnings into confirmed external dependency findings.
- Agent Volumes reopens component-level advisory targeting or external package
  advisory mirroring governance.
- SBOM, VEX, VDR, SPDX, SARIF, or another external diagnostic carrier becomes a
  required Agent Volumes export or scanner profile.
- Prominent declaration-only warning diagnostics create unacceptable false-positive
  burden despite clear labeling and local policy controls.

## More Information

Follow-up work should decide:

- exact JSON Schema changes for structured warning context
- whether potential-exposure fixtures get a standalone schema or extend an
  existing validation-case schema
- exact expected warning shape for PURL/VERS match and non-match cases
- whether warning context should include severity or leave severity entirely to
  source metadata and local policy
- how local blocking policies may map potential exposure into `ProblemDetails`
  without making blocking behavior portable
