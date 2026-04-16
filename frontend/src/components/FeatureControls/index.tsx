/**
 * FeatureControls
 *
 * Dynamic form whose fields are derived from the rules JSON currently in the editor.
 *
 * TODO (Issue #3): Implement extractFeatures(rulesJson) to derive FeatureMeta[].
 * TODO (Issue #4): Render proper input types per FeatureMeta.inputType.
 *   - Numeric fields → <input type="number">
 *   - Text fields → <input type="text">
 *   - Always include: shop (text), probabilities_needed (toggle), labels, probs.
 */

import type { FC } from 'react'
import type { SimulationInput } from '../../types'

interface FeatureControlsProps {
  rulesJson: string
  input: SimulationInput
  onChange: (updated: SimulationInput) => void
}

const FeatureControls: FC<FeatureControlsProps> = ({ input, onChange }) => {
  return (
    <div className="flex flex-col gap-3 p-3">
      <p className="text-xs text-gray-400 italic">
        {/* TODO (Issue #3): replace with dynamically extracted feature fields */}
        Feature controls will appear here once extracted from the rules JSON.
      </p>

      {/* Shop is always present — scope matching depends on it */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">shop</label>
        <input
          type="text"
          className="rounded border border-gray-300 px-2 py-1 text-sm"
          value={(input.features['shop'] as string) ?? ''}
          onChange={(e) =>
            onChange({ ...input, features: { ...input.features, shop: e.target.value } })
          }
          placeholder="e.g. myshop.com"
        />
      </div>

      {/* probabilities_needed toggle */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={input.probabilitiesNeeded}
          onChange={(e) => onChange({ ...input, probabilitiesNeeded: e.target.checked })}
        />
        <span className="text-gray-700">probabilities_needed</span>
      </label>
    </div>
  )
}

export default FeatureControls
