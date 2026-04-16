# Workflow

## When adding a feature
- understand the local architecture
- add the smallest reasonable implementation
- add or update tests
- update docs if behavior changes
- refresh `.claude/context.md` if the change affects architecture, dependencies, behavior, or workflows

## When reviewing code
Check:
- correctness
- edge cases
- error handling
- type safety
- tests
- security
- maintainability

## When writing docs
Prefer:
- concise instructions
- copy-paste friendly commands
- explicit environment variables
- troubleshooting notes only when useful

## When refactoring
- preserve behavior unless explicitly fixing a bug
- improve clarity before introducing abstraction
- keep changes scoped