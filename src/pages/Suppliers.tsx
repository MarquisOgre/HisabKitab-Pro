import { Plus, Search, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const suppliers = [
  { id: 1, name: "ABC Suppliers", phone: "9876543210", email: "abc@suppliers.com", gst: "27AABCU9703R1ZM", balance: "₹21,830", totalBusiness: "₹4,85,000" },
  { id: 2, name: "XYZ Trading Co", phone: "9123456789", email: "xyz@trading.com", gst: "27AABCU9704R1ZN", balance: "₹37,760", totalBusiness: "₹6,12,000" },
  { id: 3, name: "Ganesh Industries", phone: "9988776655", email: "ganesh@ind.com", gst: "27AABCU9705R1ZP", balance: "₹0", totalBusiness: "₹2,35,000" },
  { id: 4, name: "National Distributors", phone: "9112233445", email: "national@dist.com", gst: "27AABCU9706R1ZQ", balance: "₹64,900", totalBusiness: "₹8,95,000" },
];

export default function Suppliers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Suppliers</h1>
          <p className="text-sm text-muted-foreground">Manage your supplier database</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Add Supplier</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Total Suppliers</p><p className="text-xl font-bold text-foreground mt-1">42</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Pending Payments</p><p className="text-xl font-bold text-destructive mt-1">₹1,24,490</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Total Purchases</p><p className="text-xl font-bold text-foreground mt-1">₹22,27,000</p></div>
      </div>

      <div className="stat-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search suppliers..." className="w-full pl-10 pr-4 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {suppliers.map((s) => (
          <div key={s.id} className="stat-card space-y-3 cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{s.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">{s.gst}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Payable</p>
                <p className={`text-sm font-bold ${s.balance === "₹0" ? "text-success" : "text-destructive"}`}>{s.balance}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{s.email}</span>
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Business</span>
              <span className="text-sm font-semibold text-foreground">{s.totalBusiness}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
