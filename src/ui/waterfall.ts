import type { Judgement, TimedNote } from '../lesson/tempoMatcher.ts'
import type { KeyBox } from '../music/notes.ts'

export interface NoteText {
  text: string
  /** Not angka octave dots: above when positive, below when negative. */
  dots: number
}

export interface WaterfallColors {
  left: string
  right: string
  accent: string
  ink: string
  muted: string
  lane: string
}

export interface WaterfallFrame {
  notes: TimedNote[]
  judgements: (Judgement | null)[]
  /** Song time each note was hit, for the burst on the hit line. */
  hitAt: Map<number, number>
  now: number
}

// How long a note takes to fall from the top edge to the hit line.
export const FALL_MS = 2400
const BURST_MS = 260

export function readColors(el: Element): WaterfallColors {
  const style = getComputedStyle(el)
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback
  return {
    left: read('--left-hand', '#4fb8a8'),
    right: read('--right-hand', '#eeb35b'),
    accent: read('--accent', '#eeb35b'),
    ink: read('--accent-ink', '#2a1a05'),
    muted: read('--border', '#3a332e'),
    lane: read('--surface', '#211c19'),
  }
}

function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.beginPath()
  if (typeof ctx.roundRect === 'function')
    ctx.roundRect(x, y, w, h, Math.min(6, w / 3, h / 2))
  else ctx.rect(x, y, w, h)
  ctx.fill()
}

/**
 * Draws one frame of falling notes. Each note's bottom edge reaches the hit
 * line (the canvas bottom, right above the keys) at its time.
 */
export function drawWaterfall(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  layout: Map<number, KeyBox>,
  colors: WaterfallColors,
  label: (midi: number) => NoteText,
  frame: WaterfallFrame | null,
) {
  ctx.clearRect(0, 0, width, height)
  const px = (percent: number) => (percent / 100) * width

  // Black-key lanes are shaded and every C gets a guide line.
  for (const [midi, key] of layout) {
    if (key.black) {
      ctx.fillStyle = colors.lane
      ctx.fillRect(px(key.left), 0, px(key.width), height)
    } else if (midi % 12 === 0) {
      ctx.fillStyle = colors.muted
      ctx.fillRect(px(key.left), 0, 1, height)
    }
  }
  ctx.fillStyle = colors.accent
  ctx.fillRect(0, height - 3, width, 3)
  if (!frame) return

  const { notes, judgements, hitAt, now } = frame
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i]
    const bottom = height * (1 - (note.timeMs - now) / FALL_MS)
    if (bottom < 0) break
    const key = layout.get(note.midi)
    const top = height * (1 - (note.endMs - now) / FALL_MS) + 3
    if (!key || top > height) continue

    const judgement = judgements[i]
    const inset = key.black ? 1 : 3
    const x = px(key.left) + inset
    const w = px(key.width) - inset * 2
    ctx.globalAlpha = judgement === null ? 1 : judgement === 'miss' ? 0.8 : 0.4
    ctx.fillStyle =
      judgement === 'miss'
        ? colors.muted
        : note.hand === 'L'
          ? colors.left
          : colors.right
    box(ctx, x, top, w, bottom - top)

    const { text, dots } = label(note.midi)
    if (text && bottom - top >= 22) {
      const size = Math.max(10, Math.min(15, w * 0.5))
      const y = bottom - 6 - (dots < 0 ? 6 : 0)
      ctx.fillStyle = judgement === 'miss' ? '#a89f95' : colors.ink
      ctx.font = `700 ${size}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(text, x + w / 2, y)
      for (let d = 0; d < Math.abs(dots); d++) {
        const dy = dots > 0 ? y - size - 3 - d * 5 : y + 5 + d * 5
        ctx.beginPath()
        ctx.arc(x + w / 2, dy, 1.8, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalAlpha = 1
  }

  // A short burst on the hit line confirms every hit.
  for (const [index, at] of hitAt) {
    const age = now - at
    const key = layout.get(notes[index].midi)
    if (age > BURST_MS || !key) continue
    ctx.globalAlpha = 1 - age / BURST_MS
    ctx.fillStyle = colors.accent
    const grow = (age / BURST_MS) * 10
    ctx.fillRect(
      px(key.left) - grow,
      height - 8 - grow,
      px(key.width) + grow * 2,
      8,
    )
    ctx.globalAlpha = 1
  }
}
