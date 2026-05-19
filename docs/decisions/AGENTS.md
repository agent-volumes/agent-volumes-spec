# DECISION RECORDS

Architecture and specification decision records (ADRs) for Agent Volumes. Non-normative context — the prose specification and companion artifacts define the current release surface.

## STRUCTURE

Flat directory of 155 sequentially numbered records: `0001-*.md` through `0155-*.md`. No subdirectories. Use `README.md` as the live topic index before editing.

## WHERE TO LOOK

| Task                                     | Records                                                                                                                                              | Notes                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Identity and manifest model              | `0001-*`, `0002-*`, `0012-*`, `0048-0051-*`, `0109-0134-*`, `0139-0140-*`, `0142-0144-*`, `0146-0149-*`                                              | Largest topic area                                  |
| Component taxonomy and loading           | `0003-*`, `0084-0089-*`                                                                                                                              | Seven component types                               |
| Content integrity and release subject    | `0007-*`, `0013-*`, `0014-*`, `0090-*`, `0102-*`                                                                                                     | Digest construction, normalization                  |
| Trust and supply chain                   | `0005-*`, `0006-*`, `0008-0010-*`, `0015-*`, `0022-*`, `0023-*`, `0026-*`, `0027-*`, `0030-0032-*`, `0095-*`, `0099-*`, `0103-*`, `0108-*`, `0142-*` | Publisher identity, provenance, advisories          |
| Registry API, resolver, and upload       | `0019-*`, `0091-*`, `0097-0098-*`, `0100-0101-*`, `0106-*`, `0136-*`, `0152-*`                                                                       | Bibliotheca HTTP API                                |
| Capability metadata and extensions       | `0060-0083-*`, `0107-*`, `0141-*`                                                                                                                    | Bridge metadata, extension namespaces               |
| Conformance and readiness structure      | `0020-*`, `0028-0029-*`, `0104-*`, `0144-0151-*`                                                                                                     | Fixture families, runner contract                   |
| Public documentation and URI publication | `0153-*`, `0154-*`, `0155-*`                                                                                                                         | Mintlify platform, `site/` topology, domain routing |
| Check deferred topics                    | `0011-*`, `0015-*`, `0021-*`, `0028-*`, `0054-*`, `0084-*`, `0089-*`, `0092-0094-*`, `0096-0097-*`, `0100-*`, `0103-*`, `0106-*`, `0137-0138-*`      | Intentionally outside v0.1 baseline                 |

## CONVENTIONS

- Records are numbered chronologically; use the next available prefix when adding.
- Each record states the decision, consequences, rejected alternatives, and any reopening triggers.
- Later records can refine or supersede earlier direction — read the latest in a topic area first.
- Status values include `accepted`, `superseded by ADR-xxxx`, and `accepted, updated by ADR-xxxx`; preserve historical records instead of rewriting them for later decisions.
- Deferred topics are not accidental spec gaps unless the record's own trigger conditions are met.

## ANTI-PATTERNS

- Do **not** treat deferred topics as v0.1 readiness gaps unless the corresponding ADR trigger is met.
- Do **not** treat ADR records as normative requirements — they are context, not specification.
- Do **not** add a record without updating `README.md` if it creates a new baseline anchor or deferred topic.
- Do **not** change normative behavior in an ADR without also updating `agent-volumes-spec.md`, `schemas/`, `openapi/`, or `conformance/`.
