import { useState, useEffect } from "react";
import { Plus, Building2, CreditCard, Loader2, MoreHorizontal, Eye, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { format } from "date-fns";

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  current_balance: number | null;
  opening_balance: number | null;
  is_primary: boolean | null;
}

interface BankTransaction {
  id: string;
  bank_account_id: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  reference_type: string | null;
  transaction_date: string;
  created_at: string;
}

export default function BankAccounts() {
  const { user } = useAuth();
  const { selectedBusiness } = useBusinessSelection();
  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isTxnViewOpen, setIsTxnViewOpen] = useState(false);
  const [isTxnEditOpen, setIsTxnEditOpen] = useState(false);
  const [isTxnDeleteOpen, setIsTxnDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<BankTransaction | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    openingBalance: "",
  });

  const [txnFormData, setTxnFormData] = useState({
    transactionType: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustType, setAdjustType] = useState<"set" | "add" | "subtract">("set");

  useEffect(() => {
    if (user && selectedBusiness) {
      fetchAccounts();
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

  const fetchAccounts = async () => {
    if (!selectedBusiness) return;
    setLoading(true);
    const { data } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("business_id", selectedBusiness.id)
      .order("created_at", { ascending: false });
    
    if (data) {
      setAccounts(data);
    }
    setLoading(false);
  };

  const fetchTransactions = async () => {
    if (!selectedBusiness) return;
    const { data } = await supabase
      .from("bank_transactions")
      .select("*")
      .eq("business_id", selectedBusiness.id)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50);
    
    if (data) {
      setTransactions(data);
    }
  };

  const resetForm = () => {
    setFormData({
      accountName: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      openingBalance: "",
    });
  };

  const resetTxnForm = () => {
    setTxnFormData({
      transactionType: "",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const handleAddAccount = async () => {
    if (!user) {
      toast.error("Please login first");
      return;
    }
    if (!formData.accountName.trim()) {
      toast.error("Account name is required");
      return;
    }

    setSaving(true);
    try {
      const openingBalance = formData.openingBalance ? parseFloat(formData.openingBalance) : 0;
      
      const { error } = await supabase.from("bank_accounts").insert({
        user_id: user.id,
        business_id: selectedBusiness?.id,
        account_name: formData.accountName.trim(),
        bank_name: formData.bankName || null,
        account_number: formData.accountNumber || null,
        ifsc_code: formData.ifscCode || null,
        opening_balance: openingBalance,
        current_balance: openingBalance,
      });

      if (error) throw error;
      
      toast.success("Bank account added successfully!");
      setIsOpen(false);
      resetForm();
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to add bank account");
    } finally {
      setSaving(false);
    }
  };

  const handleEditAccount = async () => {
    if (!selectedAccount || !formData.accountName.trim()) {
      toast.error("Account name is required");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("bank_accounts")
        .update({
          account_name: formData.accountName.trim(),
          bank_name: formData.bankName || null,
          account_number: formData.accountNumber || null,
          ifsc_code: formData.ifscCode || null,
        })
        .eq("id", selectedAccount.id);

      if (error) throw error;
      
      toast.success("Bank account updated successfully!");
      setIsEditOpen(false);
      resetForm();
      setSelectedAccount(null);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update bank account");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("bank_accounts")
        .delete()
        .eq("id", selectedAccount.id);

      if (error) throw error;
      
      toast.success("Bank account deleted successfully!");
      setIsDeleteOpen(false);
      setSelectedAccount(null);
      fetchAccounts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete bank account");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustBalance = async () => {
    if (!user || !selectedAccount || !adjustAmount) {
      toast.error("Please enter an amount");
      return;
    }

    setSaving(true);
    try {
      const currentBalance = selectedAccount.current_balance || 0;
      let adjustmentAmount = parseFloat(adjustAmount);
      let transactionType: "in" | "out" = "in";
      let newBalance = currentBalance;

      if (adjustType === "set") {
        const diff = adjustmentAmount - currentBalance;
        if (diff === 0) {
          toast.info("Balance is already at this value");
          setSaving(false);
          return;
        }
        transactionType = diff > 0 ? "in" : "out";
        adjustmentAmount = Math.abs(diff);
        newBalance = parseFloat(adjustAmount);
      } else if (adjustType === "add") {
        transactionType = "in";
        newBalance = currentBalance + adjustmentAmount;
      } else {
        transactionType = "out";
        newBalance = currentBalance - adjustmentAmount;
      }

      // Insert transaction record
      await supabase.from("bank_transactions").insert({
        user_id: user.id,
        business_id: selectedBusiness?.id,
        bank_account_id: selectedAccount.id,
        transaction_type: transactionType,
        amount: adjustmentAmount,
        description: `Balance adjustment by admin`,
        transaction_date: new Date().toISOString().split("T")[0],
      });

      // Update account balance
      await supabase
        .from("bank_accounts")
        .update({ current_balance: newBalance })
        .eq("id", selectedAccount.id);
      
      toast.success("Balance adjusted successfully!");
      setIsAdjustOpen(false);
      setAdjustAmount("");
      setAdjustType("set");
      setSelectedAccount(null);
      fetchAccounts();
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || "Failed to adjust balance");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTransaction = async () => {
    if (!selectedTransaction || !txnFormData.transactionType || !txnFormData.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    setSaving(true);
    try {
      const oldAmount = selectedTransaction.amount;
      const oldType = selectedTransaction.transaction_type;
      const newAmount = parseFloat(txnFormData.amount);
      const newType = txnFormData.transactionType;

      // Calculate balance adjustment
      const account = accounts.find(a => a.id === selectedTransaction.bank_account_id);
      if (account) {
        let balanceChange = 0;
        // Reverse old transaction
        if (oldType === "in") balanceChange -= oldAmount;
        else balanceChange += oldAmount;
        // Apply new transaction
        if (newType === "in") balanceChange += newAmount;
        else balanceChange -= newAmount;

        const newBalance = (account.current_balance || 0) + balanceChange;

        await supabase
          .from("bank_accounts")
          .update({ current_balance: newBalance })
          .eq("id", selectedTransaction.bank_account_id);
      }

      const { error } = await supabase
        .from("bank_transactions")
        .update({
          transaction_type: newType,
          amount: newAmount,
          description: txnFormData.description || null,
          transaction_date: txnFormData.date,
        })
        .eq("id", selectedTransaction.id);

      if (error) throw error;
      
      toast.success("Transaction updated successfully!");
      setIsTxnEditOpen(false);
      resetTxnForm();
      setSelectedTransaction(null);
      fetchAccounts();
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
      // Reverse the transaction from account balance
      const account = accounts.find(a => a.id === selectedTransaction.bank_account_id);
      if (account) {
        let balanceChange = selectedTransaction.transaction_type === "in" 
          ? -selectedTransaction.amount 
          : selectedTransaction.amount;
        const newBalance = (account.current_balance || 0) + balanceChange;

        await supabase
          .from("bank_accounts")
          .update({ current_balance: newBalance })
          .eq("id", selectedTransaction.bank_account_id);
      }

      const { error } = await supabase
        .from("bank_transactions")
        .delete()
        .eq("id", selectedTransaction.id);

      if (error) throw error;
      
      toast.success("Transaction deleted successfully!");
      setIsTxnDeleteOpen(false);
      setSelectedTransaction(null);
      fetchAccounts();
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete transaction");
    } finally {
      setSaving(false);
    }
  };

  const openViewAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    setIsViewOpen(true);
  };

  const openEditAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    setFormData({
      accountName: account.account_name,
      bankName: account.bank_name || "",
      accountNumber: account.account_number || "",
      ifscCode: account.ifsc_code || "",
      openingBalance: String(account.opening_balance || 0),
    });
    setIsEditOpen(true);
  };

  const openDeleteAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    setIsDeleteOpen(true);
  };

  const openAdjustBalance = (account: BankAccount) => {
    setSelectedAccount(account);
    setIsAdjustOpen(true);
  };

  const openViewTransaction = (txn: BankTransaction) => {
    setSelectedTransaction(txn);
    setIsTxnViewOpen(true);
  };

  const openEditTransaction = (txn: BankTransaction) => {
    setSelectedTransaction(txn);
    setTxnFormData({
      transactionType: txn.transaction_type,
      amount: String(txn.amount),
      description: txn.description || "",
      date: txn.transaction_date,
    });
    setIsTxnEditOpen(true);
  };

  const openDeleteTransaction = (txn: BankTransaction) => {
    setSelectedTransaction(txn);
    setIsTxnDeleteOpen(true);
  };

  const getAccountName = (bankAccountId: string) => {
    const account = accounts.find(a => a.id === bankAccountId);
    return account?.account_name || "Unknown Account";
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bank Accounts</h1>
          <p className="text-muted-foreground">Manage your bank accounts and transactions</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="btn-gradient gap-2">
              <Plus className="w-4 h-4" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="accountName">Account Name *</Label>
                <Input 
                  id="accountName" 
                  placeholder="e.g., HDFC Current Account" 
                  value={formData.accountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input 
                  id="bankName" 
                  placeholder="e.g., HDFC Bank" 
                  value={formData.bankName}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNo">Account Number</Label>
                <Input 
                  id="accountNo" 
                  placeholder="Enter account number" 
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc">IFSC Code</Label>
                <Input 
                  id="ifsc" 
                  placeholder="e.g., HDFC0001234" 
                  value={formData.ifscCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="openingBalance">Opening Balance</Label>
                <Input 
                  id="openingBalance" 
                  type="number" 
                  placeholder="₹0" 
                  value={formData.openingBalance}
                  onChange={(e) => setFormData(prev => ({ ...prev, openingBalance: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setIsOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button className="btn-gradient" onClick={handleAddAccount} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Add Account
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Balance Card */}
      <div className="metric-card bg-gradient-to-r from-primary to-accent text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">Total Bank Balance</p>
            <p className="text-3xl font-bold mt-1">₹{totalBalance.toLocaleString()}</p>
            <p className="text-sm opacity-80 mt-2">{accounts.length} accounts</p>
          </div>
          <Building2 className="w-16 h-16 opacity-30" />
        </div>
      </div>

      {/* Accounts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : accounts.length === 0 ? (
        <div className="metric-card text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No bank accounts added yet</p>
          <p className="text-sm text-muted-foreground">Click "Add Account" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div key={account.id} className="metric-card">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openViewAccount(account)}>
                      <Eye className="w-4 h-4 mr-2" /> View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditAccount(account)}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => openAdjustBalance(account)}>
                        <TrendingUp className="w-4 h-4 mr-2" /> Adjust Balance
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => openDeleteAccount(account)} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <h3 className="font-semibold">{account.account_name}</h3>
              <p className="text-sm text-muted-foreground">{account.bank_name || "Bank not specified"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {account.account_number ? `****${account.account_number.slice(-4)}` : "No account number"}
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-xl font-bold text-primary">
                  ₹{(account.current_balance || 0).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Bank Transactions */}
      {transactions.length > 0 && (
        <div className="metric-card">
          <h3 className="font-semibold text-lg mb-4">Recent Bank Transactions</h3>
          <div className="space-y-3">
            {transactions.slice(0, 10).map((txn) => (
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
                    <p className="font-medium">{txn.description || (txn.transaction_type === "in" ? "Bank In" : "Bank Out")}</p>
                    <p className="text-sm text-muted-foreground">
                      {getAccountName(txn.bank_account_id)} • {format(new Date(txn.transaction_date), "dd MMM yyyy")}
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
                    {txn.transaction_type === "in" ? "+" : "-"}₹{txn.amount.toLocaleString()}
                  </p>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openViewTransaction(txn)}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditTransaction(txn)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openDeleteTransaction(txn)} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Account Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account Details</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Account Name</p>
                  <p className="font-medium">{selectedAccount.account_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bank Name</p>
                  <p className="font-medium">{selectedAccount.bank_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <p className="font-medium">{selectedAccount.account_number || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IFSC Code</p>
                  <p className="font-medium">{selectedAccount.ifsc_code || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Opening Balance</p>
                  <p className="font-medium">₹{(selectedAccount.opening_balance || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="font-bold text-primary text-lg">₹{(selectedAccount.current_balance || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bank Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Account Name *</Label>
              <Input 
                value={formData.accountName}
                onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input 
                value={formData.bankName}
                onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input 
                value={formData.accountNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>IFSC Code</Label>
              <Input 
                value={formData.ifscCode}
                onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }}>
                Cancel
              </Button>
              <Button className="btn-gradient" onClick={handleEditAccount} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Update Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bank Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAccount?.account_name}"? This will also delete all related transactions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
            <DialogTitle>Adjust Bank Balance</DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4 pt-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">{selectedAccount.account_name}</p>
                <p className="text-2xl font-bold">₹{(selectedAccount.current_balance || 0).toLocaleString()}</p>
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
          )}
        </DialogContent>
      </Dialog>

      {/* View Transaction Dialog */}
      <Dialog open={isTxnViewOpen} onOpenChange={setIsTxnViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{selectedTransaction.transaction_type === "in" ? "Bank In" : "Bank Out"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className={cn("font-bold text-lg", selectedTransaction.transaction_type === "in" ? "text-success" : "text-destructive")}>
                    ₹{selectedTransaction.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account</p>
                  <p className="font-medium">{getAccountName(selectedTransaction.bank_account_id)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedTransaction.transaction_date), "dd MMM yyyy")}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedTransaction.description || "-"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={isTxnEditOpen} onOpenChange={(open) => { setIsTxnEditOpen(open); if (!open) resetTxnForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Transaction Type *</Label>
              <Select 
                value={txnFormData.transactionType} 
                onValueChange={(value) => setTxnFormData(prev => ({ ...prev, transactionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Bank In</SelectItem>
                  <SelectItem value="out">Bank Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input 
                type="number" 
                placeholder="₹0.00" 
                value={txnFormData.amount}
                onChange={(e) => setTxnFormData(prev => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input 
                placeholder="Enter description" 
                value={txnFormData.description}
                onChange={(e) => setTxnFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date" 
                value={txnFormData.date}
                onChange={(e) => setTxnFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setIsTxnEditOpen(false); resetTxnForm(); }}>
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

      {/* Delete Transaction Confirmation */}
      <AlertDialog open={isTxnDeleteOpen} onOpenChange={setIsTxnDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? The account balance will be adjusted accordingly. This action cannot be undone.
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
    </div>
  );
}
