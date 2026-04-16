  10 GitHub Issues — boris-gans/heuristic-compiler

  ┌─────┬─────────────────────────────────────────────────────────┬──────────┐
  │  #  │                          Issue                          │ Unblocks │
  ├─────┼─────────────────────────────────────────────────────────┼──────────┤
  │ #1  │ Pyodide Worker: load and run HeuristicLayer             │ #5, #6   │
  ├─────┼─────────────────────────────────────────────────────────┼──────────┤
  │ #2  │ Monaco Editor with JSON schema validation               │ #7       │
  ├─────┼─────────────────────────────────────────────────────────┼──────────┤
  │ #3  │ extractFeatures() — derive feature list from rules JSON │ #4       │
  ├─────┼─────────────────────────────────────────────────────────┼──────────┤
  │ #4  │ Feature Controls: dynamic form                          │ —        │
  ├─────┼─────────────────────────────────────────────────────────┼──────────┤
  │ #5  │ Complete usePyodideWorker hook (state machine + retry)  │ —        │
  ├─────┼─────────────────────────────────────────────────────────┼──────────┤
  │ #6  │ Output Panel: probability bars + applied rules          │ #7       │
  ├─────┼─────────────────────────────────────────────────────────┼──────────┤
  │ #7  │ Monaco highlighting: scroll to triggered rules          │ —        │
  ├─────┼─────────────────────────────────────────────────────────┼──────────┤
  │ #8  │ Layout, drag-to-resize, responsive polish               │ —        │
  ├─────┼─────────────────────────────────────────────────────────┼──────────┤
  │ #9  │ Build pipeline: COOP/COEP + asset handling              │ —        │
  ├─────┼─────────────────────────────────────────────────────────┼──────────┤
  │ #10 │ Error handling and edge cases                           │ —        │
  └─────┴─────────────────────────────────────────────────────────┴──────────┘

  A natural start order: #1 → #5 (gets the engine running), then #2 → #7 (editor experience), then #3 → #4 (dynamic
   form), then #6, #8, #9, #10 in parallel.