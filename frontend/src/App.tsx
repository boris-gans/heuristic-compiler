import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import RuleEditor from './components/RuleEditor'
import type { RuleEditorHandle } from './components/RuleEditor'
import FeatureControls from './components/FeatureControls'
import OutputPanel from './components/OutputPanel'
import { usePyodideWorker } from './hooks/usePyodideWorker'
import type { SimulationInput } from './types'

const SPLIT_KEY = 'heuristic-split-ratio'
const DEFAULT_SPLIT = 0.5
const MIN_SPLIT = 0.2
const MAX_SPLIT = 0.8

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
      "value": "creditcard"
    }
  }
]`

const DEFAULT_INPUT: SimulationInput = {
  rulesJson: DEFAULT_RULES,
  features: { shop: '' },
  labels: ['paypal', 'creditcard', 'klarna'],
  probs: [0.5, 0.3, 0.2],
  probabilitiesNeeded: true,
}

function readSplitRatio(): number {
  try {
    const saved = localStorage.getItem(SPLIT_KEY)
    const parsed = saved ? parseFloat(saved) : NaN
    return isNaN(parsed) ? DEFAULT_SPLIT : Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, parsed))
  } catch {
    return DEFAULT_SPLIT
  }
}

function writeSplitRatio(ratio: number): void {
  try {
    localStorage.setItem(SPLIT_KEY, String(ratio))
  } catch {
    // localStorage unavailable; ignore
  }
}

export default function App() {
  const [input, setInput] = useState<SimulationInput>(DEFAULT_INPUT)
  const { status, output, error, run, retry, isInitError } = usePyodideWorker()
  const ruleEditorRef = useRef<RuleEditorHandle>(null)

  // Split ratio state, persisted in localStorage
  const [splitRatio, setSplitRatio] = useState<number>(readSplitRatio)

  // Editor visibility toggle (for very small viewports)
  const [showEditor, setShowEditor] = useState(false)

  // Responsive breakpoints
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isStacked = viewportWidth < 900
  const isVerySmall = viewportWidth < 600
  const editorVisible = isVerySmall ? showEditor : true

  // Drag-to-resize refs
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const clamped = Math.min(MAX_SPLIT, Math.max(MIN_SPLIT, ratio))
    setSplitRatio(clamped)
    writeSplitRatio(clamped)
  }

  const handlePointerUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }

  const handleRunClick = () => {
    run({ ...input, rulesJson: input.rulesJson })
  }

  const handleRuleClick = useCallback((ruleName: string) => {
    const lineRanges = ruleEditorRef.current?.getRuleLineRanges()
    const line = lineRanges?.get(ruleName)
    if (line !== undefined) {
      ruleEditorRef.current?.revealLine(line)
    }
  }, [])

  const isJsonValid = useMemo(() => {
    try {
      JSON.parse(input.rulesJson)
      return true
    } catch {
      return false
    }
  }, [input.rulesJson])

  // Block run when labels are non-empty but probs count doesn't match.
  // Empty labels is allowed (case f): the engine can build them from scratch.
  const hasLengthMismatch =
    input.probabilitiesNeeded &&
    input.labels.length > 0 &&
    input.probs.length !== input.labels.length

  const isRunDisabled =
    status === 'loading' || status === 'running' || !isJsonValid || hasLengthMismatch

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-base font-semibold text-gray-800">Heuristic Compiler</h1>
        <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
          {status}
        </span>
        <span className="text-xs text-gray-400">Heuristic Rule Simulator</span>
        {isVerySmall && (
          <button
            type="button"
            onClick={() => setShowEditor((v) => !v)}
            className="ml-auto shrink-0 rounded border border-indigo-200 px-2 py-0.5 text-xs text-indigo-600 hover:bg-indigo-50"
          >
            {showEditor ? 'Hide Editor' : 'Show Editor'}
          </button>
        )}
      </header>

      {/* Two-panel body */}
      <div
        ref={containerRef}
        className={`flex min-h-0 flex-1 ${isStacked ? 'flex-col' : 'flex-row'}`}
      >
        {/* Left panel — Rule Editor */}
        {editorVisible && (
          <div
            className={`flex min-h-0 flex-col ${
              isStacked ? 'flex-1 border-b border-gray-200' : 'border-r border-gray-200'
            }`}
            style={isStacked ? undefined : { width: `${splitRatio * 100}%` }}
          >
            <RuleEditor
              ref={ruleEditorRef}
              value={input.rulesJson}
              onChange={(rulesJson) => setInput((prev) => ({ ...prev, rulesJson }))}
              appliedRules={output?.appliedRules}
            />
            {!isJsonValid && (
              <div className="shrink-0 border-t border-red-200 bg-red-50 px-3 py-2">
                <span className="text-xs text-red-600">
                  Invalid JSON — fix errors before running.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Drag handle — horizontal layout only */}
        {!isStacked && (
          <div
            className="group relative z-10 shrink-0 cursor-col-resize select-none transition-colors hover:bg-indigo-200 active:bg-indigo-300"
            style={{ width: '6px' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            aria-hidden="true"
          >
            {/* Grab dots indicator */}
            <div className="pointer-events-none absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="h-1 w-1 rounded-full bg-indigo-500" />
              <div className="h-1 w-1 rounded-full bg-indigo-500" />
              <div className="h-1 w-1 rounded-full bg-indigo-500" />
            </div>
          </div>
        )}

        {/* Right panel — Controls + Output */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Pyodide init-failure banner */}
          {isInitError && (
            <div className="shrink-0 flex items-center gap-2 border-b border-red-200 bg-red-50 px-3 py-2">
              <span className="flex-1 text-xs text-red-700">
                Could not load the Python runtime.
              </span>
              <button
                type="button"
                onClick={retry}
                className="rounded border border-red-300 bg-white px-2 py-0.5 text-xs text-red-700 hover:bg-red-50"
              >
                Retry
              </button>
            </div>
          )}

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

          {/* Run button — fixed height, no shrink */}
          <div className="shrink-0 border-b border-gray-200 px-3 py-2">
            <button
              onClick={handleRunClick}
              disabled={isRunDisabled}
              className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'running' ? 'Running…' : 'Execute'}
            </button>
            {hasLengthMismatch && (
              <p className="mt-1.5 text-xs text-red-600">
                Labels and probabilities must have the same number of entries.
              </p>
            )}
          </div>

          {/* Output panel (scrollable) */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
            <div className="shrink-0 border-b border-gray-200 bg-gray-50 px-3 py-2">
              <span className="text-sm font-medium text-gray-600">Output</span>
            </div>
            <OutputPanel
              status={status}
              output={output}
              error={isInitError ? null : error}
              onRuleClick={handleRuleClick}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
