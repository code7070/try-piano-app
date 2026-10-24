import { useEffect, useRef } from 'react'
import type { PointerEvent } from 'react'
import { handFor, keyLabels } from '../input/keyboardMap.ts'
import type { NoteTracker } from '../input/NoteTracker.ts'
import { isBlackKey, noteName } from '../music/notes.ts'

export type LabelMode = 'note' | 'keys' | 'none'

interface KeyboardProps {
  first: number
  last: number
  octaveShift: number
  labelMode: LabelMode
  tracker: NoteTracker
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
}: KeyboardProps) {
  const keyEls = useRef(new Map<number, HTMLElement>())
  const activePointers = useRef(new Set<number>())

  // Highlight via class toggles so playing never re-renders the keyboard.
  useEffect(() => {
    for (const [midi, el] of keyEls.current)
      el.classList.toggle('is-down', tracker.isDown(midi))
    return tracker.subscribe((midi, down) =>
      keyEls.current.get(midi)?.classList.toggle('is-down', down),
    )
  }, [tracker, first, last])

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

  const midis = Array.from({ length: last - first + 1 }, (_, i) => first + i)
  const whiteWidth = 100 / midis.filter((midi) => !isBlackKey(midi)).length
  const blackWidth = whiteWidth * 0.6
  let whitesBefore = 0

  const keys = midis.map((midi) => {
    const black = isBlackKey(midi)
    const name = noteName(midi)
    const labels =
      labelMode === 'note'
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
        className={black ? 'key key-black' : 'key key-white'}
        data-midi={midi}
        data-hand={handFor(midi, octaveShift) ?? undefined}
        aria-label={name}
        style={style}
      >
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
