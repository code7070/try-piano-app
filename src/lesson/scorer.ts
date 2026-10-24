import { measureOf } from './types.ts'
import type { Song } from './types.ts'
import type { WrongPress } from './waitMatcher.ts'

export interface Problem {
  measure: number
  midi: number
  count: number
}

export interface AttemptSummary {
  accuracy: number // 0..1
  problems: Problem[] // worst first, at most 3
}

/**
 * Accuracy is expected notes over expected notes plus wrong presses, so every
 * wrong press costs the same however long the passage is.
 */
export function summarize(
  result: { expected: number; wrongs: WrongPress[] },
  song: Song,
): AttemptSummary {
  const { expected, wrongs } = result
  const accuracy = expected === 0 ? 1 : expected / (expected + wrongs.length)

  const byKey = new Map<string, Problem>()
  for (const wrong of wrongs) {
    const target = wrong.expected[0]
    const measure = measureOf(target.startBeat, song)
    const key = `${measure}:${target.midi}`
    const problem = byKey.get(key) ?? { measure, midi: target.midi, count: 0 }
    problem.count++
    byKey.set(key, problem)
  }
  const problems = [...byKey.values()]
    .sort((a, b) => b.count - a.count || a.measure - b.measure)
    .slice(0, 3)

  return { accuracy, problems }
}
