import { describe, expect, it } from 'vitest'
import {
  isBlackKey,
  keyLayout,
  midiToFrequency,
  notAngka,
  noteName,
  visibleRange,
} from './notes.ts'

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
  it('shows exactly the laptop-mapped keys when 19 white keys fit', () => {
    expect(visibleRange(19, 0)).toEqual({ first: 48, last: 79 })
  })

  it('centres on the right-hand octave on narrow screens', () => {
    expect(visibleRange(7, 0)).toEqual({ first: 60, last: 71 })
  })

  it('follows the octave shift', () => {
    expect(visibleRange(19, 1)).toEqual({ first: 60, last: 91 })
  })

  it('clamps to the piano edges', () => {
    expect(visibleRange(52, 0)).toEqual({ first: 21, last: 108 })
    expect(visibleRange(19, -2).first).toBe(24)
  })
})

describe('keyLayout', () => {
  it('splits the width between white keys and centres black keys on gaps', () => {
    const layout = keyLayout(60, 64)
    expect(layout.get(60)).toEqual({ left: 0, width: 100 / 3, black: false })
    expect(layout.get(64)?.left).toBeCloseTo(200 / 3)
    const black = layout.get(61)!
    expect(black.black).toBe(true)
    expect(black.left + black.width / 2).toBeCloseTo(100 / 3)
  })
})

describe('notAngka', () => {
  it('numbers the C major scale from middle C', () => {
    expect([60, 62, 64, 65, 67, 69, 71].map((m) => notAngka(m).degree)).toEqual(
      ['1', '2', '3', '4', '5', '6', '7'],
    )
    expect(notAngka(61)).toEqual({ degree: '1#', octave: 0 })
  })

  it('counts octave dots relative to C4–B4', () => {
    expect(notAngka(72)).toEqual({ degree: '1', octave: 1 })
    expect(notAngka(59)).toEqual({ degree: '7', octave: -1 })
  })
})
