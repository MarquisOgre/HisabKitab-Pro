import { BarChart3, Download, Printer, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const reports = [
  { name: "Sales Report", description: "Detailed sales analysis with date filters", icon: "📊" },
  { name: "Purchase Report", description: "Purchase history and supplier analysis", icon: "📦" },
  { name: "Expense Report", description: "Category-wise expense breakdown", icon: "💰" },
  { name: "Stock Report", description: "Current stock levels and valuation", icon: "📋" },
  { name: "Customer Outstanding", description: "Pending receivables from customers", icon: "👥" },
  { name: "Supplier Outstanding", description: "Pending payables to suppliers", icon: "🚛" },
  { name: "Day Book", description: "Daily transaction summary", icon: "📖" },
  { name: "Cash Flow Report", description: "Cash inflow and outflow analysis", icon: "💹" },
  { name: "Profit & Loss", description: "Revenue vs expenses breakdown", icon: "📈" },
  { name: "Tax Report", description: "GST and tax liability summary", icon: "🧾" },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Business Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and export various business reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Calendar className="w-4 h-4" /> Date Range</Button>
          <Button variant="outline" className="gap-2"><Filter className="w-4 h-4" /> Branch</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reports.map((r) => (
          <div key={r.name} className="stat-card cursor-pointer group">
            <div className="flex items-start gap-4">
              <span className="text-3xl">{r.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{r.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{r.description}</p>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Download className="w-3 h-3" /> Excel</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Printer className="w-3 h-3" /> Print</Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
