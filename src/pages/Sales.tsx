import { useState, useEffect } from "react";
import { Plus, FileText, ArrowDownLeft, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CreateInvoiceForm from "@/components/sales/CreateInvoiceForm";

export default function Sales() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [paymentsIn, setPaymentsIn] = useState<any[]>([]);
  const [challans, setChallans] = useState<any[]>([]);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const [invRes, payRes, chalRes] = await Promise.all([
      supabase.from("invoices").select("*, customers(name)").eq("invoice_type", "sales").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").eq("payment_type", "payment_in").order("created_at", { ascending: false }),
      supabase.from("invoices").select("*, customers(name)").eq("invoice_type", "delivery_challan").order("created_at", { ascending: false }),
    ]);
    if (invRes.data) setInvoices(invRes.data);
    if (payRes.data) setPaymentsIn(payRes.data);
    if (chalRes.data) setChallans(chalRes.data);
  };

  useEffect(() => { fetchData(); }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Sales</h1>
          <p className="text-sm text-muted-foreground">Manage sales invoices, payments and delivery challans</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreateInvoice(true)}><Plus className="w-4 h-4" /> New Invoice</Button>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="invoices" className="gap-2"><FileText className="w-3.5 h-3.5" /> Sales Invoice</TabsTrigger>
          <TabsTrigger value="payment-in" className="gap-2"><ArrowDownLeft className="w-3.5 h-3.5" /> Payment In</TabsTrigger>
          <TabsTrigger value="challan" className="gap-2"><Truck className="w-3.5 h-3.5" /> Delivery Challan</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Total Invoices</p><p className="text-xl font-bold text-foreground mt-1">{invoices.length}</p></div>
            <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Total Amount</p><p className="text-xl font-bold text-foreground mt-1">₹{invoices.reduce((s, i) => s + Number(i.total), 0).toLocaleString()}</p></div>
            <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Unpaid</p><p className="text-xl font-bold text-destructive mt-1">{invoices.filter(i => i.status === "unpaid").length}</p></div>
          </div>
          <div className="stat-card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-secondary/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Invoice #</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Amount</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
              </tr></thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{inv.invoice_number}</td>
                    <td className="px-5 py-3 text-muted-foreground">{inv.customers?.name || "-"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{inv.invoice_date}</td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground">₹{Number(inv.total).toLocaleString()}</td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant={inv.status === "paid" ? "default" : inv.status === "partial" ? "secondary" : "destructive"} className="text-[10px] px-2">{inv.status}</Badge>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No sales invoices yet. Click "New Invoice" to create one.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="payment-in" className="space-y-4">
          <div className="stat-card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-secondary/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Payment #</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Mode</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Amount</th>
              </tr></thead>
              <tbody>
                {paymentsIn.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{p.payment_number || "-"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.payment_date}</td>
                    <td className="px-5 py-3 text-muted-foreground capitalize">{p.payment_mode}</td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground">₹{Number(p.amount).toLocaleString()}</td>
                  </tr>
                ))}
                {paymentsIn.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No payments received yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="challan" className="space-y-4">
          <div className="stat-card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-secondary/50">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Challan #</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Amount</th>
              </tr></thead>
              <tbody>
                {challans.map(c => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{c.invoice_number}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.customers?.name || "-"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.invoice_date}</td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground">₹{Number(c.total).toLocaleString()}</td>
                  </tr>
                ))}
                {challans.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No delivery challans yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {showCreateInvoice && <CreateInvoiceForm onClose={() => setShowCreateInvoice(false)} onSaved={() => { setShowCreateInvoice(false); fetchData(); }} />}
    </div>
  );
}
