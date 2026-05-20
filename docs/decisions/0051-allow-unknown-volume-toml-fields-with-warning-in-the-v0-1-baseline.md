---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Allow unknown `volume.toml` fields with warning in the v0.1 baseline

## Context and Problem Statement

ADR-0049 and ADR-0050 establish a strict parsed-data-model and default-semantics boundary for `volume.toml`. That still leaves one important validation question unresolved: **when a manifest contains fields or tables the spec does not define, should the baseline model reject them, allow them with warning, or defer the rule entirely?**

This question affects extensibility, interoperability discipline, and how rigidly the manifest is treated as a closed-world contract in v0.1.

## Decision Drivers

- Preserve manifest interoperability while still leaving room for evolution
- Avoid making the first baseline so rigid that any experimentation or transitional metadata becomes immediately invalid
- Give validators and users a clear signal when unknown structure appears
- Keep the parsed-model and validation contract explicit enough to be testable

## Considered Options

- A — Treat unknown manifest structure as invalid in the baseline model
- B — Allow unknown manifest structure with warning
- C — Defer unknown-structure handling to later work

## Decision Outcome

Chosen option: **B — Allow unknown manifest structure with warning**, because it balances interoperability discipline with practical extensibility better than a fully closed-world baseline.

Under this decision:

- unknown fields or tables in `volume.toml` are not automatically invalid in the v0.1 baseline
- validators and clients should surface warning-level diagnostics when unknown manifest structure is encountered
- the presence of unknown structure does not by itself require rejection under the baseline model

### Consequences

- Good, because the manifest model remains more evolution-friendly than a fully closed-world baseline
- Good, because users and tooling still receive explicit signals when manifests contain unknown structure
- Good, because early experimentation or transitional metadata can coexist with the baseline contract more easily
- Neutral, because later profiles or stricter validation modes may still choose to tighten this rule
- Bad, because manifest interpretation becomes slightly less strict and more permissive than a closed-world model

### Confirmation

- Verify that validators can distinguish unknown-structure warnings from hard validation failures cleanly
- Verify that clients do not reject manifests solely because they contain unknown fields or tables in the baseline mode
- Verify that warning behavior is still explicit enough that unknown structure is not silently ignored without operator visibility

## Pros and Cons of the Options

### A — Treat unknown manifest structure as invalid in the baseline model

- Good, because it provides the strictest and clearest manifest-validation boundary
- Good, because it reduces the risk of divergent interpretation of undeclared manifest structure
- Neutral, because a future stricter profile may still want this behavior
- Bad, because it makes the baseline less flexible for evolution or experimentation
- Bad, because it can reject manifests that are otherwise understandable and usable by implementations

### B — Allow unknown manifest structure with warning

- Good, because it preserves more flexibility for evolution and transitional metadata
- Good, because it still makes the presence of unknown structure visible to users and tooling
- Good, because it avoids turning every forward-looking manifest extension into an outright failure in the baseline mode
- Neutral, because stricter profiles can still tighten the rule later if needed
- Bad, because the baseline model is less rigidly interoperable than a fully closed-world design

### C — Defer unknown-structure handling to later work

- Good, because it reduces immediate specification effort
- Good, because later versions could refine the rule with more implementation evidence
- Neutral, because some ecosystems postpone this kind of validation-boundary choice until later maturity
- Bad, because the manifest-validation contract remains under-specified in an important operational area
- Bad, because implementations would still lack a shared baseline for how to react to unknown manifest structure in v0.1
