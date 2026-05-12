# Good First Issue Guide

This guide lists small, well-scoped contribution types that are suitable for new
or casual contributors.

## Good starter tasks

| Area                | Examples                                                                 |
| ------------------- | ------------------------------------------------------------------------ |
| Editorial fixes     | Typos, broken references, unclear sentences, table formatting.           |
| Link maintenance    | Updating stale links, adding missing relative links, checking anchors.   |
| Examples            | Improving examples without changing normative behavior.                  |
| Fixture coverage    | Adding a narrow validation case that follows an existing fixture family. |
| Schema descriptions | Clarifying descriptions without changing validation semantics.           |
| ADR indexing        | Improving decision record summaries or cross-links.                      |
| OpenAPI drift audit | Marking checked endpoint rows with evidence during release-freeze work.  |

## Tasks that need prior discussion

Open an issue before working on:

- new component types;
- new normative requirements;
- schema shape changes;
- OpenAPI endpoint changes;
- conformance label changes;
- trust, advisory, provenance, or permission model changes;
- changes that reopen a deferred topic listed in
  [`../../conformance/REQUIREMENTS.md`](../../conformance/REQUIREMENTS.md).

## How to find starter work

Use GitHub Issues and Discussions for public, URL-addressable coordination.
Maintainers label suitable tasks with labels such as `good first issue`,
`documentation`, `editorial`, or `help wanted` when available.

Useful issue searches:

- [`good first issue`](https://github.com/agent-volumes/agent-volumes-spec/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22)
- [`documentation`](https://github.com/agent-volumes/agent-volumes-spec/issues?q=is%3Aissue%20state%3Aopen%20label%3Adocumentation)
- [`help wanted`](https://github.com/agent-volumes/agent-volumes-spec/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22help%20wanted%22)

If no labeled task is available, open a short issue describing the proposed
starter task before sending a pull request. Editorial corrections can be sent as
pull requests directly.

## Starter task checklist

- Keep the change narrow and reviewable.
- Link to the affected section or artifact in the pull request.
- Follow the organization-wide
  [CONTRIBUTING.md](https://github.com/agent-volumes/.github/blob/main/CONTRIBUTING.md).
- Sign off commits with DCO (`git commit -s`).
- Run the checks listed in
  [`validation-and-conformance.md`](validation-and-conformance.md) for the files
  you changed.
