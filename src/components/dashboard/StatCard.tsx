import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color: string;
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card flex items-start justify-between"
    >
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {trend && (
          <p className={`text-xs font-medium ${trendUp ? "text-success" : "text-destructive"}`}>
            {trendUp ? "↑" : "↓"} {trend}
          </p>
        )}
      </div>
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: color + "18", color }}
      >
        <Icon className="w-5 h-5" />
      </div>
    </motion.div>
  );
}
