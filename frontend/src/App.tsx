import { useState } from 'react'
import RuleEditor from './components/RuleEditor'
import FeatureControls from './components/FeatureControls'
import OutputPanel from './components/OutputPanel'
import { usePyodideWorker } from './hooks/usePyodideWorker'
import type { SimulationInput } from './types'

const DEFAULT_RULES = `[
  {
    "name": "example_rule",
    "scope": "all",
    "antecedent": {
      "logic": "all",
      "conditions": [
        { "field": "amount", "operator": ">=", "value": 500 }
      ]
    },
    "consequent": {
      "action": "override",
      "value": "card"
    }
  }
]`

const DEFAULT_INPUT: SimulationInput = {
  rulesJson: DEFAULT_RULES,
  features: { shop: '' },
  labels: ['paypal', 'card', 'klarna'],
  probs: [0.5, 0.3, 0.2],
  probabilitiesNeeded: true,
}

export default function App() {
  const [input, setInput] = useState<SimulationInput>(DEFAULT_INPUT)
  const { status, output, error, run } = usePyodideWorker()

  const handleRunClick = () => {
    run({ ...input, rulesJson: input.rulesJson })
  }

  const isRunDisabled = status === 'loading' || status === 'running'

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <header className="flex items-center border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-base font-semibold text-gray-800">Heuristic Compiler</h1>
        <span className="ml-2 rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
          {status}
        </span>
      </header>

      {/* Two-panel body */}
      <div className="flex min-h-0 flex-1">
        {/* Left panel — Rule Editor */}
        {/* TODO (Issue #8): add drag-to-resize handle between panels */}
        <div className="flex w-1/2 flex-col border-r border-gray-200">
          <RuleEditor
            value={input.rulesJson}
            onChange={(rulesJson) => setInput((prev) => ({ ...prev, rulesJson }))}
          />
        </div>

        {/* Right panel — Controls + Output */}
        <div className="flex w-1/2 flex-col">
          {/* Feature controls (scrollable) */}
          <div className="flex-1 overflow-y-auto border-b border-gray-200">
            <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
              <span className="text-sm font-medium text-gray-600">Features</span>
            </div>
            <FeatureControls
              rulesJson={input.rulesJson}
              input={input}
              onChange={setInput}
            />
          </div>

          {/* Run button */}
          <div className="border-b border-gray-200 px-3 py-2">
            <button
              onClick={handleRunClick}
              disabled={isRunDisabled}
              className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'running' ? 'Running…' : 'Run Simulation'}
            </button>
          </div>

          {/* Output panel (scrollable) */}
          <div className="flex-1 overflow-y-auto">
            <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
              <span className="text-sm font-medium text-gray-600">Output</span>
            </div>
            <OutputPanel status={status} output={output} error={error} />
          </div>
        </div>
      </div>
    </div>
  )
}
