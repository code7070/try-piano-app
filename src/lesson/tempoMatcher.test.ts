import { describe, expect, it } from 'vitest'
import { starsFor, TempoMatcher } from './tempoMatcher.ts'
import type { SongNote } from './types.ts'

const C4 = 60
const D4 = 62
const E4 = 64

function notes(...midis: number[]): SongNote[] {
  return midis.map((midi, i) => ({
    midi,
    startBeat: i,
    durBeat: 1,
    hand: 'R',
  }))
}

// 120 BPM: one beat every 500 ms.
const MS_PER_BEAT = 500

describe('TempoMatcher', () => {
  it('times notes from the first one', () => {
    const matcher = new TempoMatcher(
      notes(C4, D4).map((note) => ({ ...note, startBeat: note.startBeat + 4 })),
      MS_PER_BEAT,
    )
    expect(matcher.notes.map((note) => note.timeMs)).toEqual([0, 500])
    expect(matcher.endMs).toBe(1000)
  })

  it('judges presses by how far from the beat they land', () => {
    const matcher = new TempoMatcher(notes(C4, D4, E4), MS_PER_BEAT)
    expect(matcher.press(C4, 30)).toEqual({ kind: 'perfect', index: 0 })
    expect(matcher.press(D4, 500 - 120)).toEqual({ kind: 'good', index: 1 })
    expect(matcher.press(E4, 1000 + 200).kind).toBe('extra')
  })

  it('counts a wrong key as extra and breaks the combo', () => {
    const matcher = new TempoMatcher(notes(C4, D4), MS_PER_BEAT)
    matcher.press(C4, 0)
    expect(matcher.stats().combo).toBe(1)
    expect(matcher.press(E4, 500).kind).toBe('extra')
    expect(matcher.stats()).toMatchObject({ combo: 0, maxCombo: 1, extra: 1 })
  })

  it('takes repeated notes one at a time', () => {
    const matcher = new TempoMatcher(notes(E4, E4, E4), MS_PER_BEAT)
    expect(matcher.press(E4, 0)).toEqual({ kind: 'perfect', index: 0 })
    expect(matcher.press(E4, 10).kind).toBe('extra')
    expect(matcher.press(E4, 490)).toEqual({ kind: 'perfect', index: 1 })
  })

  it('misses notes once their window has passed', () => {
    const matcher = new TempoMatcher(notes(C4, D4, E4), MS_PER_BEAT)
    expect(matcher.sweep(150)).toEqual([])
    matcher.press(D4, 500)
    expect(matcher.sweep(1200)).toEqual([0, 2])
    expect(matcher.judgements).toEqual(['miss', 'perfect', 'miss'])
    expect(matcher.nextOpen()).toBe(-1)
    // A missed note can no longer be hit late.
    expect(matcher.press(E4, 1150).kind).toBe('extra')
  })

  it('points at the earliest note still to play', () => {
    const matcher = new TempoMatcher(notes(C4, D4), MS_PER_BEAT)
    expect(matcher.nextOpen()).toBe(0)
    matcher.press(C4, 0)
    expect(matcher.nextOpen()).toBe(1)
  })

  it('weighs "kurang tepat" half and every extra press as a note', () => {
    const matcher = new TempoMatcher(notes(C4, D4, E4), MS_PER_BEAT)
    matcher.press(C4, 0)
    matcher.press(D4, 600)
    matcher.press(C4, 700)
    matcher.sweep(2000)
    const stats = matcher.stats()
    expect(stats).toMatchObject({ perfect: 1, good: 1, miss: 1, extra: 1 })
    expect(stats.accuracy).toBeCloseTo(1.5 / 4)
  })

  it('gives stars by accuracy', () => {
    expect(starsFor(1)).toBe(3)
    expect(starsFor(0.85)).toBe(2)
    expect(starsFor(0.6)).toBe(1)
    expect(starsFor(0.3)).toBe(0)
  })
})
