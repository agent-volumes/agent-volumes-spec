---
status: accepted
date: 12026-05-05
decision-makers: Yunseo Kim
---

# Use dual-subject binding with purl+version and resolved digest

## Context and Problem Statement

With the BOM strategy decided in ADR-0005 and the provenance baseline decided in ADR-0006, Agent Volumes still needs a normative rule for **what published release trust metadata is actually about**.

The current draft already contains two important but only partially connected identity models:

- a **logical package identity** built on purl, version, and component subpaths
- an **immutable content identity** built on the SHA-256 digest of the canonical published archive

However, the specification does not yet clearly say how `volume.toml`, CycloneDX BOMs, provenance attestations, signatures, scanner findings, advisories, Git-backed references, and downloadable archives are all required to point to the **same published subject**.

This gap creates ambiguity for registries, clients, and downstream tooling:

- Should trust metadata bind only to a package-facing identifier such as `pkg:shelf/...@version`?
- Should it bind only to an immutable digest?
- Should both be required?
- If human-facing references such as Git tags or tarball URLs disagree with the digest, which one wins?

Current 2026 ecosystem practice is also relevant:

- OCI-based supply-chain metadata is typically attached to a **subject digest** and discovered via **referrers**.
- in-toto and SLSA provenance models bind attestations to artifact digests.
- Sigstore and related tooling verify attestation/signature material against an immutable digest plus signer identity and trust policy.
- Package ecosystems and advisory tooling still need a stable **package-facing identity** for lookup, indexing, human comprehension, and interoperability.

The decision must preserve both supply-chain rigor and package-ecosystem usability.

## Decision Drivers

- Unambiguous binding between package identity and immutable published content
- Compatibility with ADR-0005's canonical Agent Volumes semantics and CycloneDX exchange strategy
- Compatibility with ADR-0006's SLSA + Sigstore provenance baseline
- Clean mapping to OCI referrers, in-toto subject digests, and digest-based verification workflows
- Continued usability for package indexes, advisories, scanner outputs, and BOM consumers that reason in purls and versions
- Clear precedence when delivery references such as Git tags or tarball URLs are mutable or misleading
- A foundation for later decisions on provenance discovery, verification timing, and scanner/advisory linkage

## Considered Options

- A — Use the resolved digest as the only normative trust subject
- B — Use `pkg:shelf/...@version` as the only normative trust subject
- C — Use a dual-subject model: `pkg:shelf/...@version` plus resolved immutable digest
- D — Use a hierarchical model where digest is primary and purl+version is a mandatory alias/locator layered above it

## Decision Outcome

Chosen option: "C", because it preserves the package-facing identity required by Agent Volumes and supply-chain interoperability while also adopting the immutable digest binding expected by current provenance and attestation practice.

Under this approach:

- Every published Agent Volume release has a **logical identity** expressed as `pkg:shelf/...@version`.
- Every published Agent Volume release has an **immutable content identity** expressed as the resolved digest of the published artifact.
- Trust metadata for that release MUST bind to the same published subject in a way that is losslessly mappable to both identities.
- Human-facing delivery references such as tarball URLs, Git repository URLs, Git tags, and similar distribution metadata remain useful, but they are **not** the ultimate trust anchor.
- When a delivery reference disagrees with the resolved immutable digest, the **digest wins**.

### Consequences

- Good, because registries, clients, and security tooling can reason about a release both as a package version and as immutable content
- Good, because CycloneDX BOMs, provenance attestations, signatures, and scanner outputs can all be anchored to the same release without forcing the specification to choose between package identity and content identity
- Good, because this aligns naturally with OCI referrers, in-toto subject digests, and Sigstore/SLSA verification practices
- Good, because advisories, search systems, and package-oriented user interfaces can continue to speak in purls and versions without weakening digest-based trust
- Good, because mutable delivery references such as Git tags become explicitly subordinate to immutable content identity
- Neutral, because future specification text still needs to define exactly how each metadata artifact expresses the dual binding
- Bad, because emitters and validators will need to carry and cross-check two related identifiers instead of one
- Bad, because some external formats may represent one side of the binding more naturally than the other, requiring disciplined mapping rules

### Confirmation

- Verify that a conforming published release can always be identified as both `pkg:shelf/...@version` and an immutable digest
- Verify that a conforming BOM/provenance/signature mapping can be checked against both identities without ambiguity
- Verify that registries and clients can detect and reject mismatches between package-facing release identity and resolved immutable content identity
- Verify that later registry/API discovery rules can expose trust metadata for a release without losing either the package-facing identifier or the digest-bound subject

## Pros and Cons of the Options

### A

- Good, because it gives the strongest single cryptographic anchor
- Good, because it matches digest-centric attestation and verification workflows closely
- Bad, because it weakens package-facing ergonomics for advisories, search, indexing, and ecosystem interoperability
- Bad, because it makes logical package identity feel secondary in a package specification

### B

- Good, because it is simple and easy for users and package tooling to read
- Good, because it fits traditional package-manager mental models
- Bad, because it is too weak as a stand-alone trust anchor for modern provenance and attestation workflows
- Bad, because it leaves substitution and replay questions harder to answer cleanly

### C

- Good, because it cleanly combines package identity and immutable content identity
- Good, because it fits both package-ecosystem tooling and digest-centric supply-chain verification
- Good, because it provides a stable basis for later decisions on provenance discovery, verification timing, and advisory/scanner linkage
- Neutral, because it requires explicit cross-artifact mapping rules in later specification work
- Bad, because implementers must consistently preserve both identities across emitted metadata

### D

- Good, because it is rigorous and makes the digest-primary trust model explicit
- Good, because it captures the intuition that package-facing identity is a locator layered over immutable content
- Bad, because it is more abstract and complex than needed at the current specification maturity level
- Bad, because it risks turning a pragmatic package standard into a more OCI-centric artifact graph model than current adopters need
