// @ts-nocheck
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PartySelector } from "@/components/sale/PartySelector";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminUserId } from "@/hooks/useAdminUserId";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { format } from "date-fns";
import { recordCashBankTransaction } from "@/hooks/useCashBankTransaction";

interface LinkedInvoice {
  id: string;
  invoice_number: string;
  balance_due: number;
  party_id: string;
}

export default function PaymentOut() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get("invoice");
  const { user } = useAuth();
  const { adminUserId } = useAdminUserId();
  const { selectedBusiness } = useBusinessSelection();
  const [loading, setLoading] = useState(false);
  const [linkedInvoice, setLinkedInvoice] = useState<LinkedInvoice | null>(null);
  const [partyOutstanding, setPartyOutstanding] = useState<number>(0);
  
  const [receiptNumber, setReceiptNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [selectedParty, setSelectedParty] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (selectedBusiness) {
      generateReceiptNumber();
      if (invoiceId) {
        fetchLinkedInvoice();
      }
    }
  }, [invoiceId, selectedBusiness]);

  // Fetch outstanding balance when party is selected (and no linked invoice)
  const fetchPartyOutstanding = async (partyId: string) => {
    if (!partyId || linkedInvoice) return;
    
    try {
      const { data, error } = await supabase
        .from("purchase_invoices")
        .select("total_amount, paid_amount")
        .eq("party_id", partyId)
        .eq("is_deleted", false);

      if (error) throw error;
      
      const totalOutstanding = (data || []).reduce((sum, inv) => {
        const balance = (inv.total_amount || 0) - (inv.paid_amount || 0);
        return sum + balance;
      }, 0);
      
      setPartyOutstanding(totalOutstanding);
      if (totalOutstanding > 0) {
        setAmount(String(totalOutstanding));
      }
    } catch (error: any) {
      console.error("Failed to fetch party outstanding:", error);
    }
  };

  // Handle party change
  const handlePartyChange = (partyId: string) => {
    setSelectedParty(partyId);
    if (partyId && !linkedInvoice) {
      fetchPartyOutstanding(partyId);
    }
  };

  const generateReceiptNumber = async () => {
    if (!selectedBusiness) return;
    
    try {
      // Get the last payment number for this business
      const { data } = await supabase
        .from("payments")
        .select("payment_number")
        .eq("business_id", selectedBusiness.id)
        .eq("payment_type", "out")
        .order("created_at", { ascending: false })
        .limit(1);
      
      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastNumber = data[0].payment_number;
        const match = lastNumber.match(/(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }
      setReceiptNumber(`PAY-OUT-${String(nextNumber).padStart(3, "0")}`);
    } catch {
      setReceiptNumber("PAY-OUT-001");
    }
  };

  const fetchLinkedInvoice = async () => {
    try {
      const { data, error } = await supabase
        .from("purchase_invoices")
        .select("id, invoice_number, balance_due, party_id")
        .eq("id", invoiceId)
        .single();

      if (error) throw error;
      setLinkedInvoice(data);
      setSelectedParty(data.party_id || "");
      setAmount(String(data.balance_due || 0));
      setNotes(`Payment for invoice ${data.invoice_number}`);
    } catch (error: any) {
      console.error("Failed to fetch linked invoice:", error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please login to save payment");
      return;
    }
    if (!selectedBusiness) {
      toast.error("Please select a business first");
      return;
    }
    if (!selectedParty) {
      toast.error("Please select a supplier");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!paymentMode) {
      toast.error("Please select payment mode");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("payments").insert({
        user_id: adminUserId || user.id,
        business_id: selectedBusiness.id,
        payment_number: receiptNumber,
        payment_type: "out",
        payment_date: paymentDate.toISOString().split("T")[0],
        party_id: selectedParty,
        payment_mode: paymentMode,
        amount: parseFloat(amount),
        notes: notes || null,
        purchase_invoice_id: linkedInvoice?.id || null,
      });

      if (error) throw error;

      // Update invoice balance if linked to specific invoice
      if (linkedInvoice) {
        const { data: currentInvoice } = await supabase
          .from("purchase_invoices")
          .select("paid_amount, total_amount")
          .eq("id", linkedInvoice.id)
          .single();

        if (currentInvoice) {
          const newPaidAmount = (currentInvoice.paid_amount || 0) + parseFloat(amount);
          const newBalance = Math.max(0, (currentInvoice.total_amount || 0) - newPaidAmount);
          
          await supabase
            .from("purchase_invoices")
            .update({
              paid_amount: newPaidAmount,
              balance_due: newBalance,
              status: newBalance <= 0 ? "paid" : "partial",
            })
            .eq("id", linkedInvoice.id);
        }
      } else {
        // Distribute payment across unpaid invoices for this party (FIFO - oldest first)
        const { data: unpaidInvoices } = await supabase
          .from("purchase_invoices")
          .select("id, total_amount, paid_amount, invoice_date")
          .eq("party_id", selectedParty)
          .eq("is_deleted", false)
          .gt("balance_due", 0)
          .order("invoice_date", { ascending: true });

        if (unpaidInvoices && unpaidInvoices.length > 0) {
          let remainingPayment = parseFloat(amount);
          
          for (const inv of unpaidInvoices) {
            if (remainingPayment <= 0) break;
            
            const currentBalance = (inv.total_amount || 0) - (inv.paid_amount || 0);
            const paymentForThisInvoice = Math.min(remainingPayment, currentBalance);
            const newPaidAmount = (inv.paid_amount || 0) + paymentForThisInvoice;
            const newBalance = Math.max(0, (inv.total_amount || 0) - newPaidAmount);
            
            await supabase
              .from("purchase_invoices")
              .update({
                paid_amount: newPaidAmount,
                balance_due: newBalance,
                status: newBalance <= 0 ? "paid" : "partial",
              })
              .eq("id", inv.id);
            
            remainingPayment -= paymentForThisInvoice;
          }
        }
      }

      // Record cash/bank transaction
      await recordCashBankTransaction({
        userId: user.id,
        businessId: selectedBusiness.id,
        paymentMode: paymentMode,
        amount: parseFloat(amount),
        transactionType: "out",
        description: `Payment made - ${receiptNumber}${linkedInvoice ? ` for ${linkedInvoice.invoice_number}` : ""}`,
        referenceType: "payment_out",
        transactionDate: paymentDate.toISOString().split("T")[0],
      });

      toast.success("Payment recorded successfully!");
      navigate("/purchase/payment-out");
    } catch (error: any) {
      toast.error(error.message || "Failed to save payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/purchase/payment-out">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Payment Out</h1>
            <p className="text-muted-foreground">
              {linkedInvoice 
                ? `Payment for ${linkedInvoice.invoice_number}`
                : "Record payment to supplier"
              }
            </p>
          </div>
        </div>
        <Button className="btn-gradient gap-2" onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Linked Invoice Alert */}
          {linkedInvoice && (
            <div className="metric-card border-warning/50 bg-warning/5">
              <h2 className="text-lg font-semibold mb-2">Linked Invoice</h2>
              <p className="text-sm text-muted-foreground">
                Recording payment for invoice <span className="font-medium text-foreground">{linkedInvoice.invoice_number}</span>
              </p>
              <p className="text-sm mt-1">Balance Due: <span className="font-bold text-warning">₹{linkedInvoice.balance_due?.toLocaleString()}</span></p>
            </div>
          )}

          {/* Payment Details */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="receiptNo">Receipt Number</Label>
                <Input id="receiptNo" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />{format(paymentDate, "dd MMM yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={paymentDate} onSelect={(d) => d && setPaymentDate(d)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Supplier Selection */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Supplier Details</h3>
            <PartySelector
              value={selectedParty}
              onChange={handlePartyChange}
              partyType="supplier"
              label="Select Supplier"
              disabled={!!linkedInvoice}
            />
            {!linkedInvoice && partyOutstanding > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning">
                  Net Due: <span className="font-bold">₹{partyOutstanding.toLocaleString()}</span>
                </p>
              </div>
            )}
          </div>

          {/* Payment Amount */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Payment Amount</h3>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <NumberInput
                id="amount"
                placeholder="Enter amount"
                value={amount}
                onChange={(val) => setAmount(String(val))}
                className="text-2xl font-bold h-14"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Notes</h3>
            <Textarea
              placeholder="Add any notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <div className="metric-card sticky top-6">
            <h3 className="font-semibold mb-4">Payment Summary</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receipt No</span>
                  <span className="font-medium">{receiptNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Date</span>
                  <span>{format(paymentDate, "dd MMM yyyy")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mode</span>
                  <span className="capitalize">{paymentMode || "-"}</span>
                </div>
                {linkedInvoice && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Invoice</span>
                    <span className="font-medium">{linkedInvoice.invoice_number}</span>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-lg font-bold">
                  <span>Payment Amount</span>
                  <span className="text-warning">₹{Number(amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
