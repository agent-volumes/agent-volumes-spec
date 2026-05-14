---
status: accepted
date: 12026-05-09
decision-makers: Yunseo Kim
---

# Use layered artifact verification with optional policy for Sigstore, SLSA, and CycloneDX

## Context and Problem Statement

ADR-0005 establishes CycloneDX as the normative BOM exchange format. ADR-0006
establishes SLSA provenance and Sigstore-family signing and verification as the
baseline provenance and attestation stack. ADR-0007 establishes dual-subject
binding between package-facing identity and immutable digest, ADR-0015 defines the
v0.1 trust baseline as BOM, provenance, and signature interoperability, and
ADR-0027 requires hard failure for digest mismatch, subject mismatch, inconsistent
trust binding, and revoked or invalid trust artifacts by default.

The current specification therefore has the trust artifact categories, subject
binding model, discovery surfaces, lifecycle status model, and default failure
posture needed for verification. It does not yet define the precise verification
algorithm boundary for Sigstore bundles, SLSA provenance, and CycloneDX BOMs.

That leaves a verification question unresolved: **should v0.1 define only a light
artifact-presence check, a full package-safety policy engine, or a layered
artifact verifier that validates objective artifact facts while leaving broader
trust policy local?**

## Decision Drivers

- Make the Sigstore/SLSA/CycloneDX baseline meaningful rather than nominal.
- Preserve hard failures for objective integrity, subject-binding, signature,
  transparency, schema, and lifecycle invalidity.
- Keep BOM presence and schema validity separate from dependency safety or
  vulnerability absence.
- Keep builder identity allowlists, publisher trust tiers, vulnerability blocking,
  license policy, and organization-specific risk decisions outside the v0.1 core.
- Preserve fact-first trust discovery and avoid turning bibliotheca-derived
  judgments into canonical truth.
- Support offline or locally reproducible verification when trust artifacts,
  bundles, and trust roots are available.
- Leave room for stricter future profiles without making the baseline too heavy.

## Considered Options

- Minimal artifact-presence and subject-binding verifier.
- Layered artifact verifier with optional policy.
- Full trust policy engine in v0.1.
- Registry-hosted verification oracle.
- Strict baseline requiring complete BOM, provenance, and signature coverage.

## Decision Outcome

Chosen option: **Layered artifact verifier with optional policy**, because it
standardizes objective trust-artifact validity for the exact release while keeping
package-safety, builder-allowlist, vulnerability, and registry-governance
judgments in local policy or future profiles.

Under this decision, the v0.1 verifier answers the baseline question: **are the
available trust artifacts valid for this exact published release subject?** It
does not answer the broader question: **is this package safe or approved under a
particular organization's policy?**

The v0.1 verification algorithm is layered:

1. Resolve and validate the release subject: package-facing identity
   `pkg:volume/...@version` plus normalized-file-tree `sha256` integrity.
2. Discover trust summary and detail metadata for the release.
3. Ignore absent optional trust artifacts as missing evidence rather than an
   automatic baseline hard failure.
4. Exclude or fail on trust attachments whose lifecycle status is `revoked` or
   `invalid` according to the default failure rule in ADR-0027.
5. Validate trust artifact format identity against the baseline category and
   format conventions.
6. Retrieve or inspect the trust artifact bytes or embedded representation.
7. Validate release-subject binding for each artifact against both logical
   identity and immutable content identity.
8. For Sigstore-family signatures or bundles, verify the cryptographic signature,
   signing certificate or key material, bundled transparency or timestamp evidence
   when present in the supported bundle profile, and the signed subject digest.
9. For SLSA provenance, verify the attestation envelope, require the baseline
   predicate type `https://slsa.dev/provenance/v1`, validate that the provenance
   subject digest matches the release integrity, and extract builder/source facts
   for optional policy evaluation.
10. For CycloneDX BOMs, validate the BOM structure and schema/profile identity,
    validate the mapped package identity and SHA-256 hash fields when present, and
    treat component inventory as evidence rather than as a safety verdict.
11. Report objective verification facts and failures separately from local policy
    judgments.
12. Apply implementation-local or profile-defined policy only after baseline
    artifact verification facts have been computed.

The following conditions are baseline hard failures when the relevant artifact is
present and being evaluated:

- release content digest mismatch
- trust artifact subject mismatch or inconsistent trust binding
- malformed baseline trust artifact or unsupported baseline format identity
- invalid Sigstore signature or unsupported required bundle verification material
- invalid SLSA attestation envelope, wrong SLSA predicate type, or subject digest
  mismatch
- invalid CycloneDX BOM structure for the declared CycloneDX profile or schema
- explicit `revoked` or `invalid` trust attachment status, unless an
  implementation uses an explicit non-baseline override as allowed by ADR-0027

The following remain facts, warnings, local policy inputs, or future-profile
inputs rather than v0.1 core hard failures by themselves:

- absence of one or more baseline trust artifact categories
- builder identity allowlists or deny lists
- source repository, workflow, or external-parameter expectations beyond subject
  binding
- publisher `verified` or `trusted` status requirements
- vulnerability, license, malware, dependency-risk, or advisory blocking policy
- SLSA level requirements beyond the baseline SLSA provenance predicate and
  subject validation
- registry reputation or organization-specific approval workflows

This decision intentionally does not standardize:

- one universal Sigstore trust-root distribution or update mechanism
- one universal OIDC issuer, certificate identity, builder identity, repository,
  workflow, or SLSA level policy
- online verification or online freshness checks at install time
- vulnerability scanning, license scanning, malware scanning, or advisory freshness
  requirements
- a universal `trusted` or `policyCompliant` judgment vocabulary
- registry-hosted trust-decision APIs beyond the existing fact-first summary and
  raw detail views

## Consequences

- Good, because Sigstore, SLSA, and CycloneDX support now has concrete verification
  meaning in the v0.1 baseline.
- Good, because artifact validity is separated from organization-specific package
  safety decisions.
- Good, because digest and subject-binding failures remain strong hard failures.
- Good, because valid CycloneDX BOMs are treated as structured inventory evidence,
  not as proof that dependencies are safe.
- Good, because builder identity, publisher trust, vulnerability blocking, and
  other policy-heavy checks can evolve through local policy or future profiles.
- Good, because offline or reproducible verification remains possible when the
  needed artifacts and trust roots are available locally.
- Neutral, because implementers must integrate real Sigstore, SLSA, and CycloneDX
  validation rather than checking only category labels.
- Neutral, because strict environments will still need policy configuration beyond
  the baseline verifier.
- Bad, because v0.1 clients and bibliothecas must implement more than a simple
  presence check.
- Bad, because different local policies may still produce different install
  decisions after the shared artifact-validity layer succeeds.

## Confirmation

- Verify that trust artifact discovery exposes enough detail for independent
  artifact retrieval and verification.
- Verify that baseline verification checks both logical identity and immutable
  content identity for each applicable trust artifact.
- Verify that Sigstore-family signatures or bundles fail when cryptographic
  verification, subject digest, or required supported bundle evidence is invalid.
- Verify that SLSA provenance uses predicate type
  `https://slsa.dev/provenance/v1` and binds to the release integrity digest.
- Verify that CycloneDX BOM validation is structural and mapping-oriented, not a
  vulnerability or safety verdict.
- Verify that absence of optional baseline trust artifacts is surfaced without
  mandatory baseline install failure.
- Verify that revoked or invalid trust attachments cause default failure under
  ADR-0027.
- Verify that derived judgments remain separate from canonical trust facts.

## Pros and Cons of the Options

### Minimal artifact-presence and subject-binding verifier

- Good, because it is fast to implement.
- Good, because it keeps the baseline small and mostly offline.
- Neutral, because it could be adequate for early metadata plumbing tests.
- Bad, because it makes Sigstore/SLSA support mostly nominal.
- Bad, because forged, malformed, or cryptographically invalid artifacts may be
  treated too similarly to valid artifacts.
- Bad, because it undercuts ADR-0006's machine-verifiable provenance and signing
  baseline.

### Layered artifact verifier with optional policy

- Good, because it validates objective artifact facts without standardizing a
  universal package-safety policy.
- Good, because it matches the fact-first trust summary model and raw detail view.
- Good, because it preserves strong failures for digest, subject, cryptographic,
  schema, and lifecycle invalidity.
- Good, because local or future-profile policy can become stricter without
  changing the baseline verifier.
- Neutral, because trust roots and verifier implementation details still require
  careful maintenance.
- Bad, because implementations must support multiple verification libraries and
  artifact formats.

### Full trust policy engine in v0.1

- Good, because it could produce a simple install/block decision for users.
- Good, because it aligns with high-assurance environments that want complete
  policy enforcement.
- Neutral, because enterprise profiles may eventually define this kind of engine.
- Bad, because it would require universal policy decisions for builders,
  publishers, vulnerabilities, licenses, and advisories too early.
- Bad, because it would conflate artifact authenticity with package safety.
- Bad, because it would likely require online freshness sources that v0.1 should
  not mandate.

### Registry-hosted verification oracle

- Good, because clients can be simpler.
- Good, because a bibliotheca can centralize trust roots, revocation, advisory, and
  policy updates.
- Neutral, because registries may still expose derived judgments locally.
- Bad, because it weakens independent verification and offline audit workflows.
- Bad, because it risks turning registry-local judgments into apparent canonical
  truth.
- Bad, because compromised or incorrect bibliotheca projection behavior is already
  part of the threat model.

### Strict baseline requiring complete BOM, provenance, and signature coverage

- Good, because it creates the strongest baseline supply-chain coverage.
- Good, because it encourages publishers to provide complete evidence from the
  start.
- Neutral, because high-assurance profiles may adopt this later.
- Bad, because it conflicts with ADR-0027's decision that missing trust evidence is
  weaker than explicit invalidation and does not automatically require baseline
  install failure.
- Bad, because it raises adoption barriers for the first interoperable draft.
- Bad, because it treats absence of evidence too much like known-bad evidence.
