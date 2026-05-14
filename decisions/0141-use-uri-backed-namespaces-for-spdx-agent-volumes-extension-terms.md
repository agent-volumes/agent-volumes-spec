---
status: accepted
date: 12026-05-15
decision-makers: Yunseo Kim
---

# Use URI-backed namespaces for SPDX Agent Volumes extension terms

## Context and Problem Statement

ADR-0140 chooses an SPDX 3.0.1 Extension Profile as the primary carrier for Agent
Volumes external dependency declarations. That decision leaves a narrower naming
question: **what is the canonical namespace for Agent Volumes SPDX extension
terms, and how should compact JSON-LD aliases such as `agent-volumes:*` or `av:*`
be treated?**

CycloneDX mappings use `agent-volumes:*` property names because CycloneDX
properties are string-valued name/value extensions. SPDX 3.0.1, by contrast, is
RDF/JSON-LD-oriented and can expand compact terms through a namespace context.

## Decision Drivers

- SPDX 3.0.1 extension terms should have stable, collision-resistant identities.
- Canonical names should survive JSON-LD, RDF, normalized JSON, and future
  documentation examples.
- Compact aliases are useful for readable JSON-LD, but they should not be treated
  as the canonical semantic identity.
- The naming model should avoid confusing CycloneDX string property names with
  SPDX/RDF term identifiers.
- Agent Volumes extension terms should be versioned so future incompatible changes
  can coexist with v0.1 export semantics.

## Considered Options

- A — Use `agent-volumes:*` compact names as canonical SPDX identifiers.
- B — Use a URI-backed Agent Volumes namespace as canonical and allow compact
  JSON-LD aliases.
- C — Use only full URIs in every SPDX JSON-LD document and forbid compact aliases.
- D — Reuse CycloneDX property names without an SPDX namespace mapping.

## Decision Outcome

Chosen option: **B — Use a URI-backed Agent Volumes namespace as canonical and
allow compact JSON-LD aliases**, because it matches SPDX 3.0.1's RDF/JSON-LD
model while keeping serialized examples readable.

The canonical namespace for Agent Volumes SPDX external dependency declaration
terms is:

```text
https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#
```

The canonical class term is:

```text
https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#ExternalDependencyDeclaration
```

The canonical property terms are:

```text
https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#declarationKey
https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#purl
https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#constraint
https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#purpose
https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#scope
https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#declarationOnly
https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#resolvedEvidence
```

SPDX JSON-LD serializations may bind a compact alias to this namespace. The
preferred compact alias for SPDX examples is `av:`:

```json
{
  "@context": {
    "av": "https://agentvolumes.org/ns/spdx/external-dependency-declarations/v0.1#"
  }
}
```

With that context, examples may use compact terms such as:

```text
av:ExternalDependencyDeclaration
av:declarationKey
av:purl
av:constraint
av:purpose
av:scope
av:declarationOnly
av:resolvedEvidence
```

Compact aliases are serialization aids only. The expanded URI is the canonical
identifier.

## Relationship to `agent-volumes:*` Names

CycloneDX `agent-volumes:*` property names remain valid for CycloneDX exports.
They are not the canonical SPDX term identifiers.

SPDX examples may mention `agent-volumes:*` names only as explanatory links to
CycloneDX mappings or as non-canonical aliases when an explicit JSON-LD context
maps the prefix. SPDX normative text should prefer the canonical URI or the
preferred `av:` compact alias.

## Consequences

- Good, because URI-backed terms are stable and collision-resistant.
- Good, because JSON-LD examples can remain readable through compact aliases.
- Good, because the SPDX namespace is clearly separated from CycloneDX property
  names.
- Good, because the namespace is versioned for v0.1 external dependency
  declaration semantics.
- Neutral, because examples must include or reference the JSON-LD context before
  compact aliases are meaningful.
- Bad, because implementers must handle URI expansion instead of treating compact
  strings as canonical identifiers.
- Bad, because using both CycloneDX `agent-volumes:*` and SPDX `av:*` terms
  requires careful documentation to avoid confusion.

## Confirmation

- Verify that draft 6 SPDX mapping prose identifies the URI namespace as canonical.
- Verify that JSON-LD examples include a namespace context before using `av:*`
  compact aliases.
- Verify that `agent-volumes:*` names are described as CycloneDX property names or
  non-canonical aliases, not as canonical SPDX identifiers.
- Verify that SPDX mapping fixtures expand compact aliases to the canonical URI
  terms when testing semantic equality.
- Verify that future namespace changes use a new versioned namespace rather than
  changing the meaning of the v0.1 namespace.

## Pros and Cons of the Options

### A — Use `agent-volumes:*` compact names as canonical SPDX identifiers

- Good, because it matches existing CycloneDX examples and is easy to read.
- Bad, because compact strings are not stable RDF identifiers without a namespace
  mapping.
- Bad, because it conflates CycloneDX property naming with SPDX JSON-LD term
  identity.

### B — Use a URI-backed Agent Volumes namespace as canonical and allow compact JSON-LD aliases

- Good, because it matches SPDX 3.0.1's RDF/JSON-LD model.
- Good, because compact aliases remain available for readability.
- Good, because the expanded URI is unambiguous across serializations.
- Neutral, because implementers must manage a namespace context.

### C — Use only full URIs in every SPDX JSON-LD document and forbid compact aliases

- Good, because it maximizes explicitness.
- Bad, because it makes examples verbose and harder to read.
- Bad, because JSON-LD already has a standard compact-alias mechanism.

### D — Reuse CycloneDX property names without an SPDX namespace mapping

- Good, because it minimizes apparent naming differences between export targets.
- Bad, because it lacks canonical RDF identity.
- Bad, because it makes SPDX fixture validation depend on string conventions that
  belong to CycloneDX properties rather than SPDX extension terms.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- SPDX 3.x standardizes a registry or naming convention that conflicts with the
  selected namespace shape.
- Agent Volumes adopts a broader SPDX extension namespace that should subsume the
  external dependency declaration namespace.
- Implementers find that `av:` conflicts with common SPDX tooling assumptions and a
  different compact alias is needed for examples.
- The v0.1 external dependency declaration semantics change incompatibly and need a
  new namespace version.

## More Information

ADR-0140 defines the SPDX carrier that uses these namespace terms. CycloneDX
property names remain governed by ADR-0139.
