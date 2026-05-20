# Agent Volumes Artifact Architecture

This document explains how the major artifacts in this repository fit together.
It is a high-level design map for contributors and reviewers.

## Authority model

| Artifact                                                                  | Role                                          | Authority                                                 |
| ------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------- |
| [`agent-volumes-spec.md`](../agent-volumes-spec.md)                       | Normative prose specification                 | Final normative authority                                 |
| [`schemas/`](../schemas/)                                                 | JSON Schema contracts for structured data     | Normative companion artifacts, version-aligned with prose |
| [`openapi/bibliotheca.openapi.yaml`](../openapi/bibliotheca.openapi.yaml) | Bibliotheca HTTP API contract                 | Machine-readable API companion to spec §9                 |
| [`conformance/fixtures/`](../conformance/fixtures/)                       | Offline deterministic fixture corpus          | Normative conformance vectors for covered behavior        |
| [`conformance/REQUIREMENTS.md`](../conformance/REQUIREMENTS.md)           | Requirement inventory and coverage boundaries | Readiness and traceability guide                          |
| [`docs/decisions/`](decisions/)                                           | Architecture Decision Records                 | Non-normative decision history                            |
| [`IMPLEMENTERS.md`](../IMPLEMENTERS.md)                                   | Practical implementation guide                | Non-normative guide for prototypes                        |

## Artifact flow

Specification changes start in the prose. When a change affects structured
behavior, reviewers check whether the change also updates schemas, OpenAPI,
fixtures, coverage metadata, and implementer guidance.

```text
agent-volumes-spec.md
  ├─ schemas/                         structured contracts
  ├─ openapi/bibliotheca.openapi.yaml  HTTP API contract
  ├─ conformance/fixtures/             deterministic examples and vectors
  ├─ conformance/REQUIREMENTS.md       coverage and boundary inventory
  └─ docs/decisions/                   rationale and superseded alternatives
```

## Change categories

| Change type                           | Expected companion updates                                                                               |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Editorial clarification               | Prose only, unless examples or anchors move.                                                             |
| Normative requirement change          | Prose, affected schemas, fixtures, coverage metadata, and changelog / release notes.                     |
| Schema shape change                   | Prose, schema `$id` alignment, fixtures, validator expectations, and OpenAPI references when applicable. |
| API endpoint change                   | Prose §9, OpenAPI operation, problem details, fixtures, and prose drift audit.                           |
| Conformance behavior change           | Prose requirement, fixture family, coverage map, and `conformance/REQUIREMENTS.md`.                      |
| Deferred/local-policy boundary change | ADR update or new ADR plus the relevant guide or boundary document.                                      |

## Boundary principles

- Prose remains the final authority when generated or companion artifacts appear
  to disagree.
- Companion artifacts are still first-class review targets; drift is a release
  blocker.
- Conformance labels describe offline artifact/vector coverage only. They are
  not certification badges.
- Prototype-local choices are documented as local policy, not implied portable
  requirements.
