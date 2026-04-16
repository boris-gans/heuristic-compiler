/**
 * Pyodide Web Worker
 *
 * Loads the Python runtime and HeuristicLayer, then handles simulation run requests.
 *
 * Message protocol (see src/types/index.ts):
 *   Main → Worker:  WorkerMessage  ({ type: "run", payload: SimulationInput })
 *   Worker → Main:  WorkerResponse ({ type: "ready" | "result" | "error", ... })
 */

import type { WorkerMessage, WorkerResponse, SimulationOutput } from '../types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PyodideInterface = any

async function initPyodide(): Promise<PyodideInterface> {
  // ES module workers cannot use importScripts; dynamic import is required.
  // @vite-ignore tells Vite not to attempt to bundle this CDN URL.
  const { loadPyodide } = await import(
    /* @vite-ignore */
    'https://cdn.jsdelivr.net/pyodide/v0.27.0/full/pyodide.mjs'
  )

  const pyodide: PyodideInterface = await loadPyodide()

  // Fetch and exec heuristic_layer.py into the Pyodide global namespace.
  // Override __name__ so the `if __name__ == '__main__':` example block at the
  // bottom of the file does not execute (Pyodide's __name__ is '__main__' by default).
  const response = await fetch('/heuristic_layer.py')
  if (!response.ok) {
    throw new Error(`Failed to fetch heuristic_layer.py: ${response.status} ${response.statusText}`)
  }
  pyodide.globals.set('__name__', 'heuristic_layer')
  await pyodide.runPythonAsync(await response.text())
  pyodide.globals.set('__name__', '__main__')

  return pyodide
}

// Begin initialisation immediately; 'ready' is posted once complete.
const pyodidePromise = initPyodide()

pyodidePromise
  .then(() => {
    self.postMessage({ type: 'ready' } as WorkerResponse)
  })
  .catch((err: unknown) => {
    self.postMessage({
      type: 'error',
      message: `Pyodide init failed: ${err instanceof Error ? err.message : String(err)}`,
    } as WorkerResponse)
  })

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  if (event.data.type !== 'run') return

  try {
    const pyodide = await pyodidePromise
    const { rulesJson, features, labels, probs, probabilitiesNeeded } = event.data.payload

    // Serialize inputs to JSON so Python receives plain dicts/lists with no JsProxy issues.
    const inputJson = JSON.stringify({ rulesJson, features, labels, probs, probabilitiesNeeded })
    pyodide.globals.set('_input_json', inputJson)

    // Construct a fresh HeuristicLayer per run (stateless worker).
    // All Python exceptions propagate to JS with the full traceback in err.message.
    const resultJson: string = await pyodide.runPythonAsync(`
import json as _json
import traceback as _tb

_inp = _json.loads(_input_json)

try:
    _hl = HeuristicLayer()
    _hl._rules = _hl._split_rules(_json.loads(_inp['rulesJson']))
    _out_labels, _out_probs, _applied = _hl.apply(
        probs=_inp['probs'],
        labels=_inp['labels'],
        features=_inp['features'],
        probabilities_needed=_inp['probabilitiesNeeded'],
    )
    _result = _json.dumps({
        'labels': list(_out_labels) if _out_labels else [],
        'probs': list(_out_probs) if _out_probs is not None else None,
        'appliedRules': list(_applied) if _applied else [],
    })
except Exception as _e:
    raise RuntimeError(_tb.format_exc()) from None
_result
`)

    const output: SimulationOutput = JSON.parse(resultJson)
    self.postMessage({ type: 'result', payload: output } as WorkerResponse)
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    } as WorkerResponse)
  }
}
