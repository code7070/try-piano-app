import { describe, expect, it } from 'vitest'
import { notAngka } from '../music/notes.ts'
import { GAME_SONGS, IBU_KITA_KARTINI } from './songs.ts'

function angka(midi: number): string {
  const { degree, octave } = notAngka(midi)
  return degree + (octave > 0 ? "'" : octave < 0 ? ',' : '')
}

describe('game songs', () => {
  it('has unique ids', () => {
    const ids = GAME_SONGS.map((song) => song.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(GAME_SONGS)('$id stays in the laptop range C3–E5', (song) => {
    for (const note of song.notes) {
      expect(note.midi).toBeGreaterThanOrEqual(48)
      expect(note.midi).toBeLessThanOrEqual(76)
    }
  })

  it.each(GAME_SONGS)('$id fills whole 4/4 bars', (song) => {
    const last = song.notes[song.notes.length - 1]
    expect((last.startBeat + last.durBeat) % 4).toBe(0)
    expect(song.license).toBe('public-domain')
  })
})

describe('Ibu Kita Kartini', () => {
  const lines = (from: number, count: number) =>
    IBU_KITA_KARTINI.notes
      .slice(from, from + count)
      .map((note) => angka(note.midi))
      .join(' ')

  it('follows the not angka of the verse and the chorus', () => {
    expect(lines(0, 7)).toBe('1 2 3 4 5 3 1')
    expect(lines(7, 5)).toBe("6 1' 7 6 5")
    expect(lines(12, 6)).toBe('4 6 5 4 3 1')
    expect(lines(18, 5)).toBe('2 4 3 2 1')
    expect(lines(46, 9)).toBe('4 3 4 6 5 6 5 3 1')
    expect(lines(55, 7)).toBe('3 2 3 4 5 3 1')
    expect(lines(71, 6)).toBe('3 2 4 7, 2 1')
  })

  it('plays the verse twice before the chorus', () => {
    expect(lines(23, 23)).toBe(lines(0, 23))
    expect(IBU_KITA_KARTINI.measures).toBe(24)
  })
})
