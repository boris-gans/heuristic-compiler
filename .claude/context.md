# Project Context

## Goal

Build a **client-side heuristic rule simulator and debugger** so non-technical colleagues
can paste a rules JSON, tweak feature inputs, click "Run", and immediately see which rules
fired, in what order, and why — without any backend or deployment.

## Repo layout

```
heuristic-compiler/
  heuristic_layer.py          # Python engine — the class being simulated
  frontend/                   # React + Vite app (client-side only)
    public/
      heuristic_layer.py      # copy of root file; served as static asset for Pyodide
    src/
      types/index.ts          # SimulationInput, SimulationOutput, WorkerMessage types
      workers/
        pyodide.worker.ts     # Web Worker: loads Pyodide + heuristic_layer.py
      hooks/
        usePyodideWorker.ts   # React hook wrapping the worker lifecycle
      components/
        RuleEditor/           # Monaco-based JSON editor (Issue #2)
        FeatureControls/      # Dynamic feature form (Issues #3, #4)
        OutputPanel/          # Results display (Issue #6)
      App.tsx                 # Two-panel layout shell
    package.json
    vite.config.ts
  docs/
    overview.md               # UI/UX architecture and design spec
    heuristic_layer_integration.md  # Production integration guide (rules format ref)
  pyproject.toml              # Python dev tooling (ruff, mypy, pytest)
```

## Key architectural decisions

- **Pyodide in a Web Worker**: Python runs in-browser via WebAssembly; isolated in a
  worker to avoid blocking the UI. SharedArrayBuffer requires COOP/COEP headers.
- **`heuristic_layer.py` as static asset**: the private `ml_training_utils` package
  can't be installed via SSH in Pyodide; the source file is bundled directly and
  `exec()`'d into the Pyodide namespace at runtime.
- **Feature form derived from rules JSON**: instead of a fixed form, the UI parses the
  rules JSON and surfaces only the features referenced in conditions.
- **Rule → line mapping**: after a run, Monaco decorations highlight the rules that fired;
  requires a JS-side parse to map rule names to line numbers.

## Rules JSON format (key reference)

```json
{
  "name": "rule_name",
  "scope": "all",
  "antecedent": { "logic": "all", "conditions": [{ "field": "amount", "operator": ">=", "value": 500 }] },
  "consequent": { "action": "override", "value": "card" },
  "break": false
}
```

Operators: `override` (priority 3) > `adjust` (2) > `ban` (4) > `append` (1, no-probs only).

## Worker message protocol

```
Main → Worker:  { type: "run", payload: SimulationInput }
Worker → Main:  { type: "ready" }
                { type: "result", payload: SimulationOutput }
                { type: "error", message: string }
```

## Open issues (GitHub)

| # | Title |
|---|-------|
| 1 | Pyodide Worker: initialise and run HeuristicLayer |
| 2 | Monaco Editor: JSON editing with rule-format schema |
| 3 | Feature extraction: derive feature list from rules JSON |
| 4 | Feature Controls panel: dynamic form |
| 5 | Simulation wiring: usePyodideWorker hook |
| 6 | Output Panel: display labels, probabilities, and applied rules |
| 7 | Monaco rule highlighting: scroll to triggered rules |
| 8 | Layout, CSS, and responsive polish |
| 9 | Build pipeline: COOP/COEP headers and Pyodide asset handling |
| 10 | Error handling and edge cases |
