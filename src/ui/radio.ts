import type { KeyboardEvent as ReactKeyboardEvent } from 'react'

const ARROW_STEP: Record<string, number> = {
  ArrowLeft: -1,
  ArrowUp: -1,
  ArrowRight: 1,
  ArrowDown: 1,
}

/** Arrow keys move the selection inside a radiogroup, wrapping at the ends. */
export function onRadioKeyDown<T>(
  event: ReactKeyboardEvent<HTMLDivElement>,
  options: { value: T }[],
  current: T,
  select: (value: T) => void,
) {
  const step = ARROW_STEP[event.key]
  if (!step) return
  event.preventDefault()
  const index = options.findIndex((option) => option.value === current)
  const next = (index + step + options.length) % options.length
  select(options[next].value)
  const button = event.currentTarget.children[next]
  if (button instanceof HTMLElement) button.focus()
}
