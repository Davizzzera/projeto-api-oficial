// apps/web/src/components/layout/user-menu.tsx
"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLayout } from "./layout-context"

export default function UserMenu() {
  const { user, organization } = useLayout()
  const [menuOpen, setMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogout = async () => {
    if (loading) return
    setLoading(true)
    setError("")
    try {
      const csrfRes = await fetch("/api/auth/csrf", {
        method: "GET",
        credentials: "include",
      })
      if (!csrfRes.ok) throw new Error("CSRF fetch failed")
      const { csrfToken } = await csrfRes.json()
      const logoutRes = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "x-csrf-token": csrfToken },
      })
      if (logoutRes.status === 204) {
        router.replace("/login")
        return
      }
      throw new Error("Logout failed")
    } catch (e) {
      console.error(e)
      setError("Não foi possível sair. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ml-2 pl-2 border-l">
      <div>
        <div
          data-testid="user-menu-trigger"
          className="relative"
        >
          <Avatar 
            className="h-8 w-8 cursor-pointer ring-offset-background transition-all hover:ring-2 hover:ring-ring hover:ring-offset-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <AvatarFallback>{user?.name ? user.name.substring(0, 2).toUpperCase() : "US"}</AvatarFallback>
          </Avatar>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-surface ring-1 ring-muted-foreground z-10">
              <div className="p-3 border-b">
                <p className="font-medium">{user?.name || "Usuário"}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-sm text-muted-foreground">{organization?.name}</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
              >
                {loading ? "Saindo..." : "Sair"}
              </button>
              {error && (
                <div aria-live="polite" className="p-2 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
