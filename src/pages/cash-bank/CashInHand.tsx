// @ts-nocheck
import { useState, useEffect } from "react";
import { Plus, Banknote, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Loader2, MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { format } from "date-fns";
// @ts-nocheck
interface CashTransaction {
  id: string;
  transaction_type: string;
  description: string | null;
  amount: number;
  transaction_date: string;
  created_at: string;
  reference_type: string | null;
  reference_id: string | null;
}
// @ts-nocheck
export default function CashInHand() {
  const { user } = useAuth();
  const { selectedBusiness } = useBusinessSelection();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transactions, setTransactions] = useState<CashTransaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    transactionType: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"set" | "add" | "subtract">("set");

  useEffect(() => {
    if (user && selectedBusiness) {
      fetchTransactions();
      fetchUserRole();
    }
  }, [user, selectedBusiness]);

  const fetchUserRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setUserRole(data.role);
    }
  };

  const isAdmin = userRole === "admin";

  const fetchTransactions = async () => {
    if (!selectedBusiness) return;
    setLoading(true);
    const { data } = await supabase
      .from("cash_transactions")
      .select("*")
      .eq("business_id", selectedBusiness.id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      transactionType: "",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const handleAddTransaction = async () => {
    if (!user) {
      toast.error("Please login first");
      return;
    }
    if (!formData.transactionType) {
      toast.error("Please select transaction type");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("cash_transactions").insert({
        user_id: user.id,
        business_id: selectedBusiness?.id,
        transaction_type: formData.transactionType,
        amount: parseFloat(formData.amount),
        description: formData.description || null,
        transaction_date: formData.date,
      });

      if (error) throw error;
      
      toast.success("Transaction added successfully!");
      setIsAddOpen(false);
      resetForm();
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || "Failed to add transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTransaction = async () => {
    if (!selectedTransaction) return;
    if (!formData.transactionType || !formData.amount || Number(formData.amount) <= 0) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("cash_transactions")
        .update({
          transaction_type: formData.transactionType,
          amount: parseFloat(formData.amount),
          description: formData.description || null,
          transaction_date: formData.date,
        })
        .eq("id", selectedTransaction.id);

      if (error) throw error;
      
      toast.success("Transaction updated successfully!");
      setIsEditOpen(false);
      resetForm();
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || "Failed to update transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("cash_transactions")
        .delete()
        .eq("id", selectedTransaction.id);

      if (error) throw error;
      
      toast.success("Transaction deleted successfully!");
      setIsDeleteOpen(false);
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete transaction");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!user || !adjustAmount) {
      toast.error("Please enter an amount");
      return;
    }

    setSaving(true);
    try {
      const currentBalance = cashIn - cashOut;
      let adjustmentAmount = parseFloat(adjustAmount);
      let transactionType: "in" | "out" = "in";

      if (adjustType === "set") {
        const diff = adjustmentAmount - currentBalance;
        if (diff === 0) {
          toast.info("Balance is already at this value");
          setSaving(false);
          return;
        }
        transactionType = diff > 0 ? "in" : "out";
        adjustmentAmount = Math.abs(diff);
      } else if (adjustType === "add") {
        transactionType = "in";
      } else {
        transactionType = "out";
      }

      const { error } = await supabase.from("cash_transactions").insert({
        user_id: user.id,
        business_id: selectedBusiness?.id,
        transaction_type: transactionType,
        amount: adjustmentAmount,
        description: `Balance adjustment by admin`,
        transaction_date: new Date().toISOString().split("T")[0],
      });

      if (error) throw error;
      
      toast.success("Balance adjusted successfully!");
      setIsAdjustOpen(false);
      setAdjustAmount("");
      setAdjustType("set");
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || "Failed to adjust balance");
    } finally {
      setSaving(false);
    }
  };

  const openView = (txn: CashTransaction) => {
    setSelectedTransaction(txn);
    setIsViewOpen(true);
  };

  const openEdit = (txn: CashTransaction) => {
    setSelectedTransaction(txn);
    setFormData({
      transactionType: txn.transaction_type,
      amount: String(txn.amount),
      description: txn.description || "",
      date: txn.transaction_date,
    });
    setIsEditOpen(true);
  };

  const openDelete = (txn: CashTransaction) => {
    setSelectedTransaction(txn);
    setIsDeleteOpen(true);
  };

  // Calculate balances
  const cashIn = transactions
    .filter(t => t.transaction_type === "in")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const cashOut = transactions
    .filter(t => t.transaction_type === "out")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const currentBalance = cashIn - cashOut;

  // Today's transactions
  const today = new Date().toISOString().split("T")[0];
  const todayIn = transactions
    .filter(t => t.transaction_date === today && t.transaction_type === "in")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const todayOut = transactions
    .filter(t => t.transaction_date === today && t.transaction_type === "out")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cash in Hand</h1>
          <p className="text-muted-foreground">Track your cash transactions</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setIsAdjustOpen(true)}>
              Adjust Balance
            </Button>
          )}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="btn-gradient gap-2">
                <Plus className="w-4 h-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Cash Transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Transaction Type *</Label>
                  <Select 
                    value={formData.transactionType} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, transactionType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Cash In</SelectItem>
                      <SelectItem value="out">Cash Out</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    placeholder="₹0.00" 
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description" 
                    placeholder="Enter description" 
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button className="btn-gradient" onClick={handleAddTransaction} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Transaction
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Cash Balance Card */}
      <div className="metric-card bg-gradient-to-r from-success to-accent text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Cash in Hand</p>
            <p className="text-4xl font-bold mt-2">₹{currentBalance.toLocaleString("en-IN")}</p>
            <p className="text-sm opacity-80 mt-2">As of today</p>
          </div>
          <Banknote className="w-20 h-20 opacity-30" />
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today's Cash In</p>
              <p className="text-2xl font-bold text-success mt-1">₹{todayIn.toLocaleString("en-IN")}</p>
            </div>
            <div className="p-3 rounded-xl bg-success/10">
              <ArrowUpRight className="w-6 h-6 text-success" />
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Today's Cash Out</p>
              <p className="text-2xl font-bold text-destructive mt-1">₹{todayOut.toLocaleString("en-IN")}</p>
            </div>
            <div className="p-3 rounded-xl bg-destructive/10">
              <ArrowDownRight className="w-6 h-6 text-destructive" />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Recent Transactions</h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <Banknote className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground">Add your first cash transaction</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "p-3 rounded-xl",
                      txn.transaction_type === "in"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    )}
                  >
                    {txn.transaction_type === "in" ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{txn.description || (txn.transaction_type === "in" ? "Cash In" : "Cash Out")}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(txn.transaction_date), "dd MMM yyyy")}
                      {txn.reference_type && <span className="ml-2 text-xs">• {txn.reference_type}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p
                    className={cn(
                      "font-bold text-lg",
                      txn.transaction_type === "in" ? "text-success" : "text-destructive"
                    )}
                  >
                    {txn.transaction_type === "in" ? "+" : "-"}₹{Number(txn.amount || 0).toLocaleString("en-IN")}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openView(txn)}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEdit(txn)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDelete(txn)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedTransaction.transaction_type === "in" ? "Cash In" : "Cash Out"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className={cn("font-bold text-lg", selectedTransaction.transaction_type === "in" ? "text-success" : "text-destructive")}>
                    ₹{Number(selectedTransaction.amount || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedTransaction.transaction_date), "dd MMM yyyy")}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedTransaction.description || "-"}</p>
                </div>
                {selectedTransaction.reference_type && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Reference</p>
                    <p className="font-medium">{selectedTransaction.reference_type}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Transaction Type *</Label>
              <Select 
                value={formData.transactionType} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, transactionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Cash In</SelectItem>
                  <SelectItem value="out">Cash Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAmount">Amount *</Label>
              <Input 
                id="editAmount" 
                type="number" 
                placeholder="₹0.00" 
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Input 
                id="editDescription" 
                placeholder="Enter description" 
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDate">Date</Label>
              <Input 
                id="editDate" 
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button className="btn-gradient" onClick={handleEditTransaction} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Transaction
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Adjust Balance Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Cash Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className="text-2xl font-bold">₹{currentBalance.toLocaleString()}</p>
            </div>
            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select value={adjustType} onValueChange={(v: "set" | "add" | "subtract") => setAdjustType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Set Balance To</SelectItem>
                  <SelectItem value="add">Add Amount</SelectItem>
                  <SelectItem value="subtract">Subtract Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input 
                type="number" 
                placeholder="Enter amount" 
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>
                Cancel
              </Button>
              <Button className="btn-gradient" onClick={handleAdjustBalance} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Adjust Balance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
