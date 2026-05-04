# The Agent Volumes Organization Context

When working in this repository, always consult the organization template repository [`agent-volumes/.github`](https://github.com/agent-volumes/.github) for authoritative guidelines and policies that may not be reflected in this repo's own files.

## Mandatory External References

Before making changes—especially to CI/CD workflows, security-related configurations, or contribution processes—check the following documents in [`agent-volumes/.github`](https://github.com/agent-volumes/.github):

- **README.md**: Organization-wide reusable workflows, their interfaces, and consumer usage patterns.
- **SECURITY.md**: Supply chain integrity requirements, vulnerability reporting procedures, and security policy.
- **CONTRIBUTING.md**: Contribution boundaries, development expectations, and CI/CD requirements (e.g., SHA-pinned actions, harden-runner, job-level permissions).
- **CODE_OF_CONDUCT.md**: Behavioral expectations for community participation.

## Key Policy Notes

- **Reusable workflows**: The organization provides centralized reusable workflows for Scorecard, Dependency Review, and OSV Scanner. Prefer using these over inline implementations.
- **SHA pinning exception**: Reusable workflows from `agent-volumes/.github` are the sole exception to the organization's SHA-pinning requirement; they may be referenced via branch name (e.g., `@main`) rather than commit SHA.
- **Permissions**: Follow the principle of least privilege. Use job-level `permissions` over top-level `permissions: read-all` unless the template repo explicitly specifies otherwise.

## PR Template

When creating pull requests in this repository, use the organization's centralized PR template from [`agent-volumes/.github`](https://github.com/agent-volumes/.github/blob/main/.github/PULL_REQUEST_TEMPLATE.md):

- **URL**: `https://raw.githubusercontent.com/agent-volumes/.github/refs/heads/main/.github/PULL_REQUEST_TEMPLATE.md`
- Always fetch the latest template from this URL when creating PRs.
- The template includes sections for Summary, Related Issues, Change Type, Checklist, Testing, Documentation, and Rollout/Risk.

These documents contain critical context that cannot be inferred from this repository's contents alone.
