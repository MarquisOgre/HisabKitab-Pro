import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  customer?: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function CustomerForm({ customer, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: customer?.name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    gstin: customer?.gstin || "",
    billing_address: customer?.billing_address || "",
    opening_balance: customer?.opening_balance || "0",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      if (customer) {
        const { error } = await supabase.from("parties").update(form).eq("id", customer.id);
        if (error) throw error;
        toast.success("Customer updated!");
      } else {
        const { error } = await supabase.from("parties").insert({ ...form, user_id: user.id, party_type: "customer" });
        if (error) throw error;
        toast.success("Customer added!");
      }
      onSaved();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">{customer ? "Edit" : "Add"} Customer</h2>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2"><Label>Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Customer name" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="9876543210" /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" /></div>
            <div className="space-y-2"><Label>GSTIN</Label><Input value={form.gstin} onChange={e => set("gstin", e.target.value)} placeholder="27AABCU9603R1ZM" /></div>
            <div className="space-y-2"><Label>Opening Balance</Label><Input type="number" value={form.opening_balance} onChange={e => set("opening_balance", e.target.value)} /></div>
            <div className="space-y-2 col-span-2"><Label>Address</Label><Input value={form.billing_address} onChange={e => set("billing_address", e.target.value)} placeholder="Address" /></div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : customer ? "Update" : "Add Customer"}</Button>
        </div>
      </div>
    </div>
  );
}
