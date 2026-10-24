export interface NoteSink {
  noteOn(midi: number): void
  noteOff(midi: number): void
}

type Listener = (midi: number, down: boolean) => void

/**
 * Tracks which input sources (pointers, laptop keys) hold which notes. A note
 * starts when its first source presses it and stops when its last source lets
 * go, so two fingers on one key never cut each other off.
 */
export class NoteTracker {
  private readonly sink: NoteSink
  private readonly holders = new Map<number, Set<string>>()
  private readonly noteBySource = new Map<string, number>()
  private readonly listeners = new Set<Listener>()

  constructor(sink: NoteSink) {
    this.sink = sink
  }

  press(source: string, midi: number): void {
    this.release(source)
    const sources = this.holders.get(midi) ?? new Set<string>()
    sources.add(source)
    this.holders.set(midi, sources)
    this.noteBySource.set(source, midi)
    if (sources.size === 1) {
      this.sink.noteOn(midi)
      this.emit(midi, true)
    }
  }

  release(source: string): void {
    const midi = this.noteBySource.get(source)
    if (midi === undefined) return
    this.noteBySource.delete(source)
    const sources = this.holders.get(midi)
    sources?.delete(source)
    if (!sources || sources.size === 0) {
      this.holders.delete(midi)
      this.sink.noteOff(midi)
      this.emit(midi, false)
    }
  }

  releaseAll(filter: (source: string) => boolean = () => true): void {
    for (const source of [...this.noteBySource.keys()]) {
      if (filter(source)) this.release(source)
    }
  }

  noteOf(source: string): number | undefined {
    return this.noteBySource.get(source)
  }

  isDown(midi: number): boolean {
    return this.holders.has(midi)
  }

  heldNotes(): number[] {
    return [...this.holders.keys()].sort((a, b) => a - b)
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(midi: number, down: boolean): void {
    for (const listener of this.listeners) listener(midi, down)
  }
}
