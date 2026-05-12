# Review Policy

This document defines repository-level review expectations for Agent Volumes
specification changes.

## Review goals

Reviews protect:

- normative clarity;
- schema, OpenAPI, and fixture alignment;
- security and supply-chain boundaries;
- contributor transparency;
- maintainability of the working draft.

## Pull request expectations

Pull requests are expected to:

1. explain the problem and proposed change;
2. link related issues, discussions, or ADRs;
3. identify affected artifacts;
4. include validation results for relevant checks;
5. include DCO sign-off on commits;
6. avoid mixing unrelated normative, editorial, and process changes.

The organization-wide pull request template applies to this repository.

## Review requirements

| Change type               | Review expectation                                                |
| ------------------------- | ----------------------------------------------------------------- |
| Editorial-only fix        | Maintainer review or maintainer self-review when low risk.        |
| Process documentation     | Maintainer review; security or governance review when applicable. |
| Normative prose change    | Maintainer review plus schema/conformance impact review.          |
| Schema change             | Maintainer review plus schema/prose/fixture alignment check.      |
| OpenAPI change            | Maintainer review plus OpenAPI/prose drift check.                 |
| Security-sensitive change | Security-focused review before merge.                             |
| Release preparation       | Release coordinator review and validation evidence.               |

## Current small-project limitation

While the project has a narrow maintainer set, maintainer self-review can be used
for low-risk editorial or process-only changes. Self-review is not the target
state for security-sensitive or major normative changes. This small-project
exception is a transparency note; it does not override organization-wide pull
request, branch-protection, CODEOWNERS, required-check, or DCO requirements.

The project moves to two-person review for major normative and security-sensitive
changes once bus factor 2 is reached for merge and security-response access.

## Security review checklist

Reviewers check whether a change affects:

- trust boundaries;
- artifact integrity;
- publisher identity;
- provenance or signature semantics;
- advisory lifecycle behavior;
- permission escalation rules;
- authentication or authorization surfaces;
- local-policy boundaries.

If yes, the pull request documents the security impact and links to the relevant
section in [`security/security-requirements.md`](security/security-requirements.md)
or the applicable ADR.
