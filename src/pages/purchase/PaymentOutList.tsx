// @ts-nocheck
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, MoreHorizontal, ArrowDownCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  reference_number: string | null;
  purchase_invoice_id: string | null;
  sale_invoice_id: string | null;
  parties?: { name: string } | null;
  purchase_invoices?: { invoice_number: string } | null;
  sale_invoices?: { invoice_number: string } | null;
}

export default function PaymentOutList() {
  const { user } = useAuth();
  const { selectedBusiness } = useBusinessSelection();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

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
        .select("*, parties(name), purchase_invoices(invoice_number), sale_invoices(invoice_number)")
        .eq("payment_type", "out")
        .eq("business_id", selectedBusiness.id)
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

  const filteredPayments = payments.filter(
    (payment) =>
      payment.payment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (payment.parties?.name && payment.parties.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (payment.purchase_invoices?.invoice_number && payment.purchase_invoices.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Out</h1>
          <p className="text-muted-foreground">Manage supplier payments</p>
        </div>
        <Button asChild className="btn-gradient gap-2">
          <Link to="/purchase/payment-out/new">
            <Plus className="w-4 h-4" />
            New Payment Out
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Total Payments</p>
          <p className="text-2xl font-bold mt-1">₹{totalPayments.toLocaleString("en-IN")}</p>
          <p className="text-xs text-muted-foreground mt-1">{payments.length} payments</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Cash</p>
          <p className="text-2xl font-bold mt-1">₹{payments.filter(p => p.payment_mode === "cash").reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Bank/UPI</p>
          <p className="text-2xl font-bold mt-1">₹{payments.filter(p => p.payment_mode === "bank" || p.payment_mode === "upi").reduce((s, p) => s + Number(p.amount || 0), 0).toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by receipt number, party, or invoice..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No payments found</p>
          <Button asChild className="mt-4">
            <Link to="/purchase/payment-out/new">Record your first payment</Link>
          </Button>
        </div>
      ) : (
        <div className="metric-card overflow-hidden p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Receipt No.</th>
                <th>Date</th>
                <th>Supplier</th>
                <th>Reference</th>
                <th>Mode</th>
                <th className="text-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                        <ArrowDownCircle className="w-5 h-5 text-warning" />
                      </div>
                      <span className="font-medium">{payment.payment_number}</span>
                    </div>
                  </td>
                  <td className="text-muted-foreground">
                    {format(new Date(payment.payment_date), "dd MMM yyyy")}
                  </td>
                  <td className="font-medium">{payment.parties?.name || "-"}</td>
                  <td>
                    {payment.purchase_invoice_id && payment.purchase_invoices?.invoice_number ? (
                      <button
                        onClick={() => navigate(`/purchase/invoices/${payment.purchase_invoice_id}`)}
                        className="text-primary hover:underline font-medium"
                      >
                        {payment.purchase_invoices.invoice_number}
                      </button>
                    ) : payment.sale_invoice_id && payment.sale_invoices?.invoice_number ? (
                      <button
                        onClick={() => navigate(`/sale/invoices/${payment.sale_invoice_id}`)}
                        className="text-primary hover:underline font-medium"
                      >
                        {payment.sale_invoices.invoice_number}
                      </button>
                    ) : (
                      <span className="text-muted-foreground">{payment.reference_number || "-"}</span>
                    )}
                  </td>
                  <td className="text-muted-foreground capitalize">{payment.payment_mode || "Cash"}</td>
                  <td className="text-right font-semibold text-warning">
                    ₹{Number(payment.amount || 0).toLocaleString("en-IN")}
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/purchase/payment-out/${payment.id}`)}>View Receipt</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/purchase/payment-out/${payment.id}`)}>Print</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(payment.id)}
                        >
                          Delete
                        </DropdownMenuItem>
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
