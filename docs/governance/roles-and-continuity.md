# Roles and Continuity

This document describes repository-level responsibilities and continuity
expectations for Agent Volumes specification maintenance.

Organization-wide governance is defined by the Agent Volumes organization. This
document records how those responsibilities are applied in this repository.

## Repository roles

| Role                 | Responsibilities                                                                              |
| -------------------- | --------------------------------------------------------------------------------------------- |
| Maintainer           | Triage issues, review pull requests, merge accepted changes, coordinate releases.             |
| Specification editor | Preserve terminology, normative language discipline, section structure, and cross-references. |
| Schema steward       | Review JSON Schema changes and ensure schema/prose/fixture alignment.                         |
| Conformance steward  | Review fixture coverage, conformance reports, and requirement mappings.                       |
| Security responder   | Coordinate private vulnerability reports under the organization security policy.              |
| Release coordinator  | Run release-freeze checks, curate `CHANGELOG.md`, prepare tags, and coordinate announcements. |

One person can hold multiple roles while the project is small. Role concentration
is tracked as an operational risk.

## Current continuity posture

The repository currently has a narrow maintainer set. The practical continuity
goal is bus factor 2 for these capabilities:

- create, label, and close issues;
- review and merge pull requests;
- update protected-branch settings;
- cut draft and stable releases;
- respond to private vulnerability reports;
- publish or update changelog entries, release notes, and advisories.

Until two maintainers can perform each capability, release and security work is
treated as higher risk and is documented in PRs and release notes.

## Continuity targets

| Capability                | Target state                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| Merge access              | At least two trusted maintainers with protected-branch merge rights.                          |
| Release access            | At least two maintainers able to create tags and GitHub releases.                             |
| Security response         | At least two responders with access to private vulnerability reports.                         |
| Documentation stewardship | At least two reviewers familiar with prose/schema/conformance lockstep.                       |
| Emergency coverage        | Maintainers can hand off open issues, release blockers, and security reports within one week. |

## Review cadence

Maintainers review this document before stable releases and whenever repository
permissions, CODEOWNERS, or security-response access changes.
