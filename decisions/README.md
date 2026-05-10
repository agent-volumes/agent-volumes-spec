# Agent Volumes Decision Records

This directory records architecture and specification decisions for Agent
Volumes. Decision records are part of the project context for v0.1 readiness
review, but the prose specification and its companion artifacts define the
current normative release surface.

## How to read the records

- Records are numbered chronologically: `0001-...md`, `0002-...md`, and so on.
- Later records may refine or supersede earlier direction. Read the latest
  records in the affected topic area before drawing conclusions.
- Deferred topics should not be treated as accidental spec gaps unless the
  corresponding record says its reconsideration trigger has been met.

## Current v0.1 baseline anchors

| Topic                                 | Key records                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Identity and manifest model           | `0001-*`, `0002-*`, `0012-*`, `0048-*`, `0049-*`, `0050-*`, `0051-*`                                                                                                     |
| Component taxonomy and loading        | `0003-*`, `0084-*`, `0085-*`, `0086-*`, `0087-*`, `0088-*`, `0089-*`                                                                                                     |
| Content integrity and release subject | `0007-*`, `0013-*`, `0014-*`, `0090-*`, `0102-*`                                                                                                                         |
| Trust and supply chain                | `0005-*`, `0006-*`, `0008-*`, `0009-*`, `0010-*`, `0015-*`, `0022-*`, `0023-*`, `0026-*`, `0027-*`, `0030-*`, `0031-*`, `0032-*`, `0095-*`, `0099-*`, `0103-*`, `0108-*` |
| Advisories                            | `0021-*`, `0033-*` through `0042-*`, `0092-*`, `0105-*`                                                                                                                  |
| Machine-readable artifacts            | `0016-*`, `0017-*`, `0020-*`, `0043-*` through `0047-*`                                                                                                                  |
| Capability metadata and extensions    | `0060-*` through `0083-*`, `0107-*`                                                                                                                                      |
| Registry API, resolver, and upload    | `0019-*`, `0091-*`, `0097-*`, `0098-*`, `0100-*`, `0101-*`, `0102-*`, `0106-*`                                                                                           |
| Conformance and readiness structure   | `0020-*`, `0028-*`, `0029-*`, `0104-*`                                                                                                                                   |

## Explicitly deferred v0.1 topics

The following topics are intentionally outside the portable v0.1 baseline unless
their records are reopened:

- common derived-judgment vocabulary (`0011-*`)
- scanner-finding interchange (`0015-*`)
- component-level advisory targeting (`0021-*`)
- future strict/enterprise profiles beyond the v0.1 core (`0028-*`)
- structured deprecation metadata (`0054-*`)
- broader MCP configuration formats such as YAML (`0084-*`)
- finer permission granularity beyond the read/write baseline (`0089-*`)
- advisory write semantics (`0092-*`)
- universal prerelease-resolution policy (`0093-*`)
- transitive bundle semantics for `role = "meta"` (`0094-*`)
- AI-specific BOM profile guarantees beyond the generic CycloneDX baseline (`0096-*`)
- registry-priority policy and lockfile format (`0019-*`, `0097-*`, `0100-*`)
- universal trust-root policy (`0103-*`)
- upload profiles beyond required `http-put` (`0106-*`)

Reviewers should keep these items out of v0.1 readiness blocking lists unless a
record's own trigger conditions have been satisfied.

## Maintenance checklist

When adding a decision record:

1. Use the next numeric prefix.
2. State the decision, consequences, rejected alternatives, and any reopening
   triggers.
3. Update this README if the decision creates a new baseline anchor or deferred
   topic.
4. Update `agent-volumes-spec.md`, `schemas/`, `openapi/`, or `conformance/`
   when the decision changes normative behavior.
