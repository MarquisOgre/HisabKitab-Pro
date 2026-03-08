import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Props {
  supplier?: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function SupplierForm({ supplier, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: supplier?.name || "",
    phone: supplier?.phone || "",
    email: supplier?.email || "",
    gstin: supplier?.gstin || "",
    billing_address: supplier?.billing_address || "",
    opening_balance: supplier?.opening_balance || "0",
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!user) return;
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      if (supplier) {
        const { error } = await supabase.from("parties").update(form).eq("id", supplier.id);
        if (error) throw error;
        toast.success("Supplier updated!");
      } else {
        const { error } = await supabase.from("parties").insert({ ...form, user_id: user.id, party_type: "supplier" });
        if (error) throw error;
        toast.success("Supplier added!");
      }
      onSaved();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center">
      <div className="bg-card rounded-t-xl md:rounded-xl border border-border shadow-2xl w-full max-w-lg md:mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base md:text-lg font-bold text-foreground">{supplier ? "Edit" : "Add"} Supplier</h2>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-2 md:col-span-2"><Label>Name *</Label><Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="Supplier name" /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="9876543210" /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" /></div>
            <div className="space-y-2"><Label>GSTIN</Label><Input value={form.gstin} onChange={e => set("gstin", e.target.value)} placeholder="27AABCU9703R1ZM" /></div>
            <div className="space-y-2"><Label>Opening Balance</Label><Input type="number" value={form.opening_balance} onChange={e => set("opening_balance", e.target.value)} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Address</Label><Input value={form.billing_address} onChange={e => set("billing_address", e.target.value)} placeholder="Address" /></div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-4 md:px-6 py-3 md:py-4 border-t border-border sticky bottom-0 bg-card">
          <Button variant="outline" onClick={onClose} size="sm" className="md:size-default">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} size="sm" className="md:size-default">{saving ? "Saving..." : supplier ? "Update" : "Add Supplier"}</Button>
        </div>
      </div>
    </div>
  );
}
