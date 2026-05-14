---
status: accepted
date: 12026-05-11
decision-makers: Yunseo Kim
---

# Use explicit compatible spec version sets in capability metadata

## Context and Problem Statement

ADR-0045 requires lockstep version alignment between Agent Volumes prose releases
and normative machine-readable schema artifacts. ADR-0063 requires bibliotheca
capability metadata to include self-describing version fields, and the current
capability metadata schema already requires `schemaVersion` and `specVersion`.

Those fields identify the capability document and the implemented Agent Volumes
specification release, but they do not yet answer a client compatibility question:
**how should a client decide whether an older, newer, or different draft
bibliotheca capability document is portable to consume?**

The v0.1 baseline also has adjacent version boundaries:

- the capability metadata document shape
- the implemented Agent Volumes spec release
- the HTTP API major family, such as `/api/v1`
- draft and stable release compatibility expectations

These boundaries need distinct semantics. If they are collapsed into one version
field, clients may either reject safe additive evolution or accidentally treat
untested future draft behavior as compatible.

## Decision Drivers

- Keep capability metadata self-describing and machine-readable.
- Separate capability document shape evolution from normative spec release
  compatibility.
- Avoid applying package dependency range semantics to protocol/spec
  compatibility metadata.
- Preserve conservative behavior during v0.1 draft iteration.
- Allow bibliothecas to explicitly advertise tested compatibility with specific
  Agent Volumes spec releases.
- Keep conformance fixtures simple and deterministic for baseline clients.
- Leave room for additive capability metadata fields and values under the same
  capability schema major.

## Considered Options

- Require exact `schemaVersion` and `specVersion` matches only.
- Treat all releases in the same spec minor line as compatible.
- Use capability schema major plus explicit compatible spec version sets.
- Let the HTTP API major family, such as `/api/v1`, govern compatibility.
- Treat capability version fields as advisory-only metadata.
- Use a SemVer range string for `compatibleSpecVersions`.

## Decision Outcome

Chosen option: **Use capability schema major plus explicit compatible spec
version sets**, because capability document shape evolution and Agent Volumes spec
release compatibility are related but distinct compatibility axes.

Under this decision, capability metadata uses the following model:

- `schemaVersion` identifies the major version of the capability metadata document
  shape.
- `specVersion` identifies the Agent Volumes specification release implemented by
  the bibliotheca.
- `compatibleSpecVersions` is an optional array of exact Agent Volumes spec version
  strings that the bibliotheca explicitly claims its advertised capability metadata
  and API behavior are compatible with.
- `apiVersion` identifies the HTTP API major family, such as `v1`, when the
  capability document describes HTTP API support.

For v0.1, `schemaVersion` is `"1"`. Within `schemaVersion = "1"`, additive
capability metadata fields and values are allowed under the existing unknown-field
and unknown-value tolerance rules. Breaking changes to the capability document
shape or to the meaning of existing core fields require a new schema major, such
as `schemaVersion = "2"`.

`specVersion` remains the primary statement of the bibliotheca's implemented Agent
Volumes specification release. A baseline client that does not understand
`compatibleSpecVersions` or chooses not to evaluate it should use exact
`specVersion` matching as the conservative portable baseline during v0.1 draft
iteration.

When present, `compatibleSpecVersions` extends that conservative baseline only by
listing exact spec releases that the bibliotheca intentionally supports. The field
is a set, not a range expression. Values are exact version identifiers, not
dependency constraints.

Example:

```json
{
  "schemaVersion": "1",
  "specVersion": "0.1.0-draft.5",
  "compatibleSpecVersions": ["0.1.0-draft.5"],
  "apiVersion": "v1",
  "scopePolicy": {
    "scopesSupported": true,
    "scopelessSupported": true,
    "scopesRequired": false
  },
  "deliveryModes": ["cdn"],
  "apis": {
    "trustMetadata": true,
    "versionIndex": true,
    "releaseUploads": false,
    "trustUploads": false,
    "advisories": true
  }
}
```

The HTTP API major family is not a substitute for spec compatibility. A
bibliotheca that advertises `apiVersion = "v1"` is saying that its HTTP API belongs
to the v1 API family, not that every Agent Volumes draft or release using `/api/v1`
is automatically compatible. Breaking HTTP path, request, or response semantics
belong in a future API major such as `v2`, while normative spec compatibility is
still evaluated through `specVersion` and `compatibleSpecVersions`.

## Consequences

- Good, because clients can distinguish capability document parsing compatibility
  from broader Agent Volumes spec compatibility.
- Good, because draft compatibility remains conservative unless a bibliotheca
  explicitly advertises tested compatible spec releases.
- Good, because exact arrays can express non-contiguous compatibility sets without
  implying support for untested intermediate or future releases.
- Good, because the model aligns with protocol/spec ecosystems that negotiate or
  enumerate supported versions rather than applying dependency solver ranges.
- Good, because dependency constraints and spec compatibility metadata remain
  semantically separate.
- Good, because conformance fixtures can validate exact membership behavior without
  requiring a draft SemVer range comparison grammar.
- Neutral, because bibliothecas that support multiple spec releases must list each
  supported release explicitly.
- Neutral, because stable post-v0.1 releases may later define stronger compatibility
  families, but those families should not be inferred from a range string in v0.1.
- Bad, because explicit arrays are more verbose than a single range expression.
- Bad, because clients do not get dependency-solver-style automatic widening across
  future releases.

## Confirmation

- Verify that the capability metadata schema includes `schemaVersion`,
  `specVersion`, `compatibleSpecVersions`, and `apiVersion` with the semantics
  described by this decision.
- Verify that `compatibleSpecVersions`, when present, is an array of strings with
  unique items rather than a range string.
- Verify that baseline clients can treat exact `specVersion` match as the
  conservative v0.1 portable compatibility baseline.
- Verify that clients that understand `compatibleSpecVersions` can accept a
  bibliotheca only when the client's implemented spec version appears in that
  explicit set or matches `specVersion` under local policy.
- Verify that `/api/v1` is documented as an HTTP API major family, not as a complete
  Agent Volumes spec compatibility boundary.
- Verify that unknown additive capability metadata fields remain tolerated under
  the same schema major.
- Verify that dependency constraint range grammar is not reused for
  `compatibleSpecVersions`.

## Pros and Cons of the Options

### Require exact `schemaVersion` and `specVersion` matches only

- Good, because it is the simplest and safest compatibility rule.
- Good, because it is especially conservative during draft iteration.
- Good, because conformance fixtures are easy to write.
- Neutral, because clients can still display unknown newer capability documents.
- Bad, because every draft iteration can break portable client/bibliotheca
  compatibility even when changes are additive.
- Bad, because it underuses the capability metadata endpoint's self-describing
  evolution model.

### Treat all releases in the same spec minor line as compatible

- Good, because it allows more draft and patch-level experimentation.
- Good, because additive changes are easier for clients and bibliothecas to absorb.
- Neutral, because it can work after a stable compatibility discipline exists.
- Bad, because SemVer `0.x` releases do not provide a strong compatibility promise.
- Bad, because draft releases may change field meaning or API behavior in ways that
  same-minor matching cannot detect.
- Bad, because conformance would need additional rules for what same-minor
  compatibility actually guarantees.

### Use capability schema major plus explicit compatible spec version sets

- Good, because it separates document shape, spec release, and API major family.
- Good, because exact version sets are honest about tested compatibility.
- Good, because non-contiguous draft compatibility is representable.
- Good, because it avoids premature range semantics for spec compatibility.
- Neutral, because implementers must maintain one additional metadata field when
  claiming broader compatibility.
- Bad, because it is slightly more verbose than exact matching or a range string.

### Let the HTTP API major family govern compatibility

- Good, because HTTP clients already understand major API families such as `/api/v1`.
- Good, because breaking HTTP request and response changes have a clear boundary.
- Neutral, because it remains useful as one compatibility axis.
- Bad, because Agent Volumes compatibility includes manifests, schemas,
  conformance, trust semantics, and advisory behavior beyond HTTP routing.
- Bad, because it does not explain capability metadata schema evolution.
- Bad, because `/api/v1` alone cannot distinguish incompatible draft spec behavior.

### Treat capability version fields as advisory-only metadata

- Good, because it is maximally flexible for experimentation.
- Good, because it aligns with permissive unknown-field handling.
- Neutral, because local clients could still apply stricter policy.
- Bad, because portable compatibility claims become weak and inconsistent.
- Bad, because independent implementations may disagree about when a capability
  document is safe to consume.
- Bad, because conformance cannot rely on a strong compatibility gate.

### Use a SemVer range string for `compatibleSpecVersions`

- Good, because it is compact.
- Good, because Agent Volumes already defines a constrained SemVer range grammar for
  package dependency constraints.
- Neutral, because it may become useful for a future stable compatibility policy
  with clear monotonic guarantees.
- Bad, because spec compatibility is not package dependency resolution.
- Bad, because ranges imply support for future or intermediate releases the
  bibliotheca may not have tested.
- Bad, because draft and prerelease comparison rules would add complexity without
  providing safer interoperability.
- Bad, because range grammar would blur the distinction established by ADR-0105
  between dependency constraints and compatibility metadata.
