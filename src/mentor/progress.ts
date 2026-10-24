import type { MentorState } from './engine.ts'

// Interim localStorage store; moves to IndexedDB with ProgressStore (PRD 8.1).
const STORAGE_KEY = 'piano.mentor.v1'

export interface MentorProgress {
  version: 1
  lastLessonId?: string
  states: Record<string, MentorState>
}

export function emptyProgress(): MentorProgress {
  return { version: 1, states: {} }
}

function isBars(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((bar) => Number.isInteger(bar) && bar >= 1)
  )
}

function isMentorState(value: unknown): value is MentorState {
  if (typeof value !== 'object' || value === null) return false
  const state = value as Record<string, unknown>
  const counters = [
    'stage',
    'phrase',
    'adjust',
    'tries',
    'failStreak',
    'passStreak',
    'sessionFails',
  ]
  return (
    typeof state.lessonId === 'string' &&
    counters.every((key) => Number.isInteger(state[key])) &&
    (state.drillBars === null || isBars(state.drillBars)) &&
    typeof state.detour === 'boolean' &&
    typeof state.passed === 'boolean'
  )
}

/** Parses stored progress; anything unreadable starts fresh instead of crashing. */
export function parseProgress(raw: string | null): MentorProgress {
  if (!raw) return emptyProgress()
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return emptyProgress()
  }
  if (typeof data !== 'object' || data === null) return emptyProgress()
  const { version, lastLessonId, states } = data as Record<string, unknown>
  if (version !== 1 || typeof states !== 'object' || states === null)
    return emptyProgress()

  const progress = emptyProgress()
  if (typeof lastLessonId === 'string') progress.lastLessonId = lastLessonId
  for (const [id, state] of Object.entries(states)) {
    if (isMentorState(state) && state.lessonId === id)
      progress.states[id] = state
  }
  return progress
}

export function loadProgress(): MentorProgress {
  try {
    return parseProgress(localStorage.getItem(STORAGE_KEY))
  } catch {
    return emptyProgress()
  }
}

/** Returns false when storage is unavailable; progress then lives in memory. */
export function saveProgress(progress: MentorProgress): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    return true
  } catch {
    return false
  }
}
