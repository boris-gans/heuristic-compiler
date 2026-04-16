/**
 * OutputPanel
 *
 * Displays the result of a simulation run.
 * Handles five states: loading, running, empty, error, and result.
 */

import type { FC } from 'react'
import type { SimulationOutput } from '../../types'
import type { WorkerStatus } from '../../hooks/usePyodideWorker'

interface OutputPanelProps {
  status: WorkerStatus
  output: SimulationOutput | null
  error: string | null
  onRuleClick?: (ruleName: string) => void
}

function Spinner() {
  return (
    <svg
      className="mr-2 h-4 w-4 animate-spin text-gray-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

const OutputPanel: FC<OutputPanelProps> = ({ status, output, error, onRuleClick }) => {
  if (status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        <Spinner />
        Loading Python runtime…
      </div>
    )
  }

  if (status === 'running') {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-400">
        <Spinner />
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
      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-400">
        Adjust inputs and click Run Simulation
      </div>
    )
  }

  const appliedRulesSet = new Set(output.appliedRules)

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Labels section */}
      <section>
        <p className="mb-2 text-xs font-medium text-gray-600">Labels</p>
        {output.probs ? (
          <ol className="space-y-2">
            {output.labels.map((label, i) => {
              const pct = (output.probs![i]! * 100).toFixed(1)
              const highlight = appliedRulesSet.has(label)
              return (
                <li
                  key={label}
                  className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${highlight ? 'bg-indigo-50' : ''}`}
                >
                  <span className="w-4 shrink-0 text-right text-xs text-gray-400">{i + 1}</span>
                  <span className="w-24 shrink-0 truncate font-mono text-gray-800">{label}</span>
                  <span className="w-12 shrink-0 text-right text-xs text-gray-500">{pct}%</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-gray-100" style={{ height: '6px' }}>
                    <div
                      className={`h-full rounded-full ${highlight ? 'bg-indigo-500' : 'bg-gray-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              )
            })}
          </ol>
        ) : (
          <ol className="space-y-1">
            {output.labels.map((label, i) => (
              <li key={label} className="flex items-center gap-2 text-sm">
                <span className="w-4 shrink-0 text-right text-xs text-gray-400">{i + 1}</span>
                <span className="font-mono text-gray-800">{label}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* Applied Rules section */}
      <section>
        <p className="mb-2 text-xs font-medium text-gray-600">Applied Rules</p>
        {output.appliedRules.length === 0 ? (
          <p className="text-sm text-gray-400">No rules fired for the given inputs.</p>
        ) : (
          <ol className="space-y-1">
            {output.appliedRules.map((name, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-4 shrink-0 text-right text-xs text-gray-400">{i + 1}</span>
                <button
                  type="button"
                  onClick={() => onRuleClick?.(name)}
                  className="font-mono text-indigo-700 hover:underline focus:outline-none focus-visible:underline"
                >
                  {name}
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

export default OutputPanel
