/**
 * RuleEditor
 *
 * Monaco-based JSON editor for heuristic rules.
 *
 * TODO (Issue #2): Wire up @monaco-editor/react.
 *   - Register JSON schema for the rules format (antecedent/consequent structure).
 *   - Enable format-on-save (Ctrl+Shift+F).
 *   - Expose getRuleLineRanges(): Map<string, number> for rule name → start line.
 *   - Add decoration support for highlighting applied rules (Issue #7).
 */

import type { FC } from 'react'

interface RuleEditorProps {
  value: string
  onChange: (value: string) => void
}

const RuleEditor: FC<RuleEditorProps> = ({ value, onChange }) => {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center border-b border-gray-200 bg-gray-50 px-3 py-2">
        <span className="text-sm font-medium text-gray-600">Rules JSON</span>
      </div>
      {/* TODO (Issue #2): replace with <Editor> from @monaco-editor/react */}
      <textarea
        className="flex-1 resize-none bg-gray-900 p-3 font-mono text-sm text-gray-100 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="Paste your rules JSON here..."
      />
    </div>
  )
}

export default RuleEditor
