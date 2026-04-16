# Coding Rules
- Follow the project formatter. Do not change file style.
- Use logging instead of print. Include error context.
- Add type hints and docstrings for public functions.
- Keep functions small; prefer composition over long scripts.
- Write safe defaults. Handle timeouts and retries where external calls exist.

# Tests
- Provide a minimal test when adding new modules.
- Use fakes or fixtures; do not call real services.

# Security
- Never include secrets in code or examples.
- Use environment variables or placeholders like <API_KEY>.