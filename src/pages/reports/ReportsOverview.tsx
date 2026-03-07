import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  FileText,
  Package,
  Receipt,
  Calculator,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const reportCategories = [
  {
    title: "Sales Reports",
    icon: TrendingUp,
    color: "text-success bg-success/10",
    reports: [
      { name: "Sale Report", href: "/reports/sale" },
      { name: "Bill Wise Profit & Loss", href: "/reports/bill-wise-pnl" },
      { name: "Item Wise Profit & Loss", href: "/reports/item-wise-pnl" },
    ],
  },
  {
    title: "Purchase Reports",
    icon: TrendingDown,
    color: "text-warning bg-warning/10",
    reports: [
      { name: "Purchase Report", href: "/reports/purchase" },
      { name: "Expense Report", href: "/reports/expense" },
    ],
  },
  {
    title: "Financial Reports",
    icon: PieChart,
    color: "text-primary bg-primary/10",
    reports: [
      { name: "Profit & Loss Statement", href: "/reports/pnl" },
      { name: "Balance Sheet", href: "/reports/balance-sheet" },
    ],
  },
  {
    title: "Stock Reports",
    icon: Package,
    color: "text-accent bg-accent/10",
    reports: [
      { name: "Stock Summary", href: "/reports/stock-summary" },
      { name: "Stock Detail", href: "/reports/stock-detail" },
      { name: "Item Detail", href: "/reports/item-detail" },
    ],
  },
  {
    title: "Tax Reports",
    icon: Calculator,
    color: "text-destructive bg-destructive/10",
    reports: [
      { name: "GST Report", href: "/reports/taxes" },
      { name: "TCS Report", href: "/reports/taxes" },
    ],
  },
];

export default function ReportsOverview() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">View and analyze your business data</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-xl bg-success/10 text-success">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">This Month Sales</p>
              <p className="text-lg sm:text-xl font-bold truncate">₹4,85,200</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-xl bg-warning/10 text-warning">
              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">This Month Purchase</p>
              <p className="text-lg sm:text-xl font-bold truncate">₹2,85,400</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-xl bg-primary/10 text-primary">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Net Profit</p>
              <p className="text-lg sm:text-xl font-bold text-success truncate">₹1,99,800</p>
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-xl bg-accent/10 text-accent">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground truncate">Stock Value</p>
              <p className="text-lg sm:text-xl font-bold truncate">₹4,85,200</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {reportCategories.map((category) => (
          <div key={category.title} className="metric-card">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn("p-2 sm:p-3 rounded-xl", category.color)}>
                <category.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg">{category.title}</h3>
            </div>
            <div className="space-y-2">
              {category.reports.map((report) => (
                <Link
                  key={report.name}
                  to={report.href}
                  className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors group"
                >
                  <span className="text-xs sm:text-sm font-medium">{report.name}</span>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
