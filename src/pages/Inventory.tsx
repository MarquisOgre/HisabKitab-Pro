import { Plus, Search, Filter, Download, AlertTriangle, Package, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const products = [
  { id: 1, name: "Basmati Rice 25kg", hsn: "1006", category: "Groceries", purchase: "₹1,200", sale: "₹1,450", stock: 142, status: "In Stock" },
  { id: 2, name: "Toor Dal 1kg", hsn: "0713", category: "Groceries", purchase: "₹120", sale: "₹145", stock: 85, status: "In Stock" },
  { id: 3, name: "Sunflower Oil 5L", hsn: "1512", category: "Oils", purchase: "₹480", sale: "₹560", stock: 5, status: "Low Stock" },
  { id: 4, name: "Sugar 50kg", hsn: "1701", category: "Groceries", purchase: "₹2,100", sale: "₹2,400", stock: 0, status: "Out of Stock" },
  { id: 5, name: "Wheat Flour 10kg", hsn: "1101", category: "Groceries", purchase: "₹320", sale: "₹380", stock: 64, status: "In Stock" },
  { id: 6, name: "Mustard Oil 1L", hsn: "1514", category: "Oils", purchase: "₹180", sale: "₹210", stock: 8, status: "Low Stock" },
];

export default function Inventory() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Inventory</h1>
          <p className="text-sm text-muted-foreground">Manage products, stock levels, and categories</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><ArrowUpDown className="w-4 h-4" /> Stock Adjust</Button>
          <Button className="gap-2"><Plus className="w-4 h-4" /> Add Product</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Total Products</p><p className="text-xl font-bold text-foreground mt-1">248</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">In Stock</p><p className="text-xl font-bold text-success mt-1">215</p></div>
        <div className="stat-card flex items-start justify-between"><div><p className="text-xs text-muted-foreground uppercase">Low Stock</p><p className="text-xl font-bold text-warning mt-1">25</p></div><AlertTriangle className="w-5 h-5 text-warning" /></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Out of Stock</p><p className="text-xl font-bold text-destructive mt-1">8</p></div>
      </div>

      <div className="stat-card p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search products..." className="w-full pl-10 pr-4 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <Button variant="outline" size="sm" className="gap-2"><Filter className="w-3.5 h-3.5" /> Filter</Button>
        <Button variant="outline" size="sm" className="gap-2"><Download className="w-3.5 h-3.5" /> Export</Button>
      </div>

      <div className="stat-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Product</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">HSN</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Category</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Purchase Price</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Sale Price</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Stock</th>
              <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{p.hsn}</td>
                <td className="px-5 py-3 text-muted-foreground">{p.category}</td>
                <td className="px-5 py-3 text-right text-foreground">{p.purchase}</td>
                <td className="px-5 py-3 text-right font-semibold text-foreground">{p.sale}</td>
                <td className="px-5 py-3 text-center text-foreground">{p.stock}</td>
                <td className="px-5 py-3 text-center">
                  <Badge variant={p.status === "In Stock" ? "default" : p.status === "Low Stock" ? "secondary" : "destructive"} className="text-[10px] px-2">{p.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
