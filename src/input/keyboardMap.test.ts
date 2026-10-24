import { describe, expect, it } from 'vitest'
import { codeToMidi, handFor, keyLabel, mappedRange } from './keyboardMap.ts'

describe('keyboardMap', () => {
  it('maps the bottom row to the left hand from C3', () => {
    expect(codeToMidi('KeyZ', 0)).toBe(48)
    expect(codeToMidi('KeyS', 0)).toBe(49)
    expect(codeToMidi('KeyM', 0)).toBe(59)
  })

  it('maps the top rows to the right hand from C4', () => {
    expect(codeToMidi('KeyQ', 0)).toBe(60)
    expect(codeToMidi('Digit2', 0)).toBe(61)
    expect(codeToMidi('KeyP', 0)).toBe(76)
  })

  it('shifts by whole octaves', () => {
    expect(codeToMidi('KeyQ', 1)).toBe(72)
    expect(codeToMidi('KeyZ', -2)).toBe(24)
    expect(mappedRange(1)).toEqual([60, 88])
  })

  it('ignores unmapped keys', () => {
    expect(codeToMidi('KeyA', 0)).toBeNull()
    expect(codeToMidi('Space', 0)).toBeNull()
  })

  it('labels and assigns hands for mapped notes only', () => {
    expect(keyLabel(60, 0)).toBe('Q')
    expect(keyLabel(61, 0)).toBe('2')
    expect(keyLabel(72, 1)).toBe('Q')
    expect(keyLabel(47, 0)).toBeNull()
    expect(handFor(59, 0)).toBe('L')
    expect(handFor(60, 0)).toBe('R')
    expect(handFor(77, 0)).toBeNull()
  })
})
