import type { Lesson } from '../lesson/types.ts'

export type StageId =
  | 'concept'
  | 'listen'
  | 'guided'
  | 'unguided'
  | 'drill'
  | 'checkpoint'
  | 'memory'

export type Phase = 'learn' | 'imitate' | 'practice' | 'perform'

/** S3 lights, letters, fingers and laptop keys; S0 shows only the first note. */
export type Support = 0 | 1 | 2 | 3

export interface StageSpec {
  id: StageId
  phase: Phase
  support: Support
  minAccuracy: number
  streak: number // passes in a row needed
  phrased: boolean // played two measures at a time
  hints: boolean // FR-103 hints on a wrong note
  optional: boolean
}

export const PHASES: Phase[] = ['learn', 'imitate', 'practice', 'perform']

const DEFAULTS: Record<StageId, StageSpec> = {
  concept: spec('concept', 'learn', 3, 0),
  listen: spec('listen', 'learn', 3, 0),
  guided: { ...spec('guided', 'imitate', 3, 0.8), phrased: true },
  unguided: spec('unguided', 'imitate', 2, 0.9),
  drill: { ...spec('drill', 'practice', 2, 0.95), streak: 2 },
  checkpoint: { ...spec('checkpoint', 'perform', 1, 0.9), hints: false },
  memory: {
    ...spec('memory', 'perform', 0, 0.8),
    hints: false,
    optional: true,
  },
}

function spec(
  id: StageId,
  phase: Phase,
  support: Support,
  minAccuracy: number,
): StageSpec {
  return {
    id,
    phase,
    support,
    minAccuracy,
    streak: 1,
    phrased: false,
    hints: true,
    optional: false,
  }
}

/** Default ladder per lesson kind (PRD 4.4, release 1.0 stages only). */
export function ladderFor(lesson: Lesson): StageSpec[] {
  if (lesson.kind === 'find-note') {
    // The prompt names the key, so beyond "guided" the lights stay off.
    return [
      DEFAULTS.concept,
      { ...DEFAULTS.guided, phrased: false },
      { ...DEFAULTS.unguided, support: 1 },
      DEFAULTS.checkpoint,
    ]
  }
  return [
    DEFAULTS.concept,
    DEFAULTS.listen,
    DEFAULTS.guided,
    DEFAULTS.unguided,
    DEFAULTS.drill,
    DEFAULTS.checkpoint,
    DEFAULTS.memory,
  ]
}

export const DRILL: StageSpec = DEFAULTS.drill
