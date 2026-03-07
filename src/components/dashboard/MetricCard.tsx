import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  iconColor = "text-primary",
}: MetricCardProps) {
  return (
    <div className="metric-card p-3 md:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className="text-lg md:text-2xl font-bold mt-0.5 md:mt-1 truncate">{value}</p>
          {change && (
            <p
              className={cn(
                "text-xs md:text-sm mt-1 md:mt-2 font-medium line-clamp-2",
                changeType === "positive" && "text-success",
                changeType === "negative" && "text-destructive",
                changeType === "neutral" && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div className={cn("p-2 md:p-3 rounded-lg md:rounded-xl bg-muted/50 shrink-0", iconColor)}>
          <Icon className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>
    </div>
  );
}
