"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui-custom/page-header"
import { DataTable } from "@/components/ui-custom/data-table"
import { StatusIndicator } from "@/components/ui-custom/status-indicator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Download, Filter } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

type Contact = {
  id: string
  name: string
  phone: string
  status: "active" | "inactive" | "blocked"
  lastSeen: string
  tags: string[]
}

const data: Contact[] = [
  { id: "1", name: "Maria Silva", phone: "+55 11 98765-4321", status: "active", lastSeen: "Hoje, 14:30", tags: ["VIP", "Lead"] },
  { id: "2", name: "João Pedro", phone: "+55 21 99999-8888", status: "inactive", lastSeen: "Ontem, 09:15", tags: ["Suporte"] },
  { id: "3", name: "Ana Costa", phone: "+55 31 97777-6666", status: "active", lastSeen: "Hoje, 10:00", tags: ["Novo"] },
  { id: "4", name: "Carlos Eduardo", phone: "+55 41 96666-5555", status: "blocked", lastSeen: "Há 5 dias", tags: ["Spam"] },
  { id: "5", name: "Beatriz Oliveira", phone: "+55 51 95555-4444", status: "active", lastSeen: "Hoje, 15:45", tags: ["VIP"] },
]

export default function DemoTablePage() {
  const [loading, setLoading] = useState(false)

  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: "name",
      header: "Contato",
      cell: ({ row }) => {
        const contact = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{contact.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{contact.name}</span>
              <span className="text-xs text-muted-foreground">{contact.phone}</span>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        if (status === "active") return <StatusIndicator status="success" label="Ativo" />
        if (status === "inactive") return <StatusIndicator status="neutral" label="Inativo" />
        return <StatusIndicator status="error" label="Bloqueado" />
      }
    },
    {
      accessorKey: "tags",
      header: "Tags",
      cell: ({ row }) => {
        const tags = row.getValue("tags") as string[]
        return (
          <div className="flex gap-1 flex-wrap">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="font-normal text-xs">{tag}</Badge>
            ))}
          </div>
        )
      }
    },
    {
      accessorKey: "lastSeen",
      header: "Última Atividade",
    },
    {
      id: "actions",
      cell: () => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Ver histórico</DropdownMenuItem>
              <DropdownMenuItem>Enviar mensagem</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Bloquear contato</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]

  return (
    <div className="flex flex-col gap-6">
      <PageHeader 
        title="Tabela de Demonstração" 
        description="Exemplo de tabela avançada com ordenação, paginação e ações."
      >
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => setLoading(!loading)}>
            <Filter className="h-4 w-4" />
            Toggle Loading
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </PageHeader>

      <DataTable columns={columns} data={data} isLoading={loading} />
    </div>
  )
}
