import { useState, useEffect } from "react";
import { Search, Save, Package, CheckSquare, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";

interface ItemData {
  id: string;
  name: string;
  category: string;
  category_id: string | null;
  sale_price: number;
  purchase_price: number;
  current_stock: number;
  selected: boolean;
  modified: boolean;
}

interface Category {
  id: string;
  name: string;
}

export default function BulkUpdate() {
  const { user } = useAuth();
  const [items, setItems] = useState<ItemData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [bulkAction, setBulkAction] = useState("");
  const [bulkValue, setBulkValue] = useState("");
  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [itemsRes, catsRes] = await Promise.all([
        supabase
          .from('items')
          .select('id, name, category_id, sale_price, purchase_price, current_stock, categories(name)')
          .eq('is_deleted', false)
          .order('name'),
        supabase
          .from('categories')
          .select('id, name')
          .order('name')
      ]);

      if (itemsRes.data) {
        setItems(itemsRes.data.map(item => ({
          id: item.id,
          name: item.name,
          category: (item.categories as any)?.name || 'Uncategorized',
          category_id: item.category_id,
          sale_price: Number(item.sale_price) || 0,
          purchase_price: Number(item.purchase_price) || 0,
          current_stock: Number(item.current_stock) || 0,
          selected: false,
          modified: false,
        })));
      }

      if (catsRes.data) {
        setCategories(catsRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = items.filter(i => i.selected).length;
  const modifiedCount = items.filter(i => i.modified).length;

  const toggleSelect = (id: string) => {
    setItems(items.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  };

  const toggleSelectAll = () => {
    const filtered = getFilteredItems();
    const allSelected = filtered.every(i => i.selected);
    const filteredIds = new Set(filtered.map(i => i.id));
    setItems(items.map(i => filteredIds.has(i.id) ? { ...i, selected: !allSelected } : i));
  };

  const getFilteredItems = () => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  const applyBulkUpdate = () => {
    if (!bulkAction || !bulkValue || selectedCount === 0) return;

    const numValue = parseFloat(bulkValue);
    
    setItems(items.map(item => {
      if (!item.selected) return item;
      
      let updates: Partial<ItemData> = { modified: true };
      
      switch (bulkAction) {
        case "increase-sale-percent":
          updates.sale_price = Math.round(item.sale_price * (1 + numValue / 100));
          break;
        case "decrease-sale-percent":
          updates.sale_price = Math.round(item.sale_price * (1 - numValue / 100));
          break;
        case "increase-purchase-percent":
          updates.purchase_price = Math.round(item.purchase_price * (1 + numValue / 100));
          break;
        case "decrease-purchase-percent":
          updates.purchase_price = Math.round(item.purchase_price * (1 - numValue / 100));
          break;
        case "set-category":
          const cat = categories.find(c => c.name.toLowerCase() === bulkValue.toLowerCase());
          if (cat) {
            updates.category = cat.name;
            updates.category_id = cat.id;
          }
          break;
      }
      
      return { ...item, ...updates };
    }));

    setBulkAction("");
    setBulkValue("");
    toast.success(`Bulk update applied to ${selectedCount} items`);
  };

  const updateItemField = (id: string, field: string, value: number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value, modified: true } : i));
    setEditingField(null);
  };

  const saveAllChanges = async () => {
    const modifiedItems = items.filter(i => i.modified);
    if (modifiedItems.length === 0) {
      toast.info('No changes to save');
      return;
    }

    setSaving(true);
    try {
      for (const item of modifiedItems) {
        const { error } = await supabase
          .from('items')
          .update({
            sale_price: item.sale_price,
            purchase_price: item.purchase_price,
            category_id: item.category_id,
          })
          .eq('id', item.id);

        if (error) throw error;
      }

      setItems(items.map(i => ({ ...i, modified: false, selected: false })));
      toast.success(`Successfully updated ${modifiedItems.length} items`);
    } catch (error: any) {
      console.error('Error saving changes:', error);
      toast.error('Failed to save changes: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = getFilteredItems();
  const uniqueCategories = [...new Set(items.map(i => i.category))].filter(Boolean);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Update Items in Bulk</h1>
          <p className="text-muted-foreground">Edit multiple items at once</p>
        </div>
        <Button 
          className="btn-gradient gap-2" 
          onClick={saveAllChanges}
          disabled={saving || modifiedCount === 0}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save All Changes {modifiedCount > 0 && `(${modifiedCount})`}
        </Button>
      </div>

      {/* Bulk Actions */}
      <div className="metric-card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <span className="font-medium">{selectedCount} items selected</span>
          </div>
          
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Bulk action..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="increase-sale-percent">Increase Sale Price %</SelectItem>
              <SelectItem value="decrease-sale-percent">Decrease Sale Price %</SelectItem>
              <SelectItem value="increase-purchase-percent">Increase Purchase Price %</SelectItem>
              <SelectItem value="decrease-purchase-percent">Decrease Purchase Price %</SelectItem>
              <SelectItem value="set-category">Change Category</SelectItem>
            </SelectContent>
          </Select>

          {bulkAction && (
            <>
              {bulkAction === "set-category" ? (
                <Select value={bulkValue} onValueChange={setBulkValue}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type="number"
                  placeholder="Percentage"
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  className="w-[120px]"
                />
              )}
              <Button onClick={applyBulkUpdate} disabled={!bulkValue || selectedCount === 0}>
                Apply
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items Table */}
      {filtered.length === 0 ? (
        <div className="metric-card text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Items Found</h3>
          <p className="text-muted-foreground">
            {items.length === 0 ? "Add some items first to use bulk update" : "No items match your search"}
          </p>
        </div>
      ) : (
        <div className="metric-card overflow-hidden p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12">
                  <button onClick={toggleSelectAll} className="p-1">
                    {filtered.length > 0 && filtered.every(i => i.selected) ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </th>
                <th>Item Name</th>
                <th>Category</th>
                <th className="text-right">Sale Price</th>
                <th className="text-right">Purchase Price</th>
                <th className="text-center">Stock</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className={cn(
                  item.selected && "bg-primary/5",
                  item.modified && "bg-warning/5"
                )}>
                  <td>
                    <button onClick={() => toggleSelect(item.id)} className="p-1">
                      {item.selected ? (
                        <CheckSquare className="w-5 h-5 text-primary" />
                      ) : (
                        <Square className="w-5 h-5 text-muted-foreground" />
                      )}
                    </button>
                  </td>
                  <td className="font-medium">
                    {item.name}
                    {item.modified && <span className="ml-2 text-xs text-warning">•</span>}
                  </td>
                  <td>{item.category}</td>
                  <td className="text-right">
                    {editingField?.id === item.id && editingField?.field === "sale_price" ? (
                      <Input
                        type="number"
                        defaultValue={item.sale_price}
                        className="w-24 h-8 text-right"
                        autoFocus
                        onBlur={(e) => updateItemField(item.id, "sale_price", Number(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateItemField(item.id, "sale_price", Number((e.target as HTMLInputElement).value));
                          }
                          if (e.key === "Escape") {
                            setEditingField(null);
                          }
                        }}
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:text-primary"
                        onClick={() => setEditingField({ id: item.id, field: "sale_price" })}
                      >
                        ₹{item.sale_price.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    {editingField?.id === item.id && editingField?.field === "purchase_price" ? (
                      <Input
                        type="number"
                        defaultValue={item.purchase_price}
                        className="w-24 h-8 text-right"
                        autoFocus
                        onBlur={(e) => updateItemField(item.id, "purchase_price", Number(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateItemField(item.id, "purchase_price", Number((e.target as HTMLInputElement).value));
                          }
                          if (e.key === "Escape") {
                            setEditingField(null);
                          }
                        }}
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:text-primary text-muted-foreground"
                        onClick={() => setEditingField({ id: item.id, field: "purchase_price" })}
                      >
                        ₹{item.purchase_price.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="text-center">{item.current_stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
