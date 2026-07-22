import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeToggle } from './theme-toggle'
import { ThemeProvider } from './theme-provider'
import { describe, it, expect } from 'vitest'

describe('ThemeToggle', () => {
  it('renders correctly', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )
    expect(screen.getByRole('button', { name: /Toggle theme/i })).toBeInTheDocument()
  })

  it('can toggle menu and show options', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    )
    
    const button = screen.getByRole('button', { name: /Toggle theme/i })
    fireEvent.click(button)
    
    expect(screen.getByText('Claro')).toBeInTheDocument()
    expect(screen.getByText('Escuro')).toBeInTheDocument()
    expect(screen.getByText('Sistema')).toBeInTheDocument()
  })
})
