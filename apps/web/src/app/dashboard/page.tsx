"use client"

import * as React from "react"
import { PageHeader } from "@/components/ui-custom/page-header"
import { MetricCard } from "@/components/ui-custom/metric-card"
import { DashboardChart } from "@/components/ui-custom/dashboard-chart"
import { CampaignProgress } from "@/components/ui-custom/campaign-progress"
import { StatusIndicator } from "@/components/ui-custom/status-indicator"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, CheckCircle2, Eye, MessageCircle, AlertTriangle, Plus, ArrowRight } from "lucide-react"

export default function DashboardPage() {
  const [period, setPeriod] = React.useState("7d")
  const [connection, setConnection] = React.useState("all")

  const periodLabels: Record<string, string> = {
    "24h": "Últimas 24 horas",
    "7d": "Últimos 7 dias",
    "30d": "Últimos 30 dias",
    "month": "Este mês"
  }

  const connectionLabels: Record<string, string> = {
    "all": "Todas as conexões",
    "waba_1": "WABA Oficial 1"
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Visão Geral" 
        description="Acompanhe o desempenho das suas campanhas e atendimentos."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period} onValueChange={(v) => v && setPeriod(v)}>
            <SelectTrigger className="w-[160px] bg-surface" aria-label="Selecionar período">
              <SelectValue>{periodLabels[period]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24 horas</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
            </SelectContent>
          </Select>
          <Select value={connection} onValueChange={(v) => v && setConnection(v)}>
            <SelectTrigger className="w-[160px] bg-surface" aria-label="Selecionar conexão">
              <SelectValue>{connectionLabels[connection]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as conexões</SelectItem>
              <SelectItem value="waba_1">WABA Oficial 1</SelectItem>
            </SelectContent>
          </Select>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Mensagens Enviadas"
          value="24.592"
          comparison="+12% em relação ao período anterior"
          icon={Send}
          trend="up"
        />
        <MetricCard
          title="Taxa de Entrega"
          value="98,2%"
          comparison="-0.5% em relação ao período anterior"
          icon={CheckCircle2}
          trend="down"
        />
        <MetricCard
          title="Taxa de Leitura"
          value="76,4%"
          comparison="+4.2% em relação ao período anterior"
          icon={Eye}
          trend="up"
        />
        <MetricCard
          title="Taxa de Resposta"
          value="12,8%"
          comparison="Estável em relação ao período anterior"
          icon={MessageCircle}
          trend="neutral"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-6">
        <div className="lg:col-span-4">
          <DashboardChart />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Campanhas Ativas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <CampaignProgress title="Promoção de Inverno" sent={4500} total={5000} />
              <CampaignProgress title="Lembrete de Vencimento" sent={120} total={1200} />
              <CampaignProgress title="Reativação de Leads" sent={890} total={3000} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Atividade Recente</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1">
              Ver todos <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Novo atendimento iniciado</p>
                      <p className="text-xs text-muted-foreground">+55 11 99999-9999</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Há 5 min</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status das Conexões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">WABA Oficial 1</span>
                <StatusIndicator status="success" label="Conectado" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">WABA Suporte</span>
                <StatusIndicator status="warning" label="Rate Limit" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                O template &quot;Aviso_Corte&quot; foi rejeitado pela Meta e não poderá ser enviado.
              </p>
              <Button variant="link" className="px-0 text-destructive mt-2 h-auto">
                Ver detalhes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
