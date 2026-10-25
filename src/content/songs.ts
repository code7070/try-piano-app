import type { Song } from '../lesson/types.ts'
import { LESSONS, sequence, song } from './lessons.ts'

type Phrase = [midi: number, durBeat: number][]

const B3 = 59
const C4 = 60
const D4 = 62
const E4 = 64
const F4 = 65
const G4 = 67
const A4 = 69
const B4 = 71
const C5 = 72

// Melody from the common not angka with do = C (1 = C4). Each line is one
// phrase of two 4/4 bars; the rhythm is simplified to plain beats.
const KARTINI_VERSE: Phrase = [
  [C4, 1],
  [D4, 1],
  [E4, 1],
  [F4, 1],
  [G4, 2],
  [E4, 1],
  [C4, 1],
  [A4, 1],
  [C5, 1],
  [B4, 1],
  [A4, 1],
  [G4, 4],
  [F4, 1],
  [A4, 1],
  [G4, 1],
  [F4, 1],
  [E4, 2],
  [C4, 2],
  [D4, 1],
  [F4, 1],
  [E4, 1],
  [D4, 1],
  [C4, 4],
]

const KARTINI_CALL: Phrase = [
  [F4, 0.5],
  [E4, 0.5],
  [F4, 1],
  [A4, 1],
  [G4, 1],
  [A4, 1],
  [G4, 1],
  [E4, 1],
  [C4, 1],
]

const KARTINI_CHORUS: Phrase = [
  ...KARTINI_CALL,
  [E4, 1],
  [D4, 1],
  [E4, 1],
  [F4, 1],
  [G4, 1],
  [E4, 1],
  [C4, 2],
  ...KARTINI_CALL,
  [E4, 1],
  [D4, 1],
  [F4, 1],
  [B3, 1],
  [D4, 1],
  [C4, 3],
]

export const IBU_KITA_KARTINI: Song = song(
  {
    id: 'ibu-kita-kartini',
    title: 'Ibu Kita Kartini',
    composer: 'W.R. Supratman',
    // Supratman died in 1938, so the song is public domain in Indonesia
    // (life + 70 years).
    source: 'W.R. Supratman (1929), dari not angka umum, ritme disederhanakan',
    license: 'public-domain',
    tempo: 100,
  },
  sequence([...KARTINI_VERSE, ...KARTINI_VERSE, ...KARTINI_CHORUS], 'R'),
)

/** Songs playable in the falling-notes game, newest favourite first. */
export const GAME_SONGS: Song[] = [
  IBU_KITA_KARTINI,
  ...LESSONS.filter((lesson) => lesson.kind === 'song').map(
    (lesson) => lesson.song,
  ),
]
