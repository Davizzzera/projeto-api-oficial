import { Button } from "@/components/ui/button"
import { Building2, ChevronsUpDown } from "lucide-react"

export function OrganizationSwitcher() {
  return (
    <Button variant="outline" className="w-[200px] justify-between px-3 h-10">
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
          <Building2 className="h-4 w-4" />
        </div>
        <span className="truncate text-sm font-medium">Acme Corp Inc.</span>
      </div>
      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
    </Button>
  )
}
