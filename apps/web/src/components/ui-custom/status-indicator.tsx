import { cn } from "@/lib/utils"

interface StatusIndicatorProps {
  status: "success" | "warning" | "error" | "info" | "neutral"
  label: string
  className?: string
}

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  const variants = {
    success: "bg-chart-2",
    warning: "bg-chart-3",
    error: "bg-destructive",
    info: "bg-chart-4",
    neutral: "bg-muted-foreground",
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("h-2 w-2 rounded-full", variants[status])} />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
