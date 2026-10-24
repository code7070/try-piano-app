import type { AttemptSummary, Problem } from '../lesson/scorer.ts'
import type { Lesson } from '../lesson/types.ts'
import { DRILL, ladderFor } from './ladder.ts'
import type { StageSpec, Support } from './ladder.ts'

export interface MentorState {
  lessonId: string
  stage: number // index into the lesson's ladder
  phrase: number // two-measure chunk, for phrased stages
  adjust: number // support offset: −1 after a fast pass, +1 after repeated fails
  tries: number
  failStreak: number
  passStreak: number
  sessionFails: number
  drillBars: [number, number] | null // worst bars of the latest attempt
  detour: boolean // inside a remediation drill
  passed: boolean // checkpoint passed, next lesson unlocked
}

export interface Step {
  stage: StageSpec
  support: Support
  bars: [number, number]
  remedial: boolean
}

export type Outcome =
  | { kind: 'advance'; fast: boolean }
  | { kind: 'again' }
  | { kind: 'retry'; problem?: Problem }
  | { kind: 'drill'; bars: [number, number] }
  | { kind: 'drill-done' }
  | { kind: 'rest' }
  | { kind: 'lesson-passed' }
  | { kind: 'complete' }

const FAST_PASS = 0.97
const FAILS_BEFORE_DRILL = 2
const FAILS_BEFORE_REST = 3

export function initialState(lessonId: string): MentorState {
  return {
    lessonId,
    stage: 0,
    phrase: 0,
    adjust: 0,
    tries: 0,
    failStreak: 0,
    passStreak: 0,
    sessionFails: 0,
    drillBars: null,
    detour: false,
    passed: false,
  }
}

function phraseCount(lesson: Lesson): number {
  return Math.ceil(lesson.song.measures / 2)
}

function supportFor(stage: StageSpec, adjust: number): Support {
  // Tests keep their own support; easing a test would make it a different one.
  if (stage.phase === 'perform') return stage.support
  return Math.min(Math.max(stage.support + adjust, 1), 3) as Support
}

/** The step to run next, or null when the whole ladder is done. */
export function nextStep(lesson: Lesson, state: MentorState): Step | null {
  const measures = lesson.song.measures
  if (state.detour && state.drillBars) {
    return {
      stage: DRILL,
      support: supportFor(DRILL, state.adjust),
      bars: state.drillBars,
      remedial: true,
    }
  }
  const stage = ladderFor(lesson)[state.stage]
  if (!stage) return null
  let bars: [number, number] = [1, measures]
  if (stage.phrased) {
    const from = state.phrase * 2 + 1
    bars = [from, Math.min(from + 1, measures)]
  } else if (stage.id === 'drill' && state.drillBars) {
    bars = state.drillBars
  }
  return {
    stage,
    support: supportFor(stage, state.adjust),
    bars,
    remedial: false,
  }
}

function worstBars(
  problems: Problem[],
  measures: number,
): [number, number] | null {
  const worst = problems[0]
  if (!worst) return null
  return [worst.measure, Math.min(worst.measure + 1, measures)]
}

function moveToStage(
  lesson: Lesson,
  state: MentorState,
  index: number,
  adjust: number,
): MentorState {
  const ladder = ladderFor(lesson)
  let stage = index
  // The drill stage only exists when the previous attempt left problems.
  if (ladder[stage]?.id === 'drill' && !state.drillBars) stage++
  return {
    ...state,
    stage,
    phrase: 0,
    adjust,
    tries: 0,
    failStreak: 0,
    passStreak: 0,
    detour: false,
  }
}

export function canSkip(step: Step): boolean {
  return !step.remedial && step.stage.id !== 'checkpoint'
}

export function skip(lesson: Lesson, state: MentorState): MentorState {
  return moveToStage(lesson, state, state.stage + 1, 0)
}

export function startSession(state: MentorState): MentorState {
  return { ...state, sessionFails: 0 }
}

/**
 * Decides what happens after an attempt. `summary` is null for stages that are
 * not scored (concept, listen).
 */
export function evaluate(
  lesson: Lesson,
  state: MentorState,
  step: Step,
  summary: AttemptSummary | null,
): { state: MentorState; outcome: Outcome } {
  if (!summary) {
    return {
      state: moveToStage(lesson, state, state.stage + 1, state.adjust),
      outcome: { kind: 'advance', fast: false },
    }
  }

  const { stage } = step
  const passed = summary.accuracy >= stage.minAccuracy
  let next: MentorState = { ...state, tries: state.tries + 1 }
  if (!step.remedial) {
    next.drillBars = worstBars(summary.problems, lesson.song.measures)
  }

  if (!passed) {
    next = {
      ...next,
      failStreak: next.failStreak + 1,
      passStreak: 0,
      sessionFails: next.sessionFails + 1,
    }
    if (next.sessionFails >= FAILS_BEFORE_REST) {
      return { state: { ...next, sessionFails: 0 }, outcome: { kind: 'rest' } }
    }
    if (!step.remedial && next.failStreak >= FAILS_BEFORE_DRILL) {
      const bars = next.drillBars ?? step.bars
      return {
        state: {
          ...next,
          detour: true,
          drillBars: bars,
          adjust: Math.max(next.adjust, 0) + 1,
          passStreak: 0,
        },
        outcome: { kind: 'drill', bars },
      }
    }
    return {
      state: next,
      outcome: { kind: 'retry', problem: summary.problems[0] },
    }
  }

  next.passStreak++
  if (next.passStreak < stage.streak) {
    return { state: next, outcome: { kind: 'again' } }
  }

  if (step.remedial) {
    return {
      state: {
        ...next,
        detour: false,
        tries: 0,
        failStreak: 0,
        passStreak: 0,
      },
      outcome: { kind: 'drill-done' },
    }
  }

  const fast = next.tries === 1 && summary.accuracy >= FAST_PASS
  if (stage.phrased && next.phrase + 1 < phraseCount(lesson)) {
    return {
      state: {
        ...next,
        phrase: next.phrase + 1,
        tries: 0,
        failStreak: 0,
        passStreak: 0,
      },
      outcome: { kind: 'advance', fast: false },
    }
  }

  const moved = moveToStage(lesson, next, next.stage + 1, fast ? -1 : 0)
  if (stage.id === 'checkpoint') {
    return {
      state: { ...moved, passed: true },
      outcome: { kind: 'lesson-passed' },
    }
  }
  const following = nextStep(lesson, moved)
  if (!following) return { state: moved, outcome: { kind: 'complete' } }
  // Only call it fast when the next stage really shows less help.
  const eased = following.support < following.stage.support
  return { state: moved, outcome: { kind: 'advance', fast: fast && eased } }
}
