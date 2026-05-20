---
status: accepted
date: 12026-05-15
decision-makers: Yunseo Kim
---

# Use a CycloneDX 1.7 external component profile for external dependency declarations

## Context and Problem Statement

ADR-0131 defines exported external dependencies as declaration-only relationships.
ADR-0132 then chooses target-specific carriers and states that exporters must not
create CycloneDX component inventory entries for declaration-plane external
dependencies unless separate resolved evidence supports that stronger claim.

That wording remains correct for ordinary resolved inventory, older CycloneDX
profiles, and target formats that lack a declared-external-component carrier.
However, CycloneDX 1.7 adds a more precise native shape for external components:
`isExternal: true` marks a component as outside the assembly, and `versionRange`
can describe acceptable versions without asserting one exact resolved version.

The remaining question is CycloneDX-specific: **should Agent Volumes continue to
carry declaration-only external dependencies only as `agent-volumes:*`
properties, or should it use CycloneDX 1.7 external component entries as a native
projection while preserving Agent Volumes declaration semantics with controlled
properties?**

This decision is limited to CycloneDX. It does not choose SPDX 3.x, SLSA, or
in-toto carriers.

## Decision Drivers

- CycloneDX is the normative BOM exchange format for Agent Volumes.
- Agent Volumes semantics remain canonical; CycloneDX is an export projection.
- External dependency exports must preserve declaration-only semantics and must
  not imply resolution, installation, bundling, execution, verification,
  vulnerability confirmation, or provenance material evidence.
- CycloneDX 1.7 can express external components with `isExternal: true` and
  `versionRange`, which is closer to Agent Volumes external dependency
  declarations than ordinary component inventory.
- Generic SBOM consumers should see useful external dependency structure where
  the target format can express it safely.
- Agent Volumes-aware consumers must be able to recover the declaration key,
  original VERS constraint, purpose, scope, and declaration-only status.
- Historical ADRs are immutable except for trivial corrections, so any
  refinement of ADR-0132 must be recorded as a later partial supersession.

## Considered Options

- A — Keep CycloneDX external dependency declarations as properties-only
  metadata.
- B — Use CycloneDX 1.7 external component entries only.
- C — Use a hybrid CycloneDX 1.7 external component profile with mandatory Agent
  Volumes properties.
- D — Use CycloneDX dependency graph edges only.
- E — Use CycloneDX external references as the primary carrier.
- F — Use repeated scalar `agent-volumes:*` properties.

## Decision Outcome

Chosen option: **C — Use a hybrid CycloneDX 1.7 external component profile with
mandatory Agent Volumes properties**, because CycloneDX 1.7 external component
entries provide useful native SBOM visibility while controlled Agent Volumes
properties preserve the declaration-only boundary and round-trip metadata.

This decision partially supersedes ADR-0132 for CycloneDX 1.7 exports only. ADR
0132 remains in force for the general no-false-resolved-inventory rule, for
target formats outside CycloneDX, and for CycloneDX versions or profiles that do
not support equivalent external component semantics.

Under this decision, a CycloneDX 1.7 export may project one Agent Volumes
`[[external-dependencies]]` declaration as one CycloneDX component entry when all
of the following hold:

- the component has `isExternal: true`;
- the component uses `versionRange` rather than an exact resolved `version`;
- the component carries the declared package coordinate through `purl` where a
  PURL is available;
- the component has a stable `bom-ref` that identifies the exported declaration
  node;
- the component properties include explicit Agent Volumes declaration metadata;
- the entry does not include hashes, resolved licenses, lockfile observations,
  scanner findings, provenance materials, installed-package evidence, bundled
  artifact evidence, or runtime-presence evidence unless a separate resolved
  evidence profile supports those stronger claims.

The CycloneDX component entry is a **CycloneDX 1.7 external declaration
component**, not ordinary resolved component inventory.

## Required Agent Volumes Properties

Each CycloneDX external declaration component must include properties that make
the Agent Volumes declaration semantics explicit. The required property names are:

- `agent-volumes:external-dependency`
- `agent-volumes:declaration-key`
- `agent-volumes:declaration-only`
- `agent-volumes:constraint`
- `agent-volumes:purpose`
- `agent-volumes:scope`
- `agent-volumes:resolved-evidence`

The property semantics are:

- `agent-volumes:external-dependency` marks the component as a projection of an
  Agent Volumes `[[external-dependencies]]` declaration. Its value must be
  `"true"` for declaration-profile components.
- `agent-volumes:declaration-key` carries the stable declaration key used to link
  future resolved evidence, diagnostics, advisory matches, or policy results back
  to the declaration.
- `agent-volumes:declaration-only` marks the entry as declaration-plane metadata,
  not resolved evidence. Its value must be `"true"` unless a future profile
  explicitly changes the claim.
- `agent-volumes:constraint` preserves the original Agent Volumes VERS constraint.
  CycloneDX `versionRange` is the native projection; this property preserves the
  Agent Volumes source expression.
- `agent-volumes:purpose` carries the declaration purpose.
- `agent-volumes:scope` carries the Agent Volumes declaration scope as a compact
  JSON string. An empty object represents volume-level scope; a `components` array
  represents component-scoped declarations.
- `agent-volumes:resolved-evidence` explicitly records whether resolved evidence
  is present for this declaration. For the v0.1 declaration-only profile, its
  value must be `"false"`.

Example:

```json
{
  "type": "library",
  "bom-ref": "agent-volumes:external-dependency:av-extdep-v1:sha256-...",
  "name": "foo",
  "purl": "pkg:npm/foo",
  "isExternal": true,
  "versionRange": ">=1.0.0 <2.0.0",
  "properties": [
    { "name": "agent-volumes:external-dependency", "value": "true" },
    { "name": "agent-volumes:declaration-key", "value": "av-extdep-v1:sha256-..." },
    { "name": "agent-volumes:declaration-only", "value": "true" },
    { "name": "agent-volumes:constraint", "value": "vers:npm/>=1.0.0|<2.0.0" },
    { "name": "agent-volumes:purpose", "value": "runtime" },
    { "name": "agent-volumes:scope", "value": "{\"components\":[\"research-mcp\"]}" },
    { "name": "agent-volumes:resolved-evidence", "value": "false" }
  ]
}
```

## Dependency Graph and External References

CycloneDX `dependencies[]` entries may reference external declaration components
when the exporter can express a meaningful graph edge from the volume or scoped
component to the external declaration component. Dependency graph edges are
secondary carriers. They must not be the only representation of the declaration,
because they do not preserve the declaration key, VERS constraint, purpose, scope,
or declaration-only status by themselves.

CycloneDX `externalReferences[]` may be used as optional discovery metadata, such
as a registry URL or package documentation URL. External references must not be
the primary carrier for Agent Volumes external dependency declarations.

## Consequences

- Good, because CycloneDX consumers can see external dependency declarations as
  first-class external component nodes instead of opaque custom properties only.
- Good, because `isExternal: true` and `versionRange` avoid claiming that one
  exact resolved package version is bundled into the Agent Volumes release.
- Good, because Agent Volumes properties preserve declaration key, original VERS
  constraint, purpose, scope, declaration-only status, and resolved-evidence
  absence.
- Good, because this narrows ADR-0132 without rewriting historical ADR text.
- Good, because future resolved-evidence profiles can strengthen the same
  declaration by linking through the stable declaration key.
- Neutral, because generic SBOM consumers may still count external declaration
  components as inventory-like entries unless they understand CycloneDX 1.7
  external component semantics.
- Neutral, because exporters must translate VERS constraints into CycloneDX
  `versionRange` while preserving the original VERS expression in a property.
- Bad, because the mapping is more complex than a single JSON-string property.
- Bad, because CycloneDX versions before 1.7 cannot carry the same native profile
  and must fall back to properties-only or another lossy/extension mapping.

## Confirmation

- Verify that draft 6 CycloneDX mapping prose describes external dependency
  declarations as CycloneDX 1.7 external declaration components, not ordinary
  resolved component inventory.
- Verify that each exported external declaration component sets
  `isExternal: true` and uses `versionRange` rather than an exact resolved
  `version` in the declaration-only profile.
- Verify that each exported external declaration component includes the required
  `agent-volumes:*` properties listed in this decision.
- Verify that declaration-only external declaration components do not carry hashes,
  resolved licenses, lockfile observations, scanner findings, provenance
  materials, installed-package evidence, bundled artifact evidence, or
  runtime-presence evidence.
- Verify that any CycloneDX dependency graph edge involving an external
  declaration component is secondary to the component and property metadata.
- Verify that CycloneDX external references, if present, are treated as discovery
  metadata only.
- Verify that mapping matrix and sample fixtures distinguish CycloneDX 1.7
  external declaration components from resolved-evidence components.

## Pros and Cons of the Options

### A — Keep CycloneDX external dependency declarations as properties-only metadata

- Good, because it is the safest way to avoid ordinary resolved inventory claims.
- Good, because it matches existing Agent Volumes CycloneDX extension patterns.
- Good, because it can preserve the full Agent Volumes declaration payload in one
  controlled place.
- Bad, because it hides useful external dependency structure from generic
  CycloneDX tooling.
- Bad, because it does not use CycloneDX 1.7's native external component and
  version range semantics.

### B — Use CycloneDX 1.7 external component entries only

- Good, because it is the most native CycloneDX representation.
- Good, because generic SBOM consumers can see the external component and version
  range.
- Bad, because it does not preserve the Agent Volumes declaration key, original
  VERS constraint, purpose, scope, or declaration-only marker.
- Bad, because generic consumers may still interpret the entry as stronger
  inventory than Agent Volumes intends.

### C — Use a hybrid CycloneDX 1.7 external component profile with mandatory Agent Volumes properties

- Good, because it combines native CycloneDX visibility with Agent Volumes
  semantic fidelity.
- Good, because explicit properties prevent the native component node from losing
  declaration-only status.
- Good, because future resolved evidence can link back through the declaration
  key.
- Neutral, because it requires a profile-specific validation rule.
- Bad, because it is more verbose than a native-only or properties-only mapping.

### D — Use CycloneDX dependency graph edges only

- Good, because dependency graph tooling may notice the relationship.
- Bad, because graph edges require referenced nodes and do not by themselves carry
  package coordinate, range, purpose, scope, or declaration-only status.
- Bad, because graph-only mappings are easy to confuse with resolved dependency
  graphs.

### E — Use CycloneDX external references as the primary carrier

- Good, because external references are useful low-risk discovery pointers.
- Bad, because an external reference does not by itself mean declared dependency.
- Bad, because external references do not preserve VERS constraints, purpose,
  scope, stable declaration keys, or declaration-only status.

### F — Use repeated scalar `agent-volumes:*` properties

- Good, because scalar properties are simple to emit and inspect.
- Bad, because declaration grouping is fragile when multiple external dependencies
  are present.
- Bad, because repeated scalar names are weaker for round-tripping than one
  component node with explicit declaration properties.

## Reconsideration Triggers

Reopen this decision if one or more of the following conditions hold:

- CycloneDX changes or removes the semantics of `isExternal` or `versionRange` in a
  way that makes this profile misleading.
- CycloneDX adds a more specific declared-but-unresolved dependency carrier that
  preserves package coordinate, version range, purpose, scope, and declaration-only
  status without Agent Volumes properties.
- Generic CycloneDX tooling consistently treats external declaration components as
  confirmed resolved, installed, or vulnerable inventory despite the required
  markers.
- Agent Volumes adopts a resolved-evidence profile whose CycloneDX mapping needs
  exact versions, hashes, lockfile facts, provenance observations, or runtime
  inventory fields.
- Mapping fixtures show that VERS constraints cannot be projected into CycloneDX
  `versionRange` with acceptable fidelity while preserving the source expression
  in `agent-volumes:constraint`.

## More Information

Follow-up draft 6 work should update the CycloneDX mapping matrix and mapping
sample to include external declaration components, required `agent-volumes:*`
properties, and negative cases proving that declaration-only entries do not carry
resolved evidence.
