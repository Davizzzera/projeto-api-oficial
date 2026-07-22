"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { APP_NAME } from "@/lib/constants"
import { Network, Loader2, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      // Step 1: Get CSRF token
      const csrfRes = await fetch("/api/auth/csrf", {
        method: "GET",
        headers: { "Accept": "application/json" }
      })

      if (!csrfRes.ok) {
        throw new Error("Não foi possível iniciar a sessão segura.")
      }

      const { csrfToken } = await csrfRes.json()

      // Step 2: Login
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify({ email, password })
      })

      if (loginRes.ok || loginRes.status === 204) {
        router.push("/dashboard")
        return
      }

      if (loginRes.status === 401) {
        setErrorMsg("Credenciais inválidas. Tente novamente.")
      } else if (loginRes.status === 403) {
        setErrorMsg("Sessão inválida ou expirada. Tente novamente.")
      } else if (loginRes.status === 429) {
        setErrorMsg("Muitas tentativas. Tente novamente mais tarde.")
      } else {
        setErrorMsg("Erro ao autenticar. Tente novamente.")
      }
    } catch {
      setErrorMsg("Erro de conexão. Verifique sua rede e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Pane - Branding */}
      <div className="hidden lg:flex w-1/2 bg-primary flex-col justify-between p-12 text-primary-foreground relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground text-primary">
            <Network className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">{APP_NAME}</span>
        </div>
        
        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-4xl font-bold leading-tight">
            Gestão inteligente para sua operação.
          </h1>
          <p className="text-lg opacity-80">
            Acompanhe campanhas, gerencie conexões e atenda seus clientes com eficiência em uma única plataforma premium.
          </p>
        </div>

        <div className="relative z-10 text-sm opacity-60">
          © {new Date().getFullYear()} {APP_NAME} Inc. Todos os direitos reservados.
        </div>

        {/* Abstract Background Decoration */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Right Pane - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col space-y-2 text-center lg:text-left">
            <div className="flex lg:hidden items-center justify-center gap-2 mb-6 text-primary">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Network className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">{APP_NAME}</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Bem-vindo de volta</h2>
            <p className="text-muted-foreground">
              Insira suas credenciais para acessar a plataforma.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {errorMsg}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email corporativo</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder="nome@empresa.com" 
                  required 
                  className="bg-surface"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                </div>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  required 
                  className="bg-surface"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 text-base font-medium" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Autenticando...
                </>
              ) : (
                "Entrar na plataforma"
              )}
            </Button>
          </form>

        </div>
      </div>
    </div>
  )
}
