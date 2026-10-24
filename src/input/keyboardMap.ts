// Two-hand laptop layout, as semitone offsets from C3 (MIDI 48) before any
// octave shift. Bottom rows play the left hand, top rows the right hand.
const OFFSETS: Readonly<Record<string, number>> = {
  KeyZ: 0,
  KeyS: 1,
  KeyX: 2,
  KeyD: 3,
  KeyC: 4,
  KeyV: 5,
  KeyG: 6,
  KeyB: 7,
  KeyH: 8,
  KeyN: 9,
  KeyJ: 10,
  KeyM: 11,
  KeyQ: 12,
  Digit2: 13,
  KeyW: 14,
  Digit3: 15,
  KeyE: 16,
  KeyR: 17,
  Digit5: 18,
  KeyT: 19,
  Digit6: 20,
  KeyY: 21,
  Digit7: 22,
  KeyU: 23,
  KeyI: 24,
  Digit9: 25,
  KeyO: 26,
  Digit0: 27,
  KeyP: 28,
}

const BASE_MIDI = 48
const RIGHT_HAND_OFFSET = 12
const HIGHEST_OFFSET = 28

export const MIN_OCTAVE_SHIFT = -2
export const MAX_OCTAVE_SHIFT = 2

const LABEL_BY_OFFSET = new Map(
  Object.entries(OFFSETS).map(([code, offset]) => [
    offset,
    code.replace(/^(Key|Digit)/, ''),
  ]),
)

export function codeToMidi(code: string, octaveShift: number): number | null {
  const offset = OFFSETS[code]
  return offset === undefined ? null : BASE_MIDI + offset + octaveShift * 12
}

function offsetOf(midi: number, octaveShift: number): number | null {
  const offset = midi - BASE_MIDI - octaveShift * 12
  return offset >= 0 && offset <= HIGHEST_OFFSET ? offset : null
}

/** Laptop key that plays `midi`, e.g. "Q" for C4 with no octave shift. */
export function keyLabel(midi: number, octaveShift: number): string | null {
  const offset = offsetOf(midi, octaveShift)
  return offset === null ? null : (LABEL_BY_OFFSET.get(offset) ?? null)
}

export function handFor(midi: number, octaveShift: number): 'L' | 'R' | null {
  const offset = offsetOf(midi, octaveShift)
  if (offset === null) return null
  return offset < RIGHT_HAND_OFFSET ? 'L' : 'R'
}

export function mappedRange(octaveShift: number): [number, number] {
  const low = BASE_MIDI + octaveShift * 12
  return [low, low + HIGHEST_OFFSET]
}
