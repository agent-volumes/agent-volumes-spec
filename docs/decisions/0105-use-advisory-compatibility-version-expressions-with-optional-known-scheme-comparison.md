---
status: accepted
date: 12026-05-11
decision-makers: Yunseo Kim
---

# Use advisory compatibility version expressions with optional known-scheme comparison

## Context and Problem Statement

The v0.1 manifest model includes runtime and protocol compatibility declarations:

- `[[runtimes]].compatibility`
- `[[protocols]].version`

Examples currently use range-looking strings such as `^1.0.0`, `>=2025.02`, and
`>=3.17`. However, these fields are not dependency constraints, and the systems
they describe do not all use the same versioning scheme. Some runtimes use SemVer,
some protocol versions are date-like, and some protocol ecosystems use short
numeric versions rather than full SemVer.

That creates an interoperability question: **should v0.1 define one portable
comparison grammar for runtime and protocol compatibility strings, treat them as
opaque advisory metadata, or allow comparison only when a client explicitly
understands the relevant version scheme?**

## Decision Drivers

- Preserve implementability for the v0.1 core without standardizing a broad
  compatibility-expression language too early.
- Avoid accidentally applying dependency SemVer range semantics to protocol
  version schemes that are not full SemVer.
- Keep compatibility declarations useful for discovery, display, diagnostics, and
  runtime adapters.
- Prevent clients from claiming portable compatibility filtering when they do not
  understand the relevant runtime or protocol version scheme.
- Leave room for future runtime profiles or protocol profiles to define stronger
  comparison semantics where implementation evidence supports them.

## Considered Options

- Treat all runtime and protocol compatibility strings as opaque advisory strings.
- Reuse the dependency constrained SemVer range grammar for all compatibility
  strings.
- Split field semantics: SemVer-like runtime compatibility, protocol-specific
  protocol version expressions.
- Define profile-specific grammars for each runtime and protocol identifier.
- Use advisory compatibility expressions with optional known-scheme comparison.

## Decision Outcome

Chosen option: **Use advisory compatibility expressions with optional known-scheme
comparison**, because it keeps v0.1 implementable and honest about mixed external
version schemes while still allowing clients to compare versions for identifiers
whose schemes they explicitly support.

Under this decision, runtime and protocol compatibility declarations are
**compatibility version expressions**, not dependency constraints.

In the v0.1 core baseline:

- `[[runtimes]].compatibility` and `[[protocols]].version` are primarily
  discovery, display, and adapter-selection hints.
- Baseline clients MUST preserve and expose these strings without silently
  rewriting them into a different grammar.
- A client MAY compare a compatibility expression only when it explicitly
  understands the version scheme for the corresponding runtime or protocol
  identifier.
- If a client does not understand the relevant version scheme, it MUST treat the
  expression as advisory metadata rather than as a portable accept/reject filter.
- Clients MUST NOT claim portable compatibility filtering or rejection based on an
  unknown runtime or protocol version scheme.
- When a runtime identifier is documented by a profile as using full SemVer, that
  profile MAY state that the existing constrained SemVer range grammar is used for
  that runtime's compatibility expression.
- Protocol identifiers MAY define protocol-specific version-expression semantics
  in future profiles or later specification releases.
- The v0.1 core does not require one universal ordering, range grammar, or
  normalization rule across all runtime and protocol compatibility strings.

This means that `compatibility = "^1.0.0"` can be compared for a runtime only when
the client knows that runtime's version scheme is SemVer-compatible. A protocol
expression such as `version = ">=2025.02"` or `version = ">=3.17"` remains valid
as a protocol-facing expression, but the v0.1 core does not require every client
to evaluate it portably.

## Consequences

- Good, because v0.1 avoids forcing MCP, LSP, runtime CLI versions, and future
  protocols into one premature grammar.
- Good, because clients can still use compatibility declarations for search,
  display, diagnostics, and adapter selection.
- Good, because runtime profiles can add stronger comparison semantics without
  changing the neutral core model.
- Good, because unknown version schemes fail open as advisory metadata rather than
  causing false incompatibility decisions.
- Neutral, because portable compatibility filtering remains weaker than it would
  be under one universal grammar.
- Neutral, because profiles that want stronger comparison behavior must document
  their scheme explicitly.
- Bad, because two v0.1 clients may differ in how much compatibility filtering
  they can perform depending on which runtime or protocol schemes they support.
- Bad, because implementers need clear UI or diagnostics to distinguish
  understood comparisons from advisory-only compatibility declarations.

## Confirmation

- Verify that manifest prose does not describe `[[runtimes]].compatibility` or
  `[[protocols]].version` as dependency constraints.
- Verify that examples using SemVer-looking, date-like, or short numeric protocol
  expressions are framed as compatibility version expressions rather than one
  universal grammar.
- Verify that conformance fixtures do not require portable comparison outcomes for
  unknown runtime or protocol version schemes.
- Verify that future runtime or protocol profiles can define stronger comparison
  semantics without contradicting the v0.1 core.
- Verify that clients can preserve and display compatibility strings even when
  they cannot evaluate them.

## Pros and Cons of the Options

### Treat all compatibility strings as opaque advisory strings

- Good, because it is the simplest baseline.
- Good, because it supports every external versioning scheme without grammar work.
- Neutral, because clients can still display and search the strings.
- Bad, because clients cannot perform any portable compatibility filtering.
- Bad, because range-looking examples may mislead readers into expecting
  comparison behavior.

### Reuse the dependency constrained SemVer range grammar for all compatibility strings

- Good, because it is easy to explain and reuses an existing parser surface.
- Good, because conformance fixtures for comparison behavior would be simple.
- Neutral, because it works for runtimes that publish full SemVer versions.
- Bad, because it does not fit date-like protocol versions or short numeric
  protocol versions well.
- Bad, because it would overstate the relationship between package dependency
  constraints and runtime/protocol compatibility hints.

### Split field semantics between runtime and protocol compatibility

- Good, because runtime CLI or SDK versions are more likely to be SemVer-like than
  protocol versions.
- Good, because protocol declarations can remain faithful to protocol-native
  versioning schemes.
- Neutral, because it gives implementers a clearer default distinction between the
  two fields.
- Bad, because the field rules become asymmetric.
- Bad, because some runtimes still may not use full SemVer, and some protocols may
  eventually define SemVer-compatible profiles.

### Define profile-specific grammars for each runtime and protocol identifier

- Good, because it can provide the most accurate comparison semantics.
- Good, because it scales naturally when mature runtime or protocol profiles exist.
- Neutral, because it aligns with the existing profile-oriented compatibility
  direction.
- Bad, because it is too heavy for the v0.1 core baseline.
- Bad, because it requires a grammar registry and conformance matrix before the
  ecosystem has enough implementation evidence.

### Use advisory compatibility expressions with optional known-scheme comparison

- Good, because it balances implementability with honest support for mixed version
  schemes.
- Good, because clients can compare only what they actually understand.
- Good, because future profiles can add stricter semantics incrementally.
- Neutral, because portable filtering is partial rather than universal.
- Bad, because UI and diagnostics must avoid implying unsupported comparisons.
