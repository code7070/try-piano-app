import { describe, expect, it } from 'vitest'
import { summarize } from './scorer.ts'
import type { Song, SongNote } from './types.ts'
import { WaitMatcher } from './waitMatcher.ts'

const note = (midi: number, startBeat: number): SongNote => ({
  midi,
  startBeat,
  durBeat: 1,
  hand: 'R',
})

const song: Song = {
  id: 'test',
  title: 'Test',
  source: 'test',
  license: 'original',
  tempo: 60,
  timeSig: [4, 4],
  notes: [note(64, 0), note(62, 1), note(60, 4), note(64, 4), note(67, 4)],
  measures: 2,
}

describe('WaitMatcher', () => {
  it('waits for the right note and records wrong ones', () => {
    const matcher = new WaitMatcher(song.notes)
    expect(matcher.press(65, 0)).toBe('wrong')
    expect(matcher.wrongsOnCurrent).toBe(1)
    expect(matcher.position).toBe(0)
    expect(matcher.press(64, 10)).toBe('advance')
    expect(matcher.wrongsOnCurrent).toBe(0)
    expect(matcher.press(62, 20)).toBe('advance')
  })

  it('needs every chord note within the window', () => {
    const matcher = new WaitMatcher(song.notes)
    matcher.press(64, 0)
    matcher.press(62, 0)
    expect(matcher.press(60, 1000)).toBe('hit')
    expect(matcher.press(64, 1100)).toBe('hit')
    // 60 and 64 were pressed over 300 ms before 67, so they no longer count.
    expect(matcher.press(67, 1500)).toBe('hit')
    expect(matcher.press(64, 1550)).toBe('hit')
    expect(matcher.press(60, 1600)).toBe('done')
    expect(matcher.press(60, 1700)).toBe('ignored')
  })
})

describe('summarize', () => {
  it('scores accuracy and ranks problems by measure and note', () => {
    const matcher = new WaitMatcher(song.notes)
    matcher.press(65, 0)
    matcher.press(64, 0)
    matcher.press(61, 0)
    matcher.press(61, 0)
    matcher.press(62, 0)
    const summary = summarize(matcher.result(), song)
    expect(summary.accuracy).toBeCloseTo(3 / 6)
    expect(summary.problems).toEqual([
      { measure: 1, midi: 62, count: 2 },
      { measure: 1, midi: 64, count: 1 },
    ])
  })
})
