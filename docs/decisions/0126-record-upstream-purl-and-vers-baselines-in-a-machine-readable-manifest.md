---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Record upstream PURL and VERS baselines in a machine-readable manifest

## Context and Problem Statement

ADR-0124 decides that Agent Volumes should not vendor full upstream Package URL or
VERS fixture suites, but should cite pinned upstream artifacts as compatibility
references. ADR-0125 decides that parser and validator library guidance is
non-normative and that the pinned upstream artifacts remain authoritative over
listed library behavior.

That leaves a placement and structure question: **where should Agent Volumes record
the pinned upstream Package URL and VERS artifact references, and should that record
be prose-only, machine-readable, or part of conformance report metadata?**

The answer must support reproducible review, offline Agent Volumes fixture
execution, and future automation without turning upstream Package URL or VERS test
suites into vendored Agent Volumes fixtures.

## Decision Drivers

- Pinned upstream Package URL and VERS baselines should be reviewable and
  reproducible.
- Tooling should be able to discover the intended upstream baseline without parsing
  prose tables.
- Agent Volumes conformance runners should still execute the Agent Volumes fixture
  corpus offline.
- The pinned baseline record should not be confused with vendored upstream fixture
  content.
- Future conformance reports may need to state which upstream compatibility
  snapshots an implementation actually tested, but that evidence is distinct from
  the specification's own baseline record.
- Existing repository patterns already use machine-readable conformance artifacts
  such as `conformance-coverage.json` for traceability.

## Considered Options

- A — Record pinned upstream references only in `conformance/README.md` prose.
- B — Add a small machine-readable upstream baseline manifest.
- C — Record the upstream baseline as a schema-owned registry artifact.
- D — Record upstream baseline information only in conformance reports.
- E — Use git submodules or subtrees to pin upstream artifacts.
- F — Use implementation dependency lockfiles to pin upstream artifacts.
- G — Use a machine-readable baseline manifest plus conformance report metadata in
  the initial baseline.

## Decision Outcome

Chosen option: **B — Add a small machine-readable upstream baseline manifest**,
because it records the specification's pinned upstream baseline immediately without
expanding the conformance report schema before implementation evidence needs are
concrete.

The upstream baseline manifest should be a small JSON artifact, initially located
under `conformance/`, such as:

```text
conformance/upstream-baselines.json
```

The manifest should record pinned Package URL and VERS baseline references without
vendoring their contents. At minimum, each baseline entry should identify:

- `name` — stable baseline name such as `purl-spec` or `vers-spec`
- `upstream` — canonical upstream repository or project URL
- `revision` — immutable release tag, commit SHA, dated URL, or equivalent pinned
  upstream identifier
- `purpose` — why Agent Volumes cites the baseline, such as Package URL syntax,
  Package URL canonicalization, Package URL type definitions, VERS grammar, VERS
  schemas, or VERS tests
- `artifacts` — relevant upstream artifact paths or immutable retrieval URLs
- `lastReviewed` — the date the pinned reference was reviewed for the current Agent
  Volumes draft

Optional fields may include artifact kind, license, digest, archive URL, or notes if
they prove useful, but v0.1 should keep the manifest small.

`conformance/README.md` and implementation guidance should cite the
machine-readable manifest as the source of pinned upstream Package URL and VERS
compatibility references.

Conformance report metadata should not be required in the initial implementation of
this decision. A later ADR may add optional conformance report fields that identify
which upstream Package URL and VERS artifact snapshots an implementation tested.
That future report metadata would be implementation evidence, not the specification's
canonical baseline record.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- implementations begin reporting upstream Package URL or VERS compatibility
  results alongside Agent Volumes fixture results
- the project needs machine-readable evidence showing which upstream Package URL or
  VERS snapshots were actually tested by a conformance runner
- multiple independent implementations produce incompatible or non-comparable local
  formats for upstream compatibility evidence
- conformance reports need to distinguish Agent Volumes fixture results from
  separately executed upstream Package URL or VERS test-suite results

If reopened, the follow-up ADR should evaluate optional conformance report metadata
that references the upstream baseline manifest without replacing it as the
specification's canonical baseline record.

## Consequences

- Good, because pinned upstream Package URL and VERS references become
  machine-readable and reviewable.
- Good, because the approach aligns with existing machine-readable conformance
  traceability artifacts.
- Good, because Agent Volumes avoids vendoring upstream fixture suites while still
  making the intended upstream snapshot explicit.
- Good, because future conformance report metadata can build on the baseline
  manifest instead of inventing a separate source of truth.
- Neutral, because the manifest needs a schema or validation rule if it becomes part
  of the formal artifact validation pipeline.
- Neutral, because digest fields are deferred until the project decides how much
  integrity metadata to require for externally hosted upstream artifacts.
- Bad, because another artifact must be maintained when upstream Package URL or VERS
  references are updated.
- Bad, because the manifest does not by itself prove that any implementation ran the
  upstream Package URL or VERS test suites.

## Confirmation

- Verify that pinned Package URL and VERS references are recorded in a
  machine-readable upstream baseline manifest.
- Verify that the manifest records at least name, upstream URL, revision, purpose,
  artifact references, and last-reviewed date.
- Verify that conformance documentation points to the manifest rather than relying
  only on prose references.
- Verify that upstream Package URL and VERS fixture suites are not vendored into the
  Agent Volumes conformance corpus.
- Verify that conformance report metadata for implementation-tested upstream
  snapshots remains a future extension rather than an immediate requirement.

## Pros and Cons of the Options

### A — Record pinned upstream references only in `conformance/README.md` prose

- Good, because it is simple and human-readable.
- Good, because it follows traditional standards-style reference sections.
- Bad, because tooling cannot reliably consume the baseline without prose parsing.
- Bad, because drift detection and automated review are harder.
- Bad, because the pinned baseline is less visible as a structured artifact.

### B — Add a small machine-readable upstream baseline manifest

- Good, because it is explicit, reviewable, and tool-readable.
- Good, because it matches the repository's artifact-first conformance pattern.
- Good, because it preserves ADR-0124's no-vendoring boundary.
- Good, because it can be cited from prose documentation and implementation guides.
- Neutral, because the exact schema can remain small at first.
- Bad, because it adds another maintained artifact.

### C — Record the upstream baseline as a schema-owned registry artifact

- Good, because field shape and validation become very explicit.
- Good, because artifact validation can enforce the baseline manifest structure.
- Neutral, because this may be appropriate if the baseline manifest grows.
- Bad, because it may over-formalize a small external reference inventory too early.
- Bad, because it blurs whether the artifact is a schema family, a conformance
  fixture, or an external reference registry.

### D — Record upstream baseline information only in conformance reports

- Good, because reports can capture what a specific implementation actually tested.
- Good, because it mirrors evidence-submission models used by conformance programs.
- Bad, because it does not define the specification's intended upstream baseline.
- Bad, because different reports could cite different snapshots with no common
  source of truth.
- Bad, because it cannot replace a pinned baseline record for fixture authors and
  reviewers.

### E — Use git submodules or subtrees to pin upstream artifacts

- Good, because commit pinning is precise and offline execution is possible.
- Good, because it is a known pattern for consuming external test suites.
- Bad, because it conflicts with ADR-0124's decision not to vendor upstream suites.
- Bad, because the repository would grow and inherit upstream fixture maintenance.
- Bad, because Agent Volumes conformance could appear to include full Package URL or
  VERS conformance coverage.

### F — Use implementation dependency lockfiles to pin upstream artifacts

- Good, because lockfiles are useful for reproducing tool dependencies.
- Good, because implementation projects may choose this locally.
- Bad, because library versions are not the same as upstream specification or test
  artifact revisions.
- Bad, because lockfiles are language and toolchain specific.
- Bad, because this does not provide a standards-level baseline record.

### G — Use a machine-readable baseline manifest plus conformance report metadata in the initial baseline

- Good, because it records both the specification's baseline and implementation
  evidence from the start.
- Good, because conformance reports could state which upstream Package URL and VERS
  snapshots a runner actually tested.
- Neutral, because this may become useful once multiple implementations run
  upstream compatibility suites.
- Bad, because report metadata is premature before concrete reporting needs exist.
- Bad, because it expands the conformance report schema before the baseline manifest
  itself is proven sufficient.

## More Information

Follow-up work should decide:

- the exact `conformance/upstream-baselines.json` schema or validation rule
- the exact Package URL and VERS upstream revisions for the current draft
- whether digest fields are required, optional, or deferred
- whether future conformance reports should include optional upstream compatibility
  evidence metadata
- whether `conformance/upstream-baselines.json` should be covered by
  `validate:artifacts`
