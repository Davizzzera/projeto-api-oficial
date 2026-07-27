"use client"

import { Button } from "@/components/ui/button"
import { Building2, ChevronsUpDown, Check, Loader2 } from "lucide-react"
import { useLayout } from "@/components/layout/layout-context"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"

interface OrganizationItem {
  id: string
  name: string
  slug: string
  roleCode: string
  isCurrent: boolean
}

export function OrganizationSwitcher() {
  const { organization } = useLayout()
  const [open, setOpen] = useState(false)
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const fetchOrganizations = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/organizations", {
        method: "GET",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to fetch organizations")
      const data: OrganizationItem[] = await res.json()
      setOrganizations(data)
    } catch {
      setError("Não foi possível carregar as organizações.")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleToggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev
      if (next) {
        fetchOrganizations()
      }
      return next
    })
  }, [fetchOrganizations])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  const handleSwitch = async (targetOrgId: string) => {
    if (switching) return
    setSwitching(true)
    setError("")
    try {
      // Step 1: Get CSRF token for switch-organization
      const csrfRes = await fetch("/api/auth/csrf?action=auth:switch-organization", {
        method: "GET",
        credentials: "include",
      })
      if (!csrfRes.ok) throw new Error("CSRF fetch failed")
      const { csrfToken } = await csrfRes.json()

      // Step 2: Switch organization
      const switchRes = await fetch("/api/auth/switch-organization", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ organizationId: targetOrgId }),
      })

      if (switchRes.status === 204) {
        setOpen(false)
        // Force full reload to refresh all contexts with the new org
        router.refresh()
        return
      }
      throw new Error("Switch failed")
    } catch {
      setError("Não foi possível trocar de organização.")
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        className="w-[200px] justify-between px-3 h-10"
        onClick={handleToggle}
        disabled={switching}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
            {switching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
          </div>
          <span className="truncate text-sm font-medium">{organization?.name || "Organização"}</span>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </Button>
      {open && (
        <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-surface ring-1 ring-muted-foreground/20 z-50">
          <div className="p-2">
            <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Organizações
            </p>
            {loading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {error && (
              <p className="px-2 py-2 text-sm text-destructive" aria-live="polite">{error}</p>
            )}
            {!loading && !error && organizations.length === 0 && (
              <p className="px-2 py-2 text-sm text-muted-foreground">Nenhuma organização encontrada.</p>
            )}
            {!loading && organizations.map((org) => (
              <button
                key={org.id}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
                onClick={() => {
                  if (!org.isCurrent) {
                    handleSwitch(org.id)
                  }
                }}
                disabled={org.isCurrent || switching}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col items-start overflow-hidden flex-1">
                  <span className="truncate font-medium w-full text-left">{org.name}</span>
                  <span className="text-xs text-muted-foreground">{org.roleCode}</span>
                </div>
                {org.isCurrent && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
