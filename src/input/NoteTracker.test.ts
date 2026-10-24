import { describe, expect, it } from 'vitest'
import { NoteTracker } from './NoteTracker.ts'

function setup() {
  const calls: string[] = []
  const tracker = new NoteTracker({
    noteOn: (midi) => calls.push(`on ${midi}`),
    noteOff: (midi) => calls.push(`off ${midi}`),
  })
  return { calls, tracker }
}

describe('NoteTracker', () => {
  it('starts and stops a note for one source', () => {
    const { calls, tracker } = setup()
    tracker.press('p:1', 60)
    tracker.release('p:1')
    expect(calls).toEqual(['on 60', 'off 60'])
  })

  it('keeps a note sounding while any source still holds it', () => {
    const { calls, tracker } = setup()
    tracker.press('p:1', 60)
    tracker.press('k:KeyQ', 60)
    tracker.release('p:1')
    expect(calls).toEqual(['on 60'])
    tracker.release('k:KeyQ')
    expect(calls).toEqual(['on 60', 'off 60'])
  })

  it('moves a source to a new note when it presses again (glissando)', () => {
    const { calls, tracker } = setup()
    tracker.press('p:1', 60)
    tracker.press('p:1', 62)
    expect(calls).toEqual(['on 60', 'off 60', 'on 62'])
    expect(tracker.noteOf('p:1')).toBe(62)
  })

  it('releases filtered sources only', () => {
    const { tracker } = setup()
    tracker.press('k:KeyQ', 60)
    tracker.press('p:1', 64)
    tracker.releaseAll((source) => source.startsWith('k:'))
    expect(tracker.heldNotes()).toEqual([64])
  })

  it('notifies listeners and ignores unknown releases', () => {
    const { tracker } = setup()
    const events: string[] = []
    const unsubscribe = tracker.subscribe((midi, down) =>
      events.push(`${midi}:${down}`),
    )
    tracker.release('p:9')
    tracker.press('p:1', 60)
    tracker.releaseAll()
    unsubscribe()
    tracker.press('p:1', 61)
    expect(events).toEqual(['60:true', '60:false'])
  })
})
