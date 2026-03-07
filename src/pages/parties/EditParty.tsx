import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function EditParty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    type: "customer",
    phone: "",
    email: "",
    gstin: "",
    billingAddress: "",
    shippingAddress: "",
    openingBalance: "",
    creditLimit: "",
  });

  useEffect(() => {
    if (user && id) {
      fetchParty();
    }
  }, [user, id]);

  const fetchParty = async () => {
    try {
      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      
      setFormData({
        name: data.name || "",
        type: data.party_type || "customer",
        phone: data.phone || "",
        email: data.email || "",
        gstin: data.gstin || "",
        billingAddress: data.billing_address || "",
        shippingAddress: data.shipping_address || "",
        openingBalance: data.opening_balance?.toString() || "",
        creditLimit: data.credit_limit?.toString() || "",
      });
    } catch (error: any) {
      toast.error("Failed to fetch party: " + error.message);
      navigate("/parties");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    if (!formData.name.trim()) {
      toast.error("Party name is required");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("parties")
        .update({
          name: formData.name.trim(),
          party_type: formData.type,
          phone: formData.phone || null,
          email: formData.email || null,
          gstin: formData.gstin || null,
          billing_address: formData.billingAddress || null,
          shipping_address: formData.shippingAddress || null,
          opening_balance: formData.openingBalance ? parseFloat(formData.openingBalance) : 0,
          credit_limit: formData.creditLimit ? parseFloat(formData.creditLimit) : null,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success("Party updated successfully!");
      navigate("/parties");
    } catch (error: any) {
      toast.error(error.message || "Failed to update party");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/parties">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Party</h1>
          <p className="text-muted-foreground">Update party information</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="metric-card space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Party Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="Enter party name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Party Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="supplier">Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>

          {/* Tax Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Tax Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gstin">GSTIN</Label>
                <Input
                  id="gstin"
                  value={formData.gstin}
                  onChange={(e) => handleChange("gstin", e.target.value)}
                  placeholder="22AAAAA0000A1Z5"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billingAddress">Billing Address</Label>
                <Textarea
                  id="billingAddress"
                  value={formData.billingAddress}
                  onChange={(e) => handleChange("billingAddress", e.target.value)}
                  placeholder="Enter billing address"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingAddress">Shipping Address</Label>
                <Textarea
                  id="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={(e) => handleChange("shippingAddress", e.target.value)}
                  placeholder="Enter shipping address"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Balance & Credit */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Balance & Credit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openingBalance">Opening Balance</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  value={formData.openingBalance}
                  onChange={(e) => handleChange("openingBalance", e.target.value)}
                  placeholder="₹0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  value={formData.creditLimit}
                  onChange={(e) => handleChange("creditLimit", e.target.value)}
                  placeholder="₹0"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-border">
            <Button type="submit" className="btn-gradient gap-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/parties">Cancel</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}