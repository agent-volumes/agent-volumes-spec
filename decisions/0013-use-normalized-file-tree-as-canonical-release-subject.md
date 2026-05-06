---
status: accepted
date: 12026-05-06
decision-makers: Yunseo Kim
---

# Use normalized file tree as the canonical release subject for `integrity`

## Context and Problem Statement

The Agent Volumes draft already treats `integrity` as the immutable content identity of a published release, but it does not yet define the exact subject that the digest represents precisely enough for independent implementations.

This ambiguity is especially important because Agent Volumes is intentionally designed to support both:

- CDN-hosted immutable release archives
- Git-backed community-hosted releases

If the digest is defined over exact packaged archive bytes, interoperability becomes more tightly coupled to a packaging pipeline and archive reproduction rules. If the digest is defined over a transport-independent normalized file set, Git-backed and CDN-hosted releases can converge on the same logical release subject more naturally.

The standard therefore needs to decide what the canonical subject of `integrity` is.

## Decision Drivers

- Preserve one immutable release identity across both CDN-hosted and Git-backed delivery
- Keep the trust subject transport-independent where possible
- Avoid making archive-production details the primary interoperability boundary unless necessary
- Support later BOM, provenance, signature, and trust metadata binding to the same release subject
- Keep verification behavior implementable for clients and bibliothecas

## Considered Options

- A — Hash a normalized file tree
- B — Hash canonical packaged archive bytes

## Decision Outcome

Chosen option: **A — Hash a normalized file tree**, because it best matches Agent Volumes' hybrid delivery model and allows Git-backed and CDN-hosted releases to converge on the same canonical release subject without making one packaging format the normative center of gravity.

Under this decision:

- `integrity` is the digest of a **normalized file tree**, not of arbitrary transport bytes.
- The normalized file tree is the canonical release subject for trust workflows.
- Delivery artifacts such as tarballs remain useful transport containers, but they are not themselves the normative trust subject unless they are a faithful serialization of the normalized file tree.

## Consequences

- Good, because the canonical trust subject becomes transport-independent
- Good, because Git-backed and CDN-hosted releases can bind to the same immutable content identity more naturally
- Good, because later provenance, BOM, and signature mapping can target one consistent logical release subject
- Neutral, because the specification must now define normalization rules more precisely
- Bad, because implementations must perform canonical file-tree construction rather than simply hashing downloaded archive bytes

## Confirmation

- Verify that the same release content delivered via Git-backed and CDN-hosted paths yields the same `integrity` value
- Verify that trust metadata can bind to the normalized file-tree identity without ambiguity
- Verify that archive transport differences do not change the immutable content identity when file content is unchanged

## Pros and Cons of the Options

### A — Hash a normalized file tree

- Good, because the canonical trust subject becomes transport-independent
- Good, because Git-backed and CDN-hosted releases can converge on the same immutable identity more naturally
- Good, because later BOM, provenance, and signature mappings can bind to one consistent release subject
- Neutral, because the specification must define normalization rules more explicitly than it does today
- Bad, because implementations must perform canonical file-tree construction instead of simply hashing transport bytes

### B — Hash canonical packaged archive bytes

- Good, because the trust subject is easy to describe as a concrete byte sequence
- Good, because archive-oriented signing and verification workflows may feel more direct initially
- Neutral, because it could work well in a fully registry-hosted ecosystem with one canonical packaging path
- Bad, because it makes interoperability depend more heavily on archive-production details
- Bad, because Git-backed and CDN-hosted releases become harder to reconcile under one content identity
