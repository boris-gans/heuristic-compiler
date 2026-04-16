import { describe, it, expect } from 'vitest'
import { extractFeatures } from './extractFeatures'

const rule = (conditions: { field: string; operator: string; value: unknown }[]) => ({
  antecedent: { conditions },
  consequent: { action: 'override', value: 'card' },
})

describe('extractFeatures', () => {
  it('returns [] for empty string', () => {
    expect(extractFeatures('')).toEqual([])
  })

  it('returns [] for whitespace-only string', () => {
    expect(extractFeatures('   ')).toEqual([])
  })

  it('returns [] for invalid JSON', () => {
    expect(extractFeatures('{not valid json')).toEqual([])
  })

  it('returns [] for non-array JSON', () => {
    expect(extractFeatures('{"key": "value"}')).toEqual([])
  })

  it('returns [] for empty rules array', () => {
    expect(extractFeatures('[]')).toEqual([])
  })

  it('handles a single numeric condition', () => {
    const rules = [rule([{ field: 'amount', operator: '>=', value: 500 }])]
    const result = extractFeatures(JSON.stringify(rules))
    expect(result).toEqual([{ name: 'amount', inputType: 'number', operators: ['>='] }])
  })

  it('handles a single text condition', () => {
    const rules = [rule([{ field: 'currency', operator: '==', value: 'EUR' }])]
    const result = extractFeatures(JSON.stringify(rules))
    expect(result).toEqual([{ name: 'currency', inputType: 'text', operators: ['=='] }])
  })

  it('infers number type for all numeric operators', () => {
    for (const op of ['>', '>=', '<', '<=', 'between']) {
      const rules = [rule([{ field: 'amount', operator: op, value: 100 }])]
      const result = extractFeatures(JSON.stringify(rules))
      expect(result[0].inputType).toBe('number')
    }
  })

  it('number wins over text when field has mixed operators', () => {
    const rules = [
      rule([
        { field: 'amount', operator: '==', value: 500 },
        { field: 'amount', operator: '>=', value: 100 },
      ]),
    ]
    const result = extractFeatures(JSON.stringify(rules))
    expect(result).toHaveLength(1)
    expect(result[0].inputType).toBe('number')
    expect(result[0].operators).toContain('==')
    expect(result[0].operators).toContain('>=')
  })

  it('merges operators for the same field across multiple rules', () => {
    const rules = [
      rule([{ field: 'amount', operator: '>=', value: 100 }]),
      rule([{ field: 'amount', operator: '<=', value: 1000 }]),
    ]
    const result = extractFeatures(JSON.stringify(rules))
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('amount')
    expect(result[0].operators).toContain('>=')
    expect(result[0].operators).toContain('<=')
  })

  it('deduplicates operators for the same field', () => {
    const rules = [
      rule([{ field: 'amount', operator: '>=', value: 100 }]),
      rule([{ field: 'amount', operator: '>=', value: 200 }]),
    ]
    const result = extractFeatures(JSON.stringify(rules))
    expect(result[0].operators).toEqual(['>='])
  })

  it('returns fields in first-appearance order', () => {
    const rules = [
      rule([
        { field: 'amount', operator: '>=', value: 100 },
        { field: 'currency', operator: '==', value: 'EUR' },
      ]),
      rule([{ field: 'country', operator: '==', value: 'DE' }]),
    ]
    const result = extractFeatures(JSON.stringify(rules))
    expect(result.map((f) => f.name)).toEqual(['amount', 'currency', 'country'])
  })

  it('handles mixed numeric and text conditions across fields', () => {
    const rules = [
      rule([
        { field: 'amount', operator: '>=', value: 500 },
        { field: 'currency', operator: '==', value: 'EUR' },
      ]),
    ]
    const result = extractFeatures(JSON.stringify(rules))
    expect(result).toEqual([
      { name: 'amount', inputType: 'number', operators: ['>='] },
      { name: 'currency', inputType: 'text', operators: ['=='] },
    ])
  })

  it('skips rules with no antecedent or conditions', () => {
    const rules = [
      { consequent: { action: 'override', value: 'card' } },
      rule([{ field: 'amount', operator: '>=', value: 100 }]),
    ]
    const result = extractFeatures(JSON.stringify(rules))
    expect(result).toEqual([{ name: 'amount', inputType: 'number', operators: ['>='] }])
  })
})
