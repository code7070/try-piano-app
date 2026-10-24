import { useCallback, useEffect, useRef, useState } from 'react'
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
import type { LabelMode } from './ui/Keyboard.tsx'
import './ui/piano.css'

const coarsePointer =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(pointer: coarse)').matches

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
  const keyboardRef = useRef<HTMLDivElement>(null)
  const octaveShiftRef = useRef(octaveShift)
  const width = useWidth(keyboardRef)

  const sustainOn = sustainLatched || spaceHeld
  const whiteCount = Math.min(Math.floor(width / (coarsePointer ? 44 : 34)), 36)
  const { first, last } = visibleRange(whiteCount, octaveShift)
  const [mappedLow, mappedHigh] = mappedRange(octaveShift)

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
        if (event.target instanceof HTMLInputElement) return
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
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>Piano</h1>
          <p>Belajar dan latihan piano dari nol</p>
        </div>

        <div className="controls">
          <div className="control">
            <span>Oktaf</span>
            <div className="stepper">
              <button
                type="button"
                className="btn"
                aria-label="Geser oktaf turun"
                disabled={octaveShift === MIN_OCTAVE_SHIFT}
                onClick={() => shiftOctave(-1)}
              >
                ‹
              </button>
              <span className="stepper-value">
                {noteName(mappedLow)}–{noteName(mappedHigh)}
              </span>
              <button
                type="button"
                className="btn"
                aria-label="Geser oktaf naik"
                disabled={octaveShift === MAX_OCTAVE_SHIFT}
                onClick={() => shiftOctave(1)}
              >
                ›
              </button>
            </div>
          </div>

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

          <div className="control">
            <span>Label</span>
            <div className="segmented" role="radiogroup" aria-label="Label">
              {LABEL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={labelMode === option.value}
                  onClick={() => setLabelMode(option.value)}
                >
                  {option.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="stage">
        {!isAudioSupported() && (
          <p className="notice">
            Browser ini tidak mendukung Web Audio, jadi suara tidak bisa
            diputar. Coba Chrome, Edge, Firefox, atau Safari terbaru.
          </p>
        )}
        <output className="now-playing" aria-live="polite">
          {held.length > 0 ? held.map(noteName).join(' ') : '—'}
        </output>
        <p className="hint">
          Klik atau sentuh tuts. Di laptop: <kbd>Z</kbd>–<kbd>/</kbd> tangan
          kiri, <kbd>Q</kbd>–<kbd>]</kbd> tangan kanan (baris di atasnya untuk
          tuts hitam), <kbd>Space</kbd> sustain, <kbd>←</kbd> <kbd>→</kbd> geser
          oktaf.
        </p>
      </main>

      <div className="keyboard-wrap" ref={keyboardRef}>
        <Keyboard
          first={first}
          last={last}
          octaveShift={octaveShift}
          labelMode={labelMode}
          tracker={tracker}
        />
      </div>
    </div>
  )
}

export default App
