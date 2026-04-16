/**
 * OutputPanel
 *
 * Displays the result of a simulation run.
 *
 * TODO (Issue #6): Implement full output display.
 *   - Sorted labels with probability bars (percentage + visual bar).
 *   - Applied rules list in execution order.
 *   - Empty state when no rules fired.
 *   - Error state that surfaces the Python traceback.
 */

import type { FC } from 'react'
import type { SimulationOutput } from '../../types'
import type { WorkerStatus } from '../../hooks/usePyodideWorker'

interface OutputPanelProps {
  status: WorkerStatus
  output: SimulationOutput | null
  error: string | null
}

const OutputPanel: FC<OutputPanelProps> = ({ status, output, error }) => {
  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Loading Python runtime…
      </div>
    )
  }

  if (status === 'running') {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Running simulation…
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3">
        <p className="text-xs font-medium text-red-600">Error</p>
        <pre className="mt-1 rounded bg-red-50 p-2 text-xs text-red-700 whitespace-pre-wrap">{error}</pre>
      </div>
    )
  }

  if (!output) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        Run a simulation to see results.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* TODO (Issue #6): render probability bars */}
      <section>
        <p className="mb-1 text-xs font-medium text-gray-600">Labels</p>
        <ol className="space-y-1">
          {output.labels.map((label, i) => (
            <li key={label} className="flex items-center gap-2 text-sm">
              <span className="w-4 text-right text-gray-400">{i + 1}.</span>
              <span className="font-mono">{label}</span>
              {output.probs && (
                <span className="text-gray-500">
                  {(output.probs[i]! * 100).toFixed(1)}%
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <p className="mb-1 text-xs font-medium text-gray-600">Applied Rules</p>
        {output.appliedRules.length === 0 ? (
          <p className="text-sm text-gray-400">No rules fired.</p>
        ) : (
          <ol className="space-y-1">
            {output.appliedRules.map((name, i) => (
              <li key={i} className="font-mono text-sm text-indigo-700">
                {name}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

export default OutputPanel
