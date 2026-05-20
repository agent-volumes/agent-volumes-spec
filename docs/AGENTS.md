# PROJECT DOCUMENTATION

Process, readiness, governance, release, review, and security docs for the Agent Volumes specification repository. These files support maintainers; they do not replace the normative spec or companion artifacts.

## STRUCTURE

```text
docs/
├── README.md                         # Documentation map + policy boundary
├── architecture.md                    # Artifact architecture overview
├── mintlify-site-maintenance.md       # Publication-layer maintenance model
├── release-process.md                 # Release freeze, changelog, tag flow
├── review-policy.md                   # PR/review expectations
├── development/                       # Validation workflow + starter issues
├── governance/                        # Roles and continuity
├── security/                          # Requirements + vulnerability response
└── decisions/                         # ADR corpus; see nested AGENTS.md
```

## WHERE TO LOOK

| Task                         | Location                                    | Notes                                  |
| ---------------------------- | ------------------------------------------- | -------------------------------------- |
| Check doc map                | `README.md`                                 | Process docs only, not site navigation |
| Validate change requirements | `development/validation-and-conformance.md` | Commands by artifact/change type       |
| Review release gate          | `release-process.md`                        | Includes site OpenAPI rebuild + lint   |
| Review PR policy             | `review-policy.md`                          | Editorial vs normative change handling |
| Check maintainer roles       | `governance/roles-and-continuity.md`        | Bus factor and continuity expectations |
| Check security posture       | `security/security-requirements.md`         | Goals, non-goals, trust boundaries     |
| Check vulnerability flow     | `security/vulnerability-response.md`        | Disclosure and response runbook        |
| Edit ADRs                    | `decisions/`                                | Use `decisions/AGENTS.md` first        |
| Edit public docs site        | `../site/`                                  | Separate Mintlify publication layer    |

## CONVENTIONS

- `docs/` adds repository-local process details; organization-wide policies remain in `agent-volumes/.github` unless a local document explicitly narrows spec-specific process.
- Human-readable dates may use five-digit Human Era / Holocene Era years such as `12026`; do not normalize them to Gregorian four-digit years.
- Keep source-of-truth hierarchy explicit: `../agent-volumes-spec.md` is normative; schemas/OpenAPI/conformance are companion artifacts; ADRs are decision/history context.
- Site-maintenance prose may describe publication workflow, but `../site/` is the Mintlify source tree.

## ANTI-PATTERNS

- Do **not** treat process docs as normative requirements unless they explicitly amend repository process.
- Do **not** move public documentation pages into `docs/`; ADR-0154 keeps Mintlify source under `../site/`.
- Do **not** rewrite historical ADR meaning from process docs; add or update ADRs and canonical artifacts instead.
- Do **not** list deferred ADR topics as release blockers unless their reopening triggers are met.

## COMMANDS

```bash
bun run format:check
bun run lint:md
bun run changelog:check
```
