import { render, screen } from '@testing-library/react'
import DashboardPage from './page'
import { describe, it, expect, vi } from 'vitest'

// Mock Recharts since it requires container size which JSDOM doesn't provide
vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual<typeof import('recharts')>('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: '100px', height: '100px' }}>{children}</div>
    ),
  }
})

describe('DashboardPage', () => {
  it('renders the overview section and metrics', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Visão Geral')).toBeInTheDocument()
    expect(screen.getByText('Mensagens Enviadas')).toBeInTheDocument()
    expect(screen.getByText('Taxa de Entrega')).toBeInTheDocument()
    expect(screen.getByText('Campanhas Ativas')).toBeInTheDocument()
  })

  it('renders friendly filter texts and no technical values', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Últimos 7 dias')).toBeInTheDocument()
    expect(screen.getByText('Todas as conexões')).toBeInTheDocument()
    
    // Validate technical strings are not visible
    expect(screen.queryByText('7d', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByText('all', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByText('last_7_days', { exact: true })).not.toBeInTheDocument()
    expect(screen.queryByText('all_connections', { exact: true })).not.toBeInTheDocument()
  })
})
