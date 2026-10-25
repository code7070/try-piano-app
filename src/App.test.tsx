import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  afterEach(cleanup)

  it('renders the app title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Piano' })).toBeInTheDocument()
  })

  it('opens the falling-notes game with Ibu Kita Kartini first', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('radio', { name: 'Main Lagu' }))
    expect(screen.getByRole('combobox', { name: 'Lagu' })).toHaveDisplayValue(
      'Ibu Kita Kartini',
    )
    expect(screen.getByRole('button', { name: '▶ Main' })).toBeInTheDocument()
  })
})
