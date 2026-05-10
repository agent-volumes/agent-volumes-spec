---
status: accepted
date: 12026-05-09
decision-makers: Yunseo Kim
---

# Adopt an artifact-first deterministic conformance harness

## Context and Problem Statement

ADR-0020 requires normative conformance fixtures and vectors in v0.1. The
current specification also defines normative machine-readable companion
artifacts, JSON Schemas, an OpenAPI contract, normalized-file-tree digest
construction, constrained SemVer range behavior, resolver lifecycle semantics,
problem details, trust metadata, two-phase release and trust upload flows, and a
layered Sigstore/SLSA/CycloneDX verification boundary.

The repository already reflects this direction through companion artifacts under
`schemas/`, `openapi/`, and `conformance/fixtures/`, plus an artifact validation
script. Those artifacts make conformance more concrete than prose alone, but
they also raise a boundary question: **should v0.1 conformance require only
static artifact shape checks, deterministic behavior vectors, profiled packs, or
live registry or product certification?**

## Decision Drivers

- Make v0.1 conformance executable without making a reference implementation
  normative.
- Preserve deterministic interoperability for digesting, manifest parsing,
  resolver behavior, lifecycle behavior, API payloads, and trust metadata.
- Keep conformance offline-capable where the relevant artifacts and vectors are
  available locally.
- Avoid requiring a deployed bibliotheca, hosted certification service, object
  storage backend, CDN, or network behavior in the v0.1 core.
- Keep OpenAPI conformance focused on document, schema, and example validation in
  v0.1 rather than full HTTP interoperability testing.
- Keep policy-heavy security, vulnerability, governance, performance, and UX
  checks outside the portable v0.1 baseline.
- Leave room for a future client and bibliotheca certification program once
  implementations and governance processes are more mature.

## Considered Options

- Static artifact validator only.
- Static artifacts plus deterministic behavior vectors.
- Live registry certification harness.
- Full client and bibliotheca certification program.
- Profiled conformance packs.

## Decision Outcome

Chosen option: **Static artifacts plus deterministic behavior vectors**, because
it makes the v0.1 normative contract testable while remaining independent of any
one implementation, deployment topology, hosted service, or network environment.

Under this decision, the v0.1 conformance harness is an **artifact-first,
offline-capable harness**. It validates normative structured artifacts and pure
input/output behavior vectors. An implementation can demonstrate baseline
conformance by producing, consuming, or validating the same normative artifacts
and vectors; it does not need to expose a live registry endpoint or match a
reference implementation's internals.

The v0.1 harness MUST include deterministic checks for at least:

- JSON Schema validity for normative structured artifacts
- OpenAPI document shape, examples, security scheme declarations, and problem
  details references
- `volume.toml` valid, invalid, and warning behavior against the canonical parsed
  data model
- normalized-file-tree digest golden vectors, including archive and filesystem
  edge cases
- package identity, component identity, and purl mapping fixtures
- SemVer range grammar accept/reject fixtures
- dependency-resolution accept/reject cases, including lifecycle status behavior
- version index row fixtures and exact release metadata consistency cases
- problem details taxonomy fixtures
- trust metadata summary and detail payload fixtures
- trust attachment lifecycle fixtures, including append-only status and revision
  behavior
- two-phase release upload lifecycle vectors
- two-phase trust attachment upload lifecycle vectors
- layered Sigstore/SLSA/CycloneDX verification input and expected-result vectors
- advisory payload fixtures
- capability metadata payload fixtures
- BOM, provenance, SPDX, and CycloneDX mapping sample fixtures
- permission-escalation rejection cases

The v0.1 harness MUST NOT require:

- a deployed bibliotheca or live HTTP service
- a hosted certification authority or certification badge service
- one normative client, bibliotheca, or reference implementation
- network, CDN, cache, retry, replication, or object-storage behavior
- live Sigstore, Rekor, SLSA, vulnerability, license, malware, or advisory
  services
- universal organization policy for builders, publishers, vulnerabilities,
  licenses, advisories, or trust tiers
- performance, load, UX, CLI workflow, or registry-operations policy tests

OpenAPI conformance in v0.1 means document, schema, example, security scheme,
and problem details validation. It does not by itself require live HTTP protocol
testing.

Trust verification conformance in v0.1 means deterministic validation of
artifact format, release-subject binding, lifecycle status behavior, signature or
attestation inputs where fixture material is provided, and expected baseline
verification facts. It does not require one universal trust-root distribution
mechanism, online freshness check, vulnerability scanner, or package-safety
policy engine.

## Reconsidering a full client and bibliotheca certification program

A full client and bibliotheca certification program remains a future expansion
direction. The project SHOULD reconsider a certification program in a later
version if several of the following conditions hold:

- multiple independent clients or bibliothecas have passed the v0.1 artifact
  harness
- at least one conforming client and one conforming bibliotheca can be tested
  together without relying on project-private coordination
- live registry interoperability needs are concrete enough to test against
  multiple implementations without blessing one implementation
- certification scope can be limited to stable, non-optional API and client
  behavior rather than local policy, UX, performance, or operational preferences
- submission, review, version-skew, renewal, dispute, and appeal processes have
  clear governance owners
- pass/fail claims, badges, or public listings can be published without confusing
  certification status with the v0.1 core artifact harness
- security and enterprise adopters need a stronger ecosystem trust signal than
  artifact-level conformance alone can provide

Until those conditions are met, the v0.1 core favors one artifact-first
deterministic harness over a product certification program.

## Consequences

- Good, because v0.1 conformance is executable and reproducible rather than only
  prose-based.
- Good, because implementers can test digest, resolver, lifecycle, API payload,
  and trust semantics without deploying infrastructure.
- Good, because no single implementation becomes the de facto specification.
- Good, because the boundary matches ADR-0020's normative fixture and vector
  requirement.
- Good, because a future certification program can add live ecosystem trust
  signals without weakening the core baseline.
- Neutral, because the fixture corpus must be curated carefully and versioned as
  a normative interoperability artifact.
- Neutral, because OpenAPI validation remains narrower than end-to-end HTTP
  interoperability.
- Bad, because deterministic vectors require precise expected outputs and may
  expose ambiguities that must be resolved before release.
- Bad, because product-level client and bibliotheca certification will still need
  a later governance and operations model.

## Confirmation

- Verify that the harness can run from repository artifacts without network
  access.
- Verify that JSON Schemas, OpenAPI, examples, and fixtures validate as
  normative companion artifacts.
- Verify that digest, manifest, SemVer, resolver, lifecycle, problem details,
  trust, advisory, capability, and mapping vectors have explicit expected
  outcomes.
- Verify that OpenAPI checks do not imply live HTTP certification in v0.1.
- Verify that trust verification vectors separate objective artifact facts from
  local policy judgments.
- Verify that fixture updates are treated as normative interoperability changes
  when they affect required behavior.
- Verify that future product certification claims remain clearly distinct from
  core v0.1 conformance.

## Pros and Cons of the Options

### Static artifact validator only

- Good, because it is simple and fast to implement.
- Good, because it improves schema, OpenAPI, and fixture hygiene.
- Neutral, because it could be sufficient for a documentation-only draft.
- Bad, because it is too weak for normative digest, resolver, lifecycle, and
  trust behavior.
- Bad, because implementations could pass while disagreeing on deterministic
  behavior.

### Static artifacts plus deterministic behavior vectors

- Good, because it validates both artifact shape and observable deterministic
  semantics.
- Good, because it remains offline-capable and implementation-neutral.
- Good, because it directly exercises recent v0.1 decisions.
- Neutral, because some vectors need careful fixture design and maintenance.
- Bad, because it increases the amount of normative test material maintained by
  the project.

### Live registry certification harness

- Good, because it would test real HTTP integration and registry behavior.
- Good, because it may be valuable for later ecosystem certification.
- Neutral, because some bibliothecas may voluntarily provide live test endpoints.
- Bad, because it is too heavy for the v0.1 core baseline.
- Bad, because it would pull network, storage, auth infrastructure, reliability,
  and operations into conformance too early.
- Bad, because it risks making one hosted implementation or service appear
  normative.

### Full client and bibliotheca certification program

- Good, because it would provide a stronger ecosystem trust signal for adopters.
- Good, because clients and bibliothecas could make public conformant-product
  claims.
- Good, because it may become useful once multiple implementations need shared
  certification evidence.
- Neutral, because certification may eventually complement but not replace the
  artifact harness.
- Bad, because it is too early for v0.1 and requires governance, submission,
  review, renewal, dispute, and version-skew processes.
- Bad, because operating a certification program is larger than maintaining a
  specification fixture suite.

### Profiled conformance packs

- Good, because optional packs can express stricter client, bibliotheca,
  trust-verifier, frozen-install, or enterprise-policy expectations.
- Good, because they let future certification evolve without bloating the core.
- Neutral, because profile boundaries require implementation experience before
  they become stable.
- Bad, because introducing packs in v0.1 would create versioning and governance
  overhead before the baseline is proven.
- Bad, because premature profiles could fragment conformance claims rather than
  clarify them.
