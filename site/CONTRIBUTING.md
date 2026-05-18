# Contribute to the documentation

Thank you for your interest in contributing to Agent Volumes documentation. This site publishes human- and agent-facing documentation for the specification, but it does not replace the canonical specification artifacts in the repository root.

## How to contribute

### Option 1: Edit directly on GitHub

1. Navigate to the page you want to edit
2. Click the "Edit this file" button (the pencil icon)
3. Make your changes and submit a pull request

### Option 2: Local development

1. Fork and clone this repository
2. Install repository dependencies with `bun install`
3. Install site dependencies with `(cd site && bun install)`
4. Create a branch for your changes
5. Make changes
6. Run `bun run build:site:openapi` from the repository root if API reference content changed
7. Run `bun run site:dev` from the repository root
8. Run `bun run lint:site` from the repository root before submitting
9. Commit your changes and submit a pull request

## Writing guidelines

- **Use active voice**: "Run the command" not "The command should be run"
- **Address the reader directly**: Use "you" instead of "the user"
- **Keep sentences concise**: Aim for one idea per sentence
- **Lead with the goal**: Start instructions with what the user wants to accomplish
- **Use consistent terminology**: Don't alternate between synonyms for the same concept
- **Include examples**: Show, don't just tell
- **Cite canonical artifacts**: Link URI publication pages back to the source specification, schemas, OpenAPI contract, conformance fixtures, or ADRs.
- **Preserve scope boundaries**: Do not document implementation-local choices as portable Agent Volumes requirements.
