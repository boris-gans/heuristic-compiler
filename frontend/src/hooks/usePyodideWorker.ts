/**
 * usePyodideWorker
 *
 * React hook that manages the Pyodide Web Worker lifecycle and exposes a `run` function
 * for triggering simulations.
 *
 * State machine:
 *   loading  →  ready    (worker posts { type: 'ready' })
 *   ready    →  running  (run() called)
 *   running  →  ready    (worker posts { type: 'result' })
 *   running  →  error    (worker posts { type: 'error' })
 *   error    →  loading  (retry() called — terminates worker and re-initialises)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { SimulationInput, SimulationOutput, WorkerResponse } from '../types'

export type WorkerStatus = 'loading' | 'ready' | 'running' | 'error'

export interface UsePyodideWorkerResult {
  status: WorkerStatus
  output: SimulationOutput | null
  error: string | null
  run: (input: SimulationInput) => void
  retry: () => void
}

const LOAD_TIMEOUT_MS = 30_000

export function usePyodideWorker(): UsePyodideWorkerResult {
  const workerRef = useRef<Worker | null>(null)
  const [status, setStatus] = useState<WorkerStatus>('loading')
  const [output, setOutput] = useState<SimulationOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Incrementing epoch terminates the old worker and re-initialises a new one.
  const [epoch, setEpoch] = useState(0)

  useEffect(() => {
    setStatus('loading')
    setOutput(null)
    setError(null)

    const worker = new Worker(
      new URL('../workers/pyodide.worker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current = worker

    const timeoutId = setTimeout(() => {
      setError('Pyodide failed to initialise (timeout)')
      setStatus('error')
    }, LOAD_TIMEOUT_MS)

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data
      if (msg.type === 'ready') {
        clearTimeout(timeoutId)
        setStatus('ready')
      } else if (msg.type === 'result') {
        setOutput(msg.payload)
        setStatus('ready')
      } else if (msg.type === 'error') {
        clearTimeout(timeoutId)
        setError(msg.message)
        setStatus('error')
      }
    }

    worker.onerror = (e) => {
      clearTimeout(timeoutId)
      setError(e.message)
      setStatus('error')
    }

    return () => {
      clearTimeout(timeoutId)
      worker.terminate()
    }
  }, [epoch])

  const run = useCallback(
    (input: SimulationInput) => {
      if (!workerRef.current || status !== 'ready') return
      setStatus('running')
      setOutput(null)
      setError(null)
      workerRef.current.postMessage({ type: 'run', payload: input })
    },
    [status],
  )

  const retry = useCallback(() => {
    setEpoch((e) => e + 1)
  }, [])

  return { status, output, error, run, retry }
}
