import { useState, useEffect } from "react";
import { Plus, FileText, ArrowDownLeft, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import CreateInvoiceForm from "@/components/sales/CreateInvoiceForm";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Sales() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [paymentsIn, setPaymentsIn] = useState<any[]>([]);
  const [challans, setChallans] = useState<any[]>([]);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const isMobile = useIsMobile();

  const fetchData = async () => {
    if (!user) return;
    const [invRes, payRes, chalRes] = await Promise.all([
      supabase.from("sale_invoices").select("*, parties(name)").eq("user_id", user.id).eq("invoice_type", "sale").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").eq("user_id", user.id).eq("payment_type", "payment_in").order("created_at", { ascending: false }),
      supabase.from("sale_invoices").select("*, parties(name)").eq("user_id", user.id).eq("invoice_type", "delivery_challan").order("created_at", { ascending: false }),
    ]);
    if (invRes.data) setInvoices(invRes.data);
    if (payRes.data) setPaymentsIn(payRes.data);
    if (chalRes.data) setChallans(chalRes.data);
  };

  useEffect(() => { fetchData(); }, [user]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-foreground">Sales</h1>
          {!isMobile && <p className="text-sm text-muted-foreground">Manage sales invoices, payments and delivery challans</p>}
        </div>
        <Button className="gap-1.5 md:gap-2 shrink-0 h-8 md:h-10 text-xs md:text-sm px-2.5 md:px-4" onClick={() => setShowCreateInvoice(true)}>
          <Plus className="w-4 h-4" />
          {isMobile ? "New" : "New Invoice"}
        </Button>
      </div>

      <Tabs defaultValue="invoices" className="mobile-tabs">
        <TabsList className={isMobile ? "w-full grid grid-cols-3" : "grid w-full grid-cols-3 max-w-lg"}>
          <TabsTrigger value="invoices" className="gap-1 md:gap-2 text-xs md:text-sm px-1.5 md:px-3">
            <FileText className="w-3.5 h-3.5 hidden md:block" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="payment-in" className="gap-1 md:gap-2 text-xs md:text-sm px-1.5 md:px-3">
            <ArrowDownLeft className="w-3.5 h-3.5 hidden md:block" />
            Payment In
          </TabsTrigger>
          <TabsTrigger value="challan" className="gap-1 md:gap-2 text-xs md:text-sm px-1.5 md:px-3">
            <Truck className="w-3.5 h-3.5 hidden md:block" />
            Challan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <div className="grid grid-cols-3 gap-2 md:gap-4">
            <div className="stat-card p-3 md:p-4"><p className="text-[10px] md:text-xs text-muted-foreground uppercase">Total</p><p className="text-base md:text-xl font-bold text-foreground mt-1">{invoices.length}</p></div>
            <div className="stat-card p-3 md:p-4"><p className="text-[10px] md:text-xs text-muted-foreground uppercase">Amount</p><p className="text-base md:text-xl font-bold text-foreground mt-1">₹{invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0).toLocaleString()}</p></div>
            <div className="stat-card p-3 md:p-4"><p className="text-[10px] md:text-xs text-muted-foreground uppercase">Unpaid</p><p className="text-base md:text-xl font-bold text-destructive mt-1">{invoices.filter(i => i.status === "unpaid").length}</p></div>
          </div>

          {/* Mobile card layout */}
          {isMobile ? (
            <div className="space-y-2">
              {invoices.map(inv => (
                <div key={inv.id} className="stat-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{inv.invoice_number}</span>
                    <Badge variant={inv.status === "paid" ? "default" : inv.status === "partial" ? "secondary" : "destructive"} className="text-[10px] px-2">{inv.status}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{inv.parties?.name || "-"}</span>
                    <span>{inv.invoice_date}</span>
                  </div>
                  <div className="text-right font-semibold text-foreground">₹{Number(inv.total_amount || 0).toLocaleString()}</div>
                </div>
              ))}
              {invoices.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No sales invoices yet.</p>}
            </div>
          ) : (
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
                      <td className="px-5 py-3 text-muted-foreground">{inv.parties?.name || "-"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{inv.invoice_date}</td>
                      <td className="px-5 py-3 text-right font-semibold text-foreground">₹{Number(inv.total_amount || 0).toLocaleString()}</td>
                      <td className="px-5 py-3 text-center">
                        <Badge variant={inv.status === "paid" ? "default" : inv.status === "partial" ? "secondary" : "destructive"} className="text-[10px] px-2">{inv.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No sales invoices yet. Click "New Invoice" to create one.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="payment-in" className="space-y-4">
          {isMobile ? (
            <div className="space-y-2">
              {paymentsIn.map(p => (
                <div key={p.id} className="stat-card p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{p.payment_number || "-"}</span>
                    <span className="font-semibold text-foreground">₹{Number(p.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{p.payment_mode}</span>
                    <span>{p.payment_date}</span>
                  </div>
                </div>
              ))}
              {paymentsIn.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No payments received yet.</p>}
            </div>
          ) : (
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
          )}
        </TabsContent>

        <TabsContent value="challan" className="space-y-4">
          {isMobile ? (
            <div className="space-y-2">
              {challans.map(c => (
                <div key={c.id} className="stat-card p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-foreground">{c.invoice_number}</span>
                    <span className="font-semibold text-foreground">₹{Number(c.total_amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{c.parties?.name || "-"}</span>
                    <span>{c.invoice_date}</span>
                  </div>
                </div>
              ))}
              {challans.length === 0 && <p className="text-center py-8 text-sm text-muted-foreground">No delivery challans yet.</p>}
            </div>
          ) : (
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
                      <td className="px-5 py-3 text-muted-foreground">{c.parties?.name || "-"}</td>
                      <td className="px-5 py-3 text-muted-foreground">{c.invoice_date}</td>
                      <td className="px-5 py-3 text-right font-semibold text-foreground">₹{Number(c.total_amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                  {challans.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">No delivery challans yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showCreateInvoice && <CreateInvoiceForm onClose={() => setShowCreateInvoice(false)} onSaved={() => { setShowCreateInvoice(false); fetchData(); }} />}
    </div>
  );
}
