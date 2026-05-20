---
status: accepted
date: 12026-05-07
decision-makers: Yunseo Kim
---

# Keep v0.1 AI-BOM positioning generic and profile-oriented

## Context and Problem Statement

ADR-0005 already establishes that Agent Volumes semantics remain canonical while CycloneDX is the normative BOM exchange format and SPDX is a secondary/reference export target. Implementation-readiness review then surfaced a follow-up positioning question: **should v0.1 make a stronger explicit AI-BOM / ML-BOM profile commitment now, or should it keep AI-specific BOM positioning more generic and rely on later profile or extension work?**

The ecosystem now has meaningful AI/ML-related BOM developments, but the core v0.1 work is still primarily focused on package interoperability, trust attachment binding, and BOM/provenance export discipline rather than on freezing one AI-specific representation profile prematurely.

## Decision Drivers

- Preserve the already-chosen CycloneDX baseline without overcommitting to a narrower AI-specific profile too early
- Keep the v0.1 core focused on stable package and trust interoperability needs
- Leave room for later AI-specific profiles or extensions once ecosystem expectations are clearer
- Avoid overstating AI-BOM maturity or round-trip guarantees that the current draft does not yet provide

## Considered Options

- Keep v0.1 AI-BOM positioning generic and profile-oriented
- Commit v0.1 more explicitly to a concrete AI/ML-specific BOM profile posture now
- Mention AI-BOM only informatively without any profile/extension framing

## Decision Outcome

Chosen option: **Keep v0.1 AI-BOM positioning generic and profile-oriented**, because it preserves the CycloneDX baseline cleanly while avoiding premature over-commitment to a narrower AI-specific profile contract.

Under this decision:

- CycloneDX remains the normative BOM exchange format for the v0.1 core
- SPDX remains a secondary export/reference target as already established
- AI-specific BOM representation MAY be addressed through later profiles, mappings, or extensions rather than by making one stronger AI-specific profile claim part of the v0.1 core baseline now
- the specification SHOULD avoid implying full canonical crosswalk guarantees for AI-specific semantics that are not yet concretely defined in the current draft

## Consequences

- Good, because the v0.1 core remains disciplined and focused on the most mature interoperability surface
- Good, because future AI-specific profile work can be added without reopening the core BOM strategy unnecessarily
- Good, because the spec avoids overstating AI-BOM standardization maturity where the current draft is not yet profile-complete
- Neutral, because some readers may still want stronger AI-specific guidance sooner
- Bad, because the AI-facing message is somewhat less explicit than a stronger ML-BOM-oriented profile commitment would be
- Bad, because some implementers may need to rely more on future profile work or local conventions in the short term

## Confirmation

- Verify that BOM strategy text remains consistent with ADR-0005 and does not imply stronger AI-specific commitments than the draft actually provides
- Verify that future AI-specific mapping/profile work can be introduced cleanly without destabilizing the core BOM strategy
- Verify that the specification still gives enough guidance to distinguish core BOM compatibility from later AI-specific profile work

## Pros and Cons of the Options

### Keep v0.1 AI-BOM positioning generic and profile-oriented

- Good, because it keeps the baseline honest about current scope and maturity
- Good, because it avoids freezing a narrower AI-profile story before the mapping/profile work is ready
- Good, because it fits the broader v0.1 pattern of separating core requirements from later profiles
- Neutral, because some stronger AI-facing guidance may still arrive later through profile work
- Bad, because it provides less immediate AI-specific implementation signaling than a stronger profile commitment would

### Commit v0.1 more explicitly to a concrete AI/ML-specific BOM profile posture now

- Good, because it would give AI-facing adopters a more explicit immediate target
- Good, because it could strengthen the AI-specific positioning of the standard publicly
- Neutral, because a mature future ecosystem may eventually want this stronger level of commitment
- Bad, because it risks overcommitting before the supporting mapping/profile material is ready
- Bad, because it could create stronger compatibility expectations than the current v0.1 draft can safely guarantee

### Mention AI-BOM only informatively without any profile/extension framing

- Good, because it keeps the current draft surface smaller
- Good, because it avoids near-term disputes over AI-specific detail
- Neutral, because some readers may already assume BOM strategy is enough without explicit AI-facing framing
- Bad, because it makes the future extension/profile path less legible
- Bad, because it gives less guidance about how AI-specific semantics should fit into the broader BOM strategy
