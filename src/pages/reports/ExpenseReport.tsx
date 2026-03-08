// @ts-nocheck
import { useState, useEffect } from "react";
import { Download, TrendingUp, TrendingDown, Wallet, PieChart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DateRangeFilter, getDefaultDateRange, filterByDateRange, DateRange } from "@/components/DateRangeFilter";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";

interface ExpenseData { id: string; date: string; category: string; description: string; amount: number; }
interface CategoryTotal { category: string; amount: number; percent: number; }

export default function ExpenseReport() {
  const { selectedBusiness } = useBusinessSelection();
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expenseData, setExpenseData] = useState<ExpenseData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    if (selectedBusiness) {
      fetchExpenseData(); 
    }
  }, [selectedBusiness]);

  const fetchExpenseData = async () => {
    if (!selectedBusiness) return;
    try {
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('business_id', selectedBusiness.id)
        .order('expense_date', { ascending: false });
      const formattedData = (expenses || []).map(exp => ({ id: exp.id, date: exp.expense_date, category: exp.category, description: exp.notes || exp.expense_number, amount: Number(exp.amount || 0) }));
      setExpenseData(formattedData);
      setCategories([...new Set(formattedData.map(e => e.category))]);
    } catch (error) { console.error('Error fetching expenses:', error); } finally { setLoading(false); }
  };

  const filteredByDate = filterByDateRange(expenseData, dateRange, "date");
  const filtered = filteredByDate.filter((e) => categoryFilter === "all" || e.category === categoryFilter);
  const totalExpenses = filtered.reduce((sum, e) => sum + e.amount, 0);
  
  const categoryAmounts: { [key: string]: number } = {};
  filtered.forEach(exp => { if (!categoryAmounts[exp.category]) categoryAmounts[exp.category] = 0; categoryAmounts[exp.category] += exp.amount; });
  const categoryTotals: CategoryTotal[] = Object.entries(categoryAmounts).map(([category, amount]) => ({ category, amount, percent: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0 })).sort((a, b) => b.amount - a.amount);

  if (loading) { return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>; }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Expense Report</h1>
          <p className="text-muted-foreground">Track and analyze business expenses</p>
        </div>
        <Button variant="outline" className="gap-2 self-start sm:self-auto">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export Report</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Expenses</p>
            <Wallet className="w-4 h-4 text-destructive flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 truncate">₹{totalExpenses.toLocaleString("en-IN")}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Avg Per Day</p>
            <TrendingDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2">₹{(totalExpenses / 30).toFixed(0)}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Categories</p>
            <PieChart className="w-4 h-4 text-primary flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2">{categoryTotals.length}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Transactions</p>
            <Wallet className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2">{filtered.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="metric-card">
          <h3 className="font-semibold mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {categoryTotals.length === 0 ? (
              <p className="text-muted-foreground py-4">No expenses recorded</p>
            ) : (
              categoryTotals.map((cat, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate">{cat.category}</span>
                    <span className="font-medium flex-shrink-0">₹{cat.amount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${cat.percent}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{cat.percent.toFixed(1)}% of total</p>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center mb-4">
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="metric-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="data-table min-w-[500px]">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-muted-foreground">No expenses found</td>
                    </tr>
                  ) : (
                    filtered.map((expense) => (
                      <tr key={expense.id}>
                        <td className="text-muted-foreground">{format(new Date(expense.date), 'dd MMM yyyy')}</td>
                        <td><span className="px-2 py-1 text-xs font-medium rounded-full bg-muted">{expense.category}</span></td>
                        <td className="font-medium">{expense.description}</td>
                        <td className="text-right font-medium">₹{expense.amount.toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot>
                    <tr className="bg-muted/50 font-semibold">
                      <td colSpan={3}>Total</td>
                      <td className="text-right">₹{totalExpenses.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}