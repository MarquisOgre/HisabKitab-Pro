// @ts-nocheck
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Search, Wallet, MoreHorizontal, Eye, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface Payment {
  id: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_mode: string | null;
  sale_invoice_id: string | null;
  purchase_invoice_id: string | null;
  parties?: { name: string } | null;
  sale_invoices?: { invoice_number: string } | null;
  purchase_invoices?: { invoice_number: string } | null;
}

export default function PaymentInList() {
  const { user } = useAuth();
  const { selectedBusiness } = useBusinessSelection();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get("invoice");

  const [searchQuery, setSearchQuery] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Backward-compatible: if some link lands on /sale/payment-in?invoice=..., redirect to the prefilled form.
  useEffect(() => {
    if (invoiceId) {
      navigate(`/sale/payment-in/new?invoice=${invoiceId}`, { replace: true });
    }
  }, [invoiceId, navigate]);

  useEffect(() => {
    if (user && selectedBusiness) {
      fetchPayments();
    }
  }, [user, selectedBusiness]);

  const fetchPayments = async () => {
    if (!selectedBusiness) return;
    
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*, parties(name), sale_invoices(invoice_number), purchase_invoices(invoice_number)")
        .eq("payment_type", "in")
        .eq("business_id", selectedBusiness.id)
        .order("payment_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch payments: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;
    
    try {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
      toast.success("Payment deleted successfully");
      fetchPayments();
    } catch (error: any) {
      toast.error("Failed to delete payment: " + error.message);
    }
  };

  const filtered = payments.filter(
    (p) => p.payment_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.parties?.name && p.parties.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.sale_invoices?.invoice_number && p.sale_invoices.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getModeColor = (mode: string | null) => {
    const colors: Record<string, string> = {
      cash: "bg-success/10 text-success",
      bank: "bg-primary/10 text-primary",
      upi: "bg-secondary/50 text-secondary-foreground",
      cheque: "bg-warning/10 text-warning",
    };
    return colors[mode || "cash"] || "bg-muted text-muted-foreground";
  };

  const totalReceived = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment In</h1>
          <p className="text-muted-foreground">Record and track payments received</p>
        </div>
        <Button asChild className="btn-gradient gap-2">
          <Link to="/sale/payment-in/new"><Plus className="w-4 h-4" />Record Payment</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card"><p className="text-sm text-muted-foreground">Total Received</p><p className="text-2xl font-bold text-success mt-1">₹{totalReceived.toLocaleString("en-IN")}</p><p className="text-xs text-muted-foreground mt-1">{payments.length} payments</p></div>
        <div className="metric-card"><p className="text-sm text-muted-foreground">Cash</p><p className="text-2xl font-bold mt-1">₹{payments.filter(p => p.payment_mode === "cash").reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString("en-IN")}</p></div>
        <div className="metric-card"><p className="text-sm text-muted-foreground">Bank/UPI</p><p className="text-2xl font-bold mt-1">₹{payments.filter(p => p.payment_mode === "bank" || p.payment_mode === "upi").reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString("en-IN")}</p></div>
        <div className="metric-card"><p className="text-sm text-muted-foreground">Cheque</p><p className="text-2xl font-bold mt-1">₹{payments.filter(p => p.payment_mode === "cheque").reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString("en-IN")}</p></div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search payments or invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No payments found</p>
          <Button asChild className="mt-4">
            <Link to="/sale/payment-in/new">Record your first payment</Link>
          </Button>
        </div>
      ) : (
        <div className="metric-card overflow-hidden p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Date</th>
                <th>Party</th>
                <th>Reference</th>
                <th className="text-right">Amount</th>
                <th>Mode</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pay) => (
                <tr key={pay.id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-success" />
                      </div>
                      <span className="font-medium">{pay.payment_number}</span>
                    </div>
                  </td>
                  <td className="text-muted-foreground">{format(new Date(pay.payment_date), "dd MMM yyyy")}</td>
                  <td className="font-medium">{pay.parties?.name || "-"}</td>
                  <td>
                    {pay.sale_invoice_id && pay.sale_invoices?.invoice_number ? (
                      <button
                        onClick={() => navigate(`/sale/invoices/${pay.sale_invoice_id}`)}
                        className="text-primary hover:underline font-medium"
                      >
                        {pay.sale_invoices.invoice_number}
                      </button>
                    ) : pay.purchase_invoice_id && pay.purchase_invoices?.invoice_number ? (
                      <button
                        onClick={() => navigate(`/purchase/invoices/${pay.purchase_invoice_id}`)}
                        className="text-primary hover:underline font-medium"
                      >
                        {pay.purchase_invoices.invoice_number}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="text-right font-medium text-success">+₹{Number(pay.amount || 0).toLocaleString("en-IN")}</td>
                  <td><span className={cn("px-2 py-1 text-xs font-medium rounded-full capitalize", getModeColor(pay.payment_mode))}>{pay.payment_mode || "Cash"}</span></td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/sale/payment-in/${pay.id}`)}><Eye className="w-4 h-4 mr-2" />View Receipt</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/sale/payment-in/${pay.id}`)}><Download className="w-4 h-4 mr-2" />Download PDF</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(pay.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
