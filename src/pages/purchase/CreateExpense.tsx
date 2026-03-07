import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminUserId } from "@/hooks/useAdminUserId";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { recordCashBankTransaction } from "@/hooks/useCashBankTransaction";

const expenseCategories = [
  "Office Supplies",
  "Utilities",
  "Rent",
  "Travel",
  "Marketing",
  "Salaries",
  "Insurance",
  "Maintenance",
  "Subscriptions",
  "Other",
];

export default function CreateExpense() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { adminUserId } = useAdminUserId();
  const { selectedBusiness } = useBusinessSelection();
  const [loading, setLoading] = useState(false);
  
  const [expenseNumber, setExpenseNumber] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [amount, setAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (user && selectedBusiness) {
      generateExpenseNumber();
    }
  }, [user, selectedBusiness]);

  const generateExpenseNumber = async () => {
    if (!user || !selectedBusiness) return;
    
    // Get the last expense number for this business
    const { data } = await supabase
      .from("expenses")
      .select("expense_number")
      .eq("business_id", selectedBusiness.id)
      .order("created_at", { ascending: false })
      .limit(1);
    
    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastNumber = data[0].expense_number;
      const match = lastNumber.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    
    setExpenseNumber(`EXP-${nextNumber.toString().padStart(2, "0")}`);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Please login to save expense");
      return;
    }
    if (!selectedBusiness) {
      toast.error("Please select a business first");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const effectiveUserId = adminUserId || user.id;
    const expenseAmount = parseFloat(amount);
    const effectivePaymentMode = paymentMode || "cash";

    setLoading(true);
    try {
      // Insert expense record
      const { data: expenseData, error } = await supabase.from("expenses").insert({
        user_id: effectiveUserId,
        business_id: selectedBusiness.id,
        expense_number: expenseNumber,
        expense_date: expenseDate,
        category,
        payment_mode: effectivePaymentMode,
        amount: expenseAmount,
        reference_number: referenceNumber || null,
        notes: notes || null,
      }).select().single();

      if (error) throw error;

      // Record cash/bank transaction for expense (money going out)
      await recordCashBankTransaction({
        userId: effectiveUserId,
        businessId: selectedBusiness.id,
        paymentMode: effectivePaymentMode,
        amount: expenseAmount,
        transactionType: "out",
        description: `Expense: ${category} - ${expenseNumber}`,
        referenceType: "expense",
        referenceId: expenseData.id,
        transactionDate: expenseDate,
      });

      toast.success("Expense saved successfully!");
      navigate("/purchase/expenses");
    } catch (error: any) {
      toast.error(error.message || "Failed to save expense");
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
            <Link to="/purchase/expenses">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Add Expense</h1>
            <p className="text-muted-foreground">Record a new business expense</p>
          </div>
        </div>
        <Button className="btn-gradient gap-2" onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Expense Details */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Expense Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expenseNo">Expense Number</Label>
                <Input id="expenseNo" value={expenseNumber} onChange={(e) => setExpenseNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseDate">Date</Label>
                <Input
                  id="expenseDate"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <NumberInput
                  id="amount"
                  placeholder="₹0.00"
                  value={amount}
                  onChange={(val) => setAmount(String(val))}
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Payment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Reference Number</Label>
                <Input 
                  id="reference" 
                  placeholder="Transaction/Cheque number" 
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>
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
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Expense Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium capitalize">{category || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Mode</span>
                <span className="font-medium capitalize">{paymentMode || "-"}</span>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="font-semibold">Amount</span>
                  <span className="font-bold text-xl text-primary">
                    ₹{Number(amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
