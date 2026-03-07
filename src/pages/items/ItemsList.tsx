// @ts-nocheck
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { RoleGuard, useRoleAccess } from "@/components/RoleGuard";
import { toast } from "sonner";

interface Item {
  id: string;
  name: string;
  unit: string | null;
  hsn_code: string | null;
  purchase_price: number | null;
  sale_price: number | null;
  opening_stock: number | null;
  current_stock: number | null;
  low_stock_alert: number | null;
  category_id: string | null;
  category_name?: string | null;
}

interface Category {
  id: string;
  name: string;
}

export default function ItemsList() {
  const { user } = useAuth();
  const { selectedBusiness } = useBusinessSelection();
  const { canWrite } = useRoleAccess();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Get initial category filter from URL or default to "all"
  const categoryFromUrl = searchParams.get("category") || "all";
  const categoryNameFromUrl = searchParams.get("categoryName") || "";
  const [categoryFilter, setCategoryFilter] = useState<string>(categoryFromUrl);
  
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAdjustStock, setShowAdjustStock] = useState(false);
  const [stockAdjustment, setStockAdjustment] = useState({ type: "add", quantity: 0, notes: "" });

  // Update filter when URL params change
  useEffect(() => {
    const categoryParam = searchParams.get("category");
    if (categoryParam && categoryParam !== categoryFilter) {
      setCategoryFilter(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (user && selectedBusiness) {
      fetchItems();
      fetchCategories();
    }
  }, [user, selectedBusiness]);

  const fetchCategories = async () => {
    if (!selectedBusiness) return;
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("business_id", selectedBusiness.id)
        .order("name");
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Failed to fetch categories:", error.message);
    }
  };

  const fetchItems = async () => {
    if (!selectedBusiness) return;
    try {
      const { data, error } = await supabase
        .from("items")
        .select("id, name, unit, hsn_code, purchase_price, sale_price, opening_stock, current_stock, low_stock_alert, category_id, categories(name)")
        .eq("is_deleted", false)
        .eq("business_id", selectedBusiness.id)
        .order("name", { ascending: true });

      if (error) throw error;
      const itemsWithCategory = (data || []).map((item: any) => ({
        ...item,
        category_name: item.categories?.name || null,
      }));
      setItems(itemsWithCategory);
    } catch (error: any) {
      toast.error("Failed to fetch items: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const { error } = await supabase
        .from("items")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success("Item deleted successfully");
      fetchItems();
    } catch (error: any) {
      toast.error("Failed to delete item: " + error.message);
    }
  };

  const handleAdjustStock = async () => {
    if (!selectedItem) return;
    
    const adjustment = stockAdjustment.type === "add" 
      ? stockAdjustment.quantity 
      : -stockAdjustment.quantity;
    
    const newStock = (selectedItem.current_stock || 0) + adjustment;
    
    try {
      const { error } = await supabase
        .from("items")
        .update({ current_stock: newStock })
        .eq("id", selectedItem.id);
      
      if (error) throw error;
      toast.success("Stock adjusted successfully");
      setShowAdjustStock(false);
      setStockAdjustment({ type: "add", quantity: 0, notes: "" });
      fetchItems();
    } catch (error: any) {
      toast.error("Failed to adjust stock: " + error.message);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">
            {categoryNameFromUrl ? `Items - ${categoryNameFromUrl}` : "Items"}
          </h1>
          <p className="text-sm text-muted-foreground hidden sm:block">
            {categoryNameFromUrl ? `Showing items in ${categoryNameFromUrl}` : "Manage your products and services"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link to="/items/categories">Categories</Link>
          </Button>
          <RoleGuard requireWrite>
            <Button variant="outline" size="sm" asChild className="hidden sm:flex">
              <Link to="/utilities/import">Bulk Import</Link>
            </Button>
            <Button asChild size="sm" className="btn-gradient gap-2">
              <Link to="/items/add">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </Button>
          </RoleGuard>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items Table */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No items found</p>
          <Button asChild className="mt-4">
            <Link to="/items/add">Add your first item</Link>
          </Button>
        </div>
      ) : (
        <div className="metric-card overflow-hidden p-0">
          <div className="overflow-x-auto">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th className="text-center">Category</th>
                <th className="text-center">Item</th>
                <th className="text-center">Unit</th>
                <th className="text-center">HSN Code</th>
                <th className="text-center">Purchase Price</th>
                <th className="text-center">Sale Price</th>
                <th className="text-center">Opening Stock</th>
                <th className="text-center">Current Stock</th>
                <th className="text-center">Min Stock</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                const stock = item.current_stock || 0;
                const minStock = item.low_stock_alert || 10;
                
                return (
                  <tr key={item.id} className="group">
                    <td className="text-center text-muted-foreground">
                      {item.category_name || "-"}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-3">
                        {/* <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div> */}
                        <div>
                          <p className="font-medium">{item.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-center text-muted-foreground">{item.unit || "Bottles"}</td>
                    <td className="text-center text-muted-foreground">{item.hsn_code || "-"}</td>
                    <td className="text-center text-muted-foreground">
                      ₹{(item.purchase_price || 0).toLocaleString()}
                    </td>
                    <td className="text-center font-medium">
                      ₹{(item.sale_price || 0).toLocaleString()}
                    </td>
                    <td className="text-center text-muted-foreground">
                      {item.opening_stock || 0}
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {stock <= minStock && (
                          <AlertTriangle className="w-4 h-4 text-warning" />
                        )}
                        <span
                          className={cn(
                            "font-medium",
                            stock <= minStock && "text-warning",
                            stock === 0 && "text-destructive"
                          )}
                        >
                          {stock}
                        </span>
                      </div>
                    </td>
                    <td className="text-center text-muted-foreground">{minStock}</td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowDetails(true);
                          }}
                        >
                          View
                        </Button>
                        {canWrite && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => navigate(`/items/edit/${item.id}`)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => handleDelete(item.id)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* View Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedItem.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedItem.unit || "Bottles"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Purchase Price</p>
                  <p className="font-medium">₹{(selectedItem.purchase_price || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Sale Price</p>
                  <p className="font-medium text-success">₹{(selectedItem.sale_price || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Opening Stock</p>
                  <p className="font-medium">{selectedItem.opening_stock || 0}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Current Stock</p>
                  <p className={cn(
                    "font-medium",
                    (selectedItem.current_stock || 0) <= (selectedItem.low_stock_alert || 10) && "text-warning"
                  )}>
                    {selectedItem.current_stock || 0}
                  </p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg col-span-2">
                  <p className="text-xs text-muted-foreground">Minimum Stock Level</p>
                  <p className="font-medium">{selectedItem.low_stock_alert || 10}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
                <Button className="flex-1" onClick={() => {
                  setShowDetails(false);
                  navigate(`/items/edit/${selectedItem.id}`);
                }}>
                  Edit Item
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={showAdjustStock} onOpenChange={setShowAdjustStock}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Stock - {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-xl font-semibold">{selectedItem?.current_stock || 0} {selectedItem?.unit || "Bottles"}</p>
            </div>
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select 
                value={stockAdjustment.type} 
                onValueChange={(value) => setStockAdjustment(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add Stock</SelectItem>
                  <SelectItem value="remove">Remove Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="0"
                value={stockAdjustment.quantity}
                onChange={(e) => setStockAdjustment(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input
                placeholder="Reason for adjustment..."
                value={stockAdjustment.notes}
                onChange={(e) => setStockAdjustment(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">New Stock</p>
              <p className="text-xl font-semibold">
                {stockAdjustment.type === "add" 
                  ? (selectedItem?.current_stock || 0) + stockAdjustment.quantity
                  : (selectedItem?.current_stock || 0) - stockAdjustment.quantity
                } {selectedItem?.unit || "Bottles"}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                setShowAdjustStock(false);
                setStockAdjustment({ type: "add", quantity: 0, notes: "" });
              }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAdjustStock}>
                Save Adjustment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}