import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import type { RefObject } from 'react'
import { createSynth, isAudioSupported } from './audio/synth.ts'
import {
  codeToMidi,
  mappedRange,
  MAX_OCTAVE_SHIFT,
  MIN_OCTAVE_SHIFT,
} from './input/keyboardMap.ts'
import { NoteTracker } from './input/NoteTracker.ts'
import { noteName, visibleRange } from './music/notes.ts'
import { Keyboard } from './ui/Keyboard.tsx'
import type { KeyFlash, KeyTarget, LabelMode } from './ui/Keyboard.tsx'
import { GameScreen } from './ui/GameScreen.tsx'
import { MentorScreen } from './ui/MentorScreen.tsx'
import { onRadioKeyDown } from './ui/radio.ts'
import './ui/piano.css'

const coarsePointer =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(pointer: coarse)').matches

type View = 'mentor' | 'game' | 'free'

const VIEW_OPTIONS: { value: View; text: string }[] = [
  { value: 'mentor', text: 'Mentor' },
  { value: 'game', text: 'Main Lagu' },
  { value: 'free', text: 'Main Bebas' },
]

const LABEL_OPTIONS: { value: LabelMode; text: string }[] = [
  { value: 'note', text: 'Nada' },
  { value: 'keys', text: 'Tombol' },
  { value: 'none', text: 'Kosong' },
]

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (target instanceof HTMLTextAreaElement) return true
  if (target instanceof HTMLSelectElement) return true
  return (
    target instanceof HTMLInputElement &&
    !['range', 'checkbox', 'radio', 'button'].includes(target.type)
  )
}

function useWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(() =>
    typeof window === 'undefined' ? 1024 : window.innerWidth,
  )
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return width
}

function App() {
  const [synth] = useState(createSynth)
  const [tracker] = useState(() => new NoteTracker(synth))
  const [octaveShift, setOctaveShift] = useState(0)
  const [sustainLatched, setSustainLatched] = useState(false)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [labelMode, setLabelMode] = useState<LabelMode>(
    coarsePointer ? 'note' : 'keys',
  )
  const [held, setHeld] = useState<number[]>([])
  const [view, setView] = useState<View>('mentor')
  const [targets, setTargets] = useState<KeyTarget[]>([])
  const [flash, setFlash] = useState<KeyFlash | null>(null)
  const keyboardRef = useRef<HTMLDivElement>(null)
  const octaveShiftRef = useRef(octaveShift)
  const slideDirection = useRef(0)
  const width = useWidth(keyboardRef)

  const sustainOn = sustainLatched || spaceHeld
  const whiteCount = Math.min(Math.floor(width / (coarsePointer ? 44 : 34)), 36)
  const { first, last } = visibleRange(whiteCount, octaveShift)
  // Touch players never see the laptop mapping, so show the keys on screen.
  const [rangeLow, rangeHigh] = coarsePointer
    ? [first, last]
    : mappedRange(octaveShift)

  const shiftOctave = useCallback(
    (delta: number) => {
      const next = Math.min(
        Math.max(octaveShiftRef.current + delta, MIN_OCTAVE_SHIFT),
        MAX_OCTAVE_SHIFT,
      )
      if (next === octaveShiftRef.current) return
      // Keys held across a shift would otherwise never get their note-off.
      tracker.releaseAll((source) => source.startsWith('k:'))
      octaveShiftRef.current = next
      setOctaveShift(next)
    },
    [tracker],
  )

  function switchView(next: View) {
    // Lessons and songs are written for the default laptop range (FR-120).
    if (next !== 'free') shiftOctave(-octaveShiftRef.current)
    setView(next)
  }

  function shiftOctaveFromButton(delta: number) {
    slideDirection.current = delta
    shiftOctave(delta)
  }

  // Slides the keys in from the side they came from. Arrow-key shifts skip
  // this: they are frequent and must feel instant.
  useLayoutEffect(() => {
    const direction = slideDirection.current
    slideDirection.current = 0
    const el = keyboardRef.current
    if (direction === 0 || !el || typeof el.animate !== 'function') return
    const reduce = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches
    el.animate(
      reduce
        ? [{ opacity: 0.4 }, { opacity: 1 }]
        : [
            { transform: `translateX(${direction * 4}%)`, opacity: 0.4 },
            { transform: 'none', opacity: 1 },
          ],
      { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
    )
  }, [octaveShift])

  useEffect(() => synth.setSustain(sustainOn), [synth, sustainOn])
  useEffect(() => synth.setVolume(volume), [synth, volume])
  useEffect(
    () => tracker.subscribe(() => setHeld(tracker.heldNotes())),
    [tracker],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.code === 'Space') {
        event.preventDefault()
        setSpaceHeld(true)
        return
      }
      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        if (
          event.target instanceof HTMLElement &&
          event.target.closest('input, [role="radiogroup"]')
        )
          return
        event.preventDefault()
        if (!event.repeat) shiftOctave(event.code === 'ArrowLeft' ? -1 : 1)
        return
      }
      const midi = codeToMidi(event.code, octaveShiftRef.current)
      if (midi === null) return
      event.preventDefault()
      if (!event.repeat) tracker.press(`k:${event.code}`, midi)
    }

    function onKeyUp(event: KeyboardEvent) {
      if (event.code === 'Space') {
        // Stops Space from also clicking a focused toolbar button.
        if (!isTypingTarget(event.target)) event.preventDefault()
        setSpaceHeld(false)
      } else tracker.release(`k:${event.code}`)
    }

    function releaseEverything() {
      tracker.releaseAll()
      setSpaceHeld(false)
    }

    function onVisibilityChange() {
      if (document.hidden) releaseEverything()
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', releaseEverything)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', releaseEverything)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      synth.allNotesOff()
    }
  }, [synth, tracker, shiftOctave])

  return (
    <div className={view === 'game' ? 'app is-game' : 'app'}>
      <header className="topbar">
        <div className="brand">
          <h1>Piano</h1>
          <p>Belajar dan latihan piano dari nol</p>
        </div>

        <div className="controls">
          <div
            className="segmented"
            role="radiogroup"
            aria-label="Mode"
            onKeyDown={(event) =>
              onRadioKeyDown(event, VIEW_OPTIONS, view, switchView)
            }
          >
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={view === option.value}
                tabIndex={view === option.value ? 0 : -1}
                onClick={() => switchView(option.value)}
              >
                {option.text}
              </button>
            ))}
          </div>

          {view === 'free' && (
            <div className="control">
              <span>Oktaf</span>
              <div className="stepper">
                <button
                  type="button"
                  className="btn"
                  aria-label="Geser oktaf turun"
                  disabled={octaveShift === MIN_OCTAVE_SHIFT}
                  onClick={() => shiftOctaveFromButton(-1)}
                >
                  ‹
                </button>
                <span className="stepper-value">
                  {noteName(rangeLow)}–{noteName(rangeHigh)}
                </span>
                <button
                  type="button"
                  className="btn"
                  aria-label="Geser oktaf naik"
                  disabled={octaveShift === MAX_OCTAVE_SHIFT}
                  onClick={() => shiftOctaveFromButton(1)}
                >
                  ›
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-toggle"
            aria-pressed={sustainOn}
            onClick={() => setSustainLatched((on) => !on)}
          >
            Sustain
          </button>

          <label className="control">
            <span>Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
            />
          </label>

          {view === 'free' && (
            <div className="control">
              <span>Label</span>
              <div
                className="segmented"
                role="radiogroup"
                aria-label="Label"
                onKeyDown={(event) =>
                  onRadioKeyDown(event, LABEL_OPTIONS, labelMode, setLabelMode)
                }
              >
                {LABEL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={labelMode === option.value}
                    tabIndex={labelMode === option.value ? 0 : -1}
                    onClick={() => setLabelMode(option.value)}
                  >
                    {option.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="stage">
        {!isAudioSupported() && (
          <p className="notice">
            Browser ini tidak mendukung Web Audio, jadi suara tidak bisa
            diputar. Coba Chrome, Edge, Firefox, atau Safari terbaru.
          </p>
        )}
        {view === 'mentor' ? (
          <MentorScreen
            sink={synth}
            tracker={tracker}
            octaveShift={octaveShift}
            onTargets={setTargets}
            onFlash={setFlash}
          />
        ) : view === 'game' ? (
          <GameScreen
            tracker={tracker}
            first={first}
            last={last}
            octaveShift={octaveShift}
            touch={Boolean(coarsePointer)}
            onTargets={setTargets}
            onFlash={setFlash}
          />
        ) : (
          <>
            {/* Announcing every note would flood screen readers mid-play. */}
            <output className="now-playing" aria-live="off">
              {held.length > 0 ? held.map(noteName).join(' ') : '—'}
            </output>
            {coarsePointer ? (
              <p className="hint">Sentuh tuts untuk bermain.</p>
            ) : (
              <p className="hint">
                Klik atau sentuh tuts. Di laptop: <kbd>Z</kbd>–<kbd>/</kbd>{' '}
                tangan kiri, <kbd>Q</kbd>–<kbd>]</kbd> tangan kanan (baris di
                atasnya untuk tuts hitam), <kbd>Space</kbd> sustain,{' '}
                <kbd>←</kbd> <kbd>→</kbd> geser oktaf.
              </p>
            )}
          </>
        )}
      </main>

      <div className="keyboard-wrap" ref={keyboardRef}>
        <Keyboard
          first={first}
          last={last}
          octaveShift={octaveShift}
          labelMode={
            view === 'free' ? labelMode : coarsePointer ? 'none' : 'keys'
          }
          tracker={tracker}
          sustain={sustainOn}
          targets={view === 'free' ? undefined : targets}
          flash={view === 'free' ? null : flash}
        />
      </div>
    </div>
  )
}

export default App
