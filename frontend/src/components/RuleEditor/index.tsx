/**
 * RuleEditor
 *
 * Monaco-based JSON editor for heuristic rules.
 * Registers a JSON schema validator for the rules format, provides a
 * Ctrl+Shift+F / Cmd+Shift+F format shortcut, and exposes
 * getRuleLineRanges() via an imperative ref for Issue #7 (rule highlighting).
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { parseRuleLineRanges, parseRuleFullRanges } from './parseRuleLineRanges'

// JSON Schema for the heuristic rules format.
// Registered once per editor mount via monaco.languages.json.jsonDefaults.
const RULES_SCHEMA = {
  uri: 'monaco://schemas/heuristic-rules',
  fileMatch: ['**'],
  schema: {
    type: 'array',
    items: {
      type: 'object',
      required: ['name', 'scope', 'antecedent', 'consequent'],
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
          description: 'Unique rule identifier.',
        },
        scope: {
          description:
            'Shop scope. Use "all" for all shops, a string for substring match, or an array for multiple shops.',
          oneOf: [
            { type: 'string' },
            { type: 'array', items: { type: 'string' } },
          ],
        },
        antecedent: {
          type: 'object',
          required: ['conditions'],
          additionalProperties: false,
          properties: {
            logic: {
              type: 'string',
              enum: ['all', 'any'],
              description: '"all" = AND logic, "any" = OR logic. Defaults to "all" when omitted.',
            },
            conditions: {
              type: 'array',
              items: {
                type: 'object',
                required: ['field', 'operator', 'value'],
                properties: {
                  field: {
                    type: 'string',
                    description: 'Feature field name.',
                  },
                  operator: {
                    type: 'string',
                    enum: [
                      '==',
                      '!=',
                      '>',
                      '>=',
                      '<',
                      '<=',
                      'contains',
                      'not contains',
                      'in',
                      'not in',
                      'between',
                      'regex',
                    ],
                  },
                  value: {
                    description:
                      'Comparison value. Can be a scalar, array, or field reference like "{other_field}".',
                  },
                },
              },
            },
          },
        },
        consequent: {
          type: 'array',
          items: {
            type: 'object',
            required: ['action', 'value'],
            additionalProperties: false,
            properties: {
              action: {
                type: 'string',
                enum: ['override', 'adjust', 'ban', 'append'],
                description: 'Action to apply when the rule fires.',
              },
              value: {
                description: 'Target label or list of labels.',
              },
              scaling_factor: {
                type: 'number',
                description: 'Probability multiplier. Required for "adjust" action.',
              },
            },
          },
        },
        break: {
          type: 'boolean',
          description:
            'When true, stops evaluating further rules in the same operator bucket after this rule fires.',
        },
      },
    },
  },
}

export interface RuleEditorHandle {
  /** Returns a map of rule name → 1-indexed start line for each rule in the array. */
  getRuleLineRanges: () => Map<string, number>
  /** Scrolls the editor to center the given 1-indexed line. */
  revealLine: (line: number) => void
}

interface RuleEditorProps {
  value: string
  onChange: (value: string) => void
  /** Rule names to highlight after a simulation run. Pass an empty array to clear. */
  appliedRules?: string[]
  /** Called after decorations have been applied or cleared. */
  onDecorationsReady?: () => void
}

const RuleEditor = forwardRef<RuleEditorHandle, RuleEditorProps>(
  ({ value, onChange, appliedRules, onDecorationsReady }, ref) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
    const decorationCollectionRef = useRef<editor.IEditorDecorationsCollection | null>(null)
    const [editorReady, setEditorReady] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)
    const [importError, setImportError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    // Stable ref so we don't need onDecorationsReady in effect deps
    const onDecorationsReadyRef = useRef(onDecorationsReady)
    useEffect(() => {
      onDecorationsReadyRef.current = onDecorationsReady
    })

    const loadJsonFile = useCallback(
      (file: File) => {
        if (!file.name.endsWith('.json') && file.type !== 'application/json') {
          setImportError('Only .json files are supported.')
          return
        }
        const reader = new FileReader()
        reader.onload = (e) => {
          const text = e.target?.result
          if (typeof text !== 'string') return
          try {
            JSON.parse(text) // validate before loading
            onChange(text)
            setImportError(null)
          } catch {
            setImportError('Invalid JSON — file could not be parsed.')
          }
        }
        reader.readAsText(file)
      },
      [onChange],
    )

    const handleImportClick = () => {
      fileInputRef.current?.click()
    }

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) loadJsonFile(file)
      // Reset so the same file can be re-imported if needed
      e.target.value = ''
    }

    const handleExport = () => {
      try {
        const parsed = JSON.parse(value)
        const pretty = JSON.stringify(parsed, null, 2)
        const blob = new Blob([pretty], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'rules.json'
        a.click()
        URL.revokeObjectURL(url)
      } catch {
        // value is invalid JSON — shouldn't be reachable (Run is gated), but guard anyway
      }
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      // Only clear when the pointer actually leaves the container
      if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
      setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) loadJsonFile(file)
    }

    const handleEditorMount = useCallback(
      (
        editorInstance: editor.IStandaloneCodeEditor,
        monacoInstance: typeof import('monaco-editor'),
      ) => {
        editorRef.current = editorInstance
        setEditorReady(true)

        // Register JSON schema for the rules format
        monacoInstance.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: true,
          schemas: [RULES_SCHEMA],
        })

        // Ctrl+Shift+F / Cmd+Shift+F — format document
        editorInstance.addCommand(
          monacoInstance.KeyMod.CtrlCmd |
            monacoInstance.KeyMod.Shift |
            monacoInstance.KeyCode.KeyF,
          () => {
            editorInstance.getAction('editor.action.formatDocument')?.run()
          },
        )
      },
      [],
    )

    // Apply / clear decorations whenever appliedRules changes or the editor becomes ready
    useEffect(() => {
      const editorInstance = editorRef.current
      if (!editorInstance || !editorReady) return

      const model = editorInstance.getModel()
      if (!model) return

      // Clear previous decorations
      decorationCollectionRef.current?.clear()
      decorationCollectionRef.current = null

      if (!appliedRules || appliedRules.length === 0) {
        onDecorationsReadyRef.current?.()
        return
      }

      const ranges = parseRuleFullRanges(model.getValue())
      const newDecorations: editor.IModelDeltaDecoration[] = []
      let firstLine: number | null = null

      for (const name of appliedRules) {
        const range = ranges.get(name)
        if (range) {
          if (firstLine === null) firstLine = range.start
          newDecorations.push({
            range: {
              startLineNumber: range.start,
              startColumn: 1,
              endLineNumber: range.end,
              endColumn: model.getLineMaxColumn(range.end),
            },
            options: {
              isWholeLine: true,
              className: 'highlight-applied-rule',
            },
          })
        }
      }

      if (newDecorations.length > 0) {
        decorationCollectionRef.current =
          editorInstance.createDecorationsCollection(newDecorations)
        if (firstLine !== null) {
          editorInstance.revealLineInCenter(firstLine)
        }
      }

      onDecorationsReadyRef.current?.()
    }, [appliedRules, editorReady])

    useImperativeHandle(ref, () => ({
      getRuleLineRanges(): Map<string, number> {
        const editorInstance = editorRef.current
        if (!editorInstance) return new Map()
        const model = editorInstance.getModel()
        if (!model) return new Map()
        return parseRuleLineRanges(model.getValue())
      },
      revealLine(line: number): void {
        editorRef.current?.revealLineInCenter(line)
      },
    }))

    return (
      <div className="flex h-full flex-col">
        {/* Header row */}
        <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-3 py-2">
          <span className="text-sm font-medium text-gray-600">Rules JSON</span>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleImportClick}
              className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
            >
              Import
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
            >
              Export
            </button>
          </div>
        </div>

        {/* Hidden file input — JSON only */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Import error banner */}
        {importError && (
          <div className="flex shrink-0 items-center justify-between border-b border-red-200 bg-red-50 px-3 py-1.5">
            <span className="text-xs text-red-600">{importError}</span>
            <button
              type="button"
              onClick={() => setImportError(null)}
              className="ml-2 text-xs text-red-400 hover:text-red-600"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Editor + drag-drop overlay */}
        <div
          className="relative min-h-0 flex-1"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Editor
            height="100%"
            language="json"
            theme="vs-dark"
            value={value}
            onChange={(val) => onChange(val ?? '')}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              tabSize: 2,
            }}
          />

          {/* Drag-over overlay */}
          {isDragOver && (
            <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-indigo-900/80">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-indigo-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span className="text-sm font-medium text-indigo-200">Drop JSON file to import</span>
            </div>
          )}
        </div>
      </div>
    )
  },
)

RuleEditor.displayName = 'RuleEditor'

export default RuleEditor
