---
status: accepted
date: 12026-05-09
decision-makers: Yunseo Kim
---

# Use registry-local resource-scoped bearer token semantics for protected writes

## Context and Problem Statement

The v0.1 registry API already requires bearer authentication for protected write
operations. Publish, unpublish, and trust attachment upload are protected, while
search, fetch, capability metadata, and trust metadata reads remain unauthenticated
in the portable baseline.

The current specification also says that a publisher must own the target
namespace and that unpublish and trust upload require ownership. ADR-0059 keeps
scope governance bibliotheca-local, ADR-0024 defines a portable minimum meaning
for `verified` publishers, ADR-0025 keeps `trusted` as a bibliotheca-local
governance signal, and ADR-0099 requires minimum authorization semantics for
trust attachment uploads.

That leaves an authorization question unresolved: **what should a bearer token
mean for protected write operations, and how should token scope relate to
publisher ownership without standardizing full account, organization, or identity
provider governance?**

Comparable package ecosystems increasingly separate token capability from owner
identity. npm supports granular package or scope tokens and trusted publishing,
PyPI supports project-scoped API tokens and OIDC-based trusted publishing,
RubyGems supports action-scoped and gem-scoped API keys, GitHub Packages separates
package permissions from workflow token permissions, and GitLab package publishing
is tied to project or group roles plus deploy or CI job tokens. These ecosystems
do not generally treat a token as the owner itself; they treat it as a delegated
capability evaluated against local ownership and access-control policy.

Agent Volumes needs enough portable semantics for clients and bibliothecas to
agree on protected write behavior, while preserving bibliotheca freedom over
account models, namespace allocation, publisher verification workflows, CI/OIDC
issuance, and trust-tier governance.

## Decision Drivers

- Keep the protected write API concrete enough for independent client and
  bibliotheca implementation.
- Preserve least-privilege delegation for publish, unpublish, and trust upload.
- Avoid treating a bearer token as identical to a publisher or owner identity.
- Keep namespace ownership and scope governance bibliotheca-local.
- Support human users, service accounts, and CI workloads without requiring one
  universal identity provider or token format.
- Allow OIDC or trusted-publishing issuance without making those flows mandatory
  in v0.1.
- Reuse the existing RFC 7807 error contract and distinguish authentication from
  authorization failure.

## Considered Options

- Use registry-local resource-scoped capability semantics for bearer tokens.
- Use coarse bearer authentication plus ownership checks only.
- Use publisher- or namespace-scoped tokens as the portable baseline.
- Make OIDC or trusted publishing the primary v0.1 authorization model.

## Decision Outcome

Chosen option: **Use registry-local resource-scoped capability semantics for
bearer tokens**, because it provides the strongest least-privilege baseline while
still leaving account governance, token issuance, and namespace administration to
each bibliotheca.

Under this decision, bearer tokens remain opaque to conforming clients. A
bibliotheca validates the token and derives an effective authorization decision
from registry-local state. That decision is based on at least:

- a registry-local subject, such as a human account, service account, CI workload,
  or other bibliotheca-recognized actor
- one or more protected actions, at minimum `publish`, `unpublish`, and
  `trust_upload`
- one or more protected resources, such as a publisher namespace, volume identity,
  or exact release
- token validity state, including whether the token is recognized, unexpired when
  expiry exists, and not revoked

The portable authorization boundary for protected v0.1 writes is:

| Operation      | Minimum portable authorization semantics                                                    |
| -------------- | ------------------------------------------------------------------------------------------- |
| `publish`      | The token's subject is authorized to publish the target volume identity or namespace.       |
| `unpublish`    | The token's subject is authorized to unpublish the target volume identity or exact release. |
| `trust_upload` | The token's subject is authorized to add trust attachments for the target exact release.    |

Ownership is evaluated by the bibliotheca. A token subject may act on behalf of a
publisher namespace, volume, or release only when the bibliotheca's local
ownership, membership, delegation, or access-control policy authorizes that
relationship. The bearer token itself is not the portable ownership proof.

Publisher verification status and token authorization remain separate concepts.
Bibliothecas MAY use `unverified`, `verified`, `trusted`, or richer local signals
as policy inputs when deciding whether to issue a token or authorize an action,
but the v0.1 core does not make those publisher labels part of the token identity
model.

Missing, malformed, unknown, expired, or revoked bearer tokens are authentication
failures and use `401 Unauthorized` with the baseline problem-details error
contract. A valid token that lacks the required action or resource authorization
is an authorization failure and uses `403 Forbidden` with the baseline
problem-details error contract.

This decision intentionally does not standardize:

- bearer token syntax, JWT claims, token introspection protocols, OAuth flows, or
  credential storage
- account, organization, team, membership, transfer, billing, moderation, or
  dispute workflows
- universal namespace ownership proofs
- mandatory CI provider support or mandatory OIDC trusted-publishing flows
- token issuance UI, rotation policy, expiry duration, revocation API, or audit-log
  schema
- advisory write authorization semantics, which remain bibliotheca-local in v0.1

Bibliothecas SHOULD prefer least-privilege tokens scoped to the minimum action and
resource needed. They MAY implement simpler publisher-level or namespace-level
tokens internally if those tokens still produce the required action/resource
authorization outcomes at the API boundary.

## Reconsidering an OIDC-first trusted publishing model

An OIDC-first or trusted-publishing-first authorization model may be reconsidered
in a later version if one or more of the following conditions hold:

- multiple independent bibliotheca implementations support compatible OIDC-based
  trusted publishing flows in production
- a stable cross-registry convention emerges for mapping CI workload identity to
  package, namespace, or release authorization
- major CI providers converge on sufficiently portable issuer, subject, audience,
  repository, workflow, environment, and reusable-workflow claim semantics
- short-lived workload-issued credentials become the dominant secure publishing
  path for package registries relevant to Agent Volumes implementers
- long-lived bearer tokens become unacceptable for common baseline publishing
  workflows because of security, compliance, or ecosystem policy requirements
- provenance and trust-attachment workflows require stronger standardized binding
  between CI identity, release subject, and publish authorization than opaque
  bearer capabilities can provide
- conformance experience shows that optional OIDC issuance leads to incompatible
  client or bibliotheca behavior that materially harms interoperability

Until those conditions are met, OIDC and trusted publishing remain allowed token
issuance strategies rather than the core v0.1 authorization model.

## Consequences

- Good, because clients gain predictable `401` versus `403` behavior for protected
  writes.
- Good, because publish, unpublish, and trust upload can be authorized separately.
- Good, because exact-release-scoped trust upload becomes possible without
  granting broad publisher power.
- Good, because human, service-account, and CI use cases fit the same portable
  semantic model.
- Good, because OIDC trusted publishing can be supported as token issuance
  plumbing without becoming a mandatory v0.1 identity system.
- Good, because namespace ownership and account governance remain bibliotheca-local
  as required by prior scope-governance decisions.
- Neutral, because conforming bibliothecas need an internal authorization model
  capable of producing action/resource decisions.
- Neutral, because conformance should test observable protected-operation behavior
  rather than inspecting token internals.
- Bad, because this is more specific than a simple "bearer plus ownership" rule.
- Bad, because very small bibliothecas may need compatibility wrappers around
  coarse internal tokens to expose the required behavior clearly.

## Confirmation

- Verify that protected write operations declare bearer authentication in the
  OpenAPI contract.
- Verify that publish, unpublish, and trust upload can be described in terms of
  action/resource authorization.
- Verify that authentication failure and authorization failure remain distinct in
  prose and OpenAPI error behavior.
- Verify that the specification does not imply that token subject and publisher
  identity are the same thing.
- Verify that publisher verification and `trusted` governance signals remain
  separate from token validity.
- Verify that CI/OIDC trusted publishing remains allowed but not required by the
  v0.1 core.
- Verify that this decision does not define a token format, OAuth flow, account
  model, or namespace transfer workflow.

## Pros and Cons of the Options

### Use registry-local resource-scoped capability semantics for bearer tokens

- Good, because it matches modern least-privilege registry practice.
- Good, because it cleanly separates token subject, publisher ownership, and
  protected action.
- Good, because it supports exact release-scoped trust upload and narrower CI
  delegation.
- Good, because it leaves token format and identity-provider mechanics outside the
  v0.1 core.
- Neutral, because bibliothecas still decide how subjects, owners, and delegations
  are represented internally.
- Bad, because the model is more detailed than a minimal bearer-only rule.

### Use coarse bearer authentication plus ownership checks only

- Good, because it is the smallest change from the current draft.
- Good, because simple bibliothecas can implement it with a single write token
  class.
- Neutral, because local policy could still add finer scopes outside the core.
- Bad, because it does not separate publish, unpublish, and trust upload
  privileges.
- Bad, because CI tokens may need broader authority than the workflow actually
  needs.
- Bad, because ownership remains underspecified at the portable API boundary.

### Use publisher- or namespace-scoped tokens as the portable baseline

- Good, because it aligns naturally with scoped package namespaces.
- Good, because it is easier to reason about than arbitrary resource patterns.
- Good, because it matches common package-registry organization or project
  boundaries.
- Neutral, because it may be sufficient for many early bibliothecas.
- Bad, because it is too coarse for release-scoped trust upload.
- Bad, because unpublish authority is difficult to separate from publish authority
  without adding action scopes anyway.

### Make OIDC or trusted publishing the primary v0.1 authorization model

- Good, because it avoids long-lived shared secrets for CI publishing.
- Good, because it aligns with provenance-oriented supply-chain security trends.
- Good, because it can bind publishing to repository, workflow, or build identity
  in richer ecosystems.
- Neutral, because bibliothecas may still support it locally under the chosen
  capability-token model.
- Bad, because it would force v0.1 to standardize external identity-provider,
  OAuth, JWT, or workflow-claim details too early.
- Bad, because it would pull account, organization, repository, and CI governance
  into the core specification.
