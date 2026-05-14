---
status: accepted
date: 12026-05-14
decision-makers: Yunseo Kim
---

# Treat external dependency advisory matches as potential exposure

## Context and Problem Statement

ADR-0021 limits v0.1 security advisory targeting to volume identity and affected
volume version ranges. ADR-0040 allows informational component impact metadata,
but component impact does not change the normative volume-level advisory target.

ADR-0115 adds optional `components` scope to external dependency declarations.
ADR-0116 then states that advisory matching against declaration-plane external
dependencies produces potential exposure, not confirmed vulnerable installed-
component findings. ADR-0130 leaves confirmed resolved external dependency evidence
to a future profile.

Those decisions leave an interpretation question: **when a component-scoped
external dependency declaration intersects an external package advisory, what
should v0.1 call that result, and how strongly should clients surface it?**

## Decision Drivers

- v0.1 advisory targeting must remain volume-level unless ADR-0021 is reopened.
- Component-scoped external dependency declarations provide useful diagnostic
  context but are not component-level advisory targets.
- Declaration-only matches are not resolved package evidence, lockfile evidence,
  runtime inventory, scanner findings, or proof of exploitability.
- Agentic AI workflows can make even declaration-only potential exposure highly
  threatening because agent components may invoke tools, handle credentials, run
  code, or mediate sensitive user workflows.
- Clients should not hide potential exposure merely because it is not confirmed
  resolved evidence.
- Future resolved-evidence profiles should be able to upgrade or refine this model
  without redefining declaration-plane semantics.

## Considered Options

- A — Strict volume-only matching: ignore component-scoped external dependency
  declarations for advisory diagnostics.
- B — Keep advisory targets volume-level, but emit component-scoped
  declaration-only potential exposure diagnostics.
- C — Treat component-scoped external dependency matches as component-level advisory
  targets.
- D — Treat declaration-only external dependency matches as confirmed vulnerable
  findings.
- E — Use a two-tier model that distinguishes potential exposure from confirmed
  external dependency evidence.
- F — Leave declaration-only external dependency advisory matching entirely to
  local policy.

## Decision Outcome

Chosen option: **B — Keep advisory targets volume-level, but emit
component-scoped declaration-only potential exposure diagnostics**, with explicit
separation between potential exposure and confirmed findings.

Under this decision:

- v0.1 advisories remain volume-targeted. A declaration-only external dependency
  match must not create a component-level advisory target.
- If an external dependency declaration's package identity and VERS constraint
  intersect an advisory's affected package and version range, clients should
  prominently report a **declaration-only potential exposure** diagnostic for the affected volume
  version.
- If the matching declaration has `components` scope, the diagnostic may include
  that component scope as explanatory context.
- A declaration-only potential exposure diagnostic does not prove that the package
  was resolved, fetched, installed, bundled, executed, incorporated, reachable, or
  exploitable.
- A declaration-only potential exposure diagnostic is not a confirmed vulnerable
  installed-component finding.
- Clients and bibliothecas should surface declaration-only potential exposure
  prominently, especially in agentic AI workflows where declared dependencies can
  influence tool execution, credential handling, generated code, or user-mediated
  actions.
- Local policy may block, warn, escalate, or require review based on potential
  exposure, but such outcomes are policy judgments rather than canonical confirmed
  findings.
- Confirmed external dependency findings require separate resolved evidence or
  scanner evidence, such as exact package/version, lockfile evidence, SBOM
  component evidence, provenance evidence, runtime inventory, or a future
  resolved-evidence profile.

This decision adopts the practical v0.1 part of option E's two-tier model by
defining the potential-exposure tier now while reserving the confirmed-evidence
tier for future resolved-evidence work.

## Terminology Hierarchy

| Term                                                 | Meaning                                                                                  | v0.1 status                         |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------- |
| Volume advisory match                                | Advisory affected volume range includes the volume version.                              | Core advisory semantics             |
| Informational component impact                       | Advisory identifies a component as likely implicated, but the target remains the volume. | Core informational metadata         |
| Declaration-only external dependency exposure        | Declared external dependency purl/constraint intersects an advisory range.               | Core diagnostic/warning semantics   |
| Confirmed external dependency vulnerability evidence | Resolved/scanner evidence confirms a vulnerable external package fact.                   | Future profile or non-core evidence |

## Consequences

- Good, because ADR-0021's volume-level advisory target remains intact.
- Good, because component-scoped external dependency declarations become useful
  advisory diagnostics without becoming component-level targets.
- Good, because potential exposure and confirmed findings are explicitly separated.
- Good, because clients can surface serious warnings for agentic AI workflows even
  before resolved evidence exists.
- Good, because future resolved-evidence profiles can upgrade or refine potential
  exposure without changing v0.1 advisory targeting.
- Neutral, because implementations need clear UI and API wording to avoid implying
  confirmed vulnerability.
- Neutral, because local policy may choose different enforcement actions for
  potential exposure.
- Bad, because prominent warnings for declaration-only matches can create false
  positives when dependencies are optional, unused, unresolved, or overridden.
- Bad, because conformance needs to test that potential exposure is neither hidden
  nor mislabeled as a confirmed finding.

## Confirmation

- Verify that draft 6 prose keeps advisory targets volume-level.
- Verify that component-scoped external dependency matches are described as
  potential exposure diagnostics, not component-level advisory targets.
- Verify that declaration-only potential exposure is not described as resolved,
  installed, reachable, exploitable, or confirmed.
- Verify that client guidance requires prominent warning or review surfacing for
  declaration-only potential exposure in agentic AI workflows.
- Verify that local policy outcomes based on potential exposure are labeled as
  policy judgments, not canonical trust facts.
- Verify that future resolved-evidence prose can introduce confirmed external
  dependency evidence without redefining this potential-exposure baseline.
- Verify that conformance fixtures distinguish volume advisory matches,
  informational component impact, declaration-only potential exposure, and future
  confirmed evidence placeholders.

## Pros and Cons of the Options

### A — Strict volume-only matching: ignore component-scoped external dependency declarations for advisory diagnostics

- Good, because it is the simplest reading of ADR-0021.
- Good, because it avoids false positives from declaration-only dependency data.
- Bad, because it discards useful audit metadata introduced by external dependency
  declarations.
- Bad, because clients cannot explain which component-scoped declaration caused a
  potential advisory concern.
- Bad, because it under-warns in agentic AI workflows where potential dependency
  exposure can already be operationally serious.

### B — Keep advisory targets volume-level, but emit component-scoped declaration-only potential exposure diagnostics

- Good, because it preserves v0.1 volume-level advisory targeting.
- Good, because it uses component scope as explanatory context without turning it
  into a normative target.
- Good, because it provides actionable warnings while preserving the declaration
  versus evidence distinction.
- Good, because clients can make potential exposure visible and policy-actionable.
- Neutral, because wording and UI must prevent users from mistaking the diagnostic
  for a confirmed finding.
- Bad, because declaration-only matches can over-warn when later resolution shows no
  affected package was actually used.

### C — Treat component-scoped external dependency matches as component-level advisory targets

- Good, because it offers precise component-level targeting.
- Good, because it maps naturally to the `components` scope in external dependency
  declarations.
- Bad, because it conflicts with ADR-0021.
- Bad, because it requires component-level advisory schema, API, policy, and
  lifecycle semantics in v0.1.
- Bad, because declaration-only data is not enough to prove component vulnerability.

### D — Treat declaration-only external dependency matches as confirmed vulnerable findings

- Good, because it supports aggressive blocking policies.
- Good, because it is simple for policy engines to consume.
- Bad, because declarations do not prove resolution, installation, runtime
  presence, reachability, or exploitability.
- Bad, because it collapses declaration-plane and resolved-evidence-plane facts.
- Bad, because it creates false confirmed findings for optional, test,
  development, overridden, or unresolved dependencies.

### E — Use a two-tier model that distinguishes potential exposure from confirmed external dependency evidence

- Good, because it is the most accurate long-term model.
- Good, because resolved evidence can upgrade or refine declaration-only warnings.
- Good, because it aligns with ADR-0130's future resolved-evidence linkage.
- Neutral, because v0.1 only defines the potential-exposure tier unless a
  resolved-evidence profile exists.
- Bad, because implementers need to manage multiple diagnostic levels.

### F — Leave declaration-only external dependency advisory matching entirely to local policy

- Good, because the core specification stays smaller.
- Good, because clients can tune warning thresholds locally.
- Bad, because portable semantics and conformance become weak.
- Bad, because users may receive inconsistent diagnostics for the same manifest.
- Bad, because the spec would fail to require visible warnings for serious agentic
  AI workflow risks.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- Agent Volumes defines a resolved-evidence profile that can express confirmed
  external dependency evidence linked to declaration keys.
- Multiple implementations can produce interoperable lockfile, SBOM, provenance,
  scanner, or runtime evidence for external dependency findings.
- Real advisories show that volume-level targeting plus potential-exposure
  diagnostics is misleading or insufficient.
- Clients or bibliothecas demonstrate a strong operational need for component-level
  advisory policy decisions.
- Prominent potential-exposure warnings create unacceptable false-positive burden
  despite clear declaration-only wording.

If confirmed external dependency evidence becomes expressible in a portable profile,
Agent Volumes should actively reconsider moving to option E's full two-tier model,
where declaration-only matches remain potential exposure and resolved-evidence
matches can become confirmed external dependency findings.

## More Information

Follow-up work should decide:

- exact diagnostic field names for declaration-only potential exposure
- warning categories or advisory diagnostic categories for potential exposure
- client UI guidance for prominent but accurately labeled warnings
- conformance fixtures for declaration-only potential exposure and non-confirmed
  findings
- future resolved-evidence profile fields that can support confirmed external
  dependency findings
