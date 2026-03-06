import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Phone, Mail, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import CustomerForm from "@/components/customers/CustomerForm";

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);

  const fetchCustomers = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("customers").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setCustomers(data);
  }, [user]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Customer deleted"); fetchCustomers(); }
  };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.mobile || "").includes(search) ||
    (c.gst_number || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = customers.reduce((s, c) => s + Number(c.balance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage your customer database</p>
        </div>
        <Button className="gap-2" onClick={() => { setEditCustomer(null); setShowForm(true); }}><Plus className="w-4 h-4" /> Add Customer</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Total Customers</p><p className="text-xl font-bold text-foreground mt-1">{customers.length}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Outstanding Balance</p><p className="text-xl font-bold text-warning mt-1">₹{totalOutstanding.toLocaleString()}</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">With Balance</p><p className="text-xl font-bold text-foreground mt-1">{customers.filter(c => Number(c.balance) > 0).length}</p></div>
      </div>

      <div className="stat-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, or GST number..." className="w-full pl-10 pr-4 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <div key={c.id} className="stat-card space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{c.name}</h3>
                {c.gst_number && <p className="text-xs text-muted-foreground font-mono">{c.gst_number}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditCustomer(c); setShowForm(true); }} className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {c.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.mobile}</span>}
              {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
            </div>
            <div className="pt-2 border-t border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Balance</span>
              <span className={`text-sm font-bold ${Number(c.balance) === 0 ? "text-success" : "text-warning"}`}>₹{Number(c.balance).toLocaleString()}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">No customers found.</div>}
      </div>

      {showForm && <CustomerForm customer={editCustomer} onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchCustomers(); }} />}
    </div>
  );
}
