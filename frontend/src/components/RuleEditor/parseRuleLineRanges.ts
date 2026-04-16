/**
 * Parses a JSON rules array text and returns a map of rule name -> start line number.
 * Line numbers are 1-indexed (matching Monaco's convention).
 *
 * The parser tracks bracket depth to locate top-level rule objects, then pairs
 * each object with the parsed rule name at the same array index.
 */
export function parseRuleLineRanges(text: string): Map<string, number> {
  const map = new Map<string, number>()

  let rules: unknown[]
  try {
    rules = JSON.parse(text)
  } catch {
    return map
  }

  if (!Array.isArray(rules)) return map

  const lines = text.split('\n')
  let depth = 0
  let ruleStartLine = -1
  let ruleIndex = 0
  let inString = false
  let escape = false

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx]
    for (let charIdx = 0; charIdx < line.length; charIdx++) {
      const ch = line[charIdx]

      if (escape) {
        escape = false
        continue
      }

      if (inString) {
        if (ch === '\\') {
          escape = true
        } else if (ch === '"') {
          inString = false
        }
        continue
      }

      if (ch === '"') {
        inString = true
        continue
      }

      if (ch === '[' || ch === '{') {
        depth++
        // depth 2 + opening brace = start of a top-level rule object in the array
        if (depth === 2 && ch === '{') {
          ruleStartLine = lineIdx + 1 // 1-indexed
        }
      } else if (ch === ']' || ch === '}') {
        // depth 2 + closing brace = end of a top-level rule object
        if (depth === 2 && ch === '}' && ruleStartLine !== -1) {
          const rule = rules[ruleIndex]
          if (
            rule !== null &&
            typeof rule === 'object' &&
            'name' in rule &&
            typeof (rule as Record<string, unknown>).name === 'string'
          ) {
            map.set(
              (rule as Record<string, unknown>).name as string,
              ruleStartLine,
            )
          }
          ruleIndex++
          ruleStartLine = -1
        }
        depth--
      }
    }
  }

  return map
}
