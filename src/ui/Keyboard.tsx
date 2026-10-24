import { useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import { handFor, keyLabels } from '../input/keyboardMap.ts'
import type { NoteTracker } from '../input/NoteTracker.ts'
import { isBlackKey, noteName } from '../music/notes.ts'

export type LabelMode = 'note' | 'keys' | 'none'

/** A key the lesson wants pressed, with the help shown on it. */
export interface KeyTarget {
  midi: number
  hand: 'L' | 'R'
  finger?: number
  letter: boolean
  keys: boolean
  blink: boolean
}

export interface KeyFlash {
  midi: number
  kind: 'ok' | 'wrong'
  id: number
}

interface KeyboardProps {
  first: number
  last: number
  octaveShift: number
  labelMode: LabelMode
  tracker: NoteTracker
  sustain: boolean
  targets?: KeyTarget[]
  flash?: KeyFlash | null
}

function keyAt(x: number, y: number): number | null {
  const key = document
    .elementFromPoint(x, y)
    ?.closest<HTMLElement>('[data-midi]')
  return key ? Number(key.dataset.midi) : null
}

export function Keyboard({
  first,
  last,
  octaveShift,
  labelMode,
  tracker,
  sustain,
  targets = [],
  flash = null,
}: KeyboardProps) {
  const keyEls = useRef(new Map<number, HTMLElement>())
  const activePointers = useRef(new Set<number>())
  // Notes let go while the pedal is down keep sounding, so they stay marked.
  const ringing = useRef(new Set<number>())
  const sustainRef = useRef(sustain)

  // Highlight via class toggles so playing never re-renders the keyboard.
  useEffect(() => {
    for (const [midi, el] of keyEls.current) {
      el.classList.toggle('is-down', tracker.isDown(midi))
      el.classList.toggle('is-ringing', ringing.current.has(midi))
    }
    return tracker.subscribe((midi, down) => {
      if (down) ringing.current.delete(midi)
      else if (sustainRef.current) ringing.current.add(midi)
      const el = keyEls.current.get(midi)
      el?.classList.toggle('is-down', down)
      el?.classList.toggle('is-ringing', ringing.current.has(midi))
    })
  }, [tracker, first, last])

  useEffect(() => {
    sustainRef.current = sustain
    if (sustain) return
    for (const midi of ringing.current)
      keyEls.current.get(midi)?.classList.remove('is-ringing')
    ringing.current.clear()
  }, [sustain])

  useEffect(() => {
    const el = flash && keyEls.current.get(flash.midi)
    if (!flash || !el) return
    const className = `flash-${flash.kind}`
    el.classList.add(className)
    const timer = window.setTimeout(() => el.classList.remove(className), 350)
    return () => {
      window.clearTimeout(timer)
      el.classList.remove(className)
    }
  }, [flash])

  function follow(event: PointerEvent<HTMLDivElement>) {
    const source = `p:${event.pointerId}`
    const midi = keyAt(event.clientX, event.clientY)
    if (midi === null) tracker.release(source)
    else if (tracker.noteOf(source) !== midi) tracker.press(source, midi)
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    activePointers.current.add(event.pointerId)
    follow(event)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (activePointers.current.has(event.pointerId)) follow(event)
  }

  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    activePointers.current.delete(event.pointerId)
    tracker.release(`p:${event.pointerId}`)
  }

  const targetByMidi = new Map(targets.map((target) => [target.midi, target]))
  const midis = Array.from({ length: last - first + 1 }, (_, i) => first + i)
  const whiteWidth = 100 / midis.filter((midi) => !isBlackKey(midi)).length
  const blackWidth = whiteWidth * 0.6
  let whitesBefore = 0

  const keys = midis.map((midi) => {
    const black = isBlackKey(midi)
    const name = noteName(midi)
    const target = targetByMidi.get(midi)
    const labels = target
      ? [
          ...(target.letter ? [name.replace(/-?\d+$/, '')] : []),
          ...(target.keys ? keyLabels(midi, octaveShift).slice(0, 1) : []),
        ]
      : labelMode === 'note'
        ? black
          ? []
          : [name.startsWith('C') ? name : name[0]]
        : labelMode === 'keys'
          ? keyLabels(midi, octaveShift)
          : []
    const style = black
      ? {
          left: `${whitesBefore * whiteWidth - blackWidth / 2}%`,
          width: `${blackWidth}%`,
        }
      : undefined
    if (!black) whitesBefore++
    return (
      <div
        key={midi}
        ref={(el) => {
          if (el) keyEls.current.set(midi, el)
          else keyEls.current.delete(midi)
        }}
        className={[
          'key',
          black ? 'key-black' : 'key-white',
          target && 'is-target',
          target?.blink && 'is-blink',
        ]
          .filter(Boolean)
          .join(' ')}
        data-midi={midi}
        data-hand={handFor(midi, octaveShift) ?? undefined}
        data-target-hand={target?.hand}
        aria-label={target ? `${name}, tuts target` : name}
        style={style}
      >
        {target?.finger && (
          <span className="key-finger" aria-label={`jari ${target.finger}`}>
            {target.finger}
          </span>
        )}
        {labels.map((label) => (
          <span key={label} className="key-label">
            {label}
          </span>
        ))}
      </div>
    )
  })

  return (
    <div
      className="keyboard"
      role="group"
      aria-label="Tuts piano"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      onLostPointerCapture={onPointerEnd}
      onContextMenu={(event) => event.preventDefault()}
    >
      {keys}
    </div>
  )
}
