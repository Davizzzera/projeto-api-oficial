"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { APP_NAME } from "@/lib/constants"
import { Network, Loader2, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    setTimeout(() => {
      setLoading(false)
      setError(true) // Simulate error for demo
    }, 1500)
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
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Credenciais inválidas. Tente novamente.
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email corporativo</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nome@empresa.com" 
                  required 
                  className="bg-surface"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link href="#" className="text-sm text-primary hover:underline font-medium">
                    Esqueceu a senha?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  className="bg-surface"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                Lembrar meu acesso por 30 dias
              </Label>
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

          <div className="text-center text-sm text-muted-foreground pt-4">
            Ainda não possui uma conta?{" "}
            <Link href="#" className="text-primary font-medium hover:underline">
              Fale com um consultor
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
