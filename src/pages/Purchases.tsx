import { useState, useEffect } from "react";
import { Plus, FileText, ArrowUpRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Purchases() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [paymentsOut, setPaymentsOut] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [purRes, payRes, expRes] = await Promise.all([
        supabase.from("purchase_invoices").select("*, parties(name)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("payments").select("*").eq("user_id", user.id).eq("payment_type", "payment_out").order("created_at", { ascending: false }),
        supabase.from("expenses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (purRes.data) setPurchases(purRes.data);
      if (payRes.data) setPaymentsOut(payRes.data);
      if (expRes.data) setExpenses(expRes.data);
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Purchases</h1>
          <p className="text-sm text-muted-foreground">Manage purchase invoices, payments and expenses</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> New Purchase</Button>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="invoices" className="gap-2"><FileText className="w-3.5 h-3.5" /> Purchase Invoice</TabsTrigger>
          <TabsTrigger value="payment-out" className="gap-2"><ArrowUpRight className="w-3.5 h-3.5" /> Payment Out</TabsTrigger>
          <TabsTrigger value="expenses" className="gap-2"><Wallet className="w-3.5 h-3.5" /> Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Total Purchases</p><p className="text-xl font-bold text-foreground mt-1">{purchases.length}</p></div>
            <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Total Amount</p><p className="text-xl font-bold text-foreground mt-1">₹{purchases.reduce((s, p) => s + Number(p.total_amount || 0), 0).toLocaleString()}</p></div>
            <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Unpaid</p><p className="text-xl font-bold text-destructive mt-1">{purchases.filter(p => p.status === "unpaid").length}</p></div>
          </div>
          <div className="stat-card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-secondary/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Purchase #</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Amount</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              </tr></thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{p.invoice_number}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.parties?.name || "-"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.invoice_date}</td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground">₹{Number(p.total_amount || 0).toLocaleString()}</td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant={p.status === "paid" ? "default" : "destructive"} className="text-[10px] px-2">{p.status}</Badge>
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No purchase invoices yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="payment-out" className="space-y-4">
          <div className="stat-card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-secondary/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Payment #</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Mode</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Amount</th>
              </tr></thead>
              <tbody>
                {paymentsOut.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{p.payment_number || "-"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.payment_date}</td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">{p.payment_mode}</td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground">₹{Number(p.amount).toLocaleString()}</td>
                  </tr>
                ))}
                {paymentsOut.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No payments made yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="stat-card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-secondary/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Category</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Notes</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Mode</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Amount</th>
              </tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{e.category}</td>
                    <td className="px-5 py-3 text-muted-foreground">{e.notes || "-"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{e.expense_date}</td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">{e.payment_mode}</td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground">₹{Number(e.amount).toLocaleString()}</td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No expenses recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
