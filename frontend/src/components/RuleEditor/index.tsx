/**
 * RuleEditor
 *
 * Monaco-based JSON editor for heuristic rules.
 * Registers a JSON schema validator for the rules format, provides a
 * Ctrl+Shift+F / Cmd+Shift+F format shortcut, and exposes
 * getRuleLineRanges() via an imperative ref for Issue #7 (rule highlighting).
 */

import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { parseRuleLineRanges } from './parseRuleLineRanges'

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
          required: ['logic', 'conditions'],
          additionalProperties: false,
          properties: {
            logic: {
              type: 'string',
              enum: ['all', 'any'],
              description: '"all" = AND logic, "any" = OR logic.',
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
}

interface RuleEditorProps {
  value: string
  onChange: (value: string) => void
}

const RuleEditor = forwardRef<RuleEditorHandle, RuleEditorProps>(
  ({ value, onChange }, ref) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

    const handleEditorMount = useCallback(
      (
        editorInstance: editor.IStandaloneCodeEditor,
        monacoInstance: typeof import('monaco-editor'),
      ) => {
        editorRef.current = editorInstance

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

    useImperativeHandle(ref, () => ({
      getRuleLineRanges(): Map<string, number> {
        const editorInstance = editorRef.current
        if (!editorInstance) return new Map()
        const model = editorInstance.getModel()
        if (!model) return new Map()
        return parseRuleLineRanges(model.getValue())
      },
    }))

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center border-b border-gray-200 bg-gray-50 px-3 py-2">
          <span className="text-sm font-medium text-gray-600">Rules JSON</span>
        </div>
        <div className="min-h-0 flex-1">
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
        </div>
      </div>
    )
  },
)

RuleEditor.displayName = 'RuleEditor'

export default RuleEditor
