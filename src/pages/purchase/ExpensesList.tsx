// @ts-nocheck
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, MoreHorizontal, Receipt, Loader2 } from "lucide-react";
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
import { DateRangeFilter, getDefaultDateRange, filterByDateRange, DateRange } from "@/components/DateRangeFilter";

interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  category: string;
  notes: string | null;
  amount: number;
  payment_mode: string | null;
}

const categoryColors: Record<string, string> = {
  "Office Supplies": "bg-blue-500/10 text-blue-500",
  "Utilities": "bg-yellow-500/10 text-yellow-500",
  "Rent": "bg-purple-500/10 text-purple-500",
  "Travel": "bg-green-500/10 text-green-500",
  "Salary": "bg-pink-500/10 text-pink-500",
  "Marketing": "bg-orange-500/10 text-orange-500",
};

export default function ExpensesList() {
  const { user } = useAuth();
  const { selectedBusiness } = useBusinessSelection();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());

  useEffect(() => {
    if (user && selectedBusiness) {
      fetchExpenses();
    }
  }, [user, selectedBusiness]);

  const fetchExpenses = async () => {
    if (!selectedBusiness) return;
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("business_id", selectedBusiness.id)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch expenses: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Expense deleted successfully");
      fetchExpenses();
    } catch (error: any) {
      toast.error("Failed to delete expense: " + error.message);
    }
  };

  const filteredByDate = filterByDateRange(expenses, dateRange, "expense_date");
  
  const filteredExpenses = filteredByDate.filter(
    (expense) =>
      expense.expense_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (expense.notes && expense.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

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
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Track and manage business expenses</p>
        </div>
        <Button asChild className="btn-gradient gap-2">
          <Link to="/purchase/expenses/new">
            <Plus className="w-4 h-4" />
            Add Expense
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-bold mt-1">₹{totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{filteredExpenses.length} entries</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Cash</p>
          <p className="text-2xl font-bold mt-1">₹{filteredExpenses.filter(e => e.payment_mode === "cash").reduce((s, e) => s + e.amount, 0).toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Bank</p>
          <p className="text-2xl font-bold mt-1">₹{filteredExpenses.filter(e => e.payment_mode === "bank").reduce((s, e) => s + e.amount, 0).toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="text-2xl font-bold mt-1">{[...new Set(filteredExpenses.map(e => e.category))].length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No expenses found</p>
          <Button asChild className="mt-4">
            <Link to="/purchase/expenses/new">Add your first expense</Link>
          </Button>
        </div>
      ) : (
        <div className="metric-card overflow-hidden p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Expense No.</th>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Payment Mode</th>
                <th className="text-right">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="group">
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-destructive" />
                      </div>
                      <span className="font-medium">{expense.expense_number}</span>
                    </div>
                  </td>
                  <td className="text-muted-foreground">
                    {format(new Date(expense.expense_date), "dd MMM yyyy")}
                  </td>
                  <td>
                    <span
                      className={cn(
                        "px-2 py-1 text-xs font-medium rounded-full",
                        categoryColors[expense.category] || "bg-muted text-muted-foreground"
                      )}
                    >
                      {expense.category}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{expense.notes || "-"}</td>
                  <td className="text-muted-foreground capitalize">{expense.payment_mode || "Cash"}</td>
                  <td className="text-right font-semibold">₹{expense.amount.toLocaleString()}</td>
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
                        <DropdownMenuItem onClick={() => navigate(`/purchase/expenses/${expense.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/purchase/expenses/${expense.id}/edit`)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(expense.id)}
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