import { describe, expect, it } from 'vitest'
import { LESSONS } from './lessons.ts'

describe('lesson content', () => {
  it('has unique ids', () => {
    const ids = LESSONS.map((lesson) => lesson.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each(LESSONS)('$id stays in the laptop range C3–E5', (lesson) => {
    for (const note of lesson.song.notes) {
      expect(note.midi).toBeGreaterThanOrEqual(48)
      expect(note.midi).toBeLessThanOrEqual(76)
    }
  })

  it.each(LESSONS.filter((lesson) => lesson.kind === 'song'))(
    '$id has a finger for every note',
    (lesson) => {
      for (const note of lesson.song.notes) expect(note.finger).toBeDefined()
    },
  )
})
