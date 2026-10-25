import type { Outcome, Step } from '../mentor/engine.ts'
import type { Phase, StageId, Support } from '../mentor/ladder.ts'
import type { AttemptSummary } from '../lesson/scorer.ts'
import type { Judgement, TempoStats } from '../lesson/tempoMatcher.ts'
import type { Lesson } from '../lesson/types.ts'
import { noteName } from '../music/notes.ts'

// Mentor copy (PRD FR-165): one instruction plus one measurable target, and
// feedback that points at a real problem without judging.

export const PHASE_NAMES: Record<Phase, string> = {
  learn: 'Belajar',
  imitate: 'Tiru',
  practice: 'Latih',
  perform: 'Praktik',
}

export const STAGE_NAMES: Record<StageId, string> = {
  concept: 'Paham',
  listen: 'Dengar',
  guided: 'Tiru dipandu',
  unguided: 'Tiru sendiri',
  drill: 'Bagian sulit',
  checkpoint: 'Uji',
  memory: 'Dari ingatan',
}

const SONG_SUPPORT: Record<Support, string> = {
  3: 'Tuts menyala lengkap dengan huruf, nomor jari, dan tombol laptop.',
  2: 'Tuts tetap menyala dengan nomor jari, tanpa huruf.',
  1: 'Tuts tidak menyala lagi, ikuti huruf di atas keyboard.',
  0: 'Hanya nada pertama yang ditampilkan. Mainkan dari ingatan.',
}

const QUIZ_SUPPORT: Record<Support, string> = {
  3: 'Tuts yang dicari menyala untuk membantu.',
  2: 'Tuts yang dicari menyala.',
  1: 'Tuts tidak menyala lagi. Cari sendiri dari nama nadanya.',
  0: 'Cari sendiri dari nama nadanya.',
}

/** Song lessons use plain letters; quizzes keep the octave so C3 ≠ C4. */
export function displayName(midi: number, lesson: Lesson): string {
  const name = noteName(midi)
  return lesson.kind === 'find-note' ? name : name.replace(/-?\d+$/, '')
}

function percent(accuracy: number): string {
  return `${Math.round(accuracy * 100)}%`
}

/** Most wrong presses that still pass: accuracy is n / (n + wrong). */
export function allowedMistakes(
  noteCount: number,
  minAccuracy: number,
): number {
  if (minAccuracy <= 0) return Infinity
  return Math.floor(noteCount / minAccuracy - noteCount + 1e-9)
}

export const CONCEPT_PROMPT = 'Baca konsepnya dulu, lalu tekan Mengerti.'
export const LISTEN_PROMPT =
  'Dengarkan dulu sambil memperhatikan tuts yang menyala dan nomor jarinya. Belum perlu ikut main.'

export function instruction(
  lesson: Lesson,
  step: Step,
  noteCount: number,
): string {
  const { stage, support, bars } = step
  if (stage.id === 'concept') return CONCEPT_PROMPT
  if (stage.id === 'listen') return LISTEN_PROMPT

  const quiz = lesson.kind === 'find-note'
  let scope = 'Mainkan seluruh lagu.'
  if (quiz) scope = 'Tekan tuts yang diminta.'
  else if (step.remedial || stage.id === 'drill')
    scope = `Latih birama ${bars[0]}–${bars[1]} saja.`
  else if (stage.phrased) scope = `Mainkan birama ${bars[0]}–${bars[1]}.`
  if (stage.id === 'checkpoint')
    scope = `Uji: ${scope.toLowerCase()} Tanpa petunjuk.`

  const help = (quiz ? QUIZ_SUPPORT : SONG_SUPPORT)[support]
  const mistakes = allowedMistakes(noteCount, stage.minAccuracy)
  let target =
    mistakes === 0
      ? 'Target: tanpa salah.'
      : `Target: paling banyak ${mistakes} kali salah.`
  if (stage.streak > 1) target += ` ${stage.streak} kali berturut-turut.`
  return `${scope} ${help} ${target}`
}

export function outcomeMessage(
  outcome: Outcome,
  summary: AttemptSummary | null,
  lesson: Lesson,
  hasMoreStages: boolean,
): string {
  const score = summary ? percent(summary.accuracy) : ''
  switch (outcome.kind) {
    case 'advance':
      if (!summary) return 'Oke, lanjut.'
      return outcome.fast
        ? `Bagus, ${score}. Lancar sekali, bantuannya kukurangi.`
        : `Bagus, akurasi ${score}.`
    case 'again':
      return `Bagus, ${score}. Sekali lagi untuk memastikan.`
    case 'retry': {
      const { problem } = outcome
      if (!problem) return `Hampir, ${score}. Coba lagi.`
      const name = displayName(problem.midi, lesson)
      return lesson.kind === 'find-note'
        ? `${name} masih sering tertukar. Coba lagi pelan-pelan.`
        : `Birama ${problem.measure}: ${name} masih sering salah. Coba lagi pelan-pelan.`
    }
    case 'drill':
      return lesson.kind === 'find-note'
        ? 'Kita latih bagian yang sering tertukar dulu, dengan bantuan lebih banyak.'
        : `Kita latih birama ${outcome.bars[0]}–${outcome.bars[1]} saja dulu, dengan bantuan lebih banyak.`
    case 'drill-done':
      return 'Bagian sulitnya sudah rapi. Kembali ke tahap tadi.'
    case 'rest':
      return 'Sudah tiga kali belum lulus. Istirahat sebentar juga bagian dari latihan. Kalau mau lanjut, tekan Mulai.'
    case 'lesson-passed':
      return hasMoreStages
        ? `Lulus Uji dengan ${score}! Pelajaran berikutnya sudah terbuka. Kalau mau, coba mainkan dari ingatan.`
        : `Lulus Uji dengan ${score}! Pelajaran berikutnya sudah terbuka.`
    case 'complete':
      return `${score}! Kamu sudah bisa memainkannya dari ingatan.`
  }
}

export function checkIn(lesson: Lesson, stage: StageId | null): string {
  if (!stage)
    return `${lesson.title} sudah selesai. Pilih pelajaran berikutnya.`
  return stage === 'memory'
    ? `${lesson.title} sudah lulus. Hari ini: coba mainkan dari ingatan, atau lanjut ke pelajaran berikutnya.`
    : `Terakhir kamu sampai tahap ${STAGE_NAMES[stage]} di ${lesson.title}. Hari ini targetnya lulus Uji.`
}

export function intro(lesson: Lesson): string {
  return `Kita mulai ${lesson.title}. Satu tahap pendek dulu, lalu naik pelan-pelan.`
}

export function recap(
  stagesDone: number,
  best: number | null,
  next: string,
): string {
  const scores = best === null ? '' : `, akurasi terbaik ${percent(best)}`
  return `Sesi ini ${stagesDone} tahap selesai${scores}. PR berikutnya: ${next}.`
}

export function pressFeedback(
  lesson: Lesson,
  actual: number,
  expected: number | null,
  reveal: { finger?: number; keys: string[] } | null,
): string {
  const played = displayName(actual, lesson)
  if (expected === null || expected === actual) return `✓ ${played} benar`
  let text = `✗ Itu ${played}, yang dicari ${displayName(expected, lesson)}`
  if (reveal) {
    const parts = [
      reveal.finger ? `jari ${reveal.finger}` : '',
      reveal.keys.length ? `tombol ${reveal.keys[0]}` : '',
    ].filter(Boolean)
    if (parts.length) text += ` (${parts.join(', ')})`
  }
  return text
}

// Falling-notes game (tempo mode, PRD FR-107).

export const JUDGEMENT_NAMES: Record<Judgement | 'extra', string> = {
  perfect: 'Tepat!',
  good: 'Kurang tepat',
  miss: 'Meleset',
  extra: 'Nada lebih',
}

export function gameRecap(stats: TempoStats, tempoPct: number): string {
  const score = percent(stats.accuracy)
  if (stats.accuracy >= 0.95)
    return tempoPct < 1
      ? `${score}, rapi sekali. Saatnya naikkan tempo.`
      : `${score} di tempo asli. Kamu sudah bisa lagu ini!`
  if (stats.accuracy >= 0.8)
    return `${score}. Hampir! Ulangi sekali lagi supaya makin lancar.`
  if (stats.miss > stats.extra && tempoPct > 0.6)
    return `${score}. Banyak nada terlewat, coba tempo Pelan dulu.`
  return `${score}. Dengarkan dulu, lalu coba lagi pelan-pelan.`
}
