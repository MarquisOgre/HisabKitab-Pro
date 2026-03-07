import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreditCard, Plus, Pencil, Trash2, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { isSuperAdminEmail } from "@/lib/superadmin";

interface LicensePlan {
  id: string;
  plan_name: string;
  duration_days: number;
  price: number;
  description: string | null;
  is_active: boolean;
  sort_order: number;
}

export function LicensePlans() {
  const { user } = useAuth();
  const isSuperAdmin = isSuperAdminEmail(user?.email);
  const [plans, setPlans] = useState<LicensePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LicensePlan | null>(null);
  const [formData, setFormData] = useState({
    plan_name: "",
    duration_days: 30,
    price: 0,
    description: "",
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("license_plans")
        .select("*")
        .order("sort_order");
      
      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch plans: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingPlan(null);
    setFormData({
      plan_name: "",
      duration_days: 30,
      price: 0,
      description: "",
      is_active: true,
      sort_order: plans.length + 1,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (plan: LicensePlan) => {
    setEditingPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      duration_days: plan.duration_days,
      price: plan.price,
      description: plan.description || "",
      is_active: plan.is_active,
      sort_order: plan.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.plan_name.trim()) {
      toast.error("Plan name is required");
      return;
    }

    setSaving(true);
    try {
      if (editingPlan) {
        const { error } = await supabase
          .from("license_plans")
          .update({
            plan_name: formData.plan_name,
            duration_days: formData.duration_days,
            price: formData.price,
            description: formData.description || null,
            is_active: formData.is_active,
            sort_order: formData.sort_order,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingPlan.id);

        if (error) throw error;
        toast.success("Plan updated successfully");
      } else {
        const { error } = await supabase
          .from("license_plans")
          .insert({
            plan_name: formData.plan_name,
            duration_days: formData.duration_days,
            price: formData.price,
            description: formData.description || null,
            is_active: formData.is_active,
            sort_order: formData.sort_order,
          });

        if (error) throw error;
        toast.success("Plan created successfully");
      }

      setDialogOpen(false);
      fetchPlans();
    } catch (error: any) {
      toast.error("Failed to save plan: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      const { error } = await supabase
        .from("license_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Plan deleted successfully");
      fetchPlans();
    } catch (error: any) {
      toast.error("Failed to delete plan: " + error.message);
    }
  };

  const formatDuration = (days: number) => {
    if (days === 1) return "1 Day";
    if (days < 30) return `${days} Days`;
    if (days === 30) return "1 Month";
    if (days === 90) return "3 Months";
    if (days === 180) return "6 Months";
    if (days === 365) return "1 Year";
    return `${days} Days`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              License Plans
            </CardTitle>
            <CardDescription>
              Manage subscription plans and pricing
            </CardDescription>
          </div>
          {isSuperAdmin && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="btn-gradient gap-2">
                  <Plus className="w-4 h-4" />
                  Add Plan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPlan ? "Edit Plan" : "Add New Plan"}</DialogTitle>
                  <DialogDescription>
                    {editingPlan ? "Update the plan details below" : "Create a new license plan"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="plan_name">Plan Name *</Label>
                    <Input
                      id="plan_name"
                      value={formData.plan_name}
                      onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                      placeholder="e.g., Gold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration_days">Duration (Days)</Label>
                      <Input
                        id="duration_days"
                        type="number"
                        value={formData.duration_days}
                        onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 0 })}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        min={0}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the plan"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sort_order">Sort Order</Label>
                      <Input
                        id="sort_order"
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                        min={0}
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-6">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="btn-gradient gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {editingPlan ? "Update Plan" : "Create Plan"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan Name</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>Status</TableHead>
              {isSuperAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.plan_name}</TableCell>
                <TableCell>{formatDuration(plan.duration_days)}</TableCell>
                <TableCell className="text-right font-semibold">
                  {plan.price === 0 ? "Free" : `₹${plan.price.toLocaleString("en-IN")}`}
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-1 rounded-full ${plan.is_active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    {plan.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                {isSuperAdmin && (
                  <TableCell>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {plans.length === 0 && (
              <TableRow>
                <TableCell colSpan={isSuperAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                  No license plans found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}