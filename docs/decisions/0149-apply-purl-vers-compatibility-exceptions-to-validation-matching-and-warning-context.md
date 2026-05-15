---
status: accepted
date: 12026-05-16
decision-makers: Yunseo Kim
---

# Apply PURL/VERS compatibility exceptions to validation, matching, and warning context

## Context and Problem Statement

ADR-0134 defines exact equality between an external dependency PURL type and VERS
scheme as the default compatibility rule, with finite pinned exceptions. ADR-0144
publishes those exceptions as a dedicated conformance artifact and includes the
initial non-equal `pub` / `dart` exception. ADR-0147 then makes PURL/VERS
compatibility checking a required step before scheme-specific VERS intersection for
external dependency potential-exposure matching.

Those decisions establish that compatibility exceptions exist, but they do not fully
separate their effects across validation, advisory matching, warning payloads, and
declaration-key canonicalization. Draft 6 needs a clear rule for where the
`pub` / `dart` exception applies and where it must not change identity.

The remaining question is: **does a PURL/VERS compatibility exception affect only
semantic validation, or does it also affect advisory matching, potential-exposure
warning context, declaration key construction, and PURL canonicalization?**

## Decision Drivers

- PURL package identity and VERS version-scheme semantics are related but distinct
  layers.
- A valid non-equal PURL type / VERS scheme pair should remain useful for advisory
  matching rather than passing validation but becoming unusable downstream.
- Compatibility exceptions should not rewrite canonical PURL identity or create
  carrier-specific declaration keys.
- Warning context should be able to explain why a non-equal pair was accepted
  without turning the exception itself into a potential-exposure warning.
- The exception table should remain finite, reviewable, and conformance-controlled
  rather than becoming a broad alias registry.

## Considered Options

- A — Apply compatibility exceptions only during external dependency semantic
  validation.
- B — Apply compatibility exceptions during validation and advisory matching only.
- C — Apply compatibility exceptions during validation and advisory matching, and
  allow explanatory warning context while preserving canonical identity and
  declaration keys.
- D — Apply compatibility exceptions to declaration key construction and PURL
  canonicalization.
- E — Emit a separate warning whenever a compatibility exception is used.
- F — Treat compatibility exceptions as broad ecosystem aliases.

## Decision Outcome

Chosen option: **C — Apply compatibility exceptions during validation and advisory
matching, and allow explanatory warning context while preserving canonical identity
and declaration keys**, because it makes accepted non-equal pairs operationally
useful without redefining package identity or declaration-key canonicalization.

Under this decision, a compatibility exception applies to:

- external dependency semantic validation;
- advisory-match input validation when an advisory affected PURL and affected VERS
  range use a non-equal but listed PURL type / VERS scheme pair;
- ADR-0147 compatibility checking before VERS range intersection;
- VERS evaluator dispatch for potential-exposure matching;
- optional explanatory warning context for
  `external-dependency-potential-exposure` warnings.

A compatibility exception does not apply to:

- canonical Package URL serialization;
- declaration key construction under ADR-0146;
- the ADR-0114 declaration semantic key `(canonical purl, purpose, scope)`;
- rewriting a PURL type into a VERS scheme or a VERS scheme into a PURL type;
- creating a distinct warning category merely because an exception was used;
- resolved evidence, native lockfiles, scanner findings, or future confirmed
  external dependency evidence unless a future profile explicitly defines that
  behavior.

For the initial `pub` / `dart` exception, this means:

- `pkg:pub/...` remains the canonical package identity.
- `vers:dart/...` remains the version-range expression and selects Dart Pub version
  semantics for range intersection and prerelease handling.
- The declaration key input remains the JCS object containing canonical `purl`,
  `purpose`, and `scope`; it does not include `dart`, `constraint`, or the exception
  entry.
- If the compatible declaration and advisory range intersect, the resulting warning
  may include explanatory context such as `purlType`, `versScheme`, or a
  compatibility exception identifier.
- That explanatory context does not become a canonical identity, matching key,
  resolved evidence fact, or carrier-specific declaration key.

## Warning Context Semantics

Potential-exposure warning context may identify the compatibility exception used to
evaluate the match. This context is explanatory. It helps clients and users
understand why a non-equal PURL type / VERS scheme pair was accepted.

Draft 6 artifacts may define context fields such as:

```json
{
  "compatibility": {
    "purlType": "pub",
    "versScheme": "dart",
    "exceptionId": "pub-dart"
  }
}
```

The exact field names may be finalized with the potential-exposure warning context
schema, but the context must not imply that:

- the package identity was rewritten from `pub` to `dart`;
- the declaration key included the compatibility exception;
- the exception is itself a warning condition;
- the external package was resolved, fetched, installed, bundled, executed,
  reachable, exploitable, or confirmed vulnerable.

## Consequences

- Good, because a declaration accepted by validation can proceed through the same
  advisory matching pipeline as equal PURL type / VERS scheme pairs.
- Good, because PURL identity remains canonical and independent from VERS evaluator
  dispatch.
- Good, because warning consumers can see why a non-equal pair was accepted without
  treating the exception as a vulnerability or policy finding.
- Good, because declaration keys remain stable and carrier-independent.
- Good, because the finite compatibility exception artifact stays the only portable
  source of non-equal compatibility policy.
- Neutral, because warning context schemas need to decide whether to expose
  compatibility metadata and, if so, with which field names.
- Neutral, because conformance fixtures need to cover validation, matching, warning
  context, and key-stability cases for the `pub` / `dart` exception.
- Bad, because implementers must keep identity canonicalization, VERS evaluator
  dispatch, and warning explanation as separate steps.

## Confirmation

- Verify that draft 6 semantic validation accepts `pkg:pub/...` with
  `vers:dart/...` only through the compatibility exception table.
- Verify that advisory matching treats the same pair as compatible before applying
  scheme-specific VERS intersection.
- Verify that potential-exposure warning context may explain the compatibility
  exception without making the exception itself a warning.
- Verify that PURL canonicalization does not rewrite `pkg:pub/...` to
  `pkg:dart/...`.
- Verify that declaration keys for `pub` / `dart` declarations are derived only from
  canonical `purl`, `purpose`, and `scope` under ADR-0146.
- Verify that conformance fixtures cover validation success, matching success,
  warning-context explanation, and declaration-key stability for the exception.

## Pros and Cons of the Options

### A — Apply compatibility exceptions only during validation

- Good, because it is the narrowest rule.
- Bad, because a valid declaration could become unusable for advisory matching.
- Bad, because it conflicts with ADR-0147's compatibility-check step before VERS
  intersection.

### B — Apply compatibility exceptions during validation and advisory matching only

- Good, because it makes accepted non-equal pairs operational for range
  intersection.
- Good, because it avoids touching declaration keys and PURL canonicalization.
- Bad, because warnings may not explain why a non-equal pair matched.
- Bad, because implementers may invent inconsistent local diagnostic fields.

### C — Apply compatibility exceptions during validation and advisory matching, and allow explanatory warning context

- Good, because it combines operational matching with transparent diagnostics.
- Good, because warning context remains explanatory rather than canonical.
- Good, because key construction and PURL identity remain untouched.
- Neutral, because the warning context schema may need optional compatibility fields.
- Bad, because implementers must avoid treating warning context as identity data.

### D — Apply compatibility exceptions to declaration key construction and PURL canonicalization

- Good, because the non-equal pair is reflected directly in key construction.
- Bad, because it conflicts with ADR-0146's key input and ADR-0114's semantic key.
- Bad, because it would rewrite package identity or create carrier-specific key
  variants.

### E — Emit a separate warning whenever a compatibility exception is used

- Good, because exception use is always visible.
- Bad, because a standardized compatibility exception is not itself a warning
  condition.
- Bad, because it adds noise and can be confused with potential exposure.

### F — Treat compatibility exceptions as broad ecosystem aliases

- Good, because it is flexible for implementation-local naming differences.
- Bad, because it violates ADR-0134 and ADR-0144's finite, reviewed, portable
  exception model.
- Bad, because advisory matching and validation would become non-deterministic.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- Package URL or VERS publishes a normative compatibility mapping that supersedes
  Agent Volumes exception-scope rules.
- Warning context compatibility metadata creates repeated implementer or user
  confusion despite explanatory wording.
- Future resolved-evidence profiles need to carry compatibility exception metadata
  as part of their own evidence lifecycle.
- Additional non-equal compatibility exceptions require richer table metadata than
  `purlType`, `versScheme`, source, rationale, and optional identifier fields.

## More Information

ADR-0133 defines the external dependency PURL shape. ADR-0134 defines default PURL
type / VERS scheme equality with finite exceptions. ADR-0144 publishes the
compatibility exception artifact. ADR-0146 keeps declaration key input limited to
canonical `purl`, `purpose`, and `scope`. ADR-0147 uses compatibility checking
before scheme-specific VERS intersection, and ADR-0148 applies scheme-native
prerelease semantics during that intersection.
