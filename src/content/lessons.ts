import type { Finger, Hand, Lesson, Song, SongNote } from '../lesson/types.ts'

// Interim TypeScript content until the JSON + zod pipeline (PRD 6.1) lands.

type Step = [midi: number, durBeat: number, finger?: Finger]

const C3 = 48
const D3 = 50
const E3 = 52
const C4 = 60
const D4 = 62
const E4 = 64
const F4 = 65
const G4 = 67
const A4 = 69
const B4 = 71
const C5 = 72

export function sequence(steps: Step[], hand?: Hand): SongNote[] {
  let beat = 0
  return steps.map(([midi, durBeat, finger]) => {
    const note: SongNote = {
      midi,
      startBeat: beat,
      durBeat,
      hand: hand ?? (midi < C4 ? 'L' : 'R'),
      finger,
    }
    beat += durBeat
    return note
  })
}

export function song(
  meta: Omit<Song, 'notes' | 'measures' | 'timeSig'>,
  notes: SongNote[],
): Song {
  const last = notes[notes.length - 1]
  return {
    ...meta,
    timeSig: [4, 4],
    notes,
    measures: Math.ceil((last.startBeat + last.durBeat) / 4),
  }
}

/** A find-note quiz: one key per beat, played back slowly in the demo. */
function quiz(id: string, title: string, midis: number[]): Song {
  return song(
    { id, title, source: 'Latihan orisinal', license: 'original', tempo: 60 },
    sequence(midis.map((midi) => [midi, 1])),
  )
}

export const LESSONS: Lesson[] = [
  {
    id: 'l0-find-c',
    level: 0,
    order: 1,
    title: 'Temukan C',
    concept: {
      text: 'Tuts hitam berkelompok dua dan tiga. Nada C selalu ada tepat di kiri grup dua tuts hitam. Angka di belakang huruf menunjukkan oktaf: C4 adalah C tengah.',
    },
    kind: 'find-note',
    hands: 'both',
    song: quiz('quiz-c', 'Temukan C', [C4, C3, C5, C4, C3, C5, C4, C5]),
  },
  {
    id: 'l0-cde',
    level: 0,
    order: 2,
    title: 'C, D, E',
    concept: {
      text: 'Di sekitar grup dua tuts hitam ada tiga tuts putih: C di kiri, D di tengah, dan E di kanan.',
    },
    kind: 'find-note',
    hands: 'both',
    song: quiz('quiz-cde', 'C, D, E', [C4, D4, E4, D4, E4, C4, D3, E3]),
  },
  {
    id: 'l0-fgab',
    level: 0,
    order: 3,
    title: 'F, G, A, B',
    concept: {
      text: 'Di sekitar grup tiga tuts hitam ada empat tuts putih: F, G, A, dan B. Setelah B, urutannya kembali ke C.',
    },
    kind: 'find-note',
    hands: 'R',
    song: quiz('quiz-fgab', 'F, G, A, B', [
      F4,
      G4,
      A4,
      B4,
      G4,
      F4,
      B4,
      A4,
      C5,
      B4,
      A4,
      G4,
    ]),
  },
  {
    id: 'l1-mary',
    level: 1,
    order: 1,
    title: 'Mary Had a Little Lamb (kanan)',
    concept: {
      text: 'Letakkan tangan kanan di posisi C: jempol (jari 1) di C tengah, telunjuk (2) di D, jari tengah (3) di E, dan kelingking (5) di G.',
    },
    kind: 'song',
    hands: 'R',
    song: song(
      {
        id: 'mary',
        title: 'Mary Had a Little Lamb',
        source: 'Melodi tradisional Amerika, abad ke-19',
        license: 'public-domain',
        tempo: 90,
      },
      sequence(
        [
          [E4, 1, 3],
          [D4, 1, 2],
          [C4, 1, 1],
          [D4, 1, 2],
          [E4, 1, 3],
          [E4, 1, 3],
          [E4, 2, 3],
          [D4, 1, 2],
          [D4, 1, 2],
          [D4, 2, 2],
          [E4, 1, 3],
          [G4, 1, 5],
          [G4, 2, 5],
          [E4, 1, 3],
          [D4, 1, 2],
          [C4, 1, 1],
          [D4, 1, 2],
          [E4, 1, 3],
          [E4, 1, 3],
          [E4, 1, 3],
          [E4, 1, 3],
          [D4, 1, 2],
          [D4, 1, 2],
          [E4, 1, 3],
          [D4, 1, 2],
          [C4, 4, 1],
        ],
        'R',
      ),
    ),
  },
  {
    id: 'l1-ode',
    level: 1,
    order: 2,
    title: 'Ode to Joy (kanan)',
    concept: {
      text: 'Masih di posisi C, sekarang memakai kelima jari: jari 4 di F dan kelingking (5) di G.',
    },
    kind: 'song',
    hands: 'R',
    song: song(
      {
        id: 'ode-to-joy',
        title: 'Ode to Joy (tema)',
        composer: 'Ludwig van Beethoven',
        source: 'Simfoni No. 9, tema bagian IV (1824), aransemen sederhana',
        license: 'public-domain',
        tempo: 100,
      },
      sequence(
        [
          [E4, 1, 3],
          [E4, 1, 3],
          [F4, 1, 4],
          [G4, 1, 5],
          [G4, 1, 5],
          [F4, 1, 4],
          [E4, 1, 3],
          [D4, 1, 2],
          [C4, 1, 1],
          [C4, 1, 1],
          [D4, 1, 2],
          [E4, 1, 3],
          [E4, 1.5, 3],
          [D4, 0.5, 2],
          [D4, 2, 2],
          [E4, 1, 3],
          [E4, 1, 3],
          [F4, 1, 4],
          [G4, 1, 5],
          [G4, 1, 5],
          [F4, 1, 4],
          [E4, 1, 3],
          [D4, 1, 2],
          [C4, 1, 1],
          [C4, 1, 1],
          [D4, 1, 2],
          [E4, 1, 3],
          [D4, 1.5, 2],
          [C4, 0.5, 1],
          [C4, 2, 1],
        ],
        'R',
      ),
    ),
  },
]

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id)
}
