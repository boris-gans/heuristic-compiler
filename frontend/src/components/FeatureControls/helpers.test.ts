import { describe, it, expect } from 'vitest'
import {
  parseLabels,
  parseProbs,
  isProbsSumValid,
  formatLabels,
  formatProbs,
} from './helpers'

describe('parseLabels', () => {
  it('splits by comma and trims whitespace', () => {
    expect(parseLabels('paypal, card, klarna')).toEqual(['paypal', 'card', 'klarna'])
  })

  it('handles no spaces', () => {
    expect(parseLabels('a,b,c')).toEqual(['a', 'b', 'c'])
  })

  it('filters out empty entries', () => {
    expect(parseLabels('paypal,,klarna')).toEqual(['paypal', 'klarna'])
  })

  it('returns [] for empty string', () => {
    expect(parseLabels('')).toEqual([])
  })

  it('returns [] for whitespace-only string', () => {
    expect(parseLabels('   ')).toEqual([])
  })

  it('trims leading and trailing whitespace from each entry', () => {
    expect(parseLabels('  paypal  ,  card  ')).toEqual(['paypal', 'card'])
  })
})

describe('parseProbs', () => {
  it('parses comma-separated floats', () => {
    expect(parseProbs('0.5, 0.3, 0.2')).toEqual([0.5, 0.3, 0.2])
  })

  it('returns NaN for non-numeric entries', () => {
    const result = parseProbs('0.5, abc, 0.2')
    expect(result[0]).toBe(0.5)
    expect(isNaN(result[1])).toBe(true)
    expect(result[2]).toBe(0.2)
  })

  it('returns [] for empty string', () => {
    expect(parseProbs('')).toEqual([])
  })

  it('returns [] for whitespace-only string', () => {
    expect(parseProbs('   ')).toEqual([])
  })

  it('handles integers', () => {
    expect(parseProbs('1, 2, 3')).toEqual([1, 2, 3])
  })
})

describe('isProbsSumValid', () => {
  it('returns true for probs that sum exactly to 1', () => {
    expect(isProbsSumValid([0.5, 0.3, 0.2])).toBe(true)
  })

  it('returns true for probs within ±0.01 tolerance', () => {
    expect(isProbsSumValid([0.34, 0.33, 0.33])).toBe(true) // sum = 1.00
    expect(isProbsSumValid([0.5, 0.3, 0.205])).toBe(true) // sum = 1.005 — within tolerance
    expect(isProbsSumValid([0.5, 0.5, 0.02])).toBe(false) // sum = 1.02 — exceeds tolerance
  })

  it('returns false for probs that do not sum to 1', () => {
    expect(isProbsSumValid([0.5, 0.3])).toBe(false) // sum = 0.8
    expect(isProbsSumValid([0.5, 0.6])).toBe(false) // sum = 1.1
  })

  it('returns true for empty array', () => {
    expect(isProbsSumValid([])).toBe(true)
  })

  it('ignores NaN entries when checking sum', () => {
    expect(isProbsSumValid([0.5, NaN, 0.5])).toBe(true)
  })

  it('returns true when all entries are NaN', () => {
    expect(isProbsSumValid([NaN, NaN])).toBe(true)
  })

  it('accepts sum within lower bound of tolerance', () => {
    expect(isProbsSumValid([0.995])).toBe(true)  // |0.995 - 1| = 0.005 ≤ 0.01
    expect(isProbsSumValid([0.98])).toBe(false)   // |0.98 - 1| = 0.02 > 0.01
  })
})

describe('formatLabels', () => {
  it('joins with comma-space separator', () => {
    expect(formatLabels(['paypal', 'card', 'klarna'])).toBe('paypal, card, klarna')
  })

  it('returns empty string for empty array', () => {
    expect(formatLabels([])).toBe('')
  })

  it('returns single label without trailing separator', () => {
    expect(formatLabels(['paypal'])).toBe('paypal')
  })
})

describe('formatProbs', () => {
  it('joins with comma-space separator', () => {
    expect(formatProbs([0.5, 0.3, 0.2])).toBe('0.5, 0.3, 0.2')
  })

  it('returns empty string for empty array', () => {
    expect(formatProbs([])).toBe('')
  })
})
