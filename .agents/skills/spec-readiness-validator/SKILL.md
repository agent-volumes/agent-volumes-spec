---
name: spec-readiness-validator
description: "Validate whether a specification document is implementer-ready by checking normative prose, machine-readable schemas, OpenAPI/prose drift, versioning, error semantics, security model, registry behavior, and conformance suite alignment. Use when: (1) Evaluating spec maturity before implementation, (2) Reviewing spec PRs for completeness, (3) Auditing existing specs for gaps, (4) Preparing specs for release, (5) Reviewing OpenAPI/prose drift audit checklists, or (6) Any task involving spec quality assessment or readiness evaluation."
---

# Spec Readiness Validator

Validate specification documents against the implementer-ready criteria used by mature standards bodies (W3C, IETF, OCI, OpenAPI, MCP).

## Workflow

### Step 1: Locate Spec Files

Identify the specification document(s) to validate. Common locations:

- `spec.md`, `SPECIFICATION.md`, `README.md`
- `schemas/` directory with machine-readable artifacts
- `conformance/` or `tests/` directory
- OpenAPI/JSON Schema files

### Step 2: Run Automated Validation

Execute the validation script on the spec directory:

```bash
python3 .agents/skills/spec-readiness-validator/scripts/validate_spec.py <path-to-spec-directory>
```

This produces a JSON report with pass/fail status for each criterion.

### Step 3: Manual Review

For criteria requiring human judgment, load the detailed checklist:

```
Read references/spec-readiness-checklist.md for the full criteria with examples and references.
```

Review these areas manually:

- **Normative language quality** - Are BCP 14 terms used correctly? Are requirements testable?
- **Schema completeness** - Do schemas cover all protocol structures?
- **Error semantics** - Are error codes finite and documented?
- **Security model** - Are trust boundaries explicit?
- **Conformance alignment** - Do tests map to normative statements?

For OpenAPI/prose drift reviews, load the specialized reference:

```
Read references/openapi-prose-drift-audit.md for endpoint-family audit workflow, operation coverage invariants, and human/agent cross-review guidance.
```

Use it when reviewing `openapi/PROSE-DRIFT-AUDIT.md`, OpenAPI contract changes,
Registry API prose changes, release-freeze endpoint checklists, or PRs that touch
`agent-volumes-spec.md` §9/§11, `openapi/`, `schemas/`, or `conformance/fixtures/`.
For independent human/agent review, use the delegation prompts and
cross-validation workflow in that reference.

### Step 4: Report Findings

Produce a structured report:

For OpenAPI/prose drift reviews, use the specialized report template in
`references/openapi-prose-drift-audit.md` instead of the generic template below.

```markdown
## Spec Readiness Assessment: [Spec Name]

### Automated Checks

| Criterion                   | Status | Notes |
| --------------------------- | ------ | ----- |
| Has machine-readable schema | ✅/❌  | ...   |
| Has versioning policy       | ✅/❌  | ...   |
| Has error definitions       | ✅/❌  | ...   |
| Has security section        | ✅/❌  | ...   |
| Has conformance tests       | ✅/❌  | ...   |

### Manual Review Required

- [ ] Normative language is testable
- [ ] Schema is first-class artifact (not appendix)
- [ ] Error codes are finite and have JSON envelope
- [ ] Security/trust boundaries are explicit
- [ ] Conformance suite covers MUST/SHOULD statements
- [ ] Schema and conformance are aligned

### Verdict

[READY / NOT READY] - [Summary with specific gaps]
```

## Readiness Criteria

A spec is implementer-ready when ALL of the following are satisfied:

1. **Normative prose is testable**
   - Uses uppercase BCP 14 terms (MUST, SHOULD, MAY)
   - Requirements can become test cases
   - See references/spec-readiness-checklist.md §1

2. **Machine-readable schema is first-class**
   - Published alongside prose
   - Source of truth for clients/servers
   - See references/spec-readiness-checklist.md §2

3. **Versioning and compatibility are explicit**
   - Version docs, schemas, protocol separately
   - States what is backward-compatible
   - See references/spec-readiness-checklist.md §3

4. **Error semantics are closed**
   - Finite error code set
   - JSON error envelope defined
   - Client behavior specified per code
   - See references/spec-readiness-checklist.md §4

5. **Security and trust model are explicit**
   - Trust assumptions stated
   - Least-privilege responsibilities defined
   - Install-time risks documented
   - See references/spec-readiness-checklist.md §5

6. **Registry/catalog behavior is defined**
   - Listing, pagination, ordering specified
   - Referrers and fallback behavior documented
   - Reserved namespaces identified
   - See references/spec-readiness-checklist.md §6

7. **Conformance suite tied to normative text**
   - Every MUST/SHOULD has test coverage
   - Stable IDs for conformance requirements
   - Negative tests where applicable
   - See references/spec-readiness-checklist.md §7

8. **Schema and conformance are aligned**
   - Schema validates shapes conformance exercises
   - Suite covers schema acceptance and protocol behavior
   - See references/spec-readiness-checklist.md §8

9. **OpenAPI and prose are aligned**
   - Every operation maps to normative prose
   - Request/response/error/auth semantics match
   - See references/openapi-prose-drift-audit.md

## Practical Readiness Bar

A spec is ready for independent implementation when:

1. A third party can implement from the repo alone
2. Every normative statement is testable
3. Schemas and docs do not disagree
4. Error behavior is explicit
5. Versioning/compatibility is explicit
6. Security/trust boundaries are explicit
7. A conformance suite covers core flows and failures
8. Published versions are immutable
9. OpenAPI contracts, prose, schemas, and fixtures do not drift

## Resources

- **Detailed checklist with examples**: See [references/spec-readiness-checklist.md](references/spec-readiness-checklist.md)
- **OpenAPI/prose drift audit workflow**: See [references/openapi-prose-drift-audit.md](references/openapi-prose-drift-audit.md)
- **Validation script**: See [scripts/validate_spec.py](scripts/validate_spec.py)
- **Reference standards**: W3C test methodology, RFC 8174, OCI specs, OpenAPI, MCP
