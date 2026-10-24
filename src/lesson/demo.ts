import type { NoteSink } from '../input/NoteTracker.ts'
import type { SongNote } from './types.ts'

/**
 * Plays notes for the "listen" stage. Timer-based until the AudioContext
 * Transport (PRD 6.2) exists; a demo does not need sample-accurate timing.
 * Returns a cancel function that silences everything still sounding.
 */
export function playDemo(
  groups: SongNote[][],
  bpm: number,
  sink: NoteSink,
  onGroup: (index: number | null) => void,
): () => void {
  const timers: number[] = []
  const sounding = new Set<number>()
  const msPerBeat = 60000 / bpm
  const firstBeat = groups[0]?.[0].startBeat ?? 0
  let endMs = 0

  groups.forEach((group, index) => {
    const startMs = (group[0].startBeat - firstBeat) * msPerBeat + 400
    timers.push(
      window.setTimeout(() => {
        onGroup(index)
        for (const note of group) {
          sink.noteOn(note.midi)
          sounding.add(note.midi)
        }
      }, startMs),
    )
    for (const note of group) {
      const offMs = startMs + note.durBeat * msPerBeat * 0.9
      endMs = Math.max(endMs, offMs)
      timers.push(
        window.setTimeout(() => {
          sink.noteOff(note.midi)
          sounding.delete(note.midi)
        }, offMs),
      )
    }
  })
  timers.push(window.setTimeout(() => onGroup(null), endMs + 300))

  return () => {
    for (const timer of timers) window.clearTimeout(timer)
    for (const midi of sounding) sink.noteOff(midi)
    sounding.clear()
  }
}
