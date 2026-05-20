---
status: accepted
date: 12026-05-15
decision-makers: Yunseo Kim
---

# Use category-specific context schema for potential exposure warnings

## Context and Problem Statement

ADR-0135 defines external dependency advisory intersections as declaration-only
potential exposure diagnostics, not confirmed vulnerable installed-component
findings. ADR-0138 then chooses structured warnings with the category
`external-dependency-potential-exposure` as the portable v0.1 diagnostic carrier
and dedicated offline fixtures as the portable verification carrier.

ADR-0138 intentionally leaves the exact warning payload placement to draft 6
artifact work. The current `schemas/warning.schema.json` is a small shared warning
envelope with `category`, optional human-readable/location fields, and
`additionalProperties: true`. Existing fixtures use the same generic warning
shape for parser, semantic validation, exact release metadata cases, and
conformance reports.

The remaining schema question is: **should the `dependency`, `advisoryMatch`, and
`volume` context for `external-dependency-potential-exposure` warnings be added
directly to `warning.schema.json`, kept fixture-local, or defined in a separate
schema?**

## Decision Drivers

- The base warning schema should remain a reusable envelope for all warning
  categories.
- Potential-exposure warnings need typed, portable context so implementers do not
  infer field names from prose or fixtures.
- Category-specific context should not make every warning appear to support
  external dependency advisory fields.
- Conformance fixtures should validate the same shape that runtime warning
  consumers can rely on.
- Future warning categories should be able to define their own structured context
  without bloating the shared warning envelope.
- The schema must preserve ADR-0135 and ADR-0138's declaration-only boundary and
  must not imply resolved evidence, confirmed vulnerability, policy severity,
  advisory publication, or registry-side diagnostic API behavior.

## Considered Options

- A — Add `dependency`, `advisoryMatch`, and `volume` directly to
  `warning.schema.json`.
- B — Keep the potential-exposure payload fixture-local only.
- C — Add only a separate potential-exposure warning context schema.
- D — Add generic `context` to the base warning schema and a category-specific
  companion schema for potential-exposure context.
- E — Add category-conditioned `oneOf` or `if` / `then` validation directly to
  `warning.schema.json`.
- F — Define potential-exposure warning fields only in prose.

## Decision Outcome

Chosen option: **D — Add generic `context` to the base warning schema and a
category-specific companion schema for potential-exposure context**, because it
keeps `warning.schema.json` as a stable shared envelope while providing a
machine-readable, implementer-ready payload contract for the one warning category
that needs structured context in draft 6.

Under this decision, `schemas/warning.schema.json` should add an optional generic
`context` object. `context` is not required for all warnings.

Agent Volumes should also add a companion schema for the potential-exposure
context, such as:

```text
schemas/external-dependency-potential-exposure-warning-context.schema.json
```

When a warning has category `external-dependency-potential-exposure`, its
`context` value should validate against that companion schema.

The base warning object should look like:

```json
{
  "category": "external-dependency-potential-exposure",
  "message": "Declared external dependency range intersects an external package advisory range.",
  "context": {
    "dependency": {
      "purl": "pkg:npm/foo",
      "constraint": "vers:npm/>=1.0.0|<2.0.0",
      "components": ["research-mcp"]
    },
    "advisoryMatch": {
      "sourceId": "GHSA-example",
      "affectedPurl": "pkg:npm/foo",
      "affectedRange": "vers:npm/>=1.5.0|<1.5.3"
    },
    "volume": {
      "purl": "pkg:volume/research-agent-pack@1.4.0"
    }
  }
}
```

The companion context schema should define at least:

- `dependency`
  - `purl`
  - `constraint`
  - `components`, optional
- `advisoryMatch`
  - `sourceKind`, optional
  - `sourceId`
  - `aliases`, optional
  - `affectedPurl`
  - `affectedRange`
- `volume`, optional
  - `purl`, optional
  - `name`, optional
  - `version`, optional

The context is explanatory. It does not assert that the external package was
resolved, fetched, installed, bundled, executed, reachable, exploitable, or
confirmed vulnerable.

## Validation Model

The base `warning.schema.json` should validate the common envelope for all
warnings. Category-specific context validation should be an additional validation
step applied when the warning category is `external-dependency-potential-exposure`.

Conformance fixtures that expect potential-exposure warnings should validate those
warnings against both:

- `schemas/warning.schema.json`
- `schemas/external-dependency-potential-exposure-warning-context.schema.json` for
  the warning's `context`

The draft 6 baseline should not require category-conditioned `oneOf` or
`if` / `then` logic inside the base warning schema. A future revision may revisit
that if many core warning categories adopt structured contexts and a centralized
dispatch mechanism becomes worthwhile.

## Consequences

- Good, because the shared warning envelope remains small and reusable.
- Good, because implementers get a portable schema for the potential-exposure
  payload instead of reverse-engineering fixture-local fields.
- Good, because warning context validation aligns runtime warning objects,
  conformance fixtures, and conformance reports.
- Good, because future warning categories can define their own companion context
  schemas without changing the base envelope for every category-specific field.
- Good, because the design preserves ADR-0138's distinction between warning
  category semantics and offline fixture verification.
- Neutral, because validators need a category-aware second validation pass for
  potential-exposure warning contexts.
- Neutral, because `context` remains optional for other warnings, so generic warning
  consumers may ignore structured context.
- Bad, because this adds one more schema artifact and validation rule.
- Bad, because the connection between category and companion schema must be stated
  clearly in prose and conformance documentation rather than being fully encoded in
  the base schema.

## Confirmation

- Verify that draft 6 prose defines `context` as an optional warning field.
- Verify that `warning.schema.json` keeps `context` generic and does not add
  top-level `dependency`, `advisoryMatch`, or `volume` fields.
- Verify that
  `schemas/external-dependency-potential-exposure-warning-context.schema.json`
  defines the potential-exposure context payload.
- Verify that potential-exposure warning fixtures validate against both the base
  warning schema and the category-specific context schema.
- Verify that warning context prose says the payload is declaration-only
  explanatory context, not resolved evidence, confirmed vulnerability, scanner
  finding, VEX status, advisory publication, or policy outcome.
- Verify that exact release metadata and Agent Volumes advisory payloads do not
  become portable carriers for computed potential-exposure results in v0.1.

## Pros and Cons of the Options

### A — Add `dependency`, `advisoryMatch`, and `volume` directly to `warning.schema.json`

- Good, because every warning consumer would see the fields in one schema.
- Good, because validation would be simple for this one category.
- Bad, because one category's payload would become global warning vocabulary.
- Bad, because unrelated warnings would appear to support external dependency
  advisory fields.
- Bad, because future category-specific fields would continue bloating the base
  warning schema.

### B — Keep the potential-exposure payload fixture-local only

- Good, because it minimizes schema work.
- Good, because fixtures can still test deterministic PURL/VERS matching behavior.
- Bad, because implementers do not get a reusable runtime payload contract.
- Bad, because field names and requiredness become conformance-example conventions
  rather than first-class schema definitions.
- Bad, because the spec becomes less implementer-ready.

### C — Add only a separate potential-exposure warning context schema

- Good, because the category-specific payload becomes typed without changing the
  base warning schema.
- Good, because it avoids top-level warning schema pollution.
- Neutral, because `warning.schema.json` already allows additional properties.
- Bad, because without a standardized `context` field, the companion schema's
  attachment point is less clear.
- Bad, because implementations could place the same context under different
  top-level field names.

### D — Add generic `context` to the base warning schema and a category-specific companion schema

- Good, because it standardizes the attachment point while keeping the base warning
  schema category-neutral.
- Good, because it scales to future structured warning contexts.
- Good, because conformance can validate both the common envelope and the
  category-specific payload.
- Neutral, because category-specific validation is an additional step.
- Bad, because the category-to-schema association is not fully self-contained in the
  base schema.

### E — Add category-conditioned `oneOf` or `if` / `then` validation directly to `warning.schema.json`

- Good, because a single schema could validate both the envelope and category
  payload.
- Good, because schema-aware consumers would get stronger validation automatically.
- Bad, because the base warning schema would become complex early in v0.1.
- Bad, because extension warning categories could become awkward to support.
- Bad, because adding future category-specific contexts would repeatedly modify the
  base warning schema.

### F — Define potential-exposure warning fields only in prose

- Good, because it is the smallest documentation change.
- Good, because prose can explain declaration-only semantics in detail.
- Bad, because tooling cannot validate prose.
- Bad, because implementers may diverge on field names, requiredness, and nesting.
- Bad, because schema/conformance alignment remains weak.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- Multiple core warning categories adopt structured contexts and centralized
  category-conditioned validation becomes simpler than companion schemas.
- Implementers consistently fail to apply the category-specific context schema
  because the association is not encoded in the base warning schema.
- JSON Schema tooling used by conformance runners makes a single conditioned schema
  substantially easier to maintain than a companion-schema model.
- Future registry diagnostic APIs, scanner interchange, VEX/VDR profiles, or
  resolved-evidence profiles require a stronger typed diagnostic envelope.

## More Information

ADR-0135 defines declaration-only potential exposure semantics. ADR-0138 chooses
structured warnings and offline fixtures as the v0.1 carrier and verification
surfaces. This decision records the category-specific context schema placement for
that warning category.
