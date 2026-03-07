import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickStatsData {
  totalReceivables: number;
  receivablesParties: number;
  totalPayables: number;
  payablesParties: number;
  overdueAmount: number;
  overdueCount: number;
  paidThisMonth: number;
  paidCount: number;
}

interface QuickStatsProps {
  data: QuickStatsData;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function QuickStats({ data }: QuickStatsProps) {
  const stats = [
    {
      label: "Total Receivables",
      value: formatCurrency(data.totalReceivables),
      subtext: `${data.receivablesParties} parties`,
      icon: TrendingUp,
      color: "text-success bg-success/10",
    },
    {
      label: "Total Payables",
      value: formatCurrency(data.totalPayables),
      subtext: `${data.payablesParties} parties`,
      icon: TrendingDown,
      color: "text-warning bg-warning/10",
    },
    {
      label: "Overdue Invoices",
      value: formatCurrency(data.overdueAmount),
      subtext: `${data.overdueCount} invoices`,
      icon: AlertCircle,
      color: "text-destructive bg-destructive/10",
    },
    {
      label: "Paid This Month",
      value: formatCurrency(data.paidThisMonth),
      subtext: `${data.paidCount} payments`,
      icon: CheckCircle,
      color: "text-primary bg-primary/10",
    },
  ];

  return (
    <div className="metric-card p-3 md:p-4">
      <h3 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Quick Stats</h3>
      <div className="space-y-2 md:space-y-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-muted/30"
          >
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className={cn("p-1.5 md:p-2 rounded-lg shrink-0", stat.color)}>
                <stat.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs md:text-sm font-medium truncate">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
              </div>
            </div>
            <p className="font-semibold text-sm md:text-base shrink-0 ml-2">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
