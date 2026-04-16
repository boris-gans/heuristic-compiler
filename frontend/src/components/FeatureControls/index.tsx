import { useState } from 'react'
import type { FC } from 'react'
import type { SimulationInput } from '../../types'
import { extractFeatures } from '../../utils/extractFeatures'
import { parseLabels, parseProbs, isProbsSumValid, formatLabels, formatProbs } from './helpers'

interface FeatureControlsProps {
  rulesJson: string
  input: SimulationInput
  onChange: (updated: SimulationInput) => void
}

const FeatureControls: FC<FeatureControlsProps> = ({ rulesJson, input, onChange }) => {
  const allFeatures = extractFeatures(rulesJson)
  // shop is a fixed input — exclude it from the dynamic list to avoid duplication
  const dynamicFeatures = allFeatures.filter((f) => f.name !== 'shop')

  // Track raw string values for number inputs so the field stays responsive while
  // the user is mid-edit (e.g. typing "1e2") without corrupting parent state.
  const [rawNumbers, setRawNumbers] = useState<Record<string, string>>({})

  // Keep raw strings for labels and probs so the input doesn't reformat on every keystroke.
  const [rawLabels, setRawLabels] = useState<string>(() => formatLabels(input.labels))
  const [rawProbs, setRawProbs] = useState<string>(() => formatProbs(input.probs))

  const getRawNumber = (name: string): string => {
    if (name in rawNumbers) return rawNumbers[name]
    const val = input.features[name]
    return typeof val === 'number' ? String(val) : ''
  }

  const handleNumberChange = (name: string, raw: string) => {
    setRawNumbers((prev) => ({ ...prev, [name]: raw }))
    const parsed = parseFloat(raw)
    if (!isNaN(parsed)) {
      onChange({ ...input, features: { ...input.features, [name]: parsed } })
    }
  }

  const parsedProbsFromRaw = parseProbs(rawProbs).filter((p) => !isNaN(p))
  const probsInvalid = parsedProbsFromRaw.length > 0 && !isProbsSumValid(parsedProbsFromRaw)

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* shop — always first; required for scope matching */}
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
        {(input.features['shop'] as string) === '' && (
          <span className="text-xs text-amber-600">
            &#9888; Rules with scope will be skipped.
          </span>
        )}
      </div>

      {/* Dynamic feature inputs derived from the rules JSON */}
      {dynamicFeatures.length === 0 ? (
        <p className="text-xs italic text-gray-400">
          No feature conditions found in the rules JSON. Add conditions with a &ldquo;field&rdquo;
          key to see inputs here automatically.
        </p>
      ) : (
        dynamicFeatures.map(({ name, inputType }) => {
          if (inputType === 'number') {
            const raw = getRawNumber(name)
            const hasError = raw !== '' && isNaN(parseFloat(raw))
            return (
              <div key={name} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">{name}</label>
                <input
                  type="number"
                  step="any"
                  className={`rounded border px-2 py-1 text-sm ${
                    hasError ? 'border-red-400' : 'border-gray-300'
                  }`}
                  value={raw}
                  onChange={(e) => handleNumberChange(name, e.target.value)}
                />
                {hasError && (
                  <span className="text-xs text-red-500">Must be a valid number</span>
                )}
              </div>
            )
          }

          return (
            <div key={name} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">{name}</label>
              <input
                type="text"
                className="rounded border border-gray-300 px-2 py-1 text-sm"
                value={(input.features[name] as string) ?? ''}
                onChange={(e) =>
                  onChange({ ...input, features: { ...input.features, [name]: e.target.value } })
                }
              />
            </div>
          )
        })
      )}

      {/* probabilities_needed toggle */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={input.probabilitiesNeeded}
          onChange={(e) => onChange({ ...input, probabilitiesNeeded: e.target.checked })}
        />
        <span className="text-gray-700">probabilities_needed</span>
      </label>

      {/* labels and probs — only visible when probabilitiesNeeded is true */}
      {input.probabilitiesNeeded && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">labels</label>
            <input
              type="text"
              className="rounded border border-gray-300 px-2 py-1 text-sm"
              value={rawLabels}
              onChange={(e) => {
                setRawLabels(e.target.value)
                onChange({ ...input, labels: parseLabels(e.target.value) })
              }}
              placeholder="paypal, card, klarna"
            />
            {input.labels.length === 0 && (
              <span className="text-xs text-blue-600">
                &#9432; No labels provided — heuristic rules may add labels from scratch via override.
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">probs</label>
            <input
              type="text"
              className={`rounded border px-2 py-1 text-sm ${
                probsInvalid ? 'border-orange-400' : 'border-gray-300'
              }`}
              value={rawProbs}
              onChange={(e) => {
                setRawProbs(e.target.value)
                const parsed = parseProbs(e.target.value).filter((p) => !isNaN(p))
                onChange({ ...input, probs: parsed })
              }}
              placeholder="0.5, 0.3, 0.2"
            />
            {probsInvalid && (
              <span className="text-xs text-orange-500">
                &#9888; Probabilities should sum to 1 (current:{' '}
                {parsedProbsFromRaw.reduce((a, b) => a + b, 0).toFixed(2)})
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default FeatureControls
