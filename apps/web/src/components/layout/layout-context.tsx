"use client"

import * as React from "react"

export interface UserContext {
  id: string
  name: string
  email: string
}

export interface OrganizationContext {
  id: string
  name: string
  slug: string
}

interface LayoutContextType {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  user?: UserContext
  organization?: OrganizationContext
}

export const LayoutContext = React.createContext<LayoutContextType | undefined>(undefined)

export function LayoutProvider({ 
  children,
  user,
  organization
}: { 
  children: React.ReactNode
  user?: UserContext
  organization?: OrganizationContext
}) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)

  return (
    <LayoutContext.Provider value={{ sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed, user, organization }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const context = React.useContext(LayoutContext)
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider")
  }
  return context
}
