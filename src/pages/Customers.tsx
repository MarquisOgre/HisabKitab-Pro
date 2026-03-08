import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Phone, Mail, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import CustomerForm from "@/components/customers/CustomerForm";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const isMobile = useIsMobile();

  const fetchCustomers = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("parties").select("*").eq("user_id", user.id).eq("party_type", "customer").order("created_at", { ascending: false });
    if (data) setCustomers(data);
  }, [user]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    const { error } = await supabase.from("parties").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Customer deleted"); fetchCustomers(); }
  };

  const filtered = customers.filter(c =>
    (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search) ||
    (c.gstin || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = customers.reduce((s, c) => s + Number(c.opening_balance || 0), 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-foreground">Customers</h1>
          {!isMobile && <p className="text-sm text-muted-foreground">Manage your customer database</p>}
        </div>
        <Button className="gap-1.5 md:gap-2 shrink-0 h-8 md:h-10 text-xs md:text-sm px-2.5 md:px-4" onClick={() => { setEditCustomer(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" />
          {isMobile ? "Add" : "Add Customer"}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="stat-card p-3 md:p-4"><p className="text-[10px] md:text-xs text-muted-foreground uppercase">Total</p><p className="text-base md:text-xl font-bold text-foreground mt-1">{customers.length}</p></div>
        <div className="stat-card p-3 md:p-4"><p className="text-[10px] md:text-xs text-muted-foreground uppercase">Outstanding</p><p className="text-base md:text-xl font-bold text-warning mt-1">₹{totalOutstanding.toLocaleString()}</p></div>
        <div className="stat-card p-3 md:p-4"><p className="text-[10px] md:text-xs text-muted-foreground uppercase">With Bal.</p><p className="text-base md:text-xl font-bold text-foreground mt-1">{customers.filter(c => Number(c.opening_balance) > 0).length}</p></div>
      </div>

      <div className="stat-card p-3 md:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or GST..." className="w-full pl-10 pr-4 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="stat-card space-y-2 md:space-y-3">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm md:text-base truncate">{c.name}</h3>
                {c.gstin && <p className="text-xs text-muted-foreground font-mono truncate">{c.gstin}</p>}
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => { setEditCustomer(c); setShowForm(true); }} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4 text-xs text-muted-foreground flex-wrap">
              {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
              {c.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{c.email}</span>}
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className={`text-sm font-bold ${Number(c.opening_balance) === 0 ? "text-success" : "text-warning"}`}>₹{Number(c.opening_balance || 0).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-8 md:py-12 text-muted-foreground text-sm">No customers found.</div>}
      </div>

      {showForm && <CustomerForm customer={editCustomer} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchCustomers(); }} />}
    </div>
  );
}
