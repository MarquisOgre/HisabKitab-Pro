import { Plus, Search, Phone, Mail, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";

const customers = [
  { id: 1, name: "Rajesh Traders", phone: "9876543210", email: "rajesh@traders.com", gst: "27AABCU9603R1ZM", balance: "₹45,200", totalBusiness: "₹2,45,000" },
  { id: 2, name: "Priya Stores", phone: "9123456789", email: "priya@stores.com", gst: "27AABCU9604R1ZN", balance: "₹0", totalBusiness: "₹1,82,000" },
  { id: 3, name: "Kumar & Sons", phone: "9988776655", email: "kumar@sons.com", gst: "27AABCU9605R1ZP", balance: "₹24,800", totalBusiness: "₹3,15,000" },
  { id: 4, name: "Anita Enterprises", phone: "9112233445", email: "anita@ent.com", gst: "27AABCU9606R1ZQ", balance: "₹12,500", totalBusiness: "₹95,000" },
  { id: 5, name: "Sharma Brothers", phone: "9556677889", email: "sharma@bros.com", gst: "27AABCU9607R1ZR", balance: "₹6,200", totalBusiness: "₹1,45,000" },
];

export default function Customers() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage your customer database</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Add Customer</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Total Customers</p><p className="text-xl font-bold text-foreground mt-1">128</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Outstanding Balance</p><p className="text-xl font-bold text-warning mt-1">₹88,700</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Total Revenue</p><p className="text-xl font-bold text-success mt-1">₹12,82,000</p></div>
      </div>

      <div className="stat-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search by name, phone, or GST number..." className="w-full pl-10 pr-4 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {customers.map((c) => (
          <div key={c.id} className="stat-card space-y-3 cursor-pointer">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{c.name}</h3>
                <p className="text-xs text-muted-foreground font-mono">{c.gst}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className={`text-sm font-bold ${c.balance === "₹0" ? "text-success" : "text-warning"}`}>{c.balance}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Total Business</span>
              <span className="text-sm font-semibold text-foreground">{c.totalBusiness}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
