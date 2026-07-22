"use client"

import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { LayoutProvider, useLayout } from "./layout-context"
import { cn } from "@/lib/utils"

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useLayout()

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <Sidebar />
      <div 
        className={cn(
          "flex flex-1 flex-col h-dvh transition-all duration-300 ease-in-out overflow-hidden",
          sidebarCollapsed ? "md:pl-[72px]" : "md:pl-[248px]"
        )}
      >
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <AppShellInner>{children}</AppShellInner>
    </LayoutProvider>
  )
}
