import type { SongNote } from './types.ts'

// Timing windows from PRD FR-107: "tepat" and "kurang tepat".
export const PERFECT_MS = 80
export const GOOD_MS = 160

export type Judgement = 'perfect' | 'good' | 'miss'

export interface TimedNote extends SongNote {
  /** When the note should be pressed, in ms from the first note. */
  timeMs: number
  endMs: number
}

export type TempoPress =
  { kind: 'perfect' | 'good'; index: number } | { kind: 'extra' }

export interface TempoStats {
  perfect: number
  good: number
  miss: number
  extra: number
  combo: number
  maxCombo: number
  /** 0..1: a "kurang tepat" note counts half, every extra press costs one. */
  accuracy: number
}

/**
 * Tempo mode (PRD FR-107): the song runs on its own clock and every note is
 * judged by how far from its time it was pressed. Presses that match no note
 * inside the window count as extra.
 */
export class TempoMatcher {
  readonly notes: TimedNote[]
  readonly judgements: (Judgement | null)[]
  private firstOpen = 0
  private extra = 0
  private combo = 0
  private maxCombo = 0

  constructor(notes: SongNote[], msPerBeat: number) {
    const sorted = [...notes].sort((a, b) => a.startBeat - b.startBeat)
    const firstBeat = sorted[0]?.startBeat ?? 0
    this.notes = sorted.map((note) => ({
      ...note,
      timeMs: (note.startBeat - firstBeat) * msPerBeat,
      endMs: (note.startBeat + note.durBeat - firstBeat) * msPerBeat,
    }))
    this.judgements = this.notes.map(() => null)
  }

  /** When the last note finishes. */
  get endMs(): number {
    return this.notes.reduce((end, note) => Math.max(end, note.endMs), 0)
  }

  press(midi: number, timeMs: number): TempoPress {
    let best = -1
    for (let i = this.firstOpen; i < this.notes.length; i++) {
      const note = this.notes[i]
      if (note.timeMs - timeMs > GOOD_MS) break
      if (this.judgements[i] !== null || note.midi !== midi) continue
      const offset = Math.abs(timeMs - note.timeMs)
      if (offset > GOOD_MS) continue
      if (best < 0 || offset < Math.abs(timeMs - this.notes[best].timeMs))
        best = i
    }
    if (best < 0) {
      this.extra++
      this.combo = 0
      return { kind: 'extra' }
    }
    const kind =
      Math.abs(timeMs - this.notes[best].timeMs) <= PERFECT_MS
        ? 'perfect'
        : 'good'
    this.judgements[best] = kind
    this.combo++
    this.maxCombo = Math.max(this.maxCombo, this.combo)
    return { kind, index: best }
  }

  /** Marks notes whose window closed before `timeMs` as missed. */
  sweep(timeMs: number): number[] {
    const missed: number[] = []
    while (this.firstOpen < this.notes.length) {
      const index = this.firstOpen
      if (this.judgements[index] === null) {
        if (this.notes[index].timeMs + GOOD_MS >= timeMs) break
        this.judgements[index] = 'miss'
        missed.push(index)
        this.combo = 0
      }
      this.firstOpen++
    }
    return missed
  }

  /** Index of the earliest note still waiting to be played, or -1. */
  nextOpen(): number {
    for (let i = this.firstOpen; i < this.notes.length; i++) {
      if (this.judgements[i] === null) return i
    }
    return -1
  }

  stats(): TempoStats {
    const count = (kind: Judgement) =>
      this.judgements.filter((judgement) => judgement === kind).length
    const perfect = count('perfect')
    const good = count('good')
    const total = this.notes.length + this.extra
    return {
      perfect,
      good,
      miss: count('miss'),
      extra: this.extra,
      combo: this.combo,
      maxCombo: this.maxCombo,
      accuracy: total === 0 ? 1 : (perfect + good / 2) / total,
    }
  }
}

/** 0–3 stars for a finished run. */
export function starsFor(accuracy: number): number {
  if (accuracy >= 0.95) return 3
  if (accuracy >= 0.8) return 2
  if (accuracy >= 0.6) return 1
  return 0
}
