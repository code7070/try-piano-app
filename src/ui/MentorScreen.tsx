import { useEffect, useMemo, useRef, useState } from 'react'
import { LESSONS, lessonById } from '../content/lessons.ts'
import {
  checkIn,
  displayName,
  instruction,
  intro,
  outcomeMessage,
  PHASE_NAMES,
  pressFeedback,
  recap,
  STAGE_NAMES,
} from '../i18n/id.ts'
import { keyLabels } from '../input/keyboardMap.ts'
import type { NoteSink, NoteTracker } from '../input/NoteTracker.ts'
import { playDemo } from '../lesson/demo.ts'
import { summarize } from '../lesson/scorer.ts'
import type { AttemptSummary } from '../lesson/scorer.ts'
import { notesInBars } from '../lesson/types.ts'
import type { Lesson, SongNote } from '../lesson/types.ts'
import { groupByBeat, WaitMatcher } from '../lesson/waitMatcher.ts'
import {
  canSkip,
  evaluate,
  initialState,
  nextStep,
  skip,
  startSession,
} from '../mentor/engine.ts'
import type { MentorState, Step } from '../mentor/engine.ts'
import { ladderFor, PHASES } from '../mentor/ladder.ts'
import { loadProgress, saveProgress } from '../mentor/progress.ts'
import type { MentorProgress } from '../mentor/progress.ts'
import type { KeyFlash, KeyTarget } from './Keyboard.tsx'
import './mentor.css'

type Mode = 'brief' | 'demo' | 'play'

interface MentorScreenProps {
  sink: NoteSink
  tracker: NoteTracker
  octaveShift: number
  onTargets: (targets: KeyTarget[]) => void
  onFlash: (flash: KeyFlash) => void
}

// Reveal everything about a note after this many wrong presses (FR-103).
const REVEAL_AFTER = 3

function stateOf(progress: MentorProgress, lesson: Lesson): MentorState {
  return progress.states[lesson.id] ?? initialState(lesson.id)
}

function isUnlocked(progress: MentorProgress, index: number): boolean {
  return index === 0 || Boolean(progress.states[LESSONS[index - 1].id]?.passed)
}

function pickLesson(progress: MentorProgress): Lesson {
  const last = progress.lastLessonId && lessonById(progress.lastLessonId)
  if (last && isUnlocked(progress, LESSONS.indexOf(last))) return last
  const open = LESSONS.filter((_, index) => isUnlocked(progress, index))
  return (
    open.find((lesson) => !progress.states[lesson.id]?.passed) ?? LESSONS[0]
  )
}

function stepGroups(lesson: Lesson, step: Step | null): SongNote[][] {
  return step ? groupByBeat(notesInBars(lesson.song, step.bars)) : []
}

function greeting(lesson: Lesson, state: MentorState): string {
  const step = nextStep(lesson, state)
  const fresh = state.stage === 0 && !state.passed
  const opening = fresh
    ? intro(lesson)
    : checkIn(lesson, step?.stage.id ?? null)
  return step
    ? `${opening} ${instruction(lesson, step, stepGroups(lesson, step).length)}`
    : opening
}

export function MentorScreen({
  sink,
  tracker,
  octaveShift,
  onTargets,
  onFlash,
}: MentorScreenProps) {
  const [progress, setProgress] = useState(() => {
    const loaded = loadProgress()
    for (const [id, state] of Object.entries(loaded.states))
      loaded.states[id] = startSession(state)
    return loaded
  })
  const [lesson, setLesson] = useState(() => pickLesson(progress))
  const [mode, setMode] = useState<Mode>('brief')
  const [message, setMessage] = useState(() =>
    greeting(lesson, stateOf(progress, lesson)),
  )
  const [feedback, setFeedback] = useState('')
  const [position, setPosition] = useState(0)
  const [wrongsHere, setWrongsHere] = useState(0)
  const [storageFailed, setStorageFailed] = useState(false)
  const matcher = useRef<WaitMatcher | null>(null)
  const cancelDemo = useRef<(() => void) | null>(null)
  const flashId = useRef(0)
  const session = useRef({ stagesDone: 0, best: null as number | null })

  // Memoised so the keyboard targets only change when the step really does.
  const state = useMemo(() => stateOf(progress, lesson), [progress, lesson])
  const step = useMemo(() => nextStep(lesson, state), [lesson, state])
  const groups = useMemo(() => stepGroups(lesson, step), [lesson, step])
  const lessonIndex = LESSONS.indexOf(lesson)
  const nextLesson = LESSONS[lessonIndex + 1]
  const nextUnlocked = nextLesson && isUnlocked(progress, lessonIndex + 1)

  function commit(nextState: MentorState) {
    const updated: MentorProgress = {
      ...progress,
      lastLessonId: lesson.id,
      states: { ...progress.states, [lesson.id]: nextState },
    }
    setProgress(updated)
    if (!saveProgress(updated)) setStorageFailed(true)
  }

  function finish(currentStep: Step, summary: AttemptSummary | null) {
    setMode('brief')
    setFeedback('')
    const result = evaluate(lesson, state, currentStep, summary)
    commit(result.state)
    const { kind } = result.outcome
    if (summary) {
      const { best } = session.current
      session.current.best = Math.max(best ?? 0, summary.accuracy)
    }
    if (result.state.stage > state.stage) session.current.stagesDone++

    const following = nextStep(lesson, result.state)
    let text = outcomeMessage(
      result.outcome,
      summary,
      lesson,
      following !== null,
    )
    if (following && kind !== 'rest')
      text += ` ${instruction(lesson, following, stepGroups(lesson, following).length)}`
    setMessage(text)
  }

  function stopActivity() {
    cancelDemo.current?.()
    cancelDemo.current = null
    matcher.current = null
    setMode('brief')
    setFeedback('')
  }

  function start() {
    if (!step) return
    if (step.stage.id === 'concept') {
      finish(step, null)
      return
    }
    setPosition(0)
    setWrongsHere(0)
    setFeedback('')
    if (step.stage.id === 'listen') {
      setMode('demo')
      cancelDemo.current = playDemo(
        groups,
        lesson.song.tempo,
        sink,
        (index) => {
          if (index !== null) {
            setPosition(index)
            return
          }
          cancelDemo.current = null
          finish(step, null)
        },
      )
      return
    }
    matcher.current = new WaitMatcher(notesInBars(lesson.song, step.bars))
    setMode('play')
  }

  function skipStage() {
    stopActivity()
    const skipped = skip(lesson, state)
    commit(skipped)
    const following = nextStep(lesson, skipped)
    setMessage(
      following
        ? `Tahap dilewati. ${instruction(lesson, following, stepGroups(lesson, following).length)}`
        : 'Tahap dilewati. Pelajaran ini sudah selesai.',
    )
  }

  function switchLesson(next: Lesson) {
    stopActivity()
    setLesson(next)
    setMessage(greeting(next, stateOf(progress, next)))
  }

  function endSession() {
    stopActivity()
    const { stagesDone, best } = session.current
    const homework = step
      ? `${STAGE_NAMES[step.stage.id]} di ${lesson.title}`
      : nextLesson
        ? nextLesson.title
        : 'ulangi lagu favoritmu di Main Bebas'
    setMessage(recap(stagesDone, best, homework))
  }

  function onPress(midi: number) {
    const current = matcher.current
    const expected = current?.current
    if (!current || !expected || !step) return
    const result = current.press(midi, performance.now())
    if (result === 'ignored') return
    flashId.current++

    if (result === 'wrong') {
      const wrongs = current.wrongsOnCurrent
      const target = expected[0]
      const reveal =
        wrongs >= REVEAL_AFTER
          ? { finger: target.finger, keys: keyLabels(target.midi, octaveShift) }
          : null
      setWrongsHere(wrongs)
      setFeedback(pressFeedback(lesson, midi, target.midi, reveal))
      onFlash({ midi, kind: 'wrong', id: flashId.current })
      return
    }

    setFeedback(pressFeedback(lesson, midi, null, null))
    onFlash({ midi, kind: 'ok', id: flashId.current })
    setPosition(current.position)
    setWrongsHere(current.wrongsOnCurrent)
    if (result === 'done') {
      matcher.current = null
      finish(step, summarize(current.result(), lesson.song))
    }
  }

  // Re-subscribes every render so the handler always sees the current step.
  useEffect(() => {
    if (mode !== 'play') return
    return tracker.subscribe((midi, down) => {
      if (down) onPress(midi)
    })
  })

  useEffect(() => {
    if (mode === 'brief') return
    function onKeyDown(event: KeyboardEvent) {
      if (event.code === 'Escape') stopActivity()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  useEffect(() => () => cancelDemo.current?.(), [])

  // Targets on the keyboard follow the support level (FR-163).
  const group = mode === 'brief' ? null : groups[position]
  useEffect(() => {
    if (!group || !step) {
      onTargets([])
      return
    }
    const demo = mode === 'demo'
    const reveal = wrongsHere >= REVEAL_AFTER
    const blink = !demo && step.stage.hints && wrongsHere > 0 && !reveal
    const full = demo || step.support === 3 || reveal
    const lit = full || step.support === 2 || blink
    onTargets(
      lit
        ? group.map((note) => ({
            midi: note.midi,
            hand: note.hand,
            finger: full || step.support === 2 ? note.finger : undefined,
            letter: full,
            keys: full,
            blink,
          }))
        : [],
    )
  }, [group, mode, step, wrongsHere, onTargets])

  useEffect(() => () => onTargets([]), [onTargets])

  const ladder = ladderFor(lesson)
  const showLetters =
    mode === 'demo' || step?.support === 3 || step?.support === 1

  return (
    <section className="mentor" aria-label="Mode Mentor">
      <div className="mentor-head">
        <label className="control">
          <span>Pelajaran</span>
          <select
            value={lesson.id}
            onChange={(event) => {
              const next = lessonById(event.target.value)
              event.target.blur()
              if (next) switchLesson(next)
            }}
          >
            {LESSONS.map((item, index) => {
              const unlocked = isUnlocked(progress, index)
              const passed = progress.states[item.id]?.passed
              return (
                <option key={item.id} value={item.id} disabled={!unlocked}>
                  Level {item.level} · {item.title}
                  {passed ? ' ✓' : unlocked ? '' : ' (terkunci)'}
                </option>
              )
            })}
          </select>
        </label>

        <ol className="ladder" aria-label="Tangga belajar">
          {PHASES.map((phase) => {
            const stages = ladder
              .map((spec, index) => ({ spec, index }))
              .filter(({ spec }) => spec.phase === phase)
            if (stages.length === 0) return null
            const done = stages.every(({ index }) => index < state.stage)
            const active = stages.some(({ index }) => index === state.stage)
            return (
              <li
                key={phase}
                className="ladder-phase"
                data-state={done ? 'done' : active ? 'active' : 'todo'}
              >
                <span className="ladder-name">
                  {done ? '✓ ' : ''}
                  {PHASE_NAMES[phase]}
                </span>
                <span className="ladder-dots" aria-hidden="true">
                  {stages.map(({ spec, index }) => (
                    <i
                      key={spec.id}
                      data-state={
                        index < state.stage
                          ? 'done'
                          : index === state.stage
                            ? 'active'
                            : 'todo'
                      }
                    />
                  ))}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      {step && (
        <p className="mentor-stage">
          {STAGE_NAMES[step.stage.id]}
          {step.remedial && ' · latihan tambahan'}
          {step.stage.phrased &&
            ` · frasa ${state.phrase + 1}/${Math.ceil(lesson.song.measures / 2)}`}
          {step.stage.phase !== 'learn' && ` · bantuan S${step.support}`}
        </p>
      )}

      <p className="mentor-bubble" aria-live="polite">
        <strong>Mentor:</strong> {message}
      </p>

      {mode === 'brief' && step?.stage.id === 'concept' && (
        <p className="mentor-concept">{lesson.concept.text}</p>
      )}

      {mode !== 'brief' && (
        <div className="note-strip" aria-label="Urutan nada">
          {lesson.kind === 'find-note' && mode === 'play' ? (
            <span className="note-prompt">
              Temukan <b>{group ? displayName(group[0].midi, lesson) : '✓'}</b>
            </span>
          ) : (
            groups.map((notes, index) => {
              const visible =
                index < position ||
                showLetters ||
                (step?.support === 0 && index === 0)
              return (
                <span
                  key={notes[0].startBeat}
                  data-state={
                    index < position
                      ? 'done'
                      : index === position
                        ? 'now'
                        : 'todo'
                  }
                >
                  {visible
                    ? notes
                        .map((note) => displayName(note.midi, lesson))
                        .join('')
                    : '•'}
                </span>
              )
            })
          )}
        </div>
      )}

      <p className="mentor-feedback" aria-live="polite">
        {feedback}
      </p>

      <div className="mentor-actions">
        {mode === 'brief' && step && (
          <button type="button" className="btn btn-primary" onClick={start}>
            {step.stage.id === 'concept' ? 'Mengerti' : '▶ Mulai'}
          </button>
        )}
        {mode === 'brief' && state.passed && nextLesson && nextUnlocked && (
          <button
            type="button"
            className={step ? 'btn' : 'btn btn-primary'}
            onClick={() => switchLesson(nextLesson)}
          >
            Pelajaran berikutnya
          </button>
        )}
        {mode === 'play' && (
          <button type="button" className="btn" onClick={start}>
            Ulangi dari awal
          </button>
        )}
        {mode !== 'brief' && (
          <button type="button" className="btn" onClick={stopActivity}>
            Berhenti <kbd>Esc</kbd>
          </button>
        )}
        {step && canSkip(step) && (
          <button type="button" className="btn btn-quiet" onClick={skipStage}>
            Lewati tahap
          </button>
        )}
        {mode === 'brief' && (
          <button type="button" className="btn btn-quiet" onClick={endSession}>
            Selesai sesi
          </button>
        )}
      </div>

      {storageFailed && (
        <p className="notice">
          Progres tidak bisa disimpan di browser ini, jadi akan hilang saat tab
          ditutup.
        </p>
      )}
    </section>
  )
}
