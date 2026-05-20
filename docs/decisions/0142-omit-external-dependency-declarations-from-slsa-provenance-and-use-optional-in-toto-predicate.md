---
status: accepted
date: 12026-05-15
decision-makers: Yunseo Kim
---

# Omit external dependency declarations from SLSA provenance and use an optional in-toto predicate

## Context and Problem Statement

ADR-0116 places `[[external-dependencies]]` records in the declaration plane,
separate from resolved evidence. ADR-0131 requires exports to preserve
declaration-only relationship semantics. ADR-0132 states that SLSA/in-toto
provenance must not place declaration-only external dependencies in subjects,
materials, `resolvedDependencies`, or equivalent evidence fields.

ADR-0139 and ADR-0140 decide CycloneDX and SPDX carriers. The remaining
provenance question is: **should Agent Volumes carry declaration-only external
dependencies inside SLSA provenance, omit them from SLSA, or publish them through
a separate in-toto predicate?**

## Decision Drivers

- SLSA provenance is evidence-oriented and describes release subjects, builders,
  build definitions, resolved build inputs, and run details.
- Agent Volumes external dependency declarations are manifest-authored audit
  relationships, not resolved package evidence.
- SLSA `subject`, `materials`, and `resolvedDependencies` are too strong for PURL
  plus VERS range declarations without exact resolved versions, digests, lockfile
  observations, or provenance observations.
- Declaration metadata should be signable and attachable where needed without
  corrupting SLSA provenance semantics.
- Any optional carrier should round-trip declaration key, PURL, VERS constraint,
  purpose, scope, declaration-only status, and resolved-evidence absence.
- Potential exposure and policy judgments should remain separate from raw
  declaration export semantics.

## Considered Options

- A — Omit declaration-only external dependencies from SLSA provenance.
- B — Publish a separate Agent Volumes in-toto predicate for external dependency
  declarations.
- C — Put declarations in SLSA `externalParameters`.
- D — Put declarations in SLSA `internalParameters`.
- E — Put declarations in SLSA or in-toto `materials`.
- F — Put declarations in in-toto `subject`.
- G — Put declarations in SLSA `resolvedDependencies`.
- H — Put declarations in SLSA `byproducts`.
- I — Publish separate advisory or policy attestations.

## Decision Outcome

Chosen option: **A with optional B — Omit declaration-only external dependencies
from SLSA provenance, and define a separate Agent Volumes in-toto predicate when
an attested declaration export is needed**, because this preserves SLSA's
evidence semantics while still allowing signed declaration metadata to travel
through the in-toto and Sigstore ecosystem.

This decision refines ADR-0132 for SLSA and in-toto exports. ADR-0132 remains in
force for the general rule that declaration-only external dependencies must not be
projected into provenance evidence fields.

Under this decision, Agent Volumes v0.1 SLSA provenance must omit declaration-only
external dependencies from:

- `subject`
- `materials`
- `resolvedDependencies`
- `byproducts`
- `internalParameters`

SLSA `externalParameters` should not carry external dependency declarations in
the portable baseline. An exporter may use `externalParameters` only when a
declaration is a real build input, the relevant `buildType` explicitly defines
that input, and the result remains distinct from resolved dependency evidence.

## Optional Agent Volumes in-toto Predicate

When an implementation needs an attested export of declaration-only external
dependencies, it should publish a separate in-toto Statement whose subject is the
Agent Volume release, not the external packages.

The predicate type is:

```text
https://agentvolumes.org/predicates/external-dependency-declarations/v0.1
```

The predicate should carry at least:

- `semantics`
- `declarations`
- each declaration's `declarationKey`
- each declaration's `purl`
- each declaration's `constraint`
- each declaration's `purpose`
- each declaration's `scope`
- each declaration's `resolvedEvidence`

For the v0.1 declaration-only predicate, `semantics` must be
`"declaration-only"` and each declaration's `resolvedEvidence` must be `false`.

Example predicate shape:

```json
{
  "semantics": "declaration-only",
  "declarations": [
    {
      "declarationKey": "av-extdep-v1:sha256-...",
      "purl": "pkg:npm/foo",
      "constraint": "vers:npm/>=1.0.0|<2.0.0",
      "purpose": "runtime",
      "scope": { "components": ["research-mcp"] },
      "resolvedEvidence": false
    }
  ]
}
```

This predicate attests that the Agent Volume release carried these declaration
records. It does not attest that the external packages were resolved, fetched,
installed, bundled, executed, verified, vulnerable, used as build materials, or
present at runtime.

## Advisory and Policy Attestations

Potential exposure, advisory matching, policy decisions, suppressions, risk
ratings, or enforcement results are derived judgments. They must not be mixed into
the raw external dependency declaration predicate. Future advisory or policy
attestation predicates may reference declaration keys, but they are separate from
this carrier decision.

## Consequences

- Good, because SLSA provenance remains focused on release subjects, builders,
  build definitions, run details, and resolved build evidence.
- Good, because declaration-only external dependencies do not become false
  subjects, materials, resolved dependencies, byproducts, or builder parameters.
- Good, because Agent Volumes can still publish signed declaration metadata through
  a separate in-toto predicate when needed.
- Good, because the optional predicate can round-trip the same declaration fields
  used by CycloneDX and SPDX mappings.
- Neutral, because SLSA-only consumers will not see external dependency
  declarations unless they also consume the Agent Volumes predicate.
- Neutral, because `externalParameters` remains available only for buildType-defined
  build inputs rather than the portable baseline.
- Bad, because implementations that want signed declaration metadata must emit one
  more attestation.
- Bad, because custom predicate consumers must understand an Agent Volumes predicate
  type.

## Confirmation

- Verify that draft 6 SLSA mapping prose omits declaration-only external
  dependencies from SLSA `subject`, `materials`, `resolvedDependencies`,
  `byproducts`, and `internalParameters`.
- Verify that any use of SLSA `externalParameters` is limited to buildType-defined
  build inputs and not used as the portable declaration carrier.
- Verify that the optional Agent Volumes in-toto predicate binds its `subject` to
  the Agent Volume release rather than the external packages.
- Verify that the optional predicate preserves declaration key, PURL, VERS
  constraint, purpose, scope, declaration-only semantics, and resolved-evidence
  absence.
- Verify that the optional predicate does not carry resolved versions, package
  digests, lockfile observations, scanner findings, provenance material claims,
  installed-package evidence, bundled artifact evidence, or runtime inventory
  evidence.
- Verify that advisory and policy attestations, if added later, are separate from
  the raw declaration predicate.

## Pros and Cons of the Options

### A — Omit declaration-only external dependencies from SLSA provenance

- Good, because it preserves SLSA provenance semantics.
- Good, because it avoids false evidence claims in subjects, materials, and
  resolved dependencies.
- Good, because it matches the declaration-plane versus resolved-evidence-plane
  boundary.
- Bad, because SLSA-only consumers cannot see external dependency intent.

### B — Publish a separate Agent Volumes in-toto predicate for external dependency declarations

- Good, because it can be signed and distributed through in-toto or Sigstore
  tooling without overloading SLSA provenance.
- Good, because it can preserve all required Agent Volumes declaration fields.
- Good, because it clearly scopes the claim to declaration records on the Agent
  Volume release.
- Neutral, because consumers must understand the Agent Volumes predicate type.
- Bad, because it adds a separate attestation artifact.

### C — Put declarations in SLSA `externalParameters`

- Good, because the metadata would remain inside the SLSA predicate when it truly
  parameterizes a build.
- Bad, because external dependency declarations are not generally build invocation
  inputs.
- Bad, because unexpected `externalParameters` may be ignored or rejected by
  buildType-aware verifiers.

### D — Put declarations in SLSA `internalParameters`

- Good, because it keeps the data away from public invocation parameters.
- Bad, because it suggests builder-internal trusted configuration rather than
  manifest-authored declaration metadata.
- Bad, because it weakens portability and transparency.

### E — Put declarations in SLSA or in-toto `materials`

- Good, because provenance tooling would see them as build-related dependencies.
- Bad, because materials imply concrete build input evidence.
- Bad, because PURL plus VERS range declarations are not resolved build materials.

### F — Put declarations in in-toto `subject`

- Good, because subjects are highly visible and digest-bound.
- Bad, because the statement would appear to attest to the external packages rather
  than the Agent Volume release.
- Bad, because declaration-only external packages lack subject digests.

### G — Put declarations in SLSA `resolvedDependencies`

- Good, because the field name matches dependency terminology.
- Bad, because `resolvedDependencies` is explicitly for resolved dependencies, not
  declaration-only ranges.
- Bad, because this is the strongest false resolved-evidence claim among the
  options.

### H — Put declarations in SLSA `byproducts`

- Good, because byproducts are less central than materials.
- Bad, because byproducts are still build-run artifacts or outputs, not manifest
  declarations.
- Bad, because using byproducts would obscure the declaration semantics.

### I — Publish separate advisory or policy attestations

- Good, because potential exposure and policy outcomes are derived judgments that
  may need their own signed records.
- Neutral, because this may become useful in a later diagnostics profile.
- Bad, because it is not the canonical carrier for raw declaration records.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- SLSA standardizes a non-evidence declaration metadata field that can carry PURL,
  version range, purpose, scope, declaration key, and declaration-only status.
- Agent Volumes adopts a resolved-evidence profile whose SLSA mapping legitimately
  needs `materials`, `resolvedDependencies`, byproducts, or other provenance
  evidence fields.
- Implementers show that a buildType-defined `externalParameters` profile is the
  dominant interoperable way to carry these declarations without confusing
  verifiers.
- in-toto predicate guidance changes in a way that makes custom Agent Volumes
  predicates unsuitable for signed declaration metadata.

## More Information

CycloneDX and SPDX declaration carriers are recorded separately in ADR-0139 and
ADR-0140. This decision concerns only SLSA provenance and optional Agent Volumes
in-toto predicate export.
