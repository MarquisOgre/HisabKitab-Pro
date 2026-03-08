import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessSettings } from "@/contexts/BusinessContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { SearchableItemSelect } from "@/components/invoice/SearchableItemSelect";
import { useIsMobile } from "@/hooks/use-mobile";

export interface PurchaseInvoiceItem {
  id: number;
  itemId: string;
  categoryId: string;
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  amount: number;
}

interface PurchaseInvoiceItemsTableProps {
  items: PurchaseInvoiceItem[];
  onItemsChange: (items: PurchaseInvoiceItem[]) => void;
}

interface DbItem {
  id: string;
  name: string;
  hsn_code: string | null;
  purchase_price: string | null;
  unit: string | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface UnitOption {
  id: string;
  name: string;
}

export function PurchaseInvoiceItemsTable({ items, onItemsChange }: PurchaseInvoiceItemsTableProps) {
  const { user } = useAuth();
  const { businessSettings } = useBusinessSettings();
  const { selectedBusiness } = useBusinessSelection();
  const defaultTaxRate = businessSettings?.gst_payable ?? 0;
  const [dbItems, setDbItems] = useState<DbItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user && selectedBusiness) {
      fetchItems();
      fetchCategories();
      fetchUnits();
    }
  }, [user, selectedBusiness]);

  const fetchItems = async () => {
    if (!selectedBusiness) {
      console.log("[PurchaseItems] No selectedBusiness, skipping fetch");
      return;
    }
    console.log("[PurchaseItems] Fetching items for business:", selectedBusiness.id, selectedBusiness.name);
    const { data, error } = await supabase
      .from("items")
      .select("id, name, hsn_code, purchase_price, unit, category_id")
      .or("is_deleted.is.null,is_deleted.eq.false")
      .eq("business_id", selectedBusiness.id)
      .order("name");
    console.log("[PurchaseItems] Fetched items:", data?.length || 0, "Error:", error?.message || "none");
    if (data) {
      setDbItems(data);
    }
  };

  const fetchCategories = async () => {
    if (!user || !selectedBusiness) return;
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .eq("business_id", selectedBusiness.id)
      .order("name");
    if (data) {
      setCategories(data);
    }
  };

  const fetchUnits = async () => {
    const { data } = await supabase
      .from("units")
      .select("id, name")
      .order("name");
    if (data && data.length > 0) {
      setUnitOptions(data);
    } else {
      setUnitOptions([{ id: 'default', name: 'Bottles' }]);
    }
  };

  const addItem = () => {
    const defaultUnit = unitOptions.length > 0 ? unitOptions[0].name : "Bottles";
    const newItem: PurchaseInvoiceItem = {
      id: Date.now(),
      itemId: "",
      categoryId: "",
      name: "",
      quantity: 0,
      unit: defaultUnit,
      rate: 0,
      taxRate: Number(defaultTaxRate) || 0,
      amount: 0,
    };
    onItemsChange([...items, newItem]);
  };

  const getFilteredItems = (categoryId: string) => {
    if (!categoryId) return dbItems;
    return dbItems.filter(item => item.category_id === categoryId);
  };

  const updateItem = (id: number, field: keyof PurchaseInvoiceItem, value: string | number) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === "categoryId") {
          updatedItem.itemId = "";
          updatedItem.name = "";
          updatedItem.rate = 0;
          updatedItem.quantity = 0;
          updatedItem.amount = 0;
        }
        
        if (field === "itemId") {
          const selectedItem = dbItems.find((i) => i.id === value);
          if (selectedItem) {
            updatedItem.name = selectedItem.name;
            updatedItem.rate = Number(selectedItem.purchase_price) || 0;
            updatedItem.unit = selectedItem.unit || "Bottles";
            updatedItem.categoryId = selectedItem.category_id || "";
            updatedItem.taxRate = Number(defaultTaxRate) || 0;
          }
        }
        
        updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        
        return updatedItem;
      }
      return item;
    });
    
    if (field === "itemId" && value) {
      const lastItem = updated[updated.length - 1];
      if (lastItem && lastItem.itemId) {
        const defaultUnit = unitOptions.length > 0 ? unitOptions[0].name : "Bottles";
        const newItem: PurchaseInvoiceItem = {
          id: Date.now(),
          itemId: "",
          categoryId: "",
          name: "",
          quantity: 0,
          unit: defaultUnit,
          rate: 0,
          taxRate: Number(defaultTaxRate) || 0,
          amount: 0,
        };
        updated.push(newItem);
      }
    }
    
    onItemsChange(updated);
  };

  const removeItem = (id: number) => {
    onItemsChange(items.filter((item) => item.id !== id));
  };

  // Mobile card layout
  if (isMobile) {
    return (
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={item.id} className="border border-border rounded-lg p-3 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Item #{index + 1}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <Select
                  value={item.categoryId || "all"}
                  onValueChange={(value) => updateItem(item.id, "categoryId", value === "all" ? "" : value)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
                <Select
                  value={item.unit || (unitOptions[0]?.name || "Bottles")}
                  onValueChange={(value) => updateItem(item.id, "unit", value)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((unit) => (
                      <SelectItem key={unit.id} value={unit.name}>{unit.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Item</label>
              <SearchableItemSelect
                items={getFilteredItems(item.categoryId).map((si) => ({
                  id: si.id,
                  name: si.name,
                }))}
                value={item.itemId}
                onSelect={(value) => updateItem(item.id, "itemId", value)}
                placeholder="Select item"
                emptyText="No items found."
                className="w-full text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Qty</label>
                <NumberInput
                  value={item.quantity}
                  onChange={(val) => updateItem(item.id, "quantity", val)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Rate</label>
                <NumberInput
                  value={item.rate}
                  onChange={(val) => updateItem(item.id, "rate", val)}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
                <div className="h-9 flex items-center justify-center bg-muted/50 rounded text-xs font-medium">
                  ₹{item.amount.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Totals Card */}
        {items.length > 0 && (
          <div className="border border-primary/30 rounded-lg p-3 bg-primary/5">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center">
                <p className="text-muted-foreground">Total Qty</p>
                <p className="font-bold text-primary">{items.reduce((sum, item) => sum + item.quantity, 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Total Amount</p>
                <p className="font-bold">₹{items.reduce((sum, item) => sum + item.amount, 0).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        )}

        <Button variant="outline" onClick={addItem} className="w-full gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>
    );
  }

  // Desktop table layout
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-center py-3 px-2 font-medium text-muted-foreground w-8">#</th>
              <th className="text-center py-3 px-2 font-medium text-muted-foreground w-24">Category</th>
              <th className="text-center py-3 px-2 font-medium text-muted-foreground min-w-[200px]">Item</th>
              <th className="text-center py-3 px-2 font-medium text-muted-foreground w-16">Qty</th>
              <th className="text-center py-3 px-2 font-medium text-muted-foreground w-20">Unit</th>
              <th className="text-center py-3 px-2 font-medium text-muted-foreground w-20">Rate</th>
              <th className="text-center py-3 px-2 font-medium text-muted-foreground w-24">Amount</th>
              <th className="py-3 px-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b border-border/50">
                <td className="py-2 px-2 text-center text-muted-foreground">{index + 1}</td>
                <td className="py-2 px-2">
                  <Select
                    value={item.categoryId || "all"}
                    onValueChange={(value) => updateItem(item.id, "categoryId", value === "all" ? "" : value)}
                  >
                    <SelectTrigger className="h-9 text-xs w-24">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-2 px-2">
                  <SearchableItemSelect
                    items={getFilteredItems(item.categoryId).map((si) => ({
                      id: si.id,
                      name: si.name,
                    }))}
                    value={item.itemId}
                    onSelect={(value) => updateItem(item.id, "itemId", value)}
                    placeholder="Select item"
                    emptyText="No items found."
                    className="w-full text-xs"
                  />
                </td>
                <td className="py-2 px-2">
                  <NumberInput
                    value={item.quantity}
                    onChange={(val) => updateItem(item.id, "quantity", val)}
                    className="h-9 w-16 text-xs"
                  />
                </td>
                <td className="py-2 px-2">
                  <Select
                    value={item.unit || (unitOptions[0]?.name || "Bottles")}
                    onValueChange={(value) => updateItem(item.id, "unit", value)}
                  >
                    <SelectTrigger className="h-9 w-20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((unit) => (
                        <SelectItem key={unit.id} value={unit.name}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-2 px-2">
                  <NumberInput
                    value={item.rate}
                    onChange={(val) => updateItem(item.id, "rate", val)}
                    className="h-9 w-20 text-xs"
                  />
                </td>
                <td className="py-2 px-2 text-center font-medium text-xs">
                  ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-2 px-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr className="bg-muted/50 font-semibold border-t text-xs">
                <td colSpan={3} className="py-2 px-2 text-right">Total Qty:</td>
                <td className="py-2 px-2 text-center text-primary">{items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td colSpan={2}></td>
                <td className="py-2 px-2 text-right">₹{items.reduce((sum, item) => sum + item.amount, 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <Button variant="outline" onClick={addItem} className="gap-2">
        <Plus className="w-4 h-4" />
        Add Item
      </Button>
    </div>
  );
}
