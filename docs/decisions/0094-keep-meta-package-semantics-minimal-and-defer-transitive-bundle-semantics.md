---
status: accepted
date: 12026-05-07
decision-makers: Yunseo Kim
---

# Keep meta-package semantics minimal in v0.1 and defer transitive bundle semantics

## Context and Problem Statement

The v0.1 draft already defines `role = "meta"` as a package role intended for dependency bundling without requiring exported components. That leaves an important boundary question unresolved: **should a meta package in v0.1 mean only a lightweight direct dependency bundle, or should it carry stronger semantics over the entire transitive dependency closure as a curated bundle unit?**

The stronger interpretation could eventually support richer curated-stack, distribution-pack, or closure-level policy behavior. However, it would also make resolver, lockfile, advisory, and user-experience expectations substantially heavier.

## Decision Drivers

- Preserve a simple and implementable first meaning for `role = "meta"`
- Avoid turning meta packages into a much heavier bundle/distribution abstraction before implementation evidence exists
- Keep v0.1 resolver and advisory semantics from inheriting closure-level complexity prematurely
- Leave room for richer future bundle semantics if real adopters demonstrate the need

## Considered Options

- Define meta packages only as lightweight dependency bundles in v0.1
- Define meta packages as curated transitive bundle units in v0.1
- Keep meta packages minimal in v0.1 and defer any stronger transitive-bundle semantics to later profile or version work

## Decision Outcome

Chosen option: **Keep meta packages minimal in v0.1 and defer any stronger transitive-bundle semantics**, because it preserves a useful package role now without overloading the first interoperable draft with closure-level bundle semantics.

Under this decision:

- `role = "meta"` in v0.1 describes a lightweight dependency-bundle role
- v0.1 does not assign special normative semantics to the full transitive dependency closure of a meta package beyond ordinary dependency resolution behavior
- richer curated-bundle or closure-level semantics are intentionally deferred to future profile or version work
- future work MAY revisit whether meta packages should become a stronger distribution or curated-stack abstraction, but that is not part of the v0.1 baseline

## Consequences

- Good, because meta packages remain easy to explain and implement in the first interoperable draft
- Good, because resolver, lockfile, advisory, and policy semantics remain anchored in ordinary dependency interpretation
- Good, because the specification keeps open a path to richer bundle semantics later if evidence justifies them
- Neutral, because some implementations may still present meta packages with richer UX locally without claiming that behavior as portable baseline semantics
- Bad, because v0.1 does not yet standardize stronger curated-stack semantics that some ecosystems may eventually want
- Bad, because client UX around meta packages may remain somewhat looser until later profile work matures

## Confirmation

- Verify that the role definition and dependency sections do not imply closure-level bundle guarantees for meta packages in v0.1
- Verify that advisory and resolver rules continue to operate on ordinary package/dependency semantics rather than special bundle semantics
- Verify that future richer meta-package work can be added without contradicting the lightweight v0.1 baseline

## Pros and Cons of the Options

### Define meta packages only as lightweight dependency bundles in v0.1

- Good, because it provides a very simple and immediately usable role meaning
- Good, because it avoids almost all additional semantic burden
- Neutral, because some ecosystems may never need stronger bundle semantics
- Bad, because it can make future richer expansion feel more abrupt if the role grows later

### Define meta packages as curated transitive bundle units in v0.1

- Good, because it gives meta packages a stronger and more differentiated role immediately
- Good, because curated stacks and distribution-like bundles could gain a clearer first-class meaning
- Neutral, because some future ecosystems may indeed want this stronger abstraction
- Bad, because it would significantly increase closure-level semantics for resolver, advisory, and policy behavior too early
- Bad, because the evidence base for one portable closure-level interpretation is still weak

### Keep meta packages minimal in v0.1 and defer any stronger transitive-bundle semantics to later profile or version work

- Good, because it keeps the role useful now while preserving future flexibility
- Good, because it avoids forcing stronger semantics without enough operational evidence
- Good, because it clearly distinguishes lightweight present meaning from possible future richer meaning
- Neutral, because implementations may still experiment locally with richer UX if they do not claim portable baseline semantics
- Bad, because v0.1 users looking for first-class curated-stack semantics will need to wait for later work

## More Information

This decision should be **revisited** if one or more of the following conditions becomes true:

- multiple real implementations begin using meta packages as curated stacks or distribution packs rather than only lightweight dependency bundles
- lockfile, advisory, or policy workflows repeatedly need to refer to the full transitive closure of a meta package as one semantic unit
- client UX or registry presentation work demonstrates that lightweight meta-package semantics are no longer sufficient to describe common deployment behavior

If those triggers occur, a follow-up ADR or RFC should evaluate whether to introduce stronger transitive-bundle semantics through a later profile or version.
