import type { TempoStats } from './tempoMatcher.ts'

// Best game runs per song and tempo, in localStorage like the mentor progress.
const STORAGE_KEY = 'piano.game.v1'

export interface BestScore {
  accuracy: number // 0..1
  maxCombo: number
}

export interface BestScores {
  version: 1
  /** Keyed by `bestKey(songId, tempo)`. */
  best: Record<string, BestScore>
}

export function emptyScores(): BestScores {
  return { version: 1, best: {} }
}

export function bestKey(songId: string, tempo: number): string {
  return `${songId}@${Math.round(tempo * 100)}`
}

function isBestScore(value: unknown): value is BestScore {
  if (typeof value !== 'object' || value === null) return false
  const { accuracy, maxCombo } = value as Record<string, unknown>
  return (
    typeof accuracy === 'number' &&
    accuracy >= 0 &&
    accuracy <= 1 &&
    Number.isInteger(maxCombo) &&
    (maxCombo as number) >= 0
  )
}

/** Parses stored scores; anything unreadable starts fresh instead of crashing. */
export function parseScores(raw: string | null): BestScores {
  if (!raw) return emptyScores()
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return emptyScores()
  }
  if (typeof data !== 'object' || data === null) return emptyScores()
  const { version, best } = data as Record<string, unknown>
  if (version !== 1 || typeof best !== 'object' || best === null)
    return emptyScores()

  const scores = emptyScores()
  for (const [key, score] of Object.entries(best)) {
    if (isBestScore(score)) scores.best[key] = score
  }
  return scores
}

/** Higher accuracy wins; a longer combo breaks a tie. */
export function beats(run: BestScore, best: BestScore | undefined): boolean {
  if (!best) return true
  return (
    run.accuracy > best.accuracy ||
    (run.accuracy === best.accuracy && run.maxCombo > best.maxCombo)
  )
}

/** Adds a finished run, keeping it only when it beats the stored best. */
export function recordRun(
  scores: BestScores,
  key: string,
  stats: TempoStats,
): { scores: BestScores; previous?: BestScore; isBest: boolean } {
  const previous = scores.best[key]
  const run = { accuracy: stats.accuracy, maxCombo: stats.maxCombo }
  if (!beats(run, previous)) return { scores, previous, isBest: false }
  return {
    scores: { ...scores, best: { ...scores.best, [key]: run } },
    previous,
    isBest: true,
  }
}

export function loadScores(): BestScores {
  try {
    return parseScores(localStorage.getItem(STORAGE_KEY))
  } catch {
    return emptyScores()
  }
}

/** Returns false when storage is unavailable; scores then live in memory. */
export function saveScores(scores: BestScores): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
    return true
  } catch {
    return false
  }
}
