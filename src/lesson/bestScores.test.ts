import { describe, expect, it } from 'vitest'
import { bestKey, emptyScores, parseScores, recordRun } from './bestScores.ts'
import type { TempoStats } from './tempoMatcher.ts'

function stats(accuracy: number, maxCombo: number): TempoStats {
  return {
    perfect: 0,
    good: 0,
    miss: 0,
    extra: 0,
    combo: 0,
    maxCombo,
    accuracy,
  }
}

describe('best scores', () => {
  it('keys scores by song and tempo percent', () => {
    expect(bestKey('ibu-kita-kartini', 0.8)).toBe('ibu-kita-kartini@80')
    expect(bestKey('mary', 0.6)).toBe('mary@60')
  })

  it('starts fresh on missing or corrupt data and drops broken entries', () => {
    expect(parseScores(null)).toEqual(emptyScores())
    expect(parseScores('{oops')).toEqual(emptyScores())
    expect(parseScores('{"version":2,"best":{}}')).toEqual(emptyScores())
    const raw = JSON.stringify({
      version: 1,
      best: {
        'a@80': { accuracy: 0.9, maxCombo: 12 },
        'b@80': { accuracy: 'high', maxCombo: 1 },
        'c@80': { accuracy: 1.5, maxCombo: 1 },
      },
    })
    expect(parseScores(raw)).toEqual({
      version: 1,
      best: { 'a@80': { accuracy: 0.9, maxCombo: 12 } },
    })
  })

  it('keeps the first run and only replaces it with a better one', () => {
    const first = recordRun(emptyScores(), 'a@80', stats(0.7, 5))
    expect(first).toMatchObject({ isBest: true, previous: undefined })

    const worse = recordRun(first.scores, 'a@80', stats(0.6, 9))
    expect(worse.isBest).toBe(false)
    expect(worse.scores).toBe(first.scores)

    const tie = recordRun(first.scores, 'a@80', stats(0.7, 8))
    expect(tie).toMatchObject({
      isBest: true,
      previous: { accuracy: 0.7, maxCombo: 5 },
    })
    expect(tie.scores.best['a@80']).toEqual({ accuracy: 0.7, maxCombo: 8 })
  })

  it('tracks each tempo on its own', () => {
    const slow = recordRun(emptyScores(), 'a@60', stats(0.95, 20))
    const fast = recordRun(slow.scores, 'a@100', stats(0.5, 3))
    expect(fast.isBest).toBe(true)
    expect(Object.keys(fast.scores.best)).toEqual(['a@60', 'a@100'])
  })
})
