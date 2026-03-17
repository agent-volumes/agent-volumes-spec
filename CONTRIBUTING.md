# Contributing to the Agent Volumes Specification

Thank you for your interest in contributing to the Agent Volumes specification. This document explains how to participate in specification development.

## Ways to Contribute

### Feedback and Discussion

The most valuable contribution during the draft phase is **specification feedback**. You can:

- Open a [GitHub Issue](https://github.com/agent-volumes/agent-volumes-spec/issues) to report problems, ambiguities, or gaps in the specification
- Start a [GitHub Discussion](https://github.com/agent-volumes/agent-volumes-spec/discussions) for open-ended design questions
- Comment on existing issues and pull requests

### Specification Changes

Changes to the specification follow a proposal process:

1. **Open an issue** describing the problem and proposed change
2. **Discuss** with maintainers and community members
3. **Submit a pull request** with the proposed specification text
4. **Review** — all specification changes require review from at least one maintainer
5. **Merge** — accepted changes are merged into the working draft

For substantial changes — new sections, new component types, behavioral changes, or modifications to normative requirements — open an issue first to discuss the approach before writing specification text.

### Editorial Corrections

Typos, grammar fixes, broken links, and formatting improvements can be submitted directly as pull requests without a prior issue.

## Development Process

### Specification Lifecycle

The specification follows a staged lifecycle:

| Stage | Description |
| ----- | ----------- |
| **Working Draft** | Active development. Breaking changes expected. |
| **Candidate Recommendation** | Feature-complete. Implementer feedback sought. |
| **Stable** | Released. Only backwards-compatible changes. |

The current specification is a **Working Draft**.

### Branch Strategy

This project follows **trunk-based development**, consistent with the model used by OCI, W3C, IETF, and MCP specification projects.

- `main` is the current Working Draft. All pull requests target `main`.
- Draft milestones are marked with tags (e.g., `v0.1.0-draft.3`).
- Stable releases are marked with tags (e.g., `v1.0.0`). Release candidates use the `v1.0.0-rc.N` format.
- All work **must** be done on a fork. Do not create branches on the main repository.
- Maintenance branches for prior stable releases (e.g., `v1.0-maint`) will be created only when backport patches are needed.

### Pull Request Process

1. Fork the repository and create a branch from `main`
2. Make your changes
3. Ensure your commits are signed off (see below)
4. Submit a pull request against `main`
5. Respond to review feedback

### Commit Sign-Off (DCO)

This project uses the [Developer Certificate of Origin (DCO)](https://developercertificate.org/). All commits must include a `Signed-off-by` line:

```
Signed-off-by: Your Name <your.email@example.com>
```

You can add this automatically with `git commit -s`.

The DCO is a lightweight mechanism to certify that you have the right to submit your contribution under the project's license. It does not transfer copyright — you retain ownership of your contributions.

## Editorial Conventions

When editing the specification:

- Use [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) keywords (MUST, SHOULD, MAY) for normative requirements
- Define terms on first use and add them to the glossary (Appendix B)
- Use American English spelling
- Keep line lengths reasonable for diff readability
- Reference other specification sections by number (e.g., "see §3.2")
- Preserve existing formatting conventions in the document

## Governance

Specification development is guided by the Technical Steering Committee (TSC). For governance details, including decision-making processes and membership, see the [project governance documentation](https://github.com/agent-volumes/.github/blob/main/GOVERNANCE.md).

## Code of Conduct

All participants are expected to follow the [Contributor Covenant 3.0 Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing to this project, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
