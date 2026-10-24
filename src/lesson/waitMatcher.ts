import type { SongNote } from './types.ts'

// Chord notes count as played together when pressed within this window.
const CHORD_WINDOW_MS = 300

export interface WrongPress {
  group: number
  expected: SongNote[]
  actual: number
}

export type PressResult = 'hit' | 'advance' | 'done' | 'wrong' | 'ignored'

/** Notes starting on the same beat form one chord to press together. */
export function groupByBeat(notes: SongNote[]): SongNote[][] {
  const byBeat = new Map<number, SongNote[]>()
  for (const note of notes) {
    byBeat.set(note.startBeat, [...(byBeat.get(note.startBeat) ?? []), note])
  }
  return [...byBeat.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, group]) => group)
}

/**
 * Wait mode (PRD FR-102): the song stops at every note or chord until all of
 * its notes are pressed. Wrong notes are recorded and never move it forward.
 */
export class WaitMatcher {
  readonly groups: SongNote[][]
  private index = 0
  private readonly hits = new Map<number, number>()
  private readonly wrongs: WrongPress[] = []
  private wrongsHere = 0

  constructor(notes: SongNote[]) {
    this.groups = groupByBeat(notes)
  }

  get position(): number {
    return this.index
  }

  get current(): SongNote[] | null {
    return this.groups[this.index] ?? null
  }

  /** Wrong presses on the note or chord currently waited for. */
  get wrongsOnCurrent(): number {
    return this.wrongsHere
  }

  get done(): boolean {
    return this.index >= this.groups.length
  }

  press(midi: number, timeMs: number): PressResult {
    const group = this.current
    if (!group) return 'ignored'
    if (!group.some((note) => note.midi === midi)) {
      this.wrongs.push({ group: this.index, expected: group, actual: midi })
      this.wrongsHere++
      return 'wrong'
    }

    this.hits.set(midi, timeMs)
    for (const [held, at] of this.hits) {
      if (timeMs - at > CHORD_WINDOW_MS) this.hits.delete(held)
    }
    if (!group.every((note) => this.hits.has(note.midi))) return 'hit'

    this.index++
    this.hits.clear()
    this.wrongsHere = 0
    return this.done ? 'done' : 'advance'
  }

  result(): { expected: number; wrongs: WrongPress[] } {
    return { expected: this.groups.length, wrongs: [...this.wrongs] }
  }
}
