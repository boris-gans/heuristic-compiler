import type { FeatureMeta } from '../types'

const NUMERIC_OPERATORS = new Set(['>', '>=', '<', '<=', 'between'])

interface Condition {
  field: string
  operator: string
  value: unknown
}

interface Rule {
  antecedent?: {
    conditions?: Condition[]
  }
}

export function extractFeatures(rulesJson: string): FeatureMeta[] {
  if (!rulesJson.trim()) return []

  let rules: unknown
  try {
    rules = JSON.parse(rulesJson)
  } catch {
    return []
  }

  if (!Array.isArray(rules)) return []

  const order: string[] = []
  const operatorsMap = new Map<string, Set<string>>()
  const isNumericMap = new Map<string, boolean>()

  for (const rule of rules as Rule[]) {
    const conditions = rule?.antecedent?.conditions
    if (!Array.isArray(conditions)) continue

    for (const condition of conditions) {
      const { field, operator } = condition
      if (typeof field !== 'string' || typeof operator !== 'string') continue

      if (!operatorsMap.has(field)) {
        order.push(field)
        operatorsMap.set(field, new Set())
        isNumericMap.set(field, false)
      }

      operatorsMap.get(field)!.add(operator)

      if (NUMERIC_OPERATORS.has(operator)) {
        isNumericMap.set(field, true)
      }
    }
  }

  return order.map((field) => ({
    name: field,
    inputType: isNumericMap.get(field) ? 'number' : 'text',
    operators: Array.from(operatorsMap.get(field)!),
  }))
}
