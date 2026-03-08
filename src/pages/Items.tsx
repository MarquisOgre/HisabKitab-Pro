import { useState, useEffect } from "react";
import { Plus, Search, Tag, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Items() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [newItem, setNewItem] = useState({
    name: "", hsn_code: "", category_id: "", purchase_price: "", sale_price: "",
    opening_stock: "", unit: "pcs", low_stock_alert: "10",
  });
  const isMobile = useIsMobile();

  const fetchData = async () => {
    if (!user) return;
    const [catRes, prodRes] = await Promise.all([
      supabase.from("categories").select("*").eq("user_id", user.id).order("name"),
      supabase.from("items").select("*, categories(name)").eq("user_id", user.id).or("is_deleted.is.null,is_deleted.eq.false").order("name"),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (prodRes.data) setProducts(prodRes.data);
  };

  useEffect(() => { fetchData(); }, [user]);

  const addCategory = async () => {
    if (!user || !newCategory.name) return;
    const { error } = await supabase.from("categories").insert({ ...newCategory, user_id: user.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Category added!");
    setNewCategory({ name: "", description: "" });
    setShowAddCategory(false);
    fetchData();
  };

  const addItem = async () => {
    if (!user || !newItem.name) return;
    const { error } = await supabase.from("items").insert({
      user_id: user.id,
      name: newItem.name,
      hsn_code: newItem.hsn_code || null,
      category_id: newItem.category_id || null,
      purchase_price: newItem.purchase_price || "0",
      sale_price: newItem.sale_price || "0",
      opening_stock: newItem.opening_stock || "0",
      current_stock: newItem.opening_stock || "0",
      unit: newItem.unit,
      low_stock_alert: newItem.low_stock_alert || "10",
      is_deleted: "false",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Item added!");
    setNewItem({ name: "", hsn_code: "", category_id: "", purchase_price: "", sale_price: "", opening_stock: "", unit: "pcs", low_stock_alert: "10" });
    fetchData();
  };

  const filtered = products.filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-foreground">Items</h1>
          {!isMobile && <p className="text-sm text-muted-foreground">Manage your products, categories and stock</p>}
        </div>
      </div>

      <Tabs defaultValue="all-items" className="mobile-tabs">
        <TabsList className={isMobile ? "w-full grid grid-cols-3" : "grid w-full grid-cols-3 max-w-md"}>
          <TabsTrigger value="categories" className="gap-1 md:gap-2 text-xs md:text-sm px-1.5 md:px-3">
            <Tag className="w-3.5 h-3.5 hidden md:block" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="add-item" className="gap-1 md:gap-2 text-xs md:text-sm px-1.5 md:px-3">
            <Plus className="w-3.5 h-3.5 hidden md:block" />
            Add Item
          </TabsTrigger>
          <TabsTrigger value="all-items" className="gap-1 md:gap-2 text-xs md:text-sm px-1.5 md:px-3">
            <List className="w-3.5 h-3.5 hidden md:block" />
            All Items
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-foreground text-sm md:text-base">Categories ({categories.length})</h2>
            <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 h-8 text-xs md:text-sm"><Plus className="w-4 h-4" /> Add</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={newCategory.name} onChange={e => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="Category name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={newCategory.description} onChange={e => setNewCategory({ ...newCategory, description: e.target.value })} placeholder="Optional description" />
                  </div>
                  <Button onClick={addCategory} className="w-full">Save Category</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="stat-card">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Tag className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm md:text-base truncate">{cat.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{cat.description || "No description"}</p>
                  </div>
                </div>
              </div>
            ))}
            {categories.length === 0 && <p className="text-muted-foreground text-sm col-span-3">No categories yet. Add your first category.</p>}
          </div>
        </TabsContent>

        <TabsContent value="add-item" className="space-y-4">
          <div className="stat-card p-4 md:p-6 max-w-2xl">
            <h2 className="font-semibold text-foreground mb-4 text-sm md:text-base">Add New Item</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>Item Name *</Label>
                <Input value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} placeholder="Product name" />
              </div>
              <div className="space-y-2">
                <Label>HSN Code</Label>
                <Input value={newItem.hsn_code} onChange={e => setNewItem({ ...newItem, hsn_code: e.target.value })} placeholder="e.g. 1006" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newItem.category_id} onChange={e => setNewItem({ ...newItem, category_id: e.target.value })}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Purchase Price (₹)</Label>
                <Input type="number" value={newItem.purchase_price} onChange={e => setNewItem({ ...newItem, purchase_price: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Sale Price (₹)</Label>
                <Input type="number" value={newItem.sale_price} onChange={e => setNewItem({ ...newItem, sale_price: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Opening Stock</Label>
                <Input type="number" value={newItem.opening_stock} onChange={e => setNewItem({ ...newItem, opening_stock: e.target.value })} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })}>
                  {["pcs", "kg", "g", "ltr", "ml", "box", "pack", "dozen", "meter"].map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Low Stock Alert</Label>
                <Input type="number" value={newItem.low_stock_alert} onChange={e => setNewItem({ ...newItem, low_stock_alert: e.target.value })} placeholder="10" />
              </div>
            </div>
            <Button onClick={addItem} className="mt-4 md:mt-6 w-full sm:w-auto">Save Item</Button>
          </div>
        </TabsContent>

        <TabsContent value="all-items" className="space-y-4">
          <div className="stat-card p-3 md:p-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search items..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Badge variant="secondary" className="shrink-0">{filtered.length} items</Badge>
          </div>

          {isMobile ? (
            <div className="space-y-2">
              {filtered.map(p => {
                const stock = Number(p.current_stock || 0);
                const alert = Number(p.low_stock_alert || 10);
                const status = stock === 0 ? "Out of Stock" : stock <= alert ? "Low Stock" : "In Stock";
                return (
                  <div key={p.id} className="stat-card p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground truncate">{p.name}</span>
                      <Badge variant={status === "In Stock" ? "default" : status === "Low Stock" ? "secondary" : "destructive"} className="text-[10px] px-2 shrink-0 ml-2">{status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{p.categories?.name || "No category"}</span>
                      <span>{p.hsn_code || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                      <div><span className="text-muted-foreground">Buy: </span><span className="text-foreground">₹{Number(p.purchase_price || 0).toLocaleString()}</span></div>
                      <div><span className="text-muted-foreground">Sell: </span><span className="font-semibold text-foreground">₹{Number(p.sale_price || 0).toLocaleString()}</span></div>
                      <div><span className="text-muted-foreground">Stock: </span><span className="text-foreground">{stock} {p.unit}</span></div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No items found.</p>}
            </div>
          ) : (
            <div className="stat-card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50">
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Item</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">HSN</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Category</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Purchase</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Sale</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Stock</th>
                    <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => {
                    const stock = Number(p.current_stock || 0);
                    const alert = Number(p.low_stock_alert || 10);
                    const status = stock === 0 ? "Out of Stock" : stock <= alert ? "Low Stock" : "In Stock";
                    return (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-3 font-medium text-foreground">{p.name}</td>
                        <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{p.hsn_code || "-"}</td>
                        <td className="px-5 py-3 text-muted-foreground">{p.categories?.name || "-"}</td>
                        <td className="px-5 py-3 text-right text-foreground">₹{Number(p.purchase_price || 0).toLocaleString()}</td>
                        <td className="px-5 py-3 text-right font-semibold text-foreground">₹{Number(p.sale_price || 0).toLocaleString()}</td>
                        <td className="px-5 py-3 text-center text-foreground">{stock} {p.unit}</td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={status === "In Stock" ? "default" : status === "Low Stock" ? "secondary" : "destructive"} className="text-[10px] px-2">{status}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">No items found. Add your first item from the "Add Item" tab.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
