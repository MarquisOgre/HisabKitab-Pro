import { Plus, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const purchases = [
  { id: "PO-001", date: "04 Mar 2026", supplier: "ABC Suppliers", items: 4, amount: "₹18,500", gst: "₹3,330", total: "₹21,830", status: "Received" },
  { id: "PO-002", date: "03 Mar 2026", supplier: "XYZ Trading Co", items: 6, amount: "₹32,000", gst: "₹5,760", total: "₹37,760", status: "Pending" },
  { id: "PO-003", date: "02 Mar 2026", supplier: "Ganesh Industries", items: 2, amount: "₹8,200", gst: "₹1,476", total: "₹9,676", status: "Received" },
  { id: "PO-004", date: "01 Mar 2026", supplier: "National Distributors", items: 10, amount: "₹55,000", gst: "₹9,900", total: "₹64,900", status: "Partial" },
];

export default function Purchases() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Purchases</h1>
          <p className="text-sm text-muted-foreground">Manage purchase orders and supplier invoices</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> New Purchase</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <SC label="Today's Purchases" value="₹22,300" />
        <SC label="This Month" value="₹1,85,600" />
        <SC label="Pending Payments" value="₹45,200" />
        <SC label="Total Orders" value="84" />
      </div>

      <div className="stat-card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search purchases..." className="w-full pl-10 pr-4 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <Button variant="outline" size="sm" className="gap-2"><Filter className="w-3.5 h-3.5" /> Filter</Button>
        <Button variant="outline" size="sm" className="gap-2"><Download className="w-3.5 h-3.5" /> Export</Button>
      </div>

      <div className="stat-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">PO #</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Supplier</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Items</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Amount</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">GST</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Total</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3 font-medium text-primary">{p.id}</td>
                <td className="px-5 py-3 text-muted-foreground">{p.date}</td>
                <td className="px-5 py-3 text-foreground">{p.supplier}</td>
                <td className="px-5 py-3 text-center text-muted-foreground">{p.items}</td>
                <td className="px-5 py-3 text-right text-foreground">{p.amount}</td>
                <td className="px-5 py-3 text-right text-muted-foreground">{p.gst}</td>
                <td className="px-5 py-3 text-right font-semibold text-foreground">{p.total}</td>
                <td className="px-5 py-3 text-center">
                  <Badge variant={p.status === "Received" ? "default" : p.status === "Pending" ? "secondary" : "outline"} className="text-[10px] px-2">{p.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SC({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-card">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}
