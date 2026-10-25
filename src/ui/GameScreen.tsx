import { useEffect, useRef, useState } from 'react'
import { GAME_SONGS } from '../content/songs.ts'
import { gameRecap, JUDGEMENT_NAMES } from '../i18n/id.ts'
import { keyLabels } from '../input/keyboardMap.ts'
import type { NoteTracker } from '../input/NoteTracker.ts'
import { GOOD_MS, starsFor, TempoMatcher } from '../lesson/tempoMatcher.ts'
import type { Judgement, TempoStats } from '../lesson/tempoMatcher.ts'
import { keyLayout, notAngka, noteName } from '../music/notes.ts'
import type { KeyFlash, KeyTarget } from './Keyboard.tsx'
import { onRadioKeyDown } from './radio.ts'
import { drawWaterfall, FALL_MS, readColors } from './waterfall.ts'
import type { NoteText, WaterfallColors } from './waterfall.ts'
import './game.css'

type Mode = 'idle' | 'play' | 'demo' | 'done'
type NoteLabel = 'angka' | 'note' | 'keys'

interface GameScreenProps {
  tracker: NoteTracker
  first: number
  last: number
  octaveShift: number
  touch: boolean
  onTargets: (targets: KeyTarget[]) => void
  onFlash: (flash: KeyFlash) => void
}

interface Run {
  matcher: TempoMatcher
  /** performance.now() at which the first note reaches the hit line. */
  zero: number
  demo: boolean
  raf: number
  /** Demo notes played so far, and when each sounding one lets go. */
  played: number
  sounding: Map<string, number>
  hitAt: Map<number, number>
}

// Time before the first note lands, so it can be seen falling the whole way.
const LEAD_IN_MS = FALL_MS + 800
const TAIL_MS = 1200

const TEMPO_OPTIONS: { value: number; text: string }[] = [
  { value: 0.6, text: 'Pelan' },
  { value: 0.8, text: 'Sedang' },
  { value: 1, text: 'Asli' },
]

const LABEL_OPTIONS: { value: NoteLabel; text: string }[] = [
  { value: 'angka', text: 'Angka' },
  { value: 'note', text: 'Nada' },
  { value: 'keys', text: 'Tombol' },
]

function noteText(midi: number, mode: NoteLabel, octaveShift: number) {
  if (mode === 'angka') {
    const { degree, octave } = notAngka(midi)
    return { text: degree, dots: octave }
  }
  if (mode === 'keys')
    return { text: keyLabels(midi, octaveShift)[0] ?? '', dots: 0 }
  return { text: noteName(midi).replace(/-?\d+$/, ''), dots: 0 }
}

/** Accuracy over the notes judged so far, so a run does not open at 0%. */
function liveAccuracy({ perfect, good, miss, extra }: TempoStats): string {
  const judged = perfect + good + miss + extra
  return judged === 0
    ? '—'
    : `${Math.round(((perfect + good / 2) / judged) * 100)}%`
}

export function GameScreen({
  tracker,
  first,
  last,
  octaveShift,
  touch,
  onTargets,
  onFlash,
}: GameScreenProps) {
  const [songId, setSongId] = useState(GAME_SONGS[0].id)
  const [tempo, setTempo] = useState(0.8)
  const [labelMode, setLabelMode] = useState<NoteLabel>('angka')
  const [mode, setMode] = useState<Mode>('idle')
  const [stats, setStats] = useState<TempoStats | null>(null)
  const [call, setCall] = useState<{ kind: Judgement | 'extra'; id: number }>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const run = useRef<Run | null>(null)
  const callId = useRef(0)
  const targetKey = useRef('')
  // The frame loop reads these instead of props so it never restarts.
  const view = useRef({
    layout: keyLayout(first, last),
    label: (midi: number): NoteText => noteText(midi, labelMode, octaveShift),
    colors: null as WaterfallColors | null,
    size: { width: 0, height: 0 },
  })
  const song = GAME_SONGS.find((item) => item.id === songId) ?? GAME_SONGS[0]

  function draw() {
    const canvas = canvasRef.current
    const { layout, label, size } = view.current
    // Nothing to draw before the first resize measured the canvas.
    const ctx = size.width > 0 ? canvas?.getContext('2d') : null
    if (!canvas || !ctx) return
    view.current.colors ??= readColors(canvas)
    const current = run.current
    drawWaterfall(
      ctx,
      size.width,
      size.height,
      layout,
      view.current.colors,
      label,
      current && {
        notes: current.matcher.notes,
        judgements: current.matcher.judgements,
        hitAt: current.hitAt,
        now: performance.now() - current.zero,
      },
    )
  }

  function showTargets(current: Run | null) {
    const matcher = current?.matcher
    const next = matcher && !current.demo ? matcher.nextOpen() : -1
    const due =
      matcher && next >= 0
        ? matcher.notes.filter(
            (note, index) =>
              note.timeMs === matcher.notes[next].timeMs &&
              matcher.judgements[index] === null,
          )
        : []
    const key = due.map((note) => note.midi).join()
    if (key === targetKey.current) return
    targetKey.current = key
    onTargets(
      due.map((note) => ({
        midi: note.midi,
        hand: note.hand,
        letter: touch,
        keys: !touch,
        blink: false,
      })),
    )
  }

  function report(current: Run, kind: Judgement | 'extra', midi?: number) {
    setStats(current.matcher.stats())
    setCall({ kind, id: ++callId.current })
    if (midi !== undefined)
      onFlash({
        midi,
        kind: kind === 'extra' ? 'wrong' : 'ok',
        id: callId.current,
      })
    showTargets(current)
  }

  function release(current: Run) {
    cancelAnimationFrame(current.raf)
    for (const source of current.sounding.keys()) tracker.release(source)
    current.sounding.clear()
  }

  function stop() {
    const current = run.current
    if (!current) return
    release(current)
    run.current = null
    setMode('idle')
    showTargets(null)
    draw()
  }

  function finish(current: Run) {
    release(current)
    run.current = null
    setStats(current.matcher.stats())
    setMode(current.demo ? 'idle' : 'done')
    showTargets(null)
    draw()
  }

  function frame() {
    const current = run.current
    if (!current) return
    const now = performance.now() - current.zero
    const { matcher } = current

    if (current.demo) {
      for (const [source, end] of current.sounding) {
        // Let go a little early so a repeated note is struck again.
        if (now >= end - 40) {
          tracker.release(source)
          current.sounding.delete(source)
        }
      }
      while (
        current.played < matcher.notes.length &&
        matcher.notes[current.played].timeMs <= now
      ) {
        const note = matcher.notes[current.played]
        const source = `d:${current.played}`
        tracker.press(source, note.midi)
        current.sounding.set(source, note.endMs)
        const hit = matcher.press(note.midi, note.timeMs)
        if (hit.kind !== 'extra') current.hitAt.set(hit.index, now)
        current.played++
      }
    } else if (matcher.sweep(now).length > 0) report(current, 'miss')

    for (const [index, at] of current.hitAt)
      if (now - at > 500) current.hitAt.delete(index)
    draw()
    if (now > matcher.endMs + TAIL_MS) {
      finish(current)
      return
    }
    current.raf = requestAnimationFrame(frame)
  }

  function start(demo: boolean) {
    if (run.current) release(run.current)
    const current: Run = {
      matcher: new TempoMatcher(song.notes, 60000 / (song.tempo * tempo)),
      zero: performance.now() + LEAD_IN_MS,
      demo,
      raf: 0,
      played: 0,
      sounding: new Map(),
      hitAt: new Map(),
    }
    run.current = current
    setMode(demo ? 'demo' : 'play')
    setStats(demo ? null : current.matcher.stats())
    setCall(undefined)
    showTargets(current)
    current.raf = requestAnimationFrame(frame)
  }

  useEffect(() => {
    view.current.layout = keyLayout(first, last)
    view.current.label = (midi) => noteText(midi, labelMode, octaveShift)
    if (!run.current) draw()
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const scale = window.devicePixelRatio || 1
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      canvas.getContext('2d')?.setTransform(scale, 0, 0, scale, 0, 0)
      view.current.size = { width, height }
      if (!run.current) draw()
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  // Judges presses from every input against the song clock. Re-subscribes
  // every render, like the mentor, so the handler is never stale.
  useEffect(() =>
    tracker.subscribe((midi, down) => {
      const current = run.current
      if (!down || !current || current.demo) return
      const now = performance.now() - current.zero
      // Warming up during the lead-in is not an extra note.
      if (now < -GOOD_MS) return
      const hit = current.matcher.press(midi, now)
      if (hit.kind !== 'extra') current.hitAt.set(hit.index, now)
      report(current, hit.kind, midi)
    }),
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.code === 'Escape') stop()
    }
    function onVisibilityChange() {
      if (document.hidden) stop()
    }
    window.addEventListener('keydown', onKeyDown)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  })

  useEffect(
    () => () => {
      const current = run.current
      if (!current) return
      cancelAnimationFrame(current.raf)
      for (const source of current.sounding.keys()) tracker.release(source)
      run.current = null
    },
    [tracker],
  )

  useEffect(() => () => onTargets([]), [onTargets])

  const running = mode === 'play' || mode === 'demo'
  const stars = stats ? starsFor(stats.accuracy) : 0

  return (
    <section className="game" aria-label="Main Lagu">
      <div className="game-head">
        <label className="control">
          <span>Lagu</span>
          <select
            value={songId}
            disabled={running}
            onChange={(event) => {
              event.target.blur()
              setSongId(event.target.value)
              setMode('idle')
              setStats(null)
            }}
          >
            {GAME_SONGS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>

        <div className="control">
          <span>Tempo</span>
          <div
            className="segmented"
            role="radiogroup"
            aria-label="Tempo"
            onKeyDown={(event) =>
              !running && onRadioKeyDown(event, TEMPO_OPTIONS, tempo, setTempo)
            }
          >
            {TEMPO_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={tempo === option.value}
                tabIndex={tempo === option.value ? 0 : -1}
                disabled={running}
                onClick={() => setTempo(option.value)}
              >
                {option.text}
              </button>
            ))}
          </div>
        </div>

        <div className="control">
          <span>Label</span>
          <div
            className="segmented"
            role="radiogroup"
            aria-label="Label di balok nada"
            onKeyDown={(event) =>
              onRadioKeyDown(event, LABEL_OPTIONS, labelMode, setLabelMode)
            }
          >
            {LABEL_OPTIONS.filter(
              (option) => !touch || option.value !== 'keys',
            ).map((option) => (
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
      </div>

      <div className="game-hud">
        {mode === 'play' && stats ? (
          <>
            <span className="game-stat">
              Akurasi <b>{liveAccuracy(stats)}</b>
            </span>
            <span className="game-stat">
              Kombo <b>{stats.combo}</b>
            </span>
            {call && (
              <span
                key={call.id}
                className="game-call"
                data-kind={call.kind}
                aria-live="off"
              >
                {JUDGEMENT_NAMES[call.kind]}
              </span>
            )}
          </>
        ) : (
          <span className="game-meta">
            {song.title}
            {song.composer && ` · ${song.composer}`} ·{' '}
            {Math.round(song.tempo * tempo)} BPM
          </span>
        )}
        <span className="game-actions">
          {running ? (
            <button type="button" className="btn" onClick={stop}>
              Berhenti <kbd>Esc</kbd>
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => start(false)}
              >
                {mode === 'done' ? '↻ Main lagi' : '▶ Main'}
              </button>
              <button type="button" className="btn" onClick={() => start(true)}>
                Dengar dulu
              </button>
            </>
          )}
        </span>
      </div>

      <div className="waterfall">
        <canvas ref={canvasRef} aria-hidden="true" />
        {mode === 'idle' && (
          <p className="waterfall-note">
            Balok nada jatuh ke tutsnya. Tekan tuts tepat saat balok menyentuh
            garis.
            {labelMode === 'angka' &&
              ' Angka di balok adalah not angka: 1 = do = C, titik di atas berarti satu oktaf lebih tinggi.'}
            {!touch && ' Tombol laptop tertulis di tuts.'}
          </p>
        )}
        {mode === 'done' && stats && (
          <div className="game-result" role="status">
            <p className="game-stars" aria-label={`${stars} dari 3 bintang`}>
              {'★'.repeat(stars)}
              <span>{'★'.repeat(3 - stars)}</span>
            </p>
            <p>{gameRecap(stats, tempo)}</p>
            <p className="game-counts">
              {JUDGEMENT_NAMES.perfect} {stats.perfect} · {JUDGEMENT_NAMES.good}{' '}
              {stats.good} · {JUDGEMENT_NAMES.miss} {stats.miss} ·{' '}
              {JUDGEMENT_NAMES.extra} {stats.extra} · Kombo terbaik{' '}
              {stats.maxCombo}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
