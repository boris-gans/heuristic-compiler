# Claude Instructions

Start by reading these files when they exist:

1. `.claude/context.md`
2. `.claude/project.md`
3. `.claude/stack.md`
4. `.claude/standards.md`
5. `.claude/workflow.md`

## Core behavior
- Follow the existing architecture and local conventions before introducing new patterns.
- Make the smallest change that fully solves the problem.
- Prefer simple, explicit code over clever abstractions.
- Keep functions and modules focused.
- Add tests for new behavior or meaningful changes.
- Use logging instead of print.
- Never include secrets in code, tests, docs, or examples.

## Context maintenance
After any meaningful change:

1. Treat `.claude/context.md` as the portable project memory file. After any task that changes architecture, workflows, dependencies, module boundaries, API behavior, or important implementation decisions, update `.claude/context.md`
2. Update `.claude/stack.md` if:
   - dependencies change
   - new tools/frameworks are introduced
   - infra or runtime changes

3. Update `.claude/project.md` if:
   - features are added or removed
   - API behavior changes
   - product scope evolves

Guidelines:
- Keep all files concise
- Remove stale information
- Do not duplicate content across files

When the user asks for a summary, handoff, or reusable project context, prefer `.claude/context.md`.

## Coding expectations
- Match formatter, linter, and file style already used by the repo.
- Add type hints at important boundaries and for public functions.
- Validate external input at system boundaries.
- Handle timeouts, retries, and partial failure for external calls.
- Prefer deterministic tests with fakes, fixtures, or stubs.
- Do not rewrite unrelated code.

## Output expectations
When making non-trivial changes, provide:
1. a brief summary
2. the code changes
3. test updates
4. assumptions or trade-offs