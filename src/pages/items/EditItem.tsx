import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UnitOption {
  id: string;
  name: string;
}

export default function EditItem() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    unit: "Bottles",
    hsnCode: "",
    purchasePrice: "",
    salePrice: "",
    openingStock: "",
    currentStock: "",
    minStock: "",
  });

  useEffect(() => {
    if (user && id) {
      fetchCategories();
      fetchUnits();
      fetchItem();
    }
  }, [user, id]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");
    if (data) setCategories(data);
  };

  const fetchUnits = async () => {
    // Fetch all units (global for all users)
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

  const fetchItem = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          categoryId: data.category_id || "",
          name: data.name || "",
          unit: data.unit || "Bottles",
          hsnCode: data.hsn_code || "",
          purchasePrice: data.purchase_price?.toString() || "",
          salePrice: data.sale_price?.toString() || "",
          openingStock: data.opening_stock?.toString() || "",
          currentStock: data.current_stock?.toString() || "",
          minStock: data.low_stock_alert?.toString() || "",
        });
      }
    } catch (error: any) {
      toast.error("Failed to fetch item: " + error.message);
      navigate("/items");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) {
      toast.error("Please login to update an item");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Item name is required");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("items")
        .update({
          name: formData.name.trim(),
          category_id: formData.categoryId || null,
          unit: formData.unit,
          hsn_code: formData.hsnCode.trim() || null,
          purchase_price: formData.purchasePrice ? parseFloat(formData.purchasePrice) : 0,
          sale_price: formData.salePrice ? parseFloat(formData.salePrice) : 0,
          opening_stock: formData.openingStock ? parseFloat(formData.openingStock) : 0,
          current_stock: formData.currentStock ? parseFloat(formData.currentStock) : 0,
          low_stock_alert: formData.minStock ? parseFloat(formData.minStock) : 10,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Item updated successfully!");
      navigate("/items");
    } catch (error: any) {
      toast.error(error.message || "Failed to update item");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/items">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Item</h1>
          <p className="text-muted-foreground">Update product or service details</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="metric-card space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleChange("categoryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter item name"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => handleChange("unit", value)}
                >
                  <SelectTrigger>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="hsnCode">HSN Code</Label>
                <Input
                  id="hsnCode"
                  value={formData.hsnCode}
                  onChange={(e) => handleChange("hsnCode", e.target.value)}
                  placeholder="Enter HSN code"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <NumberInput
                  id="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={(val) => handleChange("purchasePrice", String(val))}
                  placeholder="₹0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price</Label>
                <NumberInput
                  id="salePrice"
                  value={formData.salePrice}
                  onChange={(val) => handleChange("salePrice", String(val))}
                  placeholder="₹0"
                />
              </div>
            </div>
          </div>

          {/* Stock */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Stock</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openingStock">Opening Stock</Label>
                <NumberInput
                  id="openingStock"
                  value={formData.openingStock}
                  onChange={(val) => handleChange("openingStock", String(val))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentStock">Current Stock</Label>
                <NumberInput
                  id="currentStock"
                  value={formData.currentStock}
                  onChange={(val) => handleChange("currentStock", String(val))}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Minimum Stock Level</Label>
                <NumberInput
                  id="minStock"
                  value={formData.minStock}
                  onChange={(val) => handleChange("minStock", String(val))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <Button type="submit" className="btn-gradient gap-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update Item
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/items">Cancel</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}