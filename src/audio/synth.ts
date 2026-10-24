import type { NoteSink } from '../input/NoteTracker.ts'
import { HIGHEST_MIDI, LOWEST_MIDI, midiToFrequency } from '../music/notes.ts'

export interface Synth extends NoteSink {
  setSustain(on: boolean): void
  setVolume(volume: number): void
  allNotesOff(): void
}

interface Voice {
  gain: GainNode
  oscillators: OscillatorNode[]
}

const MAX_VOICES = 32
const VELOCITY = 0.8
// Piano-like partials: a triangle fundamental plus two quiet overtones.
const PARTIALS = [
  { type: 'triangle', ratio: 1, level: 1 },
  { type: 'sine', ratio: 2, level: 0.35 },
  { type: 'sine', ratio: 3, level: 0.1 },
] as const

export function isAudioSupported(): boolean {
  return typeof window !== 'undefined' && 'AudioContext' in window
}

/**
 * Placeholder synth until piano samples land (PRD Phase 2). The AudioContext is
 * created lazily so the first one comes from a user gesture.
 */
export function createSynth(): Synth {
  let audio: { ctx: AudioContext; master: GainNode } | null = null
  let volume = 0.8
  let sustain = false
  const voices = new Map<number, Voice>()
  const sustained = new Set<number>()

  function getAudio() {
    if (!audio) {
      const ctx = new AudioContext({ latencyHint: 'interactive' })
      const master = ctx.createGain()
      master.gain.value = volume
      const limiter = ctx.createDynamicsCompressor()
      limiter.threshold.value = -10
      limiter.ratio.value = 8
      master.connect(limiter).connect(ctx.destination)
      audio = { ctx, master }
    }
    if (audio.ctx.state === 'suspended') void audio.ctx.resume()
    return audio
  }

  function fadeOut(voice: Voice, timeConstant: number) {
    if (!audio) return
    const now = audio.ctx.currentTime
    const level = voice.gain.gain
    level.cancelScheduledValues(now)
    level.setValueAtTime(level.value, now)
    level.setTargetAtTime(0, now, timeConstant)
    for (const osc of voice.oscillators) osc.stop(now + timeConstant * 8)
  }

  function stop(midi: number, timeConstant: number) {
    const voice = voices.get(midi)
    if (!voice) return
    voices.delete(midi)
    fadeOut(voice, timeConstant)
  }

  return {
    noteOn(midi) {
      const { ctx, master } = getAudio()
      stop(midi, 0.01)
      sustained.delete(midi)
      if (voices.size >= MAX_VOICES) {
        const oldest = voices.keys().next().value
        if (oldest !== undefined) stop(oldest, 0.02)
      }

      const now = ctx.currentTime
      const frequency = midiToFrequency(midi)
      const height = (midi - LOWEST_MIDI) / (HIGHEST_MIDI - LOWEST_MIDI)
      const ring = 3.2 - 2.4 * height // low notes ring longer
      const peak = 0.3 * VELOCITY

      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(Math.min(frequency * 10, 16000), now)
      filter.frequency.setTargetAtTime(Math.min(frequency * 3, 8000), now, 0.4)

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(peak, now + 0.004)
      gain.gain.setTargetAtTime(peak * 0.35, now + 0.004, 0.12)
      gain.gain.setTargetAtTime(0, now + 0.4, ring / 3)
      filter.connect(gain).connect(master)

      const oscillators = PARTIALS.map(({ type, ratio, level }) => {
        const osc = ctx.createOscillator()
        osc.type = type
        osc.frequency.value = frequency * ratio
        const partialGain = ctx.createGain()
        partialGain.gain.value = level
        osc.connect(partialGain).connect(filter)
        osc.start(now)
        osc.stop(now + 0.4 + ring * 2)
        return osc
      })

      const voice: Voice = { gain, oscillators }
      oscillators[0].onended = () => {
        gain.disconnect()
        if (voices.get(midi) === voice) voices.delete(midi)
      }
      voices.set(midi, voice)
    },

    noteOff(midi) {
      if (sustain) {
        sustained.add(midi)
        return
      }
      stop(midi, 0.1)
    },

    setSustain(on) {
      sustain = on
      if (on) return
      for (const midi of sustained) stop(midi, 0.1)
      sustained.clear()
    },

    setVolume(next) {
      volume = next
      if (audio)
        audio.master.gain.setTargetAtTime(next, audio.ctx.currentTime, 0.02)
    },

    allNotesOff() {
      sustained.clear()
      for (const midi of [...voices.keys()]) stop(midi, 0.05)
    },
  }
}
