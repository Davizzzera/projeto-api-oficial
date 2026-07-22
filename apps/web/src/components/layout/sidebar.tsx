"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { useLayout } from "./layout-context"
import { APP_NAME } from "@/lib/constants"
import { 
  Activity, 
  BarChart3, 
  MessageSquare, 
  Users, 
  FileText, 
  Workflow, 
  Zap, 
  Settings, 
  Link as LinkIcon, 
  UserCircle,
  Network
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
}

interface NavGroup {
  title: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: "Visão geral",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: Activity },
    ]
  },
  {
    title: "Operação",
    items: [
      { title: "Atendimento", href: "/inbox", icon: MessageSquare },
      { title: "Campanhas", href: "/campaigns", icon: Zap },
      { title: "Contatos", href: "/contacts", icon: Users },
      { title: "Templates", href: "/templates", icon: FileText },
    ]
  },
  {
    title: "Automação",
    items: [
      { title: "Fluxos", href: "/flows", icon: Workflow },
    ]
  },
  {
    title: "Análises",
    items: [
      { title: "Relatórios", href: "/reports", icon: BarChart3 },
    ]
  },
  {
    title: "Administração",
    items: [
      { title: "Conexões", href: "/connections", icon: LinkIcon },
      { title: "Usuários", href: "/users", icon: UserCircle },
      { title: "Configurações", href: "/settings", icon: Settings },
    ]
  }
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed } = useLayout()

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <TooltipProvider>
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-surface transition-all duration-300 ease-in-out font-sans",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            sidebarCollapsed ? "w-[72px]" : "w-[248px]"
          )}
        >
          <div className="flex h-16 shrink-0 items-center border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Network className="h-5 w-5" />
              </div>
              {!sidebarCollapsed && <span className="text-lg tracking-tight">{APP_NAME}</span>}
            </Link>
          </div>

          <div className="flex-1 overflow-auto py-4">
            <nav className="grid gap-6 px-2">
              {navGroups.map((group, index) => (
                <div key={index} className="flex flex-col gap-1">
                  {!sidebarCollapsed && (
                    <div className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 mt-2">
                      {group.title}
                    </div>
                  )}
                  {group.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                    
                    const LinkContent = (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={cn(
                          buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                          "justify-start",
                          sidebarCollapsed ? "w-12 h-12 p-0 justify-center mx-auto" : "w-full",
                          isActive ? "bg-secondary text-primary font-medium" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className={cn("shrink-0", sidebarCollapsed ? "h-5 w-5" : "h-4 w-4 mr-2")} />
                        {!sidebarCollapsed && <span>{item.title}</span>}
                      </Link>
                    )

                    if (sidebarCollapsed) {
                      return (
                        <Tooltip key={item.href}>
                          <TooltipTrigger className={cn(
                            buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                            "w-12 h-12 p-0 justify-center mx-auto",
                            isActive ? "bg-secondary text-primary font-medium" : "text-muted-foreground hover:bg-surface-muted hover:text-foreground"
                          )} onClick={() => setSidebarOpen(false)}>
                            <item.icon className="h-5 w-5 shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="flex items-center gap-4">
                            {item.title}
                          </TooltipContent>
                        </Tooltip>
                      )
                    }

                    return LinkContent
                  })}
                </div>
              ))}
            </nav>
          </div>
        </aside>
      </TooltipProvider>
    </>
  )
}
