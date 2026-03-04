import { useState } from "react";
import { Plus, Search, FileText, Download, Printer, Share2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const invoices = [
  { id: "INV-0001", date: "04 Mar 2026", customer: "Rajesh Traders", items: 5, amount: "₹12,500", gst: "₹2,250", total: "₹14,750", status: "Paid" },
  { id: "INV-0002", date: "04 Mar 2026", customer: "Priya Stores", items: 3, amount: "₹8,300", gst: "₹1,494", total: "₹9,794", status: "Paid" },
  { id: "INV-0003", date: "03 Mar 2026", customer: "Kumar & Sons", items: 8, amount: "₹24,800", gst: "₹4,464", total: "₹29,264", status: "Pending" },
  { id: "INV-0004", date: "03 Mar 2026", customer: "Anita Enterprises", items: 2, amount: "₹15,600", gst: "₹2,808", total: "₹18,408", status: "Paid" },
  { id: "INV-0005", date: "02 Mar 2026", customer: "Sharma Brothers", items: 6, amount: "₹6,200", gst: "₹1,116", total: "₹7,316", status: "Overdue" },
];

export default function Sales() {
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Sales & Invoicing</h1>
          <p className="text-sm text-muted-foreground">Manage your sales invoices and billing</p>
        </div>
        <Button onClick={() => setShowCreateInvoice(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Create Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SummaryCard label="Today's Sales" value="₹48,520" />
        <SummaryCard label="This Month" value="₹3,24,800" />
        <SummaryCard label="Pending Amount" value="₹67,800" />
        <SummaryCard label="Total Invoices" value="156" />
      </div>

      {/* Filters */}
      <div className="stat-card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search invoices..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2"><Filter className="w-3.5 h-3.5" /> Filter</Button>
        <Button variant="outline" size="sm" className="gap-2"><Download className="w-3.5 h-3.5" /> Export</Button>
        <Button variant="outline" size="sm" className="gap-2"><Printer className="w-3.5 h-3.5" /> Print</Button>
      </div>

      {/* Invoice Table */}
      <div className="stat-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Invoice #</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Items</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Amount</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">GST</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Total</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3 font-medium text-primary">{inv.id}</td>
                <td className="px-5 py-3 text-muted-foreground">{inv.date}</td>
                <td className="px-5 py-3 text-foreground">{inv.customer}</td>
                <td className="px-5 py-3 text-center text-muted-foreground">{inv.items}</td>
                <td className="px-5 py-3 text-right text-foreground">{inv.amount}</td>
                <td className="px-5 py-3 text-right text-muted-foreground">{inv.gst}</td>
                <td className="px-5 py-3 text-right font-semibold text-foreground">{inv.total}</td>
                <td className="px-5 py-3 text-center">
                  <Badge variant={inv.status === "Paid" ? "default" : inv.status === "Pending" ? "secondary" : "destructive"} className="text-[10px] px-2">
                    {inv.status}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button className="p-1.5 rounded hover:bg-secondary/50"><FileText className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button className="p-1.5 rounded hover:bg-secondary/50"><Download className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button className="p-1.5 rounded hover:bg-secondary/50"><Share2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}
