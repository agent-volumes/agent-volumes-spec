---
status: accepted
date: 12026-03-13
decision-makers: Yunseo Kim
---

# Use hybrid content delivery architecture for bibliothecas

## Context and Problem Statement

Bibliothecas (registries conforming to the Agent Volumes standard) must store, index, and serve volumes to clients. The architecture must support both curated registries that guarantee content immutability and community registries that minimize infrastructure overhead.

## Decision Drivers

- Security-vetted content must have immutability guarantees (no post-publish modification)
- Community contributions should not require centralized hosting infrastructure
- Infrastructure costs should be proportionate to usage
- Multiple bibliothecas (curated + community) must coexist
- The existing agent-toolbox catalog model should transition naturally

## Considered Options

- npm-style centralized (single registry hosts everything)
- Git-backed distributed (registry is index-only, content lives in Git)
- Hybrid (central index + CDN for curated content + Git for community)

## Decision Outcome

Chosen option: "Hybrid", because it allows bibliothecas to choose their content delivery model based on their trust and curation level. Curated bibliothecas serve immutable archives via CDN. Community bibliothecas index content hosted in Git repositories.

### Consequences

- Good, because curated bibliothecas can provide immutability guarantees via CDN
- Good, because community volumes don't require centralized hosting infrastructure
- Good, because clients verify content integrity regardless of delivery mechanism (content-hash)
- Good, because existing catalog skills migrate directly to CDN-hosted volumes
- Neutral, because two content paths (CDN vs Git) increase client complexity
- Bad, because registry infrastructure requires CDN + API + database operations for curated bibliothecas

### Confirmation

- CDN-hosted volumes are immutable (re-upload of same version fails).
- Community volumes are fetchable via Git reference and verified via content hash.
- Conforming clients transparently handle both sources without user configuration.

## Pros and Cons of the Options

### npm-style centralized

- Good, because simplest architecture
- Good, because uniform content delivery
- Bad, because single point of failure
- Bad, because all publishers must upload to central server
- Bad, because high infrastructure costs at scale

### Git-backed distributed

- Good, because minimal infrastructure (index only)
- Good, because publishers retain full control
- Bad, because no immutability guarantee (Git tags can be force-pushed)
- Bad, because Git hosting outage = install failure
- Bad, because abandons existing curated hosting capabilities

### Hybrid (chosen)

- Good, because curated bibliothecas guarantee immutability for vetted content
- Good, because community content flows through Git (low barrier)
- Good, because natural extension of current agent-toolbox model
- Bad, because two content paths to maintain
- Bad, because higher infrastructure complexity for curated bibliothecas
