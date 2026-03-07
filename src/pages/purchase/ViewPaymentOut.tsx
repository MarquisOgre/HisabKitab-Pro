import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Printer, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface Payment {
  id: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_mode: string | null;
  notes: string | null;
  parties: { name: string } | null;
}

export default function ViewPaymentOut() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (id) fetchPayment();
  }, [id]);

  const fetchPayment = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*, parties(name)")
        .eq("id", id)
        .single();

      if (error) throw error;
      setPayment(data);
    } catch (error: any) {
      toast.error("Failed to fetch payment: " + error.message);
      navigate("/purchase/payments");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this payment?")) return;

    try {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
      toast.success("Payment deleted successfully");
      navigate("/purchase/payments");
    } catch (error: any) {
      toast.error("Failed to delete payment: " + error.message);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!payment) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/purchase/payments")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Payment Voucher</h1>
            <p className="text-muted-foreground">{payment.payment_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Printer className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Voucher Number</p>
              <p className="font-medium">{payment.payment_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">{format(new Date(payment.payment_date), "dd MMM yyyy")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Supplier</p>
              <p className="font-medium">{payment.parties?.name || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Mode</p>
              <p className="font-medium capitalize">{payment.payment_mode || "Cash"}</p>
            </div>
          </div>
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">Amount Paid</p>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(payment.amount)}</p>
          </div>
          {payment.notes && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{payment.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
