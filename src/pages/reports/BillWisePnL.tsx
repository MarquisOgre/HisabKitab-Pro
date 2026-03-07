// @ts-nocheck
import { useState, useEffect } from "react";
import { Download, TrendingUp, TrendingDown, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DateRangeFilter, getDefaultDateRange, filterByDateRange, DateRange } from "@/components/DateRangeFilter";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";

interface BillData {
  id: string;
  invoice: string;
  date: string;
  party: string;
  sale: number;
  cost: number;
  tcsTds: number;
  profit: number;
  margin: number;
}

export default function BillWisePnL() {
  const { selectedBusiness } = useBusinessSelection();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [billData, setBillData] = useState<BillData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedBusiness) {
      fetchBillData();
    }
  }, [selectedBusiness]);

  const fetchBillData = async () => {
    if (!selectedBusiness) return;
    try {
      // Fetch sale invoices with items to calculate cost from purchase_price
      const { data: invoices, error } = await supabase
        .from('sale_invoices')
        .select(`
          id,
          invoice_number,
          invoice_date,
          total_amount,
          subtotal,
          tcs_amount,
          party_id,
          parties (name)
        `)
        .eq('is_deleted', false)
        .eq('business_id', selectedBusiness.id)
        .order('invoice_date', { ascending: false });

      if (error) throw error;

      // For each invoice, fetch the items and calculate cost from purchase_price
      const billsWithCost = await Promise.all((invoices || []).map(async (inv: any) => {
        // Fetch invoice items
        const { data: items } = await supabase
          .from('sale_invoice_items')
          .select('item_id, quantity')
          .eq('sale_invoice_id', inv.id);

        // Calculate cost from purchase prices
        let totalCost = 0;
        if (items && items.length > 0) {
          for (const item of items) {
            if (item.item_id) {
              const { data: itemData } = await supabase
                .from('items')
                .select('purchase_price')
                .eq('id', item.item_id)
                .single();
              
              if (itemData) {
                totalCost += (itemData.purchase_price || 0) * item.quantity;
              }
            }
          }
        }

        const sale = inv.total_amount || 0;
        const tcsTds = inv.tcs_amount || 0;
        const profit = sale - totalCost - tcsTds;
        const margin = sale > 0 ? (profit / sale) * 100 : 0;

        return {
          id: inv.id,
          invoice: inv.invoice_number,
          date: inv.invoice_date,
          party: inv.parties?.name || 'Walk-in Customer',
          sale,
          cost: totalCost,
          tcsTds,
          profit,
          margin,
        };
      }));

      setBillData(billsWithCost);
    } catch (error) {
      console.error('Error fetching bill data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredByDate = filterByDateRange(billData, dateRange, "date");
  
  const filtered = filteredByDate.filter(
    (b) => b.invoice.toLowerCase().includes(searchQuery.toLowerCase()) ||
           b.party.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSale = filtered.reduce((sum, b) => sum + b.sale, 0);
  const totalCost = filtered.reduce((sum, b) => sum + b.cost, 0);
  const totalTcsTds = filtered.reduce((sum, b) => sum + b.tcsTds, 0);
  const totalProfit = filtered.reduce((sum, b) => sum + b.profit, 0);
  const avgMargin = totalSale > 0 ? (totalProfit / totalSale) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bill Wise Profit & Loss</h1>
          <p className="text-muted-foreground">Analyze profit on each invoice</p>
        </div>
        <Button variant="outline" className="gap-2 self-start sm:self-auto">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export Report</span>
          <span className="sm:hidden">Export</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="metric-card">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Sales</p>
          <p className="text-lg sm:text-2xl font-bold mt-2 truncate">₹{totalSale.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Cost</p>
          <p className="text-lg sm:text-2xl font-bold mt-2 truncate">₹{totalCost.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Profit</p>
          <p className={cn("text-lg sm:text-2xl font-bold mt-2 truncate", totalProfit >= 0 ? "text-success" : "text-destructive")}>
            ₹{Math.abs(totalProfit).toLocaleString()}
          </p>
        </div>
        <div className="metric-card">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">Avg Margin</p>
          <p className={cn("text-lg sm:text-2xl font-bold mt-2", avgMargin >= 0 ? "text-success" : "text-destructive")}>
            {avgMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices or parties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* Data Table */}
      <div className="metric-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[800px]">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Party</th>
                <th className="text-right">Sale Amount</th>
                <th className="text-right">Cost</th>
                <th className="text-right">Profit/Loss</th>
                <th className="text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filtered.map((bill) => (
                  <tr key={bill.id}>
                    <td className="font-medium">{bill.invoice}</td>
                    <td className="text-muted-foreground">
                      {format(new Date(bill.date), 'dd MMM yyyy')}
                    </td>
                    <td>{bill.party}</td>
                    <td className="text-right">₹{bill.sale.toLocaleString()}</td>
                    <td className="text-right">₹{bill.cost.toLocaleString()}</td>
                    <td className={cn("text-right font-medium", bill.profit >= 0 ? "text-success" : "text-destructive")}>
                      <div className="flex items-center justify-end gap-1">
                        {bill.profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        ₹{Math.abs(bill.profit).toLocaleString()}
                      </div>
                    </td>
                    <td className={cn("text-right", bill.margin >= 0 ? "text-success" : "text-destructive")}>
                      {bill.margin.toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td colSpan={3}>Total</td>
                  <td className="text-right">₹{totalSale.toLocaleString()}</td>
                  <td className="text-right">₹{totalCost.toLocaleString()}</td>
                  <td className={cn("text-right", totalProfit >= 0 ? "text-success" : "text-destructive")}>
                    ₹{Math.abs(totalProfit).toLocaleString()}
                  </td>
                  <td className={cn("text-right", avgMargin >= 0 ? "text-success" : "text-destructive")}>
                    {avgMargin.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
