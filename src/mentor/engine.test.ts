import { describe, expect, it } from 'vitest'
import { lessonById } from '../content/lessons.ts'
import type { AttemptSummary } from '../lesson/scorer.ts'
import type { Lesson } from '../lesson/types.ts'
import { canSkip, evaluate, initialState, nextStep, skip } from './engine.ts'
import type { MentorState, Outcome } from './engine.ts'

const song = lessonById('l1-mary') as Lesson // 8 measures, 4 phrases
const quiz = lessonById('l0-find-c') as Lesson

const clean: AttemptSummary = { accuracy: 1, problems: [] }
const shaky: AttemptSummary = {
  accuracy: 0.92,
  problems: [{ measure: 3, midi: 62, count: 2 }],
}
const failed: AttemptSummary = {
  accuracy: 0.6,
  problems: [{ measure: 5, midi: 64, count: 4 }],
}

function run(
  lesson: Lesson,
  state: MentorState,
  summary: AttemptSummary | null,
) {
  const step = nextStep(lesson, state)
  if (!step) throw new Error('ladder finished')
  return evaluate(lesson, state, step, summary)
}

function stageOf(lesson: Lesson, state: MentorState) {
  return nextStep(lesson, state)?.stage.id
}

/** Concept and listen, then every guided phrase passed cleanly. */
function toUnguided(): MentorState {
  let state = initialState(song.id)
  state = run(song, state, null).state
  state = run(song, state, null).state
  for (let phrase = 0; phrase < 4; phrase++)
    state = run(song, state, shaky).state
  return state
}

describe('MentorEngine', () => {
  it('walks the song ladder phrase by phrase', () => {
    let state = initialState(song.id)
    expect(stageOf(song, state)).toBe('concept')
    state = run(song, state, null).state
    expect(stageOf(song, state)).toBe('listen')
    state = run(song, state, null).state

    expect(nextStep(song, state)).toMatchObject({
      stage: { id: 'guided' },
      support: 3,
      bars: [1, 2],
    })
    state = run(song, state, shaky).state
    expect(nextStep(song, state)?.bars).toEqual([3, 4])
  })

  it('goes from retry to a remediation drill to a rest offer', () => {
    let state = toUnguided()
    expect(stageOf(song, state)).toBe('unguided')

    let result = run(song, state, failed)
    expect(result.outcome).toEqual({
      kind: 'retry',
      problem: failed.problems[0],
    })

    result = run(song, result.state, failed)
    expect(result.outcome).toEqual({ kind: 'drill', bars: [5, 6] })
    expect(nextStep(song, result.state)).toMatchObject({
      stage: { id: 'drill' },
      support: 3,
      bars: [5, 6],
      remedial: true,
    })
    expect(canSkip(nextStep(song, result.state)!)).toBe(false)

    result = run(song, result.state, failed)
    expect(result.outcome.kind).toBe('rest')
    state = result.state
    expect(state.sessionFails).toBe(0)
  })

  it('returns to the stage after two clean drills', () => {
    let state = toUnguided()
    state = run(song, state, failed).state
    state = run(song, state, failed).state
    const outcomes: Outcome['kind'][] = []
    for (let i = 0; i < 2; i++) {
      const result = run(song, state, clean)
      outcomes.push(result.outcome.kind)
      state = result.state
    }
    expect(outcomes).toEqual(['again', 'drill-done'])
    expect(nextStep(song, state)).toMatchObject({
      stage: { id: 'unguided' },
      remedial: false,
    })
  })

  it('skips the drill stage when there were no problems', () => {
    const state = run(song, toUnguided(), clean).state
    expect(stageOf(song, state)).toBe('checkpoint')
  })

  it('drills the worst bars of the previous stage', () => {
    const state = run(song, toUnguided(), shaky).state
    expect(nextStep(song, state)).toMatchObject({
      stage: { id: 'drill' },
      bars: [3, 4],
    })
  })

  it('lowers support after a fast first pass', () => {
    let state = initialState(song.id)
    state = run(song, state, null).state
    state = run(song, state, null).state
    for (let phrase = 0; phrase < 3; phrase++)
      state = run(song, state, shaky).state
    const result = run(song, state, clean)
    expect(result.outcome).toEqual({ kind: 'advance', fast: true })
    expect(nextStep(song, result.state)).toMatchObject({
      stage: { id: 'unguided' },
      support: 1,
    })
  })

  it('does not claim less help when support is already at its floor', () => {
    let state = initialState(quiz.id)
    state = run(quiz, state, null).state
    const result = run(quiz, state, clean)
    // Unguided quiz support is already S1, the floor outside tests.
    expect(result.outcome).toEqual({ kind: 'advance', fast: false })
    expect(nextStep(quiz, result.state)?.support).toBe(1)
  })

  it('passes the lesson on the checkpoint and cannot skip it', () => {
    let state = initialState(quiz.id)
    state = run(quiz, state, null).state
    state = run(quiz, state, clean).state
    state = run(quiz, state, clean).state
    const checkpoint = nextStep(quiz, state)!
    expect(checkpoint.stage.id).toBe('checkpoint')
    expect(checkpoint.support).toBe(1)
    expect(canSkip(checkpoint)).toBe(false)

    const result = run(quiz, state, clean)
    expect(result.outcome.kind).toBe('lesson-passed')
    expect(result.state.passed).toBe(true)
    expect(nextStep(quiz, result.state)).toBeNull()
  })

  it('completes the song ladder from memory', () => {
    let state = run(song, toUnguided(), clean).state
    state = run(song, state, clean).state
    expect(stageOf(song, state)).toBe('memory')
    expect(nextStep(song, state)?.support).toBe(0)
    expect(run(song, state, clean).outcome.kind).toBe('complete')
  })

  it('skips to the next stage', () => {
    const state = skip(song, initialState(song.id))
    expect(stageOf(song, state)).toBe('listen')
  })
})
