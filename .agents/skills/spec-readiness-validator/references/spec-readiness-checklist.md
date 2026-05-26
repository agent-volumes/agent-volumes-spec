# Spec Readiness Checklist

Detailed criteria for evaluating specification implementer-readiness, with examples from mature standards bodies.

## Table of Contents

1. [Normative Language](#1-normative-language)
2. [Machine-Readable Schema](#2-machine-readable-schema)
3. [Versioning and Compatibility](#3-versioning-and-compatibility)
4. [Closed Error Semantics](#4-closed-error-semantics)
5. [Security and Trust Model](#5-security-and-trust-model)
6. [Registry and Catalog Behavior](#6-registry-and-catalog-behavior)
7. [Conformance Suite](#7-conformance-suite)
8. [Schema and Conformance Alignment](#8-schema-and-conformance-alignment)
9. [OpenAPI and Prose Drift Alignment](#9-openapi-and-prose-drift-alignment)

---

## 1. Normative Language

### Requirements

- [ ] Uses uppercase BCP 14 terms consistently (MUST, MUST NOT, REQUIRED, SHALL, SHALL NOT, SHOULD, SHOULD NOT, RECOMMENDED, MAY, OPTIONAL)
- [ ] Every normative statement is testable
- [ ] Requirements can be extracted and mapped to test cases
- [ ] Conformance requirements have stable IDs

### Examples

**Good (testable):**

```
A server MUST respond with a 400 status code when the request body is not valid JSON.
```

**Bad (untestable):**

```
A server should handle errors gracefully.
```

### References

- [W3C Test Methodology](https://www.w3.org/TR/test-methodology/)
- [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)
- [W3C Conformance Testing](https://www.w3.org/TR/test-methodology/)

### Common Pitfalls

- Using lowercase "must" instead of uppercase "MUST"
- Vague requirements like "handle gracefully" or "as appropriate"
- Missing negative test cases for MUST NOT statements

---

## 2. Machine-Readable Schema

### Requirements

- [ ] Schema is published alongside prose specification
- [ ] Schema is a first-class artifact (not appendix or afterthought)
- [ ] Schema is source of truth for clients and servers
- [ ] Schema covers all protocol data structures
- [ ] Schema has media type registration

### Examples

**Good (OCI):**

```json
{
  "schemaVersion": 2,
  "mediaType": "application/vnd.oci.image.manifest.v1+json",
  "config": { ... },
  "layers": [ ... ]
}
```

**Good (MCP):**

```typescript
// TypeScript schema is source of truth
export interface InitializeRequest {
  method: "initialize";
  params: {
    protocolVersion: string;
    capabilities: ClientCapabilities;
    clientInfo: Implementation;
  };
}
```

### References

- [OCI Schema Registry](https://github.com/opencontainers/image-spec/blob/29c4dbd992d51c31b874135de298e89d20afa6d4/schema/schema.go#L35-L46)
- [OCI Manifest Schema](https://github.com/opencontainers/image-spec/blob/29c4dbd992d51c31b874135de298e89d20afa6d4/schema/image-manifest-schema.json#L1-L45)
- [MCP README](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/91a643c80ee9ad0eabbe09aa0c22498908614a8e/README.md#L5-L13)

### Common Pitfalls

- Schema is auto-generated but not reviewed
- Schema and prose disagree on field requirements
- Schema is in appendix instead of published artifact

---

## 3. Versioning and Compatibility

### Requirements

- [ ] Versioning policy is explicit
- [ ] Docs, schemas, and protocol behavior are versioned
- [ ] Backward compatibility rules are stated
- [ ] Breaking changes are identified and documented
- [ ] Version negotiation mechanism is defined

### Examples

**Good (OpenAPI):**

```yaml
openapi: 3.1.0
info:
  version: 1.2.3
```

**Good (MCP):**

```typescript
// Protocol version negotiation
interface InitializeRequest {
  params: {
    protocolVersion: string; // e.g., "2024-11-05"
  };
}

// Server disconnects if version unsupported
```

### References

- [JSON Schema Process](https://github.com/json-schema-org/json-schema-spec/blob/5794814cca9edc379cc578d1d8ba756adc05814f/PROCESS.md#L57-L111)
- [OpenAPI Versions](https://github.com/OAI/OpenAPI-Specification/blob/12e4c66e91676e8a8a8280f62526c38e58ec4a38/versions/3.1.0.md#L100-L110)
- [MCP Initialize](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/91a643c80ee9ad0eabbe09aa0c22498908614a8e/schema/2025-11-25/schema.ts#L257-L295)

### Common Pitfalls

- "We'll figure out versioning later"
- Breaking changes in patch releases
- No version negotiation, just hard failures

---

## 4. Closed Error Semantics

### Requirements

- [ ] Finite error code set is defined
- [ ] JSON error envelope is specified
- [ ] Client behavior is specified per error code
- [ ] Error codes are not extensible without versioning

### Examples

**Good (OCI Distribution):**

```json
{
  "errors": [
    {
      "code": "BLOB_UNKNOWN",
      "message": "blob unknown to registry",
      "detail": {
        "digest": "sha256:..."
      }
    }
  ]
}
```

**Good (MCP):**

```typescript
interface Error {
  code: number; // e.g., -32600 (Invalid Request)
  message: string;
  data?: unknown;
}
```

### References

- [OCI Errors](https://github.com/opencontainers/distribution-spec/blob/ed409887fff5ad423bd3f410fdfcd5678469899f/spec.md#L852-L893)
- [MCP Error Type](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/91a643c80ee9ad0eabbe09aa0c22498908614a8e/schema/2025-11-25/schema.ts#L104-L117)

### Common Pitfalls

- "Any string" error messages without codes
- HTTP status codes only, no application-level semantics
- Extensible error codes without versioning

---

## 5. Security and Trust Model

### Requirements

- [ ] Trust assumptions are stated explicitly
- [ ] Least-privilege responsibilities are defined
- [ ] Install-time risks are documented
- [ ] Security schemes are explicit (OpenAPI-style)
- [ ] Threat model is included or referenced

### Examples

**Good (MCP):**

```markdown
## Security Policy

### Trust Assumptions

- The transport layer is trusted (TLS)
- Servers operate in a sandboxed environment

### Responsibilities

- **Client**: Validate server identity, enforce capability limits
- **Server**: Request minimum necessary permissions, validate inputs

### Risks

- Installing untrusted servers exposes the system to arbitrary code execution
```

**Good (OpenAPI):**

```yaml
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
```

### References

- [MCP Security](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/91a643c80ee9ad0eabbe09aa0c22498908614a8e/SECURITY.md#L23-L45)
- [MCP Responsibilities](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/91a643c80ee9ad0eabbe09aa0c22498908614a8e/SECURITY.md#L126-L152)
- [OpenAPI Security Object](https://github.com/OAI/OpenAPI-Specification/blob/12e4c66e91676e8a8a8280f62526c38e58ec4a38/versions/3.1.0.md#L194-L205)

### Common Pitfalls

- "Security is out of scope for this spec"
- Implicit trust in transport layer
- No mention of capability-based access control

---

## 6. Registry and Catalog Behavior

### Requirements

- [ ] Listing behavior is defined (pagination, ordering)
- [ ] Referrers and fallback behavior is documented
- [ ] Reserved namespaces are identified
- [ ] Extension mechanism is specified
- [ ] Versioning for extensions is defined

### Examples

**Good (OCI Distribution):**

```
GET /v2/_catalog?n=100&last=foo
GET /v2/<name>/tags/list?n=100&last=v1.0
GET /v2/<name>/referrers/<digest>?artifactType=...
```

### References

- [OCI Tags/Referrers](https://github.com/opencontainers/distribution-spec/blob/ed409887fff5ad423bd3f410fdfcd5678469899f/spec.md#L551-L624)
- [OCI Extensions](https://github.com/opencontainers/distribution-spec/blob/ed409887fff5ad423bd3f410fdfcd5678469899f/extensions/README.md#L17-L24)
- [OCI Extension Versioning](https://github.com/opencontainers/distribution-spec/blob/ed409887fff5ad423bd3f410fdfcd5678469899f/extensions/README.md#L61-L70)

### Common Pitfalls

- No pagination, assuming small datasets
- No reserved namespaces, allowing conflicts
- Extension mechanism that breaks compatibility

---

## 7. Conformance Suite

### Requirements

- [ ] Every MUST has at least one passing test
- [ ] Every SHOULD has test coverage
- [ ] Negative tests exist for MUST NOT statements
- [ ] Conformance requirements have stable IDs
- [ ] Tests are categorized (e.g., by protocol area)
- [ ] Test suite can be run independently

### Examples

**Good (W3C):**

```
Test ID: css-flexbox-001
Requirement: [CSS-FLEXBOX] Section 3.1 - A flex container establishes a new flex formatting context for its contents
Test Type: Reftest
```

**Good (OCI):**

```
Test Category: Pull
Test: GET /v2/<name>/manifests/<reference>
Expected: 200 OK with manifest body
```

### References

- [W3C Test Methodology](https://www.w3.org/TR/test-methodology/)
- [OCI Conformance README](https://github.com/opencontainers/distribution-spec/blob/ed409887fff5ad423bd3f410fdfcd5678469899f/conformance/README.md#L58-L173)
- [JSON Schema Test Suite](https://github.com/json-schema-org/json-schema-spec/blob/5794814cca9edc379cc578d1d8ba756adc05814f/README.md#L125-L128)

### Common Pitfalls

- Tests exist but don't map to normative text
- Missing negative tests
- Tests require proprietary infrastructure

---

## 8. Schema and Conformance Alignment

### Requirements

- [ ] Schema validates shapes that conformance exercises
- [ ] Conformance suite covers schema acceptance
- [ ] Conformance suite covers protocol behavior
- [ ] Test report format is machine-checkable

### Examples

**Good (OpenAPI):**

```javascript
// Schema tests register the same dialect
const dialect = "https://spec.openapis.org/oas/3.1/dialect/base";
// Used by both validation and conformance
```

**Good (JSON Schema):**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["valid", "errors"]
}
```

### References

- [OpenAPI Schema Tests](https://github.com/OAI/OpenAPI-Specification/blob/12e4c66e91676e8a8a8280f62526c38e58ec4a38/tests/schema/oas-schema.mjs#L11-L25)
- [OpenAPI Schema Publish Flow](https://github.com/OAI/OpenAPI-Specification/blob/12e4c66e91676e8a8a8280f62526c38e58ec4a38/scripts/schema-publish.sh#L68-L90)
- [JSON Schema Output Schema](https://github.com/json-schema-org/json-schema-spec/blob/5794814cca9edc379cc578d1d8ba756adc05814f/specs/output/schema.json#L1-L95)

### Common Pitfalls

- Schema and tests maintained separately, diverge over time
- Tests pass but don't exercise schema constraints
- Manual test reports, not machine-checkable

## 9. OpenAPI and Prose Drift Alignment

Use this section when a spec publishes an OpenAPI contract or similar HTTP API
companion artifact. For the detailed endpoint-family workflow, read
`openapi-prose-drift-audit.md`.

### Requirements

- [ ] Every OpenAPI path/method/operation maps to normative prose
- [ ] Every normative endpoint family appears in the OpenAPI contract
- [ ] Request parameters, headers, bodies, media types, defaults, bounds, and
      enum values match prose
- [ ] Success response status codes, schemas, examples, and empty collection
      semantics match prose
- [ ] Protected operations declare security schemes; public operations remain
      intentionally public
- [ ] Error responses use the closed error vocabulary and expected media type
- [ ] Endpoint-specific error mappings are checked, not only shared response
      components
- [ ] OpenAPI version, route family, schema versions, and capability metadata are
      in lockstep
- [ ] Deterministic endpoint behavior links to conformance fixtures or explicit
      prose-boundary notes
- [ ] Release-freeze signoff records evidence and has no unresolved blocking drift

### Review delegation

Run independent human and agent reviews when possible:

1. One reviewer checks operation coverage and route topology.
2. One reviewer checks request/response/error/auth semantics.
3. One reviewer checks fixture evidence, requirement IDs, and policy boundaries.
4. A final reviewer reconciles disagreements before release-freeze signoff.

### Common Pitfalls

- Matrix rows use broad endpoint families that hide per-operation differences
- Shared OpenAPI response components are treated as operation-specific evidence
- Request-side details drift while response schemas stay aligned
- Status values are marked reviewed but evidence remains missing
- Local policy choices are accidentally promoted into portable requirements

---

## Practical Readiness Bar

A spec is ready for independent client/server/catalog implementations when:

1. [ ] A third party can implement from the repo alone
2. [ ] Every normative statement is testable
3. [ ] Schemas and docs do not disagree
4. [ ] Error behavior is explicit
5. [ ] Versioning/compatibility is explicit
6. [ ] Security/trust boundaries are explicit
7. [ ] A conformance suite covers core flows and failures
8. [ ] Published versions are immutable
9. [ ] OpenAPI contracts, prose, schemas, and fixtures do not drift

## Assessment Report Template

```markdown
## Spec Readiness Assessment: [Spec Name]

### Summary

- **Status**: [READY / NOT READY / PARTIAL]
- **Version**: [spec version]
- **Date**: [assessment date]

### Automated Checks

| #   | Criterion                    | Status | Evidence |
| --- | ---------------------------- | ------ | -------- |
| 1   | Normative language           | ✅/❌  | ...      |
| 2   | Machine-readable schema      | ✅/❌  | ...      |
| 3   | Versioning policy            | ✅/❌  | ...      |
| 4   | Error semantics              | ✅/❌  | ...      |
| 5   | Security model               | ✅/❌  | ...      |
| 6   | Registry behavior            | ✅/❌  | ...      |
| 7   | Conformance suite            | ✅/❌  | ...      |
| 8   | Schema-conformance alignment | ✅/❌  | ...      |
| 9   | OpenAPI-prose drift          | ✅/❌  | ...      |

### Gaps

1. [Specific gap with recommendation]
2. ...

### Recommendations

1. [Actionable recommendation]
2. ...
```
