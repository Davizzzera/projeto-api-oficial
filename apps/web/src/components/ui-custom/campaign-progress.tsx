import { Progress } from "@/components/ui/progress"

interface CampaignProgressProps {
  title: string
  sent: number
  total: number
}

export function CampaignProgress({ title, sent, total }: CampaignProgressProps) {
  const percentage = Math.round((sent / total) * 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">{sent} / {total} ({percentage}%)</span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  )
}
