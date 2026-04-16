import { describe, expect, it } from 'vitest'
import { parseRuleLineRanges, parseRuleFullRanges } from './parseRuleLineRanges'

// prettier-ignore
const THREE_RULE_JSON = `[
  {
    "name": "force_card_high_value",
    "scope": "all",
    "antecedent": { "logic": "all", "conditions": [{ "field": "amount", "operator": ">=", "value": 500 }] },
    "consequent": { "action": "override", "value": "card" }
  },
  {
    "name": "ban_paypal_de",
    "scope": "de_shop",
    "antecedent": { "logic": "all", "conditions": [{ "field": "currency", "operator": "==", "value": "EUR" }] },
    "consequent": { "action": "ban", "value": "paypal" }
  },
  {
    "name": "adjust_klarna",
    "scope": "all",
    "antecedent": { "logic": "any", "conditions": [{ "field": "amount", "operator": ">", "value": 100 }] },
    "consequent": { "action": "adjust", "value": "klarna", "scaling_factor": 1.5 }
  }
]`

describe('parseRuleLineRanges', () => {
  it('returns the correct start line for each rule in a 3-rule array', () => {
    const ranges = parseRuleLineRanges(THREE_RULE_JSON)
    expect(ranges.size).toBe(3)
    // Line 2: opening { of first rule
    expect(ranges.get('force_card_high_value')).toBe(2)
    // Line 8: opening { of second rule
    expect(ranges.get('ban_paypal_de')).toBe(8)
    // Line 14: opening { of third rule
    expect(ranges.get('adjust_klarna')).toBe(14)
  })

  it('returns an empty map for invalid JSON', () => {
    expect(parseRuleLineRanges('not valid json')).toEqual(new Map())
  })

  it('returns an empty map when JSON is not an array', () => {
    const single = JSON.stringify({
      name: 'single_rule',
      scope: 'all',
      antecedent: { logic: 'all', conditions: [] },
      consequent: { action: 'ban', value: 'paypal' },
    })
    expect(parseRuleLineRanges(single)).toEqual(new Map())
  })

  it('returns an empty map for an empty array', () => {
    expect(parseRuleLineRanges('[]')).toEqual(new Map())
  })

  it('handles a rule with a name containing escaped quotes', () => {
    const json = `[
  {
    "name": "rule_with_\\"quotes\\"",
    "scope": "all",
    "antecedent": { "logic": "all", "conditions": [] },
    "consequent": { "action": "ban", "value": "paypal" }
  }
]`
    const ranges = parseRuleLineRanges(json)
    expect(ranges.size).toBe(1)
    expect(ranges.get('rule_with_"quotes"')).toBe(2)
  })

  it('handles rules with deeply nested conditions', () => {
    const json = `[
  {
    "name": "deep_rule",
    "scope": ["shop_a", "shop_b"],
    "antecedent": {
      "logic": "all",
      "conditions": [
        { "field": "amount", "operator": "between", "value": [100, 500] }
      ]
    },
    "consequent": { "action": "adjust", "value": "card", "scaling_factor": 0.8 },
    "break": true
  }
]`
    const ranges = parseRuleLineRanges(json)
    expect(ranges.get('deep_rule')).toBe(2)
  })
})

describe('parseRuleFullRanges', () => {
  it('returns correct start and end lines for a 3-rule array', () => {
    const ranges = parseRuleFullRanges(THREE_RULE_JSON)
    expect(ranges.size).toBe(3)

    const first = ranges.get('force_card_high_value')
    expect(first?.start).toBe(2)
    expect(first?.end).toBe(7)

    const second = ranges.get('ban_paypal_de')
    expect(second?.start).toBe(8)
    expect(second?.end).toBe(13)

    const third = ranges.get('adjust_klarna')
    expect(third?.start).toBe(14)
    expect(third?.end).toBe(19)
  })

  it('returns an empty map for invalid JSON', () => {
    expect(parseRuleFullRanges('not valid json')).toEqual(new Map())
  })

  it('returns an empty map when JSON is not an array', () => {
    const single = JSON.stringify({
      name: 'single_rule',
      scope: 'all',
      antecedent: { logic: 'all', conditions: [] },
      consequent: { action: 'ban', value: 'paypal' },
    })
    expect(parseRuleFullRanges(single)).toEqual(new Map())
  })

  it('returns an empty map for an empty array', () => {
    expect(parseRuleFullRanges('[]')).toEqual(new Map())
  })

  it('end line is always >= start line', () => {
    const ranges = parseRuleFullRanges(THREE_RULE_JSON)
    for (const { start, end } of ranges.values()) {
      expect(end).toBeGreaterThanOrEqual(start)
    }
  })
})
