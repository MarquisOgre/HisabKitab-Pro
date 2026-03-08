import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Phone, Mail, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SupplierForm from "@/components/suppliers/SupplierForm";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const isMobile = useIsMobile();

  const fetchSuppliers = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("parties").select("*").eq("user_id", user.id).eq("party_type", "supplier").order("created_at", { ascending: false });
    if (data) setSuppliers(data);
  }, [user]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this supplier?")) return;
    const { error } = await supabase.from("parties").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supplier deleted"); fetchSuppliers(); }
  };

  const filtered = suppliers.filter(s =>
    (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || "").includes(search) ||
    (s.gstin || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalPayable = suppliers.reduce((s, sup) => s + Number(sup.opening_balance || 0), 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-foreground">Suppliers</h1>
          {!isMobile && <p className="text-sm text-muted-foreground">Manage your supplier database</p>}
        </div>
        <Button className="gap-1.5 md:gap-2 shrink-0 h-8 md:h-10 text-xs md:text-sm px-2.5 md:px-4" onClick={() => { setEditSupplier(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" />
          {isMobile ? "Add" : "Add Supplier"}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="stat-card p-3 md:p-4"><p className="text-[10px] md:text-xs text-muted-foreground uppercase">Total</p><p className="text-base md:text-xl font-bold text-foreground mt-1">{suppliers.length}</p></div>
        <div className="stat-card p-3 md:p-4"><p className="text-[10px] md:text-xs text-muted-foreground uppercase">Pending</p><p className="text-base md:text-xl font-bold text-destructive mt-1">₹{totalPayable.toLocaleString()}</p></div>
        <div className="stat-card p-3 md:p-4"><p className="text-[10px] md:text-xs text-muted-foreground uppercase">With Bal.</p><p className="text-base md:text-xl font-bold text-foreground mt-1">{suppliers.filter(s => Number(s.opening_balance) > 0).length}</p></div>
      </div>

      <div className="stat-card p-3 md:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search suppliers..." className="w-full pl-10 pr-4 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {filtered.map((s) => (
          <div key={s.id} className="stat-card space-y-2 md:space-y-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm md:text-base truncate">{s.name}</h3>
                {s.gstin && <p className="text-xs text-muted-foreground font-mono truncate">{s.gstin}</p>}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => { setEditSupplier(s); setShowForm(true); }} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 text-xs text-muted-foreground flex-wrap">
              {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
              {s.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{s.email}</span>}
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Payable</span>
              <span className={`text-sm font-bold ${Number(s.opening_balance) === 0 ? "text-success" : "text-destructive"}`}>₹{Number(s.opening_balance || 0).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-8 md:py-12 text-muted-foreground text-sm">No suppliers found.</div>}
      </div>

      {showForm && <SupplierForm supplier={editSupplier} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchSuppliers(); }} />}
    </div>
  );
}
