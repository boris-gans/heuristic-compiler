# Stack Guidance

## Defaults
- Python >= 3.11
- pytest for tests
- ruff for linting (line-length=100)
- mypy for type checking (strict=true)

## Frontend
- **Framework**: React 18 via Vite 5
- **Language**: TypeScript (strict, ESNext target)
- **Styling**: Tailwind CSS v3 (PostCSS plugin)
- **Editor component**: `@monaco-editor/react` — wraps Monaco Editor
- **Python runtime**: Pyodide (loaded from CDN in a Web Worker)
- **Worker communication**: `postMessage` / `onmessage` with typed `WorkerMessage` / `WorkerResponse`

## Python
- No runtime dependencies (heuristic_layer.py uses stdlib only: `json`, `logging`, `re`, `random`)
- Dev: `pytest`, `ruff`, `mypy`

## Deployment target
- Static hosting only (no server required)
- Requires `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`
  headers for Pyodide SharedArrayBuffer support

## Key constraints
- Entirely client-side — no backend, no API calls
- `heuristic_layer.py` must be served as a static file at `/heuristic_layer.py`
