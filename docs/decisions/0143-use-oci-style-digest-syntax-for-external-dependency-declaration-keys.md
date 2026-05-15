---
status: accepted
date: 12026-05-15
decision-makers: Yunseo Kim
---

# Use OCI-style digest syntax for external dependency declaration keys

## Context and Problem Statement

ADR-0114 defines the external dependency declaration uniqueness key as
`(canonical purl, purpose, scope)`. ADR-0130 then requires future resolved
evidence records to reference external dependency declarations by a stable
declaration key derived from the canonical declaration identity. ADR-0139,
ADR-0140, and ADR-0142 require CycloneDX, SPDX, and optional in-toto carriers to
preserve that declaration key.

The remaining naming question is: **what textual envelope should Agent Volumes
use for stable external dependency declaration keys so the same key can travel
through JSON schemas, conformance fixtures, CycloneDX `bom-ref` values, SPDX
extension fields, in-toto predicates, logs, and CLI diagnostics?**

This decision records the declaration key string shape. It does not redefine the
semantic uniqueness tuple chosen by ADR-0114, and it does not include VERS
`constraint` in the declaration key.

## Decision Drivers

- The key should be stable across carriers and independent of manifest array
  position, whitespace, comments, and presentation details.
- The key should make the Agent Volumes external dependency declaration namespace
  explicit without requiring every consumer to process a full URI.
- The key should make the hash algorithm explicit and leave room for future
  incompatible key-construction versions.
- The key should be easy to validate with JSON Schema patterns and conformance
  fixtures.
- The key should be safe as a string value in JSON, TOML-derived data models,
  CycloneDX properties and `bom-ref` values, SPDX extension fields, in-toto
  predicates, logs, and CLI output.
- The key should follow broadly recognized content-addressed identifier patterns
  rather than web-resource-specific integrity syntax or package-identity syntax.

## Considered Options

- A — Use OCI-style digest syntax: `av-extdep-v1:sha256:<lowercase-hex>`.
- B — Use SRI-like digest syntax: `av-extdep-v1:sha256-<encoded-digest>`.
- C — Use a full HTTPS URI.
- D — Use a URN-like identifier.
- E — Use a compact opaque prefix: `av-extdep-v1-<lowercase-hex>`.
- F — Use a PURL-like identifier.

## Decision Outcome

Chosen option: **A — Use OCI-style digest syntax:
`av-extdep-v1:sha256:<lowercase-hex>`**, because it separates the Agent Volumes
key-construction version, digest algorithm, and digest value in a widely familiar
content-addressed shape while remaining compact enough for repeated use in
schemas, fixtures, BOMs, attestations, logs, and diagnostics.

The canonical external dependency declaration key string has this shape:

```text
av-extdep-v1:sha256:<lowercase-hex-sha256>
```

Where:

- `av-extdep-v1` identifies the Agent Volumes external dependency declaration key
  construction version.
- `sha256` identifies the digest algorithm.
- `<lowercase-hex-sha256>` is the lowercase hexadecimal SHA-256 digest of the
  canonical declaration-key input defined for this key-construction version.

The declaration key is a string value, not a URI, PURL, SPDX term name,
CycloneDX property name, or in-toto predicate type. Carrier-specific identifiers
may wrap or reference the declaration key, but they must preserve this canonical
key value when a field is named `declarationKey`, `agent-volumes:declaration-key`,
or equivalent.

## Consequences

- Good, because the selected shape follows the common `algorithm:digest` pattern
  used by content-addressed systems such as OCI descriptors while adding an Agent
  Volumes-specific version prefix.
- Good, because hash agility is explicit: future incompatible key-construction
  versions or digest algorithms can use a different version prefix or algorithm
  segment.
- Good, because the key remains shorter and easier to read than an HTTPS URI or
  URN while still being namespaced.
- Good, because the key does not overload PURL package identity syntax for a value
  that identifies a declaration tuple rather than a package.
- Good, because lowercase hexadecimal output is easy to compare, validate, log,
  and copy across JSON, TOML-derived data models, SBOMs, attestations, and CLI
  tools.
- Neutral, because consumers must parse the string as three colon-delimited
  segments rather than a single prefix plus opaque suffix.
- Neutral, because the selected key is not dereferenceable by itself; explanatory
  documentation and schema definitions must define its semantics.
- Bad, because the key is less compact than a single opaque prefix such as
  `av-extdep-v1-<hex>`.
- Bad, because any future change to canonical declaration-key input construction
  requires a new key-construction version or a carefully documented compatibility
  rule.

## Confirmation

- Verify that draft 6 prose defines the external dependency declaration key shape
  as `av-extdep-v1:sha256:<lowercase-hex-sha256>`.
- Verify that schema patterns for declaration keys accept the selected syntax and
  reject uppercase hex, missing algorithm segments, unsupported algorithms, and
  malformed digest lengths.
- Verify that conformance fixtures use the same canonical declaration key value
  across manifest semantic keys, exact release metadata, warning payloads,
  CycloneDX mappings, SPDX mappings, and optional in-toto predicates.
- Verify that `constraint` remains outside the declaration key and that duplicate
  detection continues to use `(canonical purl, purpose, scope)`.
- Verify that carrier-specific wrappers do not replace the canonical declaration
  key value in fields that are intended to carry the declaration key itself.

## Pros and Cons of the Options

### A — Use OCI-style digest syntax: `av-extdep-v1:sha256:<lowercase-hex>`

- Good, because it uses the broadly recognized `algorithm:digest` shape for the
  content-addressed part of the key.
- Good, because the Agent Volumes-specific version prefix is compact and separates
  key-construction compatibility from the digest algorithm.
- Good, because lowercase hexadecimal digests are easy to validate and compare.
- Neutral, because it is not a URI and therefore does not provide built-in global
  dereference or namespace documentation.
- Bad, because colon-delimited parsing must be specified precisely.

### B — Use SRI-like digest syntax: `av-extdep-v1:sha256-<encoded-digest>`

- Good, because it is compact and easy to treat as a single token in logs and CLI
  output.
- Good, because the algorithm remains visible.
- Bad, because Subresource Integrity syntax is web-resource-specific and normally
  uses base64 rather than lowercase hexadecimal.
- Bad, because it is less aligned with registry and content-addressed storage
  conventions than `algorithm:digest`.

### C — Use a full HTTPS URI

- Good, because it provides clear namespace ownership and can be documented or
  dereferenced.
- Good, because URI-backed identifiers align well with SPDX, JSON-LD, in-toto, and
  SLSA type naming practices.
- Bad, because it is verbose for repeated use in fixtures, release metadata,
  warnings, SBOMs, attestations, logs, and diagnostics.
- Bad, because the declaration key value is an opaque stable key, not primarily a
  web resource or vocabulary term.

### D — Use a URN-like identifier

- Good, because it clearly signals a global identifier rather than a package or web
  resource.
- Good, because URN-like strings are URI-compatible values.
- Bad, because it is longer than the compact Agent Volumes prefix without adding
  practical dereference behavior.
- Bad, because URN namespace expectations can create unnecessary process and
  tooling questions for a v0.1 declaration key.

### E — Use a compact opaque prefix: `av-extdep-v1-<lowercase-hex>`

- Good, because it is the shortest and easiest shape to copy into logs, filenames,
  anchors, and diagnostics.
- Bad, because it hides the digest algorithm or forces the algorithm into the
  version prefix.
- Bad, because future hash agility is less explicit.
- Bad, because consumers cannot distinguish key-construction version, algorithm,
  and digest value by structured parsing.

### F — Use a PURL-like identifier

- Good, because Agent Volumes already uses PURL-compatible package identity.
- Good, because PURL-like strings are familiar to package and supply-chain tools.
- Bad, because the declaration key identifies a declaration tuple, not a package.
- Bad, because overloading PURL syntax risks confusing package identity with
  declaration identity and can encourage consumers to treat declaration keys as
  resolvable package coordinates.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- A future Agent Volumes version changes the canonical declaration-key input in a
  way that cannot be represented by `av-extdep-v1`.
- Implementers need a digest algorithm other than SHA-256 in the portable baseline.
- A target carrier rejects or rewrites colon-delimited key values in a way that
  prevents stable round-tripping.
- SPDX, CycloneDX, in-toto, or another adopted carrier standardizes a native
  declaration-key syntax that materially improves interoperability.

## More Information

ADR-0114 defines the semantic uniqueness tuple. ADR-0130 records the need for
stable keys to link external dependency declarations to future resolved evidence.
ADR-0139, ADR-0140, and ADR-0142 define carrier-specific places where the
declaration key is preserved.
