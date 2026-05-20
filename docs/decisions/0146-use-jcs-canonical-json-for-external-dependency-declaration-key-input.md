---
status: accepted
date: 12026-05-16
decision-makers: Yunseo Kim
---

# Use JCS canonical JSON for external dependency declaration key input

## Context and Problem Statement

ADR-0114 defines each external dependency declaration's semantic identity as the
tuple `(canonical purl, purpose, scope)`. ADR-0130 requires future resolved
evidence records to link back to declarations by stable declaration keys derived
from that semantic identity. ADR-0143 then chooses the declaration key envelope:

```text
av-extdep-v1:sha256:<lowercase-hex-sha256>
```

ADR-0143 intentionally leaves one remaining construction detail open: **which
canonical bytes are hashed to produce the `<lowercase-hex-sha256>` value for
`av-extdep-v1`?**

The key input needs to be stable across TOML formatting, manifest array position,
schema artifacts, exact release metadata, warning payloads, CycloneDX `bom-ref`
values, SPDX extension fields, optional in-toto predicates, logs, and CLI
diagnostics. It also needs to preserve the declaration-plane boundary chosen by
ADR-0116 and ADR-0130.

## Decision Drivers

- The key input should encode the semantic declaration identity selected by
  ADR-0114 without adding fields that would fragment duplicate detection.
- The key input should remain independent of authored TOML whitespace, comments,
  row ordering, array position, and carrier-specific wrapper fields.
- The key input should be easy to reproduce in JSON Schema-adjacent conformance
  fixtures and implementer documentation.
- The serialization should be based on an existing canonical structured-data
  convention rather than an Agent Volumes-specific delimiter format.
- The serialization should avoid number, float, timestamp, and Unicode
  normalization edge cases in the v0.1 baseline.
- Future incompatible changes to key input construction should be expressible by a
  new key-construction version rather than ambiguous interpretation of
  `av-extdep-v1`.

## Considered Options

- A — Serialize a restricted JSON object using JSON Canonicalization Scheme (JCS,
  RFC 8785) and hash its UTF-8 bytes.
- B — Define an Agent Volumes length-prefixed text record format and hash those
  bytes.
- C — Concatenate canonical purl, purpose, and scope with delimiters and hash the
  resulting string.
- D — Serialize a restricted object using deterministic CBOR and hash those bytes.
- E — Hash only a raw canonical PURL plus purpose and a compact scope token.

## Decision Outcome

Chosen option: **A — Serialize a restricted JSON object using JCS and hash its
UTF-8 bytes**, because it gives Agent Volumes a standard canonical structured-data
encoding while keeping the key input readable, fixture-friendly, and aligned with
the repository's existing JSON companion artifacts.

For `av-extdep-v1`, the canonical declaration-key input is the JCS canonicalized
UTF-8 JSON serialization of an object with exactly these members:

```json
{
  "purl": "<canonical-external-package-purl>",
  "purpose": "<purpose>",
  "scope": { "kind": "volume" }
}
```

or, for component-scoped declarations:

```json
{
  "purl": "<canonical-external-package-purl>",
  "purpose": "<purpose>",
  "scope": { "components": ["<component-scope>"] }
}
```

The digest input is produced as follows:

1. Parse and validate the external dependency declaration according to the draft 6
   external dependency rules.
2. Derive `purl` as the canonical external package PURL string after applying the
   Package URL baseline, ADR-0133's allowance for qualifiers, and ADR-0133's
   prohibition on PURL versions and subpaths.
3. Derive `purpose` as the validated purpose string after applying the core purpose
   vocabulary and reverse-DNS extension rules.
4. Derive `scope` as:
   - `{ "kind": "volume" }` when the declaration has no component scope.
   - `{ "components": [...] }` when the declaration is component-scoped, with the
     array containing the canonical component-scope strings sorted
     lexicographically and with duplicates rejected before key construction.
5. Construct a JSON object with exactly the top-level members `purl`, `purpose`, and
   `scope`.
6. Serialize that object using JCS canonicalization and UTF-8 encoding.
7. Compute SHA-256 over those bytes and encode the digest as lowercase hexadecimal
   in the ADR-0143 envelope.

The `av-extdep-v1` key input does not include:

- VERS `constraint` values or normalized VERS comparison outputs
- warnings, warning categories, warning context, advisory matches, or potential
  exposure diagnostics
- resolved versions, digests, installer observations, lockfile references, SBOM
  inventory facts, provenance observations, scanner findings, or other resolved
  evidence
- exact release metadata wrapper fields, CycloneDX wrapper fields, SPDX wrapper
  fields, in-toto predicate wrapper fields, log metadata, or CLI diagnostic fields
- manifest array position, TOML comments, authored whitespace, source file order, or
  other presentation-only details

`constraint` remains outside the declaration key because ADR-0114 treats two
records with the same `(canonical purl, purpose, scope)` but different constraints
as conflicting duplicate declarations rather than independent declarations. ADR-0129
uses normalized VERS comparison only to classify repeated same-key declarations as
duplicates or conflicts.

Warnings and advisory matches remain outside the declaration key because they are
diagnostics about a declaration, not part of the declaration's identity. Resolved
evidence remains outside the declaration key because ADR-0130 requires future
resolved-evidence records to reference declaration-plane records by stable keys,
not to participate in those keys. Carrier fields remain outside the declaration key
because ADR-0143 requires CycloneDX, SPDX, optional in-toto, logs, and diagnostics
to preserve the same key rather than produce carrier-specific variants.

## Consequences

- Good, because independent implementations can produce identical declaration keys
  from the same semantic declaration without depending on TOML formatting or carrier
  placement.
- Good, because the input object is small, inspectable, and directly aligned with
  the ADR-0114 semantic identity tuple.
- Good, because JCS avoids Agent Volumes inventing a new canonical structured-data
  syntax for this purpose.
- Good, because the rule keeps declaration identity stable when advisory data,
  warning text, exact release metadata wrappers, SBOM carriers, or future resolved
  evidence changes.
- Good, because conformance fixtures can publish expected JCS input objects and
  expected `av-extdep-v1:sha256:<hex>` outputs.
- Neutral, because implementers need either a JCS implementation or a small
  restricted-object canonicalizer that matches JCS for this string-only object
  shape.
- Neutral, because any future change to the key input object requires a new
  key-construction version or a narrowly defined compatibility rule.
- Bad, because JCS is an additional referenced algorithm for the draft 6 external
  dependency validation surface.

## Confirmation

- Verify that draft 6 prose defines `av-extdep-v1` declaration key input as JCS
  canonicalized UTF-8 JSON over exactly `purl`, `purpose`, and `scope`.
- Verify that conformance fixtures include positive declaration-key vectors for
  volume-scoped and component-scoped declarations.
- Verify that conformance fixtures reject or fail duplicate component scope entries
  before key construction.
- Verify that changing TOML row order, whitespace, comments, or carrier wrapper
  placement does not change the declaration key.
- Verify that changing `constraint` on the same `(canonical purl, purpose, scope)`
  changes duplicate/conflict classification but does not create a distinct
  declaration key.
- Verify that exact release metadata, potential-exposure warning payloads,
  CycloneDX mappings, SPDX mappings, and optional in-toto predicates preserve the
  same declaration key value.

## Pros and Cons of the Options

### A — Serialize a restricted JSON object using JCS

- Good, because it uses an existing canonical JSON convention rather than a local
  delimiter or escaping scheme.
- Good, because JSON companion artifacts and fixtures can show the key input
  directly.
- Good, because the restricted object contains only strings, arrays, and objects,
  avoiding numeric and timestamp canonicalization concerns.
- Neutral, because JCS must be referenced and tested.
- Bad, because implementers that do not already depend on JCS need one more
  canonicalization step.

### B — Define a length-prefixed text record format

- Good, because length-prefixing avoids delimiter collision and can be implemented
  without a JSON canonicalization dependency.
- Good, because it resembles Agent Volumes' normalized file-tree digest style.
- Bad, because Agent Volumes would need to define escaping, length counting, record
  ordering, Unicode handling, and future extension rules itself.
- Bad, because fixtures would be less natural for JSON Schema-adjacent tooling.

### C — Concatenate canonical fields with delimiters

- Good, because it is compact and simple for prototypes.
- Bad, because delimiter collision, escaping, and future scope extensions become
  error-prone.
- Bad, because the field names and structural boundaries are not self-describing in
  the hash input.

### D — Serialize deterministic CBOR

- Good, because deterministic CBOR is compact and designed for canonical binary
  encoding.
- Good, because it is well suited to security protocols that already use CBOR or
  COSE.
- Bad, because Agent Volumes' companion artifacts and examples are JSON-oriented.
- Bad, because CBOR bytes are harder for spec readers and fixture authors to inspect
  without tooling.

### E — Hash only raw canonical PURL plus purpose and compact scope token

- Good, because the resulting input can be very short.
- Bad, because it lacks explicit field structure and makes future scope evolution
  harder.
- Bad, because it risks conflating package identity with declaration identity, which
  ADR-0143 explicitly avoids.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- JCS proves too costly or unavailable for target implementers despite the restricted
  object shape.
- The external dependency scoping model gains nested or non-string fields that cannot
  be represented cleanly in the restricted input object.
- Future resolved-evidence profiles require a different declaration-link key that
  cannot safely reference `av-extdep-v1`.
- CycloneDX, SPDX, in-toto, or another adopted carrier standardizes an incompatible
  but materially better declaration-key canonicalization model.

## More Information

ADR-0114 defines the semantic uniqueness tuple. ADR-0129 keeps VERS normalization
outside successful semantic key output. ADR-0130 separates declaration-plane records
from future resolved evidence. ADR-0143 defines the declaration key envelope that
wraps the digest produced by this decision.
