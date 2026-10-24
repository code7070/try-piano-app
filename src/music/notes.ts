// MIDI note numbers for the 88-key piano range.
export const LOWEST_MIDI = 21 // A0
export const HIGHEST_MIDI = 108 // C8

const PITCH_CLASSES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const

export function isBlackKey(midi: number): boolean {
  return PITCH_CLASSES[midi % 12].length > 1
}

export function noteName(midi: number): string {
  return `${PITCH_CLASSES[midi % 12]}${Math.floor(midi / 12) - 1}`
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12)
}

export const WHITE_KEYS: readonly number[] = Array.from(
  { length: HIGHEST_MIDI - LOWEST_MIDI + 1 },
  (_, i) => LOWEST_MIDI + i,
).filter((midi) => !isBlackKey(midi))

/**
 * Picks the visible slice of the piano so the laptop-mapped keys stay centred.
 * Returns the first and last visible white keys.
 */
export function visibleRange(
  whiteCount: number,
  octaveShift: number,
): { first: number; last: number } {
  const count = Math.min(Math.max(whiteCount, 7), WHITE_KEYS.length)
  const c3 = WHITE_KEYS.indexOf(48 + octaveShift * 12)
  // C3–E5 spans 17 white keys; narrow screens centre on the right-hand octave.
  const centre = count >= 17 ? c3 + 8 : c3 + 10
  const start = Math.min(
    Math.max(Math.round(centre - (count - 1) / 2), 0),
    WHITE_KEYS.length - count,
  )
  return { first: WHITE_KEYS[start], last: WHITE_KEYS[start + count - 1] }
}
