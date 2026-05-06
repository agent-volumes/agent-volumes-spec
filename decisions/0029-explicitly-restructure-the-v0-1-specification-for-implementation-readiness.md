---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Explicitly restructure the v0.1 specification for implementation readiness

## Context and Problem Statement

The v0.1 review and decision loop has now made the draft significantly more concrete in areas such as digesting, trust artifacts, API contracts, conformance fixtures, resolver behavior, publisher verification, and profile boundaries.

That creates a document-structure question: **should these implementation-readiness decisions simply be woven into the existing chapter structure, or should the specification be explicitly reorganized so the implementation baseline is structurally visible?**

Without structural clarification, many of the newly chosen requirements may remain hard for readers to discover and reason about as a coherent implementation baseline.

## Decision Drivers

- Make the implementation-ready baseline easy for readers and implementers to locate
- Reflect the newly strengthened core/profile/conformance distinctions in the document structure itself
- Reduce the risk that major new decisions remain scattered across unrelated sections
- Keep the specification legible as both a standards document and an implementation reference point

## Considered Options

- A — Explicitly restructure the specification around implementation-readiness concerns
- B — Keep the existing structure and weave the new decisions into existing sections
- C — Leave the main specification lighter and move much of the implementation-readiness framing into companion documentation

## Decision Outcome

Chosen option: **A — Explicitly restructure the specification around implementation-readiness concerns**, because the volume of implementation-defining decisions now warrants a clearer structural presentation in the main standard itself.

Under this decision:

- the v0.1 specification should visibly incorporate implementation-readiness-oriented structure
- the document should provide a clearer place for core-vs-profile boundaries, normative conformance artifacts, and related trust-lifecycle clarifications
- implementation-readiness framing should remain in the main specification rather than being treated as a secondary companion-only concern

### Consequences

- Good, because implementers can locate the practical interoperability baseline more easily
- Good, because the structure of the spec will better reflect the actual maturity and specificity of its decisions
- Good, because core/profile/conformance distinctions become easier to understand and maintain
- Neutral, because the exact editorial form of the restructuring can still be refined during drafting
- Bad, because restructuring the document creates additional editorial work and may require careful navigation updates

### Confirmation

- Verify that the restructured specification makes implementation-defining requirements easier to discover and follow
- Verify that readers can distinguish baseline core requirements, future profile candidates, and conformance artifacts more clearly than before
- Verify that structural changes improve clarity without changing the meaning of already accepted technical decisions

## Pros and Cons of the Options

### A — Explicitly restructure the specification around implementation-readiness concerns

- Good, because it gives the strengthened implementation baseline a visible home in the main spec
- Good, because it reduces the risk that important requirements remain scattered and hard to synthesize
- Good, because it supports both implementers and reviewers better than a purely incremental editorial update
- Neutral, because the exact section layout can still evolve as long as the structural intent is preserved
- Bad, because it requires more editorial coordination than simply editing existing paragraphs in place

### B — Keep the existing structure and weave the new decisions into existing sections

- Good, because it minimizes document churn and preserves familiar chapter ordering
- Good, because it may reduce the amount of immediate editorial restructuring work
- Neutral, because some readers already familiar with the current structure may prefer incremental updates
- Bad, because major new implementation-readiness decisions may remain too dispersed
- Bad, because the new core/profile/conformance distinctions may stay harder to see as a coherent whole

### C — Leave the main specification lighter and move much of the implementation-readiness framing into companion documentation

- Good, because it keeps the main specification shorter and potentially more conceptually focused
- Good, because companion documents can evolve independently in some cases
- Neutral, because some projects do keep practical implementation framing outside the main standard text
- Bad, because it weakens the goal of making the specification itself implementation-ready enough for independent work
- Bad, because normative understanding may become too dependent on secondary documents
