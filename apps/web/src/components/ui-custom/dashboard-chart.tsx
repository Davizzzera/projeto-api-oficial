"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
  { time: "08:00", msgs: 120 },
  { time: "10:00", msgs: 250 },
  { time: "12:00", msgs: 380 },
  { time: "14:00", msgs: 310 },
  { time: "16:00", msgs: 500 },
  { time: "18:00", msgs: 420 },
  { time: "20:00", msgs: 200 },
]

export function DashboardChart() {
  return (
    <Card className="col-span-full lg:col-span-4">
      <CardHeader>
        <CardTitle>Desempenho de Mensagens</CardTitle>
        <CardDescription>
          Volume de mensagens enviadas e recebidas nas últimas 12 horas.
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMsgs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                width={40}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: "var(--popover)", 
                  borderColor: "var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--popover-foreground)"
                }}
                itemStyle={{ color: "var(--popover-foreground)" }}
              />
              <Area 
                type="monotone" 
                dataKey="msgs" 
                stroke="var(--primary)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorMsgs)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
