import { BookOpen, FileText, ArrowRightLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ledgerEntries = [
  { date: "04 Mar 2026", particular: "Sales - Rajesh Traders", debit: "", credit: "₹14,750", balance: "₹4,52,300 Cr" },
  { date: "04 Mar 2026", particular: "Purchase - ABC Suppliers", debit: "₹21,830", credit: "", balance: "₹4,30,470 Cr" },
  { date: "03 Mar 2026", particular: "Expense - Office Rent", debit: "₹25,000", credit: "", balance: "₹4,05,470 Cr" },
  { date: "03 Mar 2026", particular: "Sales - Kumar & Sons", debit: "", credit: "₹29,264", balance: "₹4,34,734 Cr" },
  { date: "02 Mar 2026", particular: "Cash Received - Sharma Bros", debit: "", credit: "₹6,200", balance: "₹4,40,934 Cr" },
];

export default function Accounting() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Accounting</h1>
          <p className="text-sm text-muted-foreground">Ledger, journals, and financial statements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><ArrowRightLeft className="w-4 h-4" /> Journal Entry</Button>
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Total Assets</p><p className="text-xl font-bold text-foreground mt-1">₹12,45,000</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Total Liabilities</p><p className="text-xl font-bold text-foreground mt-1">₹3,85,000</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Net Profit</p><p className="text-xl font-bold text-success mt-1">₹2,84,500</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Capital</p><p className="text-xl font-bold text-foreground mt-1">₹8,60,000</p></div>
      </div>

      <Tabs defaultValue="ledger" className="w-full">
        <TabsList className="bg-secondary/50 p-1">
          <TabsTrigger value="ledger">General Ledger</TabsTrigger>
          <TabsTrigger value="cashbook">Cash Book</TabsTrigger>
          <TabsTrigger value="bankbook">Bank Book</TabsTrigger>
          <TabsTrigger value="trial">Trial Balance</TabsTrigger>
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="mt-4">
          <div className="stat-card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Particular</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Debit</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Credit</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgerEntries.map((e, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 text-muted-foreground">{e.date}</td>
                    <td className="px-5 py-3 text-foreground">{e.particular}</td>
                    <td className="px-5 py-3 text-right text-destructive font-medium">{e.debit}</td>
                    <td className="px-5 py-3 text-right text-success font-medium">{e.credit}</td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground">{e.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {["cashbook", "bankbook", "trial", "pnl", "balance"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="stat-card flex items-center justify-center h-48">
              <div className="text-center">
                <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Select a date range to generate the report</p>
                <Button variant="outline" size="sm" className="mt-3">Generate Report</Button>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
