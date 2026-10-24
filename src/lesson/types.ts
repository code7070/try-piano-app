export type Hand = 'L' | 'R'
export type Finger = 1 | 2 | 3 | 4 | 5

export interface SongNote {
  midi: number
  startBeat: number
  durBeat: number
  hand: Hand
  finger?: Finger
}

export interface Song {
  id: string
  title: string
  composer?: string
  source: string
  license: 'public-domain' | 'original'
  tempo: number
  timeSig: [number, number]
  notes: SongNote[]
  measures: number
}

export interface Lesson {
  id: string
  level: 0 | 1 | 2 | 3 | 4
  order: number
  title: string
  concept: { text: string }
  kind: 'find-note' | 'song'
  song: Song
  hands: Hand | 'both'
}

/** 1-based measure a beat falls in; assumes the beat is the time signature's unit. */
export function measureOf(beat: number, song: Song): number {
  return Math.floor(beat / song.timeSig[0]) + 1
}

/** Notes whose start falls inside measures `from`–`to` (inclusive). */
export function notesInBars(song: Song, [from, to]: [number, number]) {
  return song.notes.filter((note) => {
    const measure = measureOf(note.startBeat, song)
    return measure >= from && measure <= to
  })
}
