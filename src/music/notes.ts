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
  // C3–G5 spans 19 white keys; narrow screens centre on the right-hand octave.
  const centre = count >= 19 ? c3 + 9 : c3 + 10
  const start = Math.min(
    Math.max(Math.round(centre - (count - 1) / 2), 0),
    WHITE_KEYS.length - count,
  )
  return { first: WHITE_KEYS[start], last: WHITE_KEYS[start + count - 1] }
}

/** Horizontal position of a key, in percent of the keyboard's width. */
export interface KeyBox {
  left: number
  width: number
  black: boolean
}

/**
 * Key boxes for `first`–`last`: white keys share the width equally and black
 * keys sit centred on the gap between their neighbours. The keyboard and the
 * falling notes both use this so the notes land on their keys.
 */
export function keyLayout(first: number, last: number): Map<number, KeyBox> {
  const midis = Array.from({ length: last - first + 1 }, (_, i) => first + i)
  const whiteWidth = 100 / midis.filter((midi) => !isBlackKey(midi)).length
  const blackWidth = whiteWidth * 0.6
  const layout = new Map<number, KeyBox>()
  let whitesBefore = 0
  for (const midi of midis) {
    const black = isBlackKey(midi)
    layout.set(
      midi,
      black
        ? {
            left: whitesBefore * whiteWidth - blackWidth / 2,
            width: blackWidth,
            black,
          }
        : { left: whitesBefore * whiteWidth, width: whiteWidth, black },
    )
    if (!black) whitesBefore++
  }
  return layout
}

// Not angka degree of each pitch class with do = C; sharps carry a "#".
const DEGREES = [
  '1',
  '1#',
  '2',
  '2#',
  '3',
  '4',
  '4#',
  '5',
  '5#',
  '6',
  '6#',
  '7',
]

/**
 * Not angka for `midi` with do = C. `octave` counts the dots: 0 for C4–B4,
 * positive (dots above) higher, negative (dots below) lower.
 */
export function notAngka(midi: number): { degree: string; octave: number } {
  return { degree: DEGREES[midi % 12], octave: Math.floor(midi / 12) - 5 }
}
