import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, Loader2, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  category: string;
  notes: string | null;
  amount: number;
  payment_mode: string | null;
  reference_number: string | null;
  created_at: string;
}

export default function ViewExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchExpense();
    }
  }, [id]);

  const fetchExpense = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setExpense(data);
    } catch (error: any) {
      toast.error("Failed to fetch expense: " + error.message);
      navigate("/purchase/expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Expense deleted successfully");
      navigate("/purchase/expenses");
    } catch (error: any) {
      toast.error("Failed to delete expense: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Expense not found</p>
        <Button asChild className="mt-4">
          <Link to="/purchase/expenses">Back to Expenses</Link>
        </Button>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold">Expense Details</h1>
            <p className="text-muted-foreground">{expense.expense_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/purchase/expenses/${id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="metric-card">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Receipt className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{expense.expense_number}</h2>
                <p className="text-muted-foreground capitalize">{expense.category}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{format(new Date(expense.expense_date), "dd MMM yyyy")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Mode</p>
                <p className="font-medium capitalize">{expense.payment_mode || "Cash"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reference Number</p>
                <p className="font-medium">{expense.reference_number || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{format(new Date(expense.created_at), "dd MMM yyyy, hh:mm a")}</p>
              </div>
            </div>

            {expense.notes && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Notes</p>
                <p className="text-muted-foreground">{expense.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Amount Summary */}
        <div className="space-y-6">
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Amount</h3>
            <div className="text-center py-4">
              <p className="text-4xl font-bold text-destructive">
                ₹{expense.amount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}