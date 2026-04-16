/** Split a comma-separated string into trimmed, non-empty strings. */
export function parseLabels(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Split a comma-separated string into floats; non-parseable entries become NaN. */
export function parseProbs(raw: string): number[] {
  if (!raw.trim()) return []
  return raw.split(',').map((s) => parseFloat(s.trim()))
}

/** Returns true if all probs (ignoring NaN) sum to 1 within ±0.01 tolerance, or if empty. */
export function isProbsSumValid(probs: number[]): boolean {
  const valid = probs.filter((p) => !isNaN(p))
  if (valid.length === 0) return true
  const sum = valid.reduce((a, b) => a + b, 0)
  return Math.abs(sum - 1) <= 0.01
}

/** Serialise labels array back to a comma-separated string for display. */
export function formatLabels(labels: string[]): string {
  return labels.join(', ')
}

/** Serialise probs array back to a comma-separated string for display. */
export function formatProbs(probs: number[]): string {
  return probs.join(', ')
}
