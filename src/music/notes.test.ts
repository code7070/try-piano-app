import { describe, expect, it } from 'vitest'
import { isBlackKey, midiToFrequency, noteName, visibleRange } from './notes.ts'

describe('notes', () => {
  it('names notes with scientific pitch notation', () => {
    expect(noteName(60)).toBe('C4')
    expect(noteName(21)).toBe('A0')
    expect(noteName(61)).toBe('C#4')
  })

  it('knows black keys', () => {
    expect(isBlackKey(61)).toBe(true)
    expect(isBlackKey(64)).toBe(false)
  })

  it('tunes A4 to 440 Hz', () => {
    expect(midiToFrequency(69)).toBe(440)
    expect(midiToFrequency(81)).toBeCloseTo(880)
  })
})

describe('visibleRange', () => {
  it('shows exactly the laptop-mapped keys when 17 white keys fit', () => {
    expect(visibleRange(17, 0)).toEqual({ first: 48, last: 76 })
  })

  it('centres on the right-hand octave on narrow screens', () => {
    expect(visibleRange(7, 0)).toEqual({ first: 60, last: 71 })
  })

  it('follows the octave shift', () => {
    expect(visibleRange(17, 1)).toEqual({ first: 60, last: 88 })
  })

  it('clamps to the piano edges', () => {
    expect(visibleRange(52, 0)).toEqual({ first: 21, last: 108 })
    expect(visibleRange(17, -2).first).toBe(24)
  })
})
