"use client"

import { Menu, Search, Bell, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLayout } from "./layout-context"
import { OrganizationSwitcher } from "@/components/ui-custom/organization-switcher"
import { Input } from "@/components/ui/input"
import UserMenu from "./user-menu"

export function Header() {
  const { setSidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useLayout()

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-surface px-4 shadow-sm md:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex text-muted-foreground hover:text-foreground"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        
        <div className="hidden sm:block">
          <OrganizationSwitcher />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative hidden lg:block w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search"
            placeholder="Buscar..."
            className="pl-8 bg-background border-none focus-visible:ring-1"
          />
        </div>
        
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
          <span className="sr-only">Notificações</span>
        </Button>
        
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  )
}
