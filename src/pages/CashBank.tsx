import { useState, useEffect } from "react";
import { Plus, Building2, Wallet, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function CashBank() {
  const { user } = useAuth();
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newAccount, setNewAccount] = useState({ account_name: "", bank_name: "", account_number: "", ifsc_code: "", account_type: "savings", balance: "" });

  const fetchData = async () => {
    if (!user) return;
    const [bankRes, profRes] = await Promise.all([
      supabase.from("bank_accounts").select("*").order("created_at"),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
    ]);
    if (bankRes.data) setBankAccounts(bankRes.data);
    if (profRes.data) setProfile(profRes.data);
  };

  useEffect(() => { fetchData(); }, [user]);

  const addAccount = async () => {
    if (!user || !newAccount.account_name) return;
    const { error } = await supabase.from("bank_accounts").insert({
      user_id: user.id, ...newAccount, balance: parseFloat(newAccount.balance) || 0,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Bank account added!");
    setNewAccount({ account_name: "", bank_name: "", account_number: "", ifsc_code: "", account_type: "savings", balance: "" });
    setShowAdd(false);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Cash & Bank</h1>
          <p className="text-sm text-muted-foreground">Manage your bank accounts and cash balance</p>
        </div>
      </div>

      <Tabs defaultValue="bank">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="bank" className="gap-2"><Building2 className="w-3.5 h-3.5" /> Bank Accounts</TabsTrigger>
          <TabsTrigger value="cash" className="gap-2"><Banknote className="w-3.5 h-3.5" /> Cash in Hand</TabsTrigger>
        </TabsList>

        <TabsContent value="bank" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Bank Account</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Bank Account</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Account Name *</Label><Input value={newAccount.account_name} onChange={e => setNewAccount({ ...newAccount, account_name: e.target.value })} placeholder="e.g. Business Savings" /></div>
                  <div className="space-y-2"><Label>Bank Name</Label><Input value={newAccount.bank_name} onChange={e => setNewAccount({ ...newAccount, bank_name: e.target.value })} placeholder="e.g. SBI" /></div>
                  <div className="space-y-2"><Label>Account Number</Label><Input value={newAccount.account_number} onChange={e => setNewAccount({ ...newAccount, account_number: e.target.value })} /></div>
                  <div className="space-y-2"><Label>IFSC Code</Label><Input value={newAccount.ifsc_code} onChange={e => setNewAccount({ ...newAccount, ifsc_code: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Opening Balance (₹)</Label><Input type="number" value={newAccount.balance} onChange={e => setNewAccount({ ...newAccount, balance: e.target.value })} placeholder="0" /></div>
                  <Button onClick={addAccount} className="w-full">Save Account</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map(acc => (
              <div key={acc.id} className="stat-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{acc.account_name}</p>
                    <p className="text-xs text-muted-foreground">{acc.bank_name || "Bank"} • {acc.account_type}</p>
                    {acc.account_number && <p className="text-xs text-muted-foreground mt-1">A/C: ****{acc.account_number.slice(-4)}</p>}
                  </div>
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground mt-3">₹{Number(acc.balance).toLocaleString()}</p>
              </div>
            ))}
            {bankAccounts.length === 0 && <p className="text-muted-foreground text-sm col-span-3">No bank accounts added yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="cash" className="space-y-4">
          <div className="stat-card max-w-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase">Cash in Hand</p>
                <p className="text-3xl font-bold text-foreground mt-2">₹{Number(profile?.cash_in_hand || 0).toLocaleString()}</p>
              </div>
              <Wallet className="w-6 h-6 text-accent" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
