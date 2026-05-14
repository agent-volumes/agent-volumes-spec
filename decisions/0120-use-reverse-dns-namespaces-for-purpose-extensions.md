---
status: accepted
date: 12026-05-13
decision-makers: Yunseo Kim
---

# Use reverse-DNS namespaces for purpose extensions

## Context and Problem Statement

ADR-0112 defines `[[external-dependencies]].purpose` as a small core vocabulary
with namespaced extension values. ADR-0118 then decides that `volume.schema.json`
should validate `purpose` as either a core enum value or a syntactically
namespaced extension value.

ADR-0112 intentionally leaves the exact extension syntax open. It also uses short
illustrative examples such as `python:lint`, `ruby:benchmark`, and
`cargo:proc-macro-helper`. Those examples show the intended `<namespace>:<purpose>`
shape, but they do not settle namespace ownership, collision avoidance, reserved
namespaces, length limits, or schema pattern details.

That leaves a concrete schema and governance question: **should namespaced
`purpose` extension values permit short ecosystem namespaces, require reverse-DNS
ownership namespaces, or use a different delimiter model?**

## Decision Drivers

- Extension values should be distinguishable from core purpose enum values.
- Namespace ownership should be clear enough to avoid ambiguous governance over
  short names such as `python`, `cargo`, or `ruby`.
- The syntax should be familiar to developers from existing extension and metadata
  ecosystems.
- The syntax should be simple enough for shallow JSON Schema validation.
- Agent Volumes should preserve existing reserved extension namespaces where
  applicable.
- Unknown extension values should remain syntactically valid without being treated
  as portable core semantics.

## Considered Options

- A — Use a simple `<namespace>:<purpose>` slug syntax with short namespaces.
- B — Use `<namespace>:<purpose>` with dot-capable namespaces and allow both short
  and reverse-DNS-like namespaces.
- C — Use reverse-DNS-only `<reverse-dns>:<purpose>` extension values.
- D — Use DNS-prefix style `<dns-prefix>/<purpose>` extension values.
- E — Use a dotted single-token value such as `<reverse-dns>.<purpose>`.
- F — Use npm-style `@namespace/purpose` extension values.

## Decision Outcome

Chosen option: **C — Use reverse-DNS-only `<reverse-dns>:<purpose>` extension
values**, because it provides an explicit ownership model from the start and avoids
needing separate governance for short ecosystem namespaces.

Under this decision, non-core `purpose` values use this form:

```text
<reverse-dns>:<purpose>
```

Examples:

```text
org.python:lint
io.github.acme:gpu-runtime
com.example:benchmark
```

The extension value syntax is:

- exactly one colon separates the namespace and purpose token
- lowercase ASCII only
- namespace uses reverse-DNS-style labels separated by dots
- namespace must contain at least one dot
- namespace labels contain lowercase letters, digits, and hyphens
- namespace labels start and end with a lowercase letter or digit
- purpose token contains lowercase letters, digits, and hyphens
- purpose token starts and ends with a lowercase letter or digit
- underscores, slashes, spaces, URI escapes, uppercase letters, and additional
  colons are not allowed
- namespace length should be bounded for schema and tooling interoperability
- purpose token length should be bounded for schema and tooling interoperability
- the complete value should be bounded for schema and tooling interoperability

The v0.1 reserved extension namespace list applies to purpose extension namespaces.
The reserved namespaces are:

- `agent-volumes`
- `core`
- `spec`

Because purpose extension namespaces must be reverse-DNS-style and contain at least
one dot, these reserved names are not valid extension namespaces under the current
syntax. They remain reserved so that future syntax relaxations or other extension
surfaces cannot repurpose official-looking namespace identifiers accidentally.

This decision supersedes ADR-0112's short illustrative extension examples. Future
prose, schema, and fixtures should use reverse-DNS examples instead of
`python:lint`, `ruby:benchmark`, or `cargo:proc-macro-helper`.

Baseline validators should validate the syntax of reverse-DNS extension values.
They should not validate domain ownership, extension registration, or the semantic
meaning of the purpose token unless a profile or ecosystem-specific agreement adds
that behavior.

## Consequences

- Good, because namespace ownership is clearer than with short ecosystem names.
- Good, because the model avoids a separate governance process for names such as
  `python`, `cargo`, or `ruby` in the v0.1 core.
- Good, because reverse-DNS and DNS-prefix ownership conventions are familiar from
  OCI annotations, Kubernetes labels and annotations, Java packages, and other
  extension ecosystems.
- Good, because the colon delimiter still cleanly separates extension values from
  core enum values and preserves ADR-0112's `<namespace>:<purpose>` shape.
- Good, because schema validation can reject uppercase, slashes, underscores,
  unqualified short namespaces, and extra colon delimiters.
- Neutral, because domain ownership itself remains outside schema validation.
- Neutral, because organizations that do not own domains need another stable
  namespace source, such as a controlled project domain or hosting-domain namespace.
- Bad, because common ecosystem-scoped examples become more verbose.
- Bad, because small communities may find reverse-DNS names heavier than short
  names.

## Confirmation

- Verify that future `purpose` schema work requires extension namespaces to contain
  at least one dot.
- Verify that `purpose` extension examples use reverse-DNS namespaces.
- Verify that short unqualified namespaces such as `python:lint`,
  `ruby:benchmark`, and `cargo:proc-macro-helper` are rejected by schema or
  semantic validation.
- Verify that reserved namespaces from `reserved-extension-namespaces.json` remain
  reserved for official-looking extension namespace identifiers.
- Verify that validators do not infer domain ownership or portable semantics from a
  syntactically valid unknown extension value.

## Pros and Cons of the Options

### A — Use a simple `<namespace>:<purpose>` slug syntax with short namespaces

- Good, because it is concise and easy to author.
- Good, because it matches the examples originally used in ADR-0112.
- Good, because the schema pattern is simple.
- Bad, because short namespaces require governance to decide who owns names such as
  `python`, `cargo`, or `ruby`.
- Bad, because collisions between ecosystems, tools, profiles, and organizations
  become likely.
- Bad, because ambiguous short namespaces can weaken machine-readable policy
  interoperability.

### B — Use `<namespace>:<purpose>` with dot-capable namespaces and allow both short and reverse-DNS-like namespaces

- Good, because it supports concise ecosystem names and globally scoped names.
- Good, because it is flexible during early experimentation.
- Good, because reverse-DNS-like values remain possible.
- Neutral, because schema validation remains straightforward.
- Bad, because short namespace governance remains unresolved.
- Bad, because authors may choose short names when globally scoped names would be
  safer.
- Bad, because tools may need policy overlays to distinguish well-known short names
  from organization-defined namespaces.

### C — Use reverse-DNS-only `<reverse-dns>:<purpose>` extension values

- Good, because it starts with a clear ownership and collision-avoidance model.
- Good, because it follows familiar OCI/Kubernetes-style extension ownership
  conventions while retaining the colon split from ADR-0112.
- Good, because it avoids allocating or governing short ecosystem namespaces in the
  core specification.
- Good, because schema can reject unqualified short namespaces deterministically.
- Neutral, because unknown extension semantics still require profile or ecosystem
  documentation to become portable.
- Bad, because values are longer and less convenient for authors.

### D — Use DNS-prefix style `<dns-prefix>/<purpose>` extension values

- Good, because it closely follows Kubernetes label and annotation key structure.
- Good, because DNS ownership is explicit.
- Neutral, because it could work well for map keys or metadata paths.
- Bad, because `/` makes the value look path-like rather than enum-like.
- Bad, because it departs from ADR-0112's colon-prefixed extension form.
- Bad, because slash characters are more awkward in CLI arguments, URLs, JSON
  Pointer fragments, and documentation examples.

### E — Use a dotted single-token value such as `<reverse-dns>.<purpose>`

- Good, because it resembles OCI annotation keys and Java package naming.
- Good, because it avoids special delimiter characters beyond dots and hyphens.
- Neutral, because it can still be globally scoped.
- Bad, because it is ambiguous where the namespace ends and the purpose token
  begins.
- Bad, because extension values are less clearly distinguishable from possible
  future core enum forms.
- Bad, because schema and diagnostics cannot split namespace from purpose as
  directly.

### F — Use npm-style `@namespace/purpose` extension values

- Good, because package ecosystem users may recognize the ownership shape.
- Good, because namespace and purpose are visually distinct.
- Neutral, because it could be useful if Agent Volumes intentionally mirrored npm
  scope syntax.
- Bad, because it is JavaScript-ecosystem-specific.
- Bad, because `@` and `/` add unnecessary syntax for a cross-ecosystem enum
  extension value.
- Bad, because it departs from ADR-0112's colon-prefixed extension form.

## More Information

Follow-up work should decide:

- exact JSON Schema regex text and length limits for reverse-DNS purpose extension
  values
- whether `reserved-extension-namespaces.json` should gain examples or comments for
  reverse-DNS purpose extensions
- conformance fixtures for valid reverse-DNS extensions and invalid short,
  uppercase, slash-containing, underscore-containing, and multi-colon values
- whether any future official Agent Volumes purpose extension namespace should use
  a fully qualified domain controlled by the project rather than the currently
  reserved short names
