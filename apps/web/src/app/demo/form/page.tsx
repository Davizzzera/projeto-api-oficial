"use client"

import { PageHeader } from "@/components/ui-custom/page-header"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from "lucide-react"
import { useState } from "react"

export default function DemoFormPage() {
  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setHasError(true)
    }, 1500)
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <PageHeader 
        title="Formulário de Demonstração" 
        description="Exemplo de formulário complexo com validações, estados e múltiplos inputs."
      />

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Configurações da Campanha</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para configurar uma nova campanha de disparo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Campanha <span className="text-destructive">*</span></Label>
              <Input 
                id="name" 
                placeholder="Ex: Black Friday 2026" 
                className={hasError ? "border-destructive focus-visible:ring-destructive" : ""} 
              />
              {hasError && (
                <p className="text-sm font-medium text-destructive flex items-center gap-1 mt-1">
                  <AlertCircle className="h-4 w-4" />
                  O nome da campanha é obrigatório.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Este nome será visível apenas internamente.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="template">Template da Mensagem</Label>
                <Select defaultValue="t1">
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="t1">Promo_Desconto_V1</SelectItem>
                    <SelectItem value="t2">Alerta_Vencimento</SelectItem>
                    <SelectItem value="t3">Boas_Vindas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="connection">Conexão</Label>
                <Select disabled>
                  <SelectTrigger id="connection" className="bg-muted/50">
                    <SelectValue placeholder="WABA Principal (Bloqueada)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="w1">WABA Principal</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Esta conexão está temporariamente indisponível.
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message">Variáveis da Mensagem (Opcional)</Label>
              <Textarea 
                id="message" 
                placeholder='{"nome": "João", "desconto": "20%"}'
                className="font-mono text-sm h-24"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4 shadow-sm bg-surface-muted/50">
              <div className="space-y-0.5">
                <Label className="text-base">Aprovação Automática</Label>
                <p className="text-sm text-muted-foreground">
                  A campanha será iniciada assim que a lista for processada.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-6 bg-muted/20">
            <Button variant="outline" type="button" onClick={() => setHasError(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Campanha"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
