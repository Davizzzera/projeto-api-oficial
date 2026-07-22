import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from './sidebar'
import { LayoutProvider, useLayout } from './layout-context'
import { describe, it, expect } from 'vitest'

// Wrapper to expose context for testing
const SidebarTestWrapper = () => {
  return (
    <LayoutProvider>
      <Sidebar />
      <TestControls />
    </LayoutProvider>
  )
}

const TestControls = () => {
  const { setSidebarCollapsed, setSidebarOpen } = useLayout()
  return (
    <div>
      <button onClick={() => setSidebarCollapsed(true)}>Colapsar</button>
      <button onClick={() => setSidebarOpen(true)}>Abrir Mobile</button>
    </div>
  )
}

describe('Sidebar', () => {
  it('renders all main groups when expanded', () => {
    render(<SidebarTestWrapper />)
    expect(screen.getByText('Visão geral')).toBeInTheDocument()
    expect(screen.getByText('Operação')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('hides group titles when collapsed', () => {
    render(<SidebarTestWrapper />)
    
    // Collapse sidebar
    fireEvent.click(screen.getByText('Colapsar'))
    
    // Group titles should not be visible
    expect(screen.queryByText('Visão geral')).not.toBeInTheDocument()
    expect(screen.queryByText('Operação')).not.toBeInTheDocument()
    // The items might only exist in tooltips, but since tooltips are radix, 
    // the text is inside a portal or visually hidden button text.
  })
})
