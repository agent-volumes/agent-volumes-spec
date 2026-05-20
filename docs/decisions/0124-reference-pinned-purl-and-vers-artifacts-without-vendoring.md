---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Reference pinned PURL and VERS artifacts without vendoring

## Context and Problem Statement

ADR-0117 decides that Agent Volumes should use Package URL and VERS-aware semantic
validation rather than reimplementing their grammars in `volume.schema.json`.
ADR-0121 through ADR-0123 define a dedicated external dependency validation fixture
family, medium-granularity failure categories, and successful-case semantic key
expectations.

Those decisions leave a conformance corpus boundary question: **should Agent
Volumes vendor upstream Package URL and VERS fixture suites, merely reference them,
or include only Agent Volumes integration fixtures while citing pinned upstream
artifacts as the compatibility baseline?**

The answer must preserve Agent Volumes' offline, deterministic conformance model
without turning the Agent Volumes fixture suite into a duplicate Package URL or
VERS conformance suite.

## Decision Drivers

- Agent Volumes conformance fixtures should remain offline and deterministic.
- Agent Volumes should avoid maintaining a forked Package URL or VERS test suite.
- Package URL and VERS grammar, canonicalization, and compatibility behavior should
  remain owned by their upstream projects.
- Agent Volumes fixtures should focus on Agent Volumes integration behavior such as
  external dependency declaration validation, non-volume purl enforcement,
  VERS/PURL type compatibility, scope references, duplicates, conflicts, and
  semantic keys.
- Expected canonical Package URL strings in Agent Volumes fixtures need a clear
  upstream basis.
- Upstream artifact references should be stable enough for reproducible review.

## Considered Options

- A — Vendor the full upstream Package URL and VERS fixture suites.
- B — Reference upstream Package URL and VERS artifacts only by unpinned URLs.
- C — Include only Agent Volumes integration fixtures and cite pinned upstream
  Package URL and VERS artifacts as compatibility references.
- D — Vendor a minimal curated subset of upstream-derived Package URL and VERS
  fixtures.

## Decision Outcome

Chosen option: **C — Include only Agent Volumes integration fixtures and cite pinned
upstream Package URL and VERS artifacts as compatibility references**, because it
keeps the Agent Volumes conformance corpus focused while preserving an explicit
source of truth for Package URL and VERS behavior.

Under this decision:

- Agent Volumes should not vendor the full upstream Package URL or VERS fixture
  suites into the v0.1 conformance corpus.
- `external-dependency-validation-cases.json` should contain Agent Volumes-specific
  integration cases only.
- Agent Volumes conformance runners should be able to execute the Agent Volumes
  fixture corpus offline without fetching upstream resources at runtime.
- Conformance documentation should cite pinned upstream Package URL and VERS
  artifacts as compatibility references for parser, canonicalization, grammar, and
  range behavior.
- Pinned references may use immutable release tags, commit SHAs, archived URLs, or
  equivalent immutable identifiers for the upstream artifacts.
- Agent Volumes expected canonical Package URL strings should be interpreted against
  the cited Package URL specification and artifact snapshot.
- VERS validity and scheme behavior should be interpreted against the cited VERS
  specification and artifact snapshot.
- Implementations may run upstream Package URL and VERS test suites separately as
  compatibility checks, but those upstream suites are not copied wholesale into the
  Agent Volumes offline fixture corpus.

This decision only covers upstream artifact reference and fixture vendoring policy.
It does not decide whether Agent Volumes should publish preferred Package URL or
VERS parser/validator library lists. That is a separate architecture decision.

## Consequences

- Good, because Agent Volumes conformance remains offline, deterministic, and
  focused on Agent Volumes semantics.
- Good, because Package URL and VERS remain authoritative for their own grammar,
  canonicalization, and test artifacts.
- Good, because the repository avoids the maintenance burden of syncing full
  upstream fixture suites.
- Good, because fixture authors still have pinned references for expected canonical
  Package URL strings and VERS behavior.
- Neutral, because implementers need to run upstream compatibility tests separately
  if they want stronger assurance for their chosen parser or validator.
- Neutral, because pinned upstream references must be reviewed and updated when the
  Agent Volumes draft updates its compatibility baseline.
- Bad, because the Agent Volumes fixture corpus alone does not prove full Package
  URL or VERS conformance.
- Bad, because pinned reference drift must be managed deliberately rather than
  automatically following upstream changes.

## Confirmation

- Verify that Agent Volumes conformance fixtures do not vendor the complete upstream
  Package URL or VERS test suites.
- Verify that `external-dependency-validation-cases.json` focuses on Agent
  Volumes-specific integration behavior.
- Verify that conformance documentation identifies pinned Package URL and VERS
  upstream artifact snapshots.
- Verify that conformance runners do not require network access to execute the
  Agent Volumes fixture corpus.
- Verify that implementation guidance can recommend separate upstream Package URL
  and VERS compatibility runs without making those vendored Agent Volumes fixtures.

## Pros and Cons of the Options

### A — Vendor the full upstream Package URL and VERS fixture suites

- Good, because Agent Volumes runners could verify upstream compatibility fully
  offline.
- Good, because the exact upstream fixture snapshot would be visible in the repo.
- Bad, because the Agent Volumes fixture corpus would become much larger and less
  focused.
- Bad, because vendored fixtures must be synchronized with upstream releases.
- Bad, because Agent Volumes would appear to maintain a duplicate Package URL or
  VERS conformance suite.

### B — Reference upstream Package URL and VERS artifacts only by unpinned URLs

- Good, because the repository stays small.
- Good, because Agent Volumes clearly delegates Package URL and VERS behavior to
  upstream projects.
- Bad, because unpinned URLs can change behavior over time.
- Bad, because conformance reviewers cannot reproduce which upstream snapshot was
  intended.
- Bad, because expected canonical outputs in Agent Volumes fixtures would have a
  weaker audit trail.

### C — Include only Agent Volumes integration fixtures and cite pinned upstream Package URL and VERS artifacts as compatibility references

- Good, because it preserves offline Agent Volumes conformance while avoiding full
  upstream fixture vendoring.
- Good, because Agent Volumes-specific integration behavior remains the focus of
  the fixture corpus.
- Good, because pinned upstream references provide reproducible context for
  canonicalization and grammar expectations.
- Good, because upstream compatibility testing can remain a separate implementation
  responsibility.
- Neutral, because the pinned references need maintenance as upstream artifacts
  evolve.
- Bad, because the Agent Volumes fixture corpus alone cannot certify complete
  Package URL or VERS parser behavior.

### D — Vendor a minimal curated subset of upstream-derived Package URL and VERS fixtures

- Good, because selected edge cases can be verified offline inside the Agent
  Volumes corpus.
- Good, because the fixture set is lighter than full vendoring.
- Neutral, because curated examples can be useful for documentation.
- Bad, because subset selection is inherently subjective.
- Bad, because curated copies can drift from upstream fixtures.
- Bad, because partial upstream vendoring can create unclear claims about Package
  URL or VERS conformance coverage.

## More Information

Follow-up work should decide:

- where pinned upstream Package URL and VERS artifact references are recorded
- which exact Package URL and VERS upstream revisions are cited for v0.1
- whether conformance reports should include optional metadata identifying the
  upstream Package URL and VERS artifact snapshots used by an implementation
- whether Agent Volumes should publish non-normative preferred parser/validator
  library guidance
