---
status: accepted
date: 12026-03-13
decision-makers: Yunseo Kim
---

# Use purl-aligned identity scheme with `shelf` type

## Context and Problem Statement

The Agent Volumes standard needs a globally unique identifier scheme for volumes and their exported components. The scheme must support supply chain security tooling integration (SBOM, vulnerability scanners) and enable precise references to sub-package components.

## Decision Drivers

- Interoperability with existing supply chain security tools (Snyk, Dependabot, OSV, Grype)
- SBOM standard compatibility (SPDX, CycloneDX)
- Ability to reference sub-package components (e.g., a specific tool within a volume)
- Existing ecosystem conventions for package identifiers

## Considered Options

- Custom URI scheme (`vol:@scope/name@version`)
- Package URL (purl) with custom type
- npm-style identifiers only (`@scope/name@version`)

## Decision Outcome

Chosen option: "Package URL (purl) with `shelf` type", because it provides immediate compatibility with the entire supply chain security ecosystem while supporting component-level references via the purl subpath field.

Format: `pkg:shelf/<name>@<version>#<type>/<component>`

The purl type name `shelf` was selected over `bibliotheca` (12 chars, spelling-error-prone) and `bib` (BibTeX confusion) based on analysis of the 38 registered purl types, where CLI name = purl type is the dominant convention (npm, cargo, pub, composer, gem).

### Consequences

- Good, because existing tools (Snyk, Grype, OSV) can parse Agent Volumes identifiers without custom adapters
- Good, because SPDX and CycloneDX SBOMs can include volumes natively
- Good, because the `#subpath` field naturally maps to `<type>/<component>` references
- Neutral, because purl type registration requires a PR to the purl-spec repository
- Bad, because purl URL-encodes the `@` in scopes (`%40`), making raw identifiers less readable

### Confirmation

Validate that `pkg:shelf/` identifiers parse correctly in at least two major supply chain tools (Snyk CLI, Grype) once the type is registered.

## Pros and Cons of the Options

### Custom URI scheme

- Good, because full design control over syntax
- Bad, because zero interoperability with existing tools
- Bad, because requires building custom parsers for every integration

### Package URL with custom type

- Good, because immediate ecosystem interoperability
- Good, because well-specified parsing rules (RFC-compliant)
- Good, because subpath field supports component references
- Neutral, because requires purl type registration (lightweight process)
- Bad, because `%40` encoding for scoped packages reduces readability

### npm-style identifiers only

- Good, because familiar to JavaScript developers
- Bad, because no sub-package component addressing
- Bad, because no integration with supply chain security standards
- Bad, because not a formal URI scheme

## More Information

purl specification: https://github.com/package-url/purl-spec  
Registered types: https://github.com/package-url/purl-spec/blob/main/purl-types-index.json
