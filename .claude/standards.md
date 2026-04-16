# Engineering Standards

## General
- Follow the existing project formatter, linter, and file style
- Match local conventions before introducing new patterns
- Prefer simple, explicit code over clever abstractions
- Keep modules focused and functions small
- Prefer composition over deeply nested logic

## Types and interfaces
- Add type hints for public functions and important internal boundaries
- Use clear input and output contracts
- Validate data at boundaries, especially from external systems

## Logging and errors
- Use logging instead of print
- Include useful context in logs
- Do not swallow exceptions silently
- Raise specific exceptions where appropriate
- Return safe and predictable errors at API boundaries

## External calls
- Assume network calls can fail
- Handle timeouts, retries, and partial failures where relevant
- Make retry behavior explicit and bounded

## Testing
- Add a minimal, high-value test for meaningful changes
- Prefer fast unit tests unless integration coverage is needed
- Use fakes, fixtures, and stubs instead of real services
- Cover the happy path and at least one important failure path

## Security
- Never include secrets in code, tests, docs, or examples
- Use environment variables or placeholders like `<API_KEY>`
- Avoid logging sensitive data
- Validate and constrain external input

## Change discipline
- Make the smallest change that fully solves the problem
- Do not rewrite unrelated code
- Preserve backward compatibility unless told otherwise