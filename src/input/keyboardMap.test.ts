import { describe, expect, it } from 'vitest'
import { codeToMidi, handFor, keyLabels, mappedRange } from './keyboardMap.ts'

describe('keyboardMap', () => {
  it('lets the bottom row play a full scale from C3 up to C4 and beyond', () => {
    const bottomRow = ['KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM']
    expect(bottomRow.map((code) => codeToMidi(code, 0))).toEqual([
      48, 50, 52, 53, 55, 57, 59,
    ])
    expect(codeToMidi('Comma', 0)).toBe(60)
    expect(codeToMidi('Period', 0)).toBe(62)
    expect(codeToMidi('Slash', 0)).toBe(64)
    expect(codeToMidi('KeyS', 0)).toBe(49)
    expect(codeToMidi('KeyL', 0)).toBe(61)
    expect(codeToMidi('Semicolon', 0)).toBe(63)
  })

  it('maps the top rows to the right hand from C4 to G5', () => {
    expect(codeToMidi('KeyQ', 0)).toBe(60)
    expect(codeToMidi('KeyI', 0)).toBe(72)
    expect(codeToMidi('Digit2', 0)).toBe(61)
    expect(codeToMidi('KeyP', 0)).toBe(76)
    expect(codeToMidi('BracketLeft', 0)).toBe(77)
    expect(codeToMidi('Equal', 0)).toBe(78)
    expect(codeToMidi('BracketRight', 0)).toBe(79)
  })

  it('shifts by whole octaves', () => {
    expect(codeToMidi('KeyQ', 1)).toBe(72)
    expect(codeToMidi('KeyZ', -2)).toBe(24)
    expect(mappedRange(0)).toEqual([48, 79])
    expect(mappedRange(1)).toEqual([60, 91])
  })

  it('ignores unmapped keys', () => {
    expect(codeToMidi('KeyA', 0)).toBeNull()
    expect(codeToMidi('Space', 0)).toBeNull()
  })

  it('labels every laptop key for a note, top row first', () => {
    expect(keyLabels(60, 0)).toEqual(['Q', ','])
    expect(keyLabels(61, 0)).toEqual(['2', 'L'])
    expect(keyLabels(59, 0)).toEqual(['M'])
    expect(keyLabels(79, 0)).toEqual([']'])
    expect(keyLabels(72, 1)).toEqual(['Q', ','])
    expect(keyLabels(47, 0)).toEqual([])
  })

  it('assigns hands for mapped notes only', () => {
    expect(handFor(59, 0)).toBe('L')
    expect(handFor(60, 0)).toBe('R')
    expect(handFor(80, 0)).toBeNull()
  })
})
