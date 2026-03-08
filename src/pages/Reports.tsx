import { BarChart3, Download, Printer, TrendingUp, Package, FileText, Users, Truck, Wallet, DollarSign, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

const reportSections = [
  {
    tab: "financial",
    label: "Financial",
    reports: [
      { name: "Purchase Report", description: "Purchase history and supplier analysis", icon: Package },
      { name: "Sale Report", description: "Detailed sales analysis with date filters", icon: TrendingUp },
      { name: "Profit & Loss", description: "Revenue vs expenses breakdown", icon: DollarSign },
      { name: "Bill Wise P&L", description: "Profit & loss per invoice", icon: FileText },
      { name: "Balance Sheet", description: "Assets, liabilities & equity snapshot", icon: BookOpen },
      { name: "Expense Report", description: "Category-wise expense breakdown", icon: Wallet },
    ],
  },
  {
    tab: "stock",
    label: "Stock",
    reports: [
      { name: "Stock Register", description: "Complete stock movement register", icon: Package },
      { name: "Stock Summary", description: "Current stock levels overview", icon: BarChart3 },
      { name: "Stock Movements", description: "Inward & outward stock transactions", icon: TrendingUp },
      { name: "Stock Details", description: "Detailed per-item stock information", icon: FileText },
      { name: "Item Wise P&L", description: "Profit & loss per product item", icon: DollarSign },
    ],
  },
  {
    tab: "tax",
    label: "Taxes",
    reports: [
      { name: "GSTR-1 Summary", description: "Outward supply summary for filing", icon: FileText },
      { name: "GSTR-3B Summary", description: "Monthly tax return summary", icon: FileText },
      { name: "HSN Summary", description: "HSN code-wise tax breakdown", icon: BarChart3 },
      { name: "Tax Liability", description: "Total GST liability report", icon: DollarSign },
    ],
  },
];

export default function Reports() {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-foreground">Reports</h1>
        {!isMobile && <p className="text-sm text-muted-foreground">Generate and export business reports</p>}
      </div>

      <Tabs defaultValue="financial" className="mobile-tabs">
        <TabsList className={isMobile ? "w-full grid grid-cols-3" : "grid w-full grid-cols-3 max-w-md"}>
          <TabsTrigger value="financial" className="text-xs md:text-sm">Financial</TabsTrigger>
          <TabsTrigger value="stock" className="text-xs md:text-sm">Stock</TabsTrigger>
          <TabsTrigger value="tax" className="text-xs md:text-sm">Taxes</TabsTrigger>
        </TabsList>

        {reportSections.map(section => (
          <TabsContent key={section.tab} value={section.tab} className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
              {section.reports.map(r => (
                <div key={r.name} className="stat-card cursor-pointer group">
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <r.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm md:text-base group-hover:text-primary transition-colors">{r.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 md:mt-1">{r.description}</p>
                      <div className="flex gap-2 mt-2 md:mt-3">
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Download className="w-3 h-3" /> Excel</Button>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1"><Printer className="w-3 h-3" /> Print</Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
