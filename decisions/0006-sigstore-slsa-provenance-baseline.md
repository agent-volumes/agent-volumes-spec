---
status: accepted
date: 12026-05-05
decision-makers: Yunseo Kim
---

# Use Sigstore and SLSA as the provenance and attestation baseline

## Context and Problem Statement

With the BOM strategy decided in ADR-0005, Agent Volumes still needs a concrete provenance and attestation baseline for publish, install, and verification workflows.

The current specification already introduces provenance and attestation concepts:

- `volume.toml` includes a `[provenance]` section and a `[provenance.build]` subsection.
- The Trust and Supply Chain Model calls for provenance attestation verification.
- Bibliothecas are expected to verify build provenance using CI identity and signature-related evidence.

However, the specification did not yet define which provenance and signing ecosystem should act as the interoperability baseline.

The decision must balance practical implementability, interoperability, and alignment with the dominant 2026 software supply chain verification model.

## Decision Drivers

- Immediate interoperability for publish/install/verify workflows
- A clear, machine-verifiable baseline for provenance generation and verification
- Alignment with current supply chain security practice and tooling
- Minimal ambiguity for conforming registries and clients
- Compatibility with the A+ BOM strategy chosen in ADR-0005
- Room for future expansion without weakening the baseline

## Considered Options

- P1 — Use SLSA provenance and Sigstore-based signing/verification as the normative baseline
- P2 — Require provenance attestation, but remain signing- and framework-neutral, treating Sigstore/SLSA only as a recommended profile
- P3 — Define only provenance attachment/discovery/verification hooks now, and defer the baseline ecosystem decision to a later ADR or release candidate

## Decision Outcome

Chosen option: "P1", because it provides the clearest, most implementable baseline while aligning with the dominant 2026 supply chain provenance workflow.

Under this approach:

- **SLSA provenance** is the baseline provenance model for Agent Volumes publish and verification workflows.
- **Sigstore-family signing and verification** is the baseline trust mechanism for provenance-attached artifacts.
- Registries and clients SHOULD treat this stack as the first interoperability target for provenance generation, discovery, and validation.
- The specification MAY allow additional provenance/signing systems later, but they do not replace the normative baseline.

### Consequences

- Good, because registries and clients gain a clear baseline for verification behavior instead of inventing incompatible trust models
- Good, because the baseline matches current industry practice for machine-verifiable provenance, signatures, OIDC-backed identity, and transparency-log-oriented workflows
- Good, because it complements ADR-0005 cleanly: CycloneDX is the BOM exchange format, while Sigstore + SLSA provide the provenance and attestation trust baseline
- Good, because future optional profiles can be added without weakening the minimum interoperability guarantee
- Neutral, because not every ecosystem will use Sigstore or SLSA natively, so some implementations will need mapping or wrapper logic
- Bad, because the choice is more opinionated than a framework-neutral baseline
- Bad, because premature divergence from the baseline by implementers could create apparent but incompatible provenance support claims

### Confirmation

- Verify that a conforming publisher can attach SLSA-style provenance to a published Agent Volumes artifact
- Verify that a conforming bibliotheca can discover and validate baseline provenance and associated signatures consistently
- Verify that a conforming client can distinguish between baseline-valid provenance and unsupported/custom provenance formats

## Pros and Cons of the Options

### P1

- Good, because it yields a concrete and interoperable publish/install/verify baseline immediately
- Good, because it matches the current supply chain security convergence around signed provenance, CI-backed identity, and transparent verification workflows
- Good, because it reduces early ambiguity for registry and client implementers
- Bad, because it is more prescriptive than a purely neutral specification

### P2

- Good, because it stays neutral across signing and provenance ecosystems
- Good, because it allows a broader range of implementations to claim support without adopting one specific stack
- Bad, because it weakens interoperability by making baseline verification behavior harder to predict
- Bad, because it encourages multiple incompatible trust models during the earliest phase of the ecosystem
- Bad, because it shifts complexity onto implementers and downstream consumers precisely where trust should be clearest

### P3

- Good, because it reduces immediate specification burden and leaves more time for field validation
- Good, because it avoids prematurely overcommitting if the ecosystem is still changing
- Bad, because it delays the most important part of provenance standardization: a shared verification baseline
- Bad, because it risks early fragmentation in registry, client, and publisher implementations
- Bad, because it would leave the Trust and Supply Chain Model with hooks but without a sufficiently concrete interoperability target
