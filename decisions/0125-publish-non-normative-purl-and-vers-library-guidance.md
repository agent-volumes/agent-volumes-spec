---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Publish non-normative PURL and VERS library guidance

## Context and Problem Statement

ADR-0117 decides that Agent Volumes should rely on Package URL and VERS-aware
semantic validation rather than reimplementing their grammars. ADR-0124 decides
that Agent Volumes should keep its conformance corpus focused on Agent
Volumes-specific integration fixtures while citing pinned upstream Package URL and
VERS artifacts instead of vendoring the full upstream fixture suites.

That leaves a tooling guidance question: **should Agent Volumes provide a list of
preferred Package URL and VERS parser or validator libraries, and if so, should
that list be normative or non-normative?**

This decision is about implementation guidance only. It does not change the
normative authority of Agent Volumes prose, schemas, conformance fixtures, or the
pinned upstream Package URL and VERS artifacts referenced by ADR-0124.

## Decision Drivers

- Implementers should be encouraged to use mature Package URL and VERS tooling
  rather than writing bespoke parsers.
- Agent Volumes should not make a particular library's bugs, release cadence, or
  language ecosystem availability part of the standard.
- Package URL has official or project-maintained libraries in several languages;
  VERS library maturity is less uniform.
- Mature standards projects commonly separate normative specifications and
  conformance suites from non-normative tool directories, known implementation
  lists, validators, or reference implementations.
- Tool listings can be misread as endorsement or certification unless the guidance
  includes explicit guardrails.

## Ecosystem Precedents

- JSON Schema publishes specifications and test suites separately from tooling
  listings. Its tooling guidance states that listing a tool does not signify
  recommendation or endorsement.
- OpenAPI keeps the OpenAPI Specification authoritative while community tooling is
  listed separately through a community tool directory.
- SPDX publishes specifications, schemas, and validation artifacts separately from
  tooling lists, and states that tool listings are non-exhaustive and not a
  certification program.
- CycloneDX maintains a Tool Center separate from the specification; tools help
  adoption but do not replace schema/spec conformance.
- Kubernetes documents supported and community client libraries while conformance
  remains tied to API behavior and conformance tests, not library selection.
- OCI specifications and conformance tools remain authoritative while reference
  implementations and practical tools serve as implementation aids.
- W3C and IETF practice distinguishes normative requirements from informative
  implementation notes, validators, examples, and implementation reports.

## Considered Options

- A — Publish a normative preferred-library list.
- B — Publish non-normative implementation guidance listing known parser and
  validator libraries.
- C — Maintain a structured tool or library registry.
- D — Publish no library guidance.
- E — Publish non-normative guidance limited to official or project-maintained
  libraries only.

## Decision Outcome

Chosen option: **B — Publish non-normative implementation guidance listing known
parser and validator libraries**, with a preference order that prioritizes mature
official or project-maintained libraries.

Under this decision, Agent Volumes may publish implementation guidance that lists
known Package URL and VERS parser or validator libraries. The guidance should use
this preference order:

1. official or project-maintained Package URL or VERS libraries, when mature and
   available for the implementation language
2. community-maintained libraries that are demonstrably compatible with the pinned
   upstream Package URL or VERS artifacts
3. bespoke parser or validator implementations only when no mature library is
   available, and only when tested against the relevant upstream artifacts

The library guidance is non-normative. Listed libraries are not required for Agent
Volumes conformance, and listing a library does not imply endorsement,
certification, security review, or fitness for any deployment.

When library behavior conflicts with Agent Volumes requirements or with the pinned
Package URL and VERS artifacts referenced by ADR-0124, the normative Agent Volumes
requirements and cited upstream artifacts take precedence over the listed library's
behavior.

Guidance should clearly mark the checked scope, such as language, package name,
upstream project or maintainer, supported Package URL or VERS feature area, last
review date, and known caveats where practical. VERS guidance should be especially
careful to distinguish project artifacts and tests from less mature parser library
ecosystems.

## Consequences

- Good, because implementers get practical help without turning library selection
  into a conformance requirement.
- Good, because mature official or project-maintained libraries are preferred when
  available.
- Good, because the approach matches mature standards practice that separates specs
  and conformance from tooling directories.
- Good, because Agent Volumes reduces pressure to write bespoke PURL or VERS
  parsers while keeping upstream artifacts authoritative.
- Neutral, because the guidance still requires maintenance and freshness review.
- Neutral, because users may still need to evaluate library security, licensing,
  performance, and feature coverage locally.
- Bad, because implementers may over-read listed libraries as endorsed unless the
  disclaimer is prominent.
- Bad, because non-normative guidance cannot guarantee identical behavior across
  all implementations.

## Confirmation

- Verify that preferred Package URL and VERS library guidance is published only as
  non-normative implementation guidance.
- Verify that the guidance says listed libraries are not required for conformance
  and are not endorsed or certified by Agent Volumes.
- Verify that official or project-maintained libraries are listed before community
  libraries when they are mature and available.
- Verify that community libraries are presented as implementation aids only and
  should be checked against the pinned upstream artifacts.
- Verify that any conflict between a listed library and normative Agent Volumes or
  upstream Package URL/VERS artifacts is resolved in favor of the normative text and
  pinned artifacts.

## Pros and Cons of the Options

### A — Publish a normative preferred-library list

- Good, because implementers receive a very clear library selection path.
- Good, because behavior may be more consistent when many implementations use the
  same libraries.
- Bad, because library bugs and release cadence can become de facto standard
  behavior.
- Bad, because language ecosystems with no blessed library are disadvantaged.
- Bad, because VERS library maturity is not uniform enough for a normative list.
- Bad, because Agent Volumes would inherit supply-chain and governance obligations
  for listed libraries.

### B — Publish non-normative implementation guidance listing known parser and validator libraries

- Good, because it improves implementer experience while preserving conformance
  neutrality.
- Good, because it can prefer official or project-maintained libraries without
  requiring them.
- Good, because it follows JSON Schema, OpenAPI, SPDX, CycloneDX, Kubernetes, OCI,
  W3C, and IETF-style separation between normative artifacts and implementation
  aids.
- Neutral, because the guidance needs periodic review.
- Bad, because listed libraries can still be mistaken for endorsements if the
  disclaimer is weak.

### C — Maintain a structured tool or library registry

- Good, because a registry can scale better than prose as the ecosystem grows.
- Good, because it can capture language, license, maintainer, feature coverage,
  last-verified date, and fixture compatibility metadata.
- Neutral, because this may become useful after multiple independent
  implementations exist.
- Bad, because v0.1 would need registry governance, submission rules, freshness
  checks, and endorsement disclaimers.
- Bad, because a registry is likely premature while PURL/VERS integration is still
  being standardized.

### D — Publish no library guidance

- Good, because it has the lowest maintenance burden.
- Good, because it avoids endorsement or certification confusion entirely.
- Bad, because implementers are more likely to write inconsistent bespoke parsers.
- Bad, because adoption becomes harder for implementers unfamiliar with Package URL
  or VERS tooling.
- Bad, because it weakens the practical effect of ADR-0117's preference for using
  upstream artifacts and tooling.

### E — Publish non-normative guidance limited to official or project-maintained libraries only

- Good, because it narrows endorsement risk and maintenance scope.
- Good, because it fits Package URL ecosystems where official or project-maintained
  libraries exist.
- Neutral, because it can be a useful subset of the chosen guidance policy.
- Bad, because VERS may not have mature official libraries across languages.
- Bad, because high-quality community libraries that pass upstream fixtures would
  be omitted.
- Bad, because implementers in unsupported languages would receive little help.

## More Information

Follow-up work should decide:

- where to publish the non-normative library guidance, such as `IMPLEMENTERS.md`, a
  dedicated implementation note, or a future docs page
- what metadata fields to include for listed libraries
- how often maintainers review listed libraries for freshness and compatibility
- whether to require a last-reviewed date and upstream fixture compatibility note
- whether a structured registry becomes necessary after the implementation
  ecosystem grows
