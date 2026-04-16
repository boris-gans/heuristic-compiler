/**
 * Pyodide Web Worker
 *
 * Loads the Python runtime and HeuristicLayer, then handles simulation run requests.
 *
 * TODO (Issue #1): Implement Pyodide initialisation and HeuristicLayer execution.
 *   1. Load Pyodide from CDN: https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.js
 *   2. Fetch /heuristic_layer.py and exec it in the Pyodide namespace.
 *   3. On { type: "run" } message: call HeuristicLayer.apply() and post back the result.
 *
 * Message protocol (see src/types/index.ts):
 *   Main → Worker:  WorkerMessage  ({ type: "run", payload: SimulationInput })
 *   Worker → Main:  WorkerResponse ({ type: "ready" | "result" | "error", ... })
 */

import type { WorkerMessage, WorkerResponse } from '../types'

// Notify the main thread that the worker script has been parsed.
// Pyodide initialisation happens here in Issue #1.
const readyResponse: WorkerResponse = { type: 'ready' }
self.postMessage(readyResponse)

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type } = event.data

  if (type === 'run') {
    // TODO (Issue #1): execute HeuristicLayer.apply() via Pyodide and post result back.
    const errorResponse: WorkerResponse = {
      type: 'error',
      message: 'Pyodide not yet initialised — see Issue #1',
    }
    self.postMessage(errorResponse)
  }
}
