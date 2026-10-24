import { describe, expect, it } from 'vitest'
import { initialState } from './engine.ts'
import { emptyProgress, parseProgress } from './progress.ts'

describe('parseProgress', () => {
  it('starts fresh on missing or corrupt data', () => {
    expect(parseProgress(null)).toEqual(emptyProgress())
    expect(parseProgress('{oops')).toEqual(emptyProgress())
    expect(parseProgress('{"version":2,"states":{}}')).toEqual(emptyProgress())
  })

  it('keeps valid states and drops broken ones', () => {
    const good = { ...initialState('a'), stage: 2, drillBars: [3, 4] }
    const raw = JSON.stringify({
      version: 1,
      lastLessonId: 'a',
      states: {
        a: good,
        b: { ...initialState('b'), stage: 'two' },
        c: initialState('not-c'),
      },
    })
    expect(parseProgress(raw)).toEqual({
      version: 1,
      lastLessonId: 'a',
      states: { a: good },
    })
  })
})
