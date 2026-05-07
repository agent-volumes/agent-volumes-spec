---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
supersedes: 0001-purl-aligned-identity-scheme
---

# Use `volume` as the purl type instead of `shelf`

## Context and Problem Statement

ADR-0001 selected Package URL (purl) with the custom type `shelf` for Agent Volumes package identity.

That decision was reasonable at the time: `shelf` was short, distinctive, and less awkward than alternatives such as `bibliotheca` or `bib`.

However, subsequent clarification of project boundaries introduced a new concern that ADR-0001 did not weigh heavily enough:

- the Agent Volumes standard is governed by the **Agent Volumes Organization**, an independent, vendor-neutral standards body
- the `shelf` CLI and `Alexandria` bibliotheca are **Windlass-maintained reference implementations**, not governance artifacts of the standard
- `SHELF` is also a Windlass brand asset, with trademark protection concerns around genericization and category-label drift

This creates a naming tension if the standard also uses `shelf` as the normative purl type:

- in standards and tooling contexts, purl types behave like neutral ecosystem identifiers
- in brand and legal contexts, `SHELF` should continue to function as a source identifier for the Windlass client rather than as the ordinary name of the package category itself

At the same time, the replacement name must still fit normal purl-type conventions and remain easy for external tooling ecosystems to understand.

## Decision Drivers

- Preserve interoperability with existing supply chain security tools (Snyk, Dependabot, OSV, Grype)
- Keep purl-compatible component addressing via the subpath field
- Reduce avoidable trademark genericization / source-identifier erosion risk for the Windlass `SHELF` mark
- Preserve the governance and branding separation between the neutral standard and its downstream implementations
- Follow ordinary purl-type naming conventions used for ecosystem/protocol identifiers
- Prefer a concise, broadly legible identifier over opaque abbreviations

## Considered Options

- Keep `shelf`
- Change the purl type to `volume`
- Change the purl type to `vol`
- Revisit a longer registry-derived name such as `bibliotheca`

## Decision Outcome

Chosen option: **Change the purl type from `shelf` to `volume`**, because it best balances standards neutrality, naming clarity, and trademark risk reduction while remaining plausible within purl naming conventions.

Format: `pkg:volume/<name>@<version>#<type>/<component>`

Under this decision:

- `volume` becomes the normative purl type token for Agent Volumes packages.
- `shelf` remains the Windlass-maintained reference client implementation name.
- The standard and the implementation brand are intentionally decoupled at the identifier layer.
- Existing references to `pkg:shelf/...` in the specification are replaced by `pkg:volume/...`.

The name `volume` was selected over `vol` and continued use of `shelf` for these reasons:

- `volume` aligns directly with the standard's own distribution-unit terminology.
- singular `volume` follows the general naming pattern of purl ecosystem tokens better than plural `volumes`.
- `vol` is too abbreviated and under-specified for an ecosystem identifier.
- `shelf`, while distinctive, now carries an avoidable brand/source-identifier entanglement with the downstream Windlass client.

### Consequences

- Good, because the purl type becomes more governance-neutral and no longer mirrors the name of a specific downstream implementation
- Good, because the change reduces the risk that `SHELF` drifts toward becoming the ordinary category label for Agent Volumes packages
- Good, because `volume` is already the standard's core package-domain term and is readily legible to non-native English speakers
- Good, because component addressing and supply-chain interoperability remain unchanged at the purl-structure level
- Neutral, because `volume` is more generic than `shelf` and overlaps with storage-related terminology in adjacent technical domains
- Neutral, because the ecosystem still needs formal purl-type registration and tool validation regardless of the chosen token
- Bad, because the change supersedes ADR-0001 and requires spec/example updates wherever `pkg:shelf/...` previously appeared

### Confirmation

- Validate that `pkg:volume/` identifiers parse correctly in major supply chain tools once the type is registered
- Confirm that specification prose no longer relies on CLI-name = purl-type convention
- Confirm that `shelf` remains clearly documented as a downstream reference client brand, not the normative purl type

## Pros and Cons of the Options

### Keep `shelf`

- Good, because it is short, distinctive, and already documented
- Good, because it avoids the genericity of `volume`
- Bad, because it couples the neutral package identifier to a branded downstream implementation name
- Bad, because it increases the risk that the `SHELF` mark is interpreted as the category name of the ecosystem rather than the source identifier of the client

### Change to `volume`

- Good, because it matches the standard's package-domain term directly
- Good, because it separates the purl identifier from downstream implementation branding
- Good, because singular `volume` reads more naturally than plural `volumes` for an ecosystem token
- Neutral, because it is more generic and somewhat overloaded in adjacent storage-oriented tooling contexts

### Change to `vol`

- Good, because it is short
- Bad, because it reads like an unexplained abbreviation rather than a stable ecosystem identifier
- Bad, because it is less legible, especially to non-native English readers

### Revisit `bibliotheca`

- Good, because it would align the type with the registry term
- Bad, because it is long, spelling-error-prone, and inconsistent with short purl-type norms
- Bad, because it solves neither the brand separation concern nor the package-domain naming concern as well as `volume`

## More Information

- purl specification: <https://github.com/package-url/purl-spec>
- Registered types: <https://github.com/package-url/purl-spec/blob/main/purl-types-index.json>
