---
status: accepted
date: 12026-05-18
decision-makers: Yunseo Kim
consulted: Mintlify documentation, Scalar documentation, ReadMe documentation, MkDocs Material documentation, Docusaurus documentation, Astro Starlight documentation, VitePress documentation, GitHub Pages documentation
---

# Adopt Mintlify for the `agentvolumes.org` documentation site

## Context and Problem Statement

Agent Volumes v0.1.0-rc.1 needs a public documentation surface for human readers
and automated consumers. Issue #29 identifies Agent Volumes-owned Namespace and
URI publications that need stable public documentation under `agentvolumes.org`,
including versioned schema `$id` URLs, Problem Details type URIs, SPDX extension
namespace documentation, in-toto predicate documentation, SLSA-related profile
identifiers, BOM/profile identifiers, external dependency declaration key
documentation, and reserved extension namespace governance.

The current `agent-volumes-spec` repository remains the normative source for the
prose specification, JSON Schemas, OpenAPI contract, conformance fixtures, and
decision records. It does not currently contain a documentation-site scaffold,
and project resources for design, documentation infrastructure maintenance,
custom plugin development, and custom site engineering are limited.

The question is: **which documentation platform should Agent Volumes use now for
the `agentvolumes.org` documentation site while preserving long-term URI
stability and the existing specification authority model?**

## Decision Drivers

- Maintainer time should focus on specification content, machine-readable
  artifacts, conformance coverage, and implementation feedback rather than custom
  documentation infrastructure.
- The first public site should have high-quality default design and navigation
  without requiring a separate design system effort.
- The site should publish the Bibliotheca OpenAPI contract with generated API
  reference pages and an interactive API playground.
- The site should be friendly to agentic AI consumers, not only human readers;
  `llms.txt`, Markdown-oriented AI surfaces, and MCP access are therefore
  valuable first-class capabilities.
- The site should support custom domains, redirects, versioned documentation, and
  stable URI publication patterns for `agentvolumes.org`.
- The site should not move normative authority away from `agent-volumes-spec.md`
  and its companion artifacts.

## Considered Options

- A — Adopt Mintlify for the initial `agentvolumes.org` documentation site.
- B — Use MkDocs Material plus `mike` for a fully static, repository-first site.
- C — Use Scalar for an OpenAPI-first documentation site and API reference.
- D — Use ReadMe for a hosted API documentation portal.
- E — Use Docusaurus.
- F — Use Astro Starlight or plain Astro.
- G — Use VitePress.
- H — Publish a minimal hand-built static site or GitHub Pages surface.

## Decision Outcome

Chosen option: **A — Adopt Mintlify for the initial `agentvolumes.org`
documentation site**, because it provides the strongest out-of-the-box fit for
the project's current resource constraints and for both human- and AI-facing
developer documentation.

Under this decision:

- Mintlify is the preferred documentation platform for the first public
  `agentvolumes.org` documentation site.
- Mintlify-generated OpenAPI reference pages and the interactive API playground
  should be used for the Bibliotheca API surface.
- Mintlify's AI-oriented publication surfaces, including `llms.txt` and MCP
  support, should be used where compatible with public documentation access.
- URI publication routes under `agentvolumes.org` should be treated as stable
  publication contracts and covered by link, redirect, and content-type checks
  where practical.
- MkDocs Material plus `mike` remains the preferred fallback or reconsideration
  path if long-term portability, self-hosted static output, or byte-level URI
  control becomes more important than managed-platform leverage.
- Scalar remains a strong reconsideration candidate if Agent Volumes needs a more
  OpenAPI-first documentation model, a lower-lock-in embedded API reference, or a
  hybrid static-site architecture with Scalar API Reference embedded into a
  repository-owned site.

## Consequences

- Good, because Mintlify reduces the amount of custom design and documentation
  infrastructure work needed before the v0.1.0-rc.1 public documentation launch.
- Good, because OpenAPI reference generation and the interactive playground let
  Bibliotheca implementers explore the API without custom plugin work.
- Good, because `llms.txt`, Markdown-oriented AI access, and MCP support align
  with Agent Volumes' goal of serving agentic AI tooling as well as human
  implementers.
- Good, because custom domains, redirects, and versioned documentation are
  available without building a bespoke static-site deployment stack first.
- Neutral, because the documentation site becomes a managed-platform deployment
  rather than a purely static artifact owned entirely by the project.
- Neutral, because this decision concerns publication tooling and does not change
  the normative authority of `agent-volumes-spec.md`, schemas, OpenAPI, or
  conformance fixtures.
- Bad, because Mintlify introduces platform dependency and may constrain future
  low-level routing, hosting, authentication, or content-negotiation behavior.
- Bad, because any generated documentation site can drift from the specification
  repository unless release-tag import, route checks, and review discipline are
  maintained.

## Confirmation

- Verify that the site links back to the canonical specification, schemas,
  OpenAPI contract, conformance fixtures, and decision records in this repository.
- Verify that generated OpenAPI documentation is sourced from
  `openapi/bibliotheca.openapi.yaml` or a pinned release copy of that file.
- Verify that required `agentvolumes.org` URI publication routes are covered by
  link checks, redirect checks, content-type checks, or equivalent release
  evidence.
- Verify that public AI-facing surfaces such as `llms.txt` and MCP access remain
  available for public documentation pages and are not accidentally hidden behind
  authentication.
- Verify that schema `$id` URLs and other versioned URI publications remain
  immutable after release.

## Pros and Cons of the Options

### A — Adopt Mintlify for the initial `agentvolumes.org` documentation site

- Good, because Mintlify provides polished default design, navigation, search, and
  documentation components without a custom design-system effort.
- Good, because Mintlify supports OpenAPI 3.0 and 3.1 documentation generation and
  API playground workflows.
- Good, because Mintlify documents `llms.txt`, `llms-full.txt`, and MCP-oriented
  access patterns that make the site more useful to AI tools.
- Good, because redirects, custom domains, and versioned documentation are part of
  the platform rather than separate plugin decisions.
- Neutral, because site content will need to be converted or generated into
  Mintlify's MDX and `docs.json` model.
- Bad, because Mintlify is a managed platform and therefore adds vendor and
  hosting-model dependency.

### B — Use MkDocs Material plus `mike` for a fully static, repository-first site

- Good, because this approach gives strong long-term portability, static output,
  and repository-owned version archives.
- Good, because `mike` fits immutable versioned documentation well and can support
  long-lived standard documentation paths.
- Good, because it reduces managed-platform dependency and keeps deployment
  mechanics closer to ordinary static hosting.
- Neutral, because custom OpenAPI, JSON Schema, AI-surface, and playground support
  would require plugin selection or project-specific integration work.
- Bad, because this path spends scarce maintainer time on site composition,
  design polish, plugin wiring, and custom AI-facing affordances before the
  project has broad implementation feedback.

### C — Use Scalar for an OpenAPI-first documentation site and API reference

- Good, because Scalar has a strong OpenAPI-first API reference and interactive
  playground model that fits the Bibliotheca API surface.
- Good, because the Scalar API Reference can be embedded into a repository-owned
  static or framework-based site, giving Agent Volumes a lower-lock-in escape
  hatch than a fully managed documentation platform.
- Good, because Scalar's hosted Docs, Registry, MCP, and Agent direction are
  aligned with API documentation and agentic tooling use cases.
- Neutral, because Scalar Docs as a full documentation platform is still a hosted
  product rather than a documented fully static export path.
- Neutral, because a hybrid static site with an embedded Scalar API Reference
  would still require project-owned site composition, version routing, URI
  publication checks, and AI-surface integration.
- Bad, because Scalar's `llms.txt` support and full standards-site maturity are
  less clearly established than Mintlify's documented AI-facing publication
  surfaces at the time of this decision.

### D — Use ReadMe for a hosted API documentation portal

- Good, because ReadMe provides mature hosted API documentation, OpenAPI 3.1
  support, interactive API reference features, custom domains, `llms.txt`, and
  MCP-related capabilities.
- Good, because ReadMe could reduce initial operational burden for a product-style
  API documentation portal.
- Neutral, because ReadMe is optimized for SaaS API customer documentation more
  than standards/specification publication.
- Bad, because ReadMe-specific content structure, export behavior, and versioning
  limits increase lock-in and make immutable standards publication less natural.
- Bad, because Agent Volumes needs stable Namespace and URI publications, schema
  dereference behavior, and artifact governance that should remain independent of
  a product-docs portal workflow.

### E — Use Docusaurus

- Good, because Docusaurus has mature documentation versioning and a large
  ecosystem.
- Good, because React and MDX extensibility would allow a highly customized
  developer portal over time.
- Neutral, because a customized React documentation stack may be useful later if
  Agent Volumes needs richer interactive documentation experiences.
- Bad, because OpenAPI and AI-facing surfaces would still require additional
  plugin or custom integration decisions.
- Bad, because the React/MDX stack is more infrastructure than the project needs
  for the initial publication site.

### F — Use Astro Starlight or plain Astro

- Good, because Astro can produce fast static pages and gives direct control over
  routes and content collections.
- Good, because plain Astro could support custom URI publication pages with fewer
  platform constraints than a managed documentation product.
- Neutral, because this route is attractive if the site later needs bespoke
  content negotiation or static asset behavior.
- Bad, because versioned standards documentation, OpenAPI reference generation,
  API playground behavior, `llms.txt`, and MCP access would need more custom
  design and integration.

### G — Use VitePress

- Good, because VitePress is lightweight and convenient for Markdown-oriented
  documentation.
- Neutral, because it could work for a small static documentation surface.
- Bad, because versioned standards documentation, OpenAPI reference generation,
  and AI-facing publication features would require substantial additional work.

### H — Publish a minimal hand-built static site or GitHub Pages surface

- Good, because this minimizes tooling dependency and could expose a few required
  URI pages quickly.
- Good, because static hosting can be made highly durable for immutable artifacts.
- Bad, because it would provide little out-of-the-box design, navigation, search,
  API reference, playground, `llms.txt`, or MCP support.
- Bad, because it risks turning documentation infrastructure into a recurring
  custom maintenance burden.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- Mintlify cannot reliably serve required `agentvolumes.org` URI publication
  routes with the needed status codes, redirects, content types, or immutability
  expectations.
- Mintlify's AI-facing surfaces become unavailable, unsuitable for public docs, or
  incompatible with Agent Volumes' agentic AI documentation goals.
- Managed-platform dependency becomes unacceptable for governance, security,
  archiving, cost, availability, or long-term standardization reasons.
- The project gains enough documentation-infrastructure capacity to justify a
  fully static, self-hosted standards site.
- Scalar's hosted Docs, API Reference, or MCP/Agent capabilities mature into a
  better fit for Agent Volumes' OpenAPI-first and agentic-AI documentation goals,
  especially if they provide clearer static-export, self-hosting, `llms.txt`, or
  standards-site publication guarantees.
- Implementers or standards consumers report that Mintlify's generated structure
  makes versioned artifact discovery, schema retrieval, OpenAPI access, or
  namespace URI documentation harder than a repository-first static site would.
- A future stable release requires byte-level artifact archival or content
  negotiation behavior that Mintlify cannot provide.

## More Information

- Issue #29 tracks the need for stable public Namespace and URI publications under
  `agentvolumes.org`.
- ADR-0043, ADR-0044, ADR-0045, and ADR-0047 establish the companion-artifact and
  normative-authority model for schemas and related machine-readable files.
- ADR-0141 chooses URI-backed SPDX namespaces for Agent Volumes extension terms.
- ADR-0152 keeps Agent Volumes Problem Details type URIs stable while updating the
  current Problem Details RFC reference.
