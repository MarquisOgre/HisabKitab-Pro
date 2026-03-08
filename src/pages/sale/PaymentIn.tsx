// @ts-nocheck
import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { PartySelector } from "@/components/sale/PartySelector";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminUserId } from "@/hooks/useAdminUserId";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { recordCashBankTransaction } from "@/hooks/useCashBankTransaction";

interface LinkedInvoice {
  id: string;
  invoice_number: string;
  balance_due: number;
  party_id: string;
}

export default function PaymentIn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invoiceId = searchParams.get("invoice");
  const modeFromUrl = searchParams.get("mode");
  const { user } = useAuth();
  const { adminUserId } = useAdminUserId();
  const { selectedBusiness } = useBusinessSelection();
  const [loading, setLoading] = useState(false);
  const [linkedInvoice, setLinkedInvoice] = useState<LinkedInvoice | null>(null);
  const [partyOutstanding, setPartyOutstanding] = useState<number>(0);
  
  const [receiptNumber, setReceiptNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [selectedParty, setSelectedParty] = useState("");
  const [paymentMode, setPaymentMode] = useState(modeFromUrl || "cash");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (user && selectedBusiness) {
      generateReceiptNumber();
      if (invoiceId) {
        fetchLinkedInvoice();
      }
    }
  }, [invoiceId, user, selectedBusiness]);

  const generateReceiptNumber = async () => {
    if (!selectedBusiness) return;
    
    try {
      // Get ALL payment numbers to find the max numeric suffix
      const { data } = await supabase
        .from("payments")
        .select("payment_number")
        .eq("business_id", selectedBusiness.id)
        .eq("payment_type", "in");
      
      let maxNumber = 0;
      if (data && data.length > 0) {
        for (const row of data) {
          const match = row.payment_number?.match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNumber) maxNumber = num;
          }
        }
      }
      setReceiptNumber(`REC-${String(maxNumber + 1).padStart(3, "0")}`);
    } catch {
      setReceiptNumber("REC-001");
    }
  };

  const fetchLinkedInvoice = async () => {
    if (!invoiceId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sale_invoices")
        .select("id, invoice_number, balance_due, party_id, total_amount, paid_amount")
        .eq("id", invoiceId)
        .single();

      if (error) throw error;
      
      if (data) {
        const balanceDue = (data.total_amount || 0) - (data.paid_amount || 0);
        setLinkedInvoice({
          id: data.id,
          invoice_number: data.invoice_number,
          balance_due: balanceDue,
          party_id: data.party_id || "",
        });
        setSelectedParty(data.party_id || "");
        setAmount(String(balanceDue));
        setNotes(`Payment for invoice ${data.invoice_number}`);
      }
    } catch (error: any) {
      console.error("Failed to fetch linked invoice:", error);
      toast.error("Failed to load invoice details");
    } finally {
      setLoading(false);
    }
  };

  // Fetch outstanding balance when party is selected (and no linked invoice)
  const fetchPartyOutstanding = async (partyId: string) => {
    if (!partyId || linkedInvoice) return;
    
    try {
      const { data, error } = await supabase
        .from("sale_invoices")
        .select("total_amount, paid_amount")
        .eq("party_id", partyId)
        .or("is_deleted.is.null,is_deleted.eq.false")
        .in("invoice_type", ["sale", "sale_invoice", "invoice"]);

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
      toast.error("Please select a party");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("payments").insert({
        user_id: adminUserId || user.id,
        business_id: selectedBusiness.id,
        payment_number: receiptNumber,
        payment_type: "in",
        payment_date: paymentDate.toISOString().split("T")[0],
        party_id: selectedParty,
        payment_mode: paymentMode,
        amount: parseFloat(amount),
        notes: notes || null,
        sale_invoice_id: linkedInvoice?.id || null,
      });

      if (error) throw error;

      // Update invoice balance if linked to specific invoice
      if (linkedInvoice) {
        const { data: currentInvoice } = await supabase
          .from("sale_invoices")
          .select("paid_amount, total_amount")
          .eq("id", linkedInvoice.id)
          .single();

        if (currentInvoice) {
          const newPaidAmount = (Number(currentInvoice.paid_amount) || 0) + parseFloat(amount);
          const newBalance = Math.max(0, (Number(currentInvoice.total_amount) || 0) - newPaidAmount);
          
          await supabase
            .from("sale_invoices")
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
          .from("sale_invoices")
          .select("id, total_amount, paid_amount, invoice_date")
          .eq("party_id", selectedParty)
          .eq("is_deleted", false)
          .in("invoice_type", ["sale", "sale_invoice"])
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
              .from("sale_invoices")
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
        transactionType: "in",
        description: `Payment received - ${receiptNumber}${linkedInvoice ? ` for ${linkedInvoice.invoice_number}` : ""}`,
        referenceType: "payment_in",
        transactionDate: paymentDate.toISOString().split("T")[0],
      });

      toast.success("Payment recorded successfully!");
      navigate("/sale/payment-in");
    } catch (error: any) {
      toast.error(error.message || "Failed to save payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/sale/payment-in"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Record Payment In</h1>
            <p className="text-muted-foreground">
              {linkedInvoice 
                ? `Payment for ${linkedInvoice.invoice_number}`
                : "Record payment received from customer"
              }
            </p>
          </div>
        </div>
        <Button onClick={handleSave} className="btn-gradient gap-2" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Linked Invoice Alert */}
          {linkedInvoice && (
            <div className="metric-card border-primary/50 bg-primary/5">
              <h2 className="text-lg font-semibold mb-2">Linked Invoice</h2>
              <p className="text-sm text-muted-foreground">
                Recording payment for invoice <span className="font-medium text-foreground">{linkedInvoice.invoice_number}</span>
              </p>
              <p className="text-sm mt-1">Balance Due: <span className="font-bold text-primary">₹{linkedInvoice.balance_due?.toLocaleString()}</span></p>
            </div>
          )}

          {/* Payment Details */}
          <div className="metric-card">
            <h2 className="text-lg font-semibold mb-4">Payment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Receipt Number</Label>
                <Input value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} />
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
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Party Selection */}
          <div className="metric-card">
            <h2 className="text-lg font-semibold mb-4">Customer</h2>
            <PartySelector 
              value={selectedParty} 
              onChange={handlePartyChange} 
              partyType="customer" 
              disabled={!!linkedInvoice}
            />
            {!linkedInvoice && partyOutstanding > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning">
                  Total Outstanding: <span className="font-bold">₹{partyOutstanding.toLocaleString()}</span>
                </p>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="metric-card">
            <h2 className="text-lg font-semibold mb-4">Payment Amount</h2>
            <div className="space-y-2">
              <Label>Amount Received (₹)</Label>
              <NumberInput 
                value={amount} 
                onChange={(val) => setAmount(String(val))} 
                placeholder="Enter amount"
                className="text-2xl font-bold h-14"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="metric-card">
            <h2 className="text-lg font-semibold mb-4">Notes</h2>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add payment notes..." rows={3} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="metric-card sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
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
                  <span className="capitalize">{paymentMode}</span>
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
                  <span>Amount</span>
                  <span className="text-success">₹{Number(amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
