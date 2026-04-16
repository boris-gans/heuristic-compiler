/**
 * usePyodideWorker
 *
 * React hook that manages the Pyodide Web Worker lifecycle and exposes a `run` function
 * for triggering simulations.
 *
 * TODO (Issue #5): Complete this hook.
 *   - Handle 'ready' response to transition from 'loading' to 'ready'.
 *   - Handle 'result' and 'error' responses.
 *   - Expose stable `run` callback via useCallback.
 */

import { useEffect, useRef, useState } from 'react'
import type { SimulationInput, SimulationOutput, WorkerResponse } from '../types'

export type WorkerStatus = 'loading' | 'ready' | 'running' | 'error'

export interface UsePyodideWorkerResult {
  status: WorkerStatus
  output: SimulationOutput | null
  error: string | null
  run: (input: SimulationInput) => void
}

export function usePyodideWorker(): UsePyodideWorkerResult {
  const workerRef = useRef<Worker | null>(null)
  const [status, setStatus] = useState<WorkerStatus>('loading')
  const [output, setOutput] = useState<SimulationOutput | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/pyodide.worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data
      if (msg.type === 'ready') {
        // TODO (Issue #5): transition to 'ready' once Pyodide is fully initialised.
        setStatus('ready')
      } else if (msg.type === 'result') {
        setOutput(msg.payload)
        setStatus('ready')
      } else if (msg.type === 'error') {
        setError(msg.message)
        setStatus('error')
      }
    }

    worker.onerror = (e) => {
      setError(e.message)
      setStatus('error')
    }

    return () => {
      worker.terminate()
    }
  }, [])

  const run = (input: SimulationInput) => {
    if (!workerRef.current || status !== 'ready') return
    setStatus('running')
    setOutput(null)
    setError(null)
    workerRef.current.postMessage({ type: 'run', payload: input })
  }

  return { status, output, error, run }
}
