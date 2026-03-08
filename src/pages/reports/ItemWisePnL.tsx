// @ts-nocheck
import { useState, useEffect } from "react";
import { Download, Search, TrendingUp, TrendingDown, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { DateRangeFilter, getDefaultDateRange, DateRange } from "@/components/DateRangeFilter";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";

interface ItemPnL { id: string; name: string; sold: number; revenue: number; cost: number; profit: number; margin: number; }

export default function ItemWisePnL() {
  const { selectedBusiness } = useBusinessSelection();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("profit");
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [itemPnLData, setItemPnLData] = useState<ItemPnL[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    if (selectedBusiness) {
      fetchItemPnL(); 
    }
  }, [selectedBusiness]);

  const fetchItemPnL = async () => {
    if (!selectedBusiness) return;
    try {
      const { data: saleInvoiceItems } = await supabase
        .from('sale_invoice_items')
        .select(`item_name, quantity, rate, total, sale_invoice_id`)
        .eq('business_id', selectedBusiness.id);
      const { data: saleInvoices } = await supabase
        .from('sale_invoices')
        .select('id, invoice_type')
        .eq('business_id', selectedBusiness.id)
        .in('invoice_type', ['sale', 'sale_invoice']);
      const userInvoiceIds = new Set(saleInvoices?.map(inv => inv.id) || []);
      const salesItems = (saleInvoiceItems || []).filter((item: any) => userInvoiceIds.has(item.sale_invoice_id));
      const { data: items } = await supabase
        .from('items')
        .select('name, purchase_price')
        .eq('business_id', selectedBusiness.id);
      const itemPrices: { [key: string]: number } = {};
      (items || []).forEach(item => { itemPrices[item.name] = Number(item.purchase_price || 0); });
      const itemAggregates: { [key: string]: { sold: number; revenue: number; cost: number } } = {};
      salesItems.forEach((item: any) => {
        const name = item.item_name;
        if (!itemAggregates[name]) { itemAggregates[name] = { sold: 0, revenue: 0, cost: 0 }; }
        itemAggregates[name].sold += item.quantity;
        itemAggregates[name].revenue += item.total;
        itemAggregates[name].cost += item.quantity * (itemPrices[name] || item.rate * 0.7);
      });
      const pnlData = Object.entries(itemAggregates).map(([name, data], idx) => {
        const profit = data.revenue - data.cost;
        const margin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
        return { id: `item-${idx}`, name, sold: data.sold, revenue: data.revenue, cost: data.cost, profit, margin };
      });
      setItemPnLData(pnlData);
    } catch (error) { console.error('Error fetching item P&L:', error); } finally { setLoading(false); }
  };

  const filtered = itemPnLData.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => {
    if (sortBy === "profit") return b.profit - a.profit;
    if (sortBy === "revenue") return b.revenue - a.revenue;
    if (sortBy === "margin") return b.margin - a.margin;
    if (sortBy === "sold") return b.sold - a.sold;
    return 0;
  });

  const totalRevenue = filtered.reduce((sum, i) => sum + i.revenue, 0);
  const totalCost = filtered.reduce((sum, i) => sum + i.cost, 0);
  const totalProfit = filtered.reduce((sum, i) => sum + i.profit, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  if (loading) { return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>; }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Item Wise Profit & Loss</h1>
          <p className="text-muted-foreground">Analyze profitability by product</p>
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
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Revenue</p>
            <TrendingUp className="w-4 h-4 text-primary flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 truncate">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Cost</p>
            <TrendingDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 truncate">₹{totalCost.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Profit</p>
            <TrendingUp className="w-4 h-4 text-success flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 text-success truncate">₹{totalProfit.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Avg Margin</p>
            <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2">{avgMargin.toFixed(1)}%</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="profit">Highest Profit</SelectItem>
            <SelectItem value="revenue">Highest Revenue</SelectItem>
            <SelectItem value="margin">Highest Margin</SelectItem>
            <SelectItem value="sold">Most Sold</SelectItem>
          </SelectContent>
        </Select>
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      <div className="metric-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[600px]">
            <thead>
              <tr>
                <th>Item Name</th>
                <th className="text-center">Units Sold</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">Cost</th>
                <th className="text-right">Profit</th>
                <th className="text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">No item data found</td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.name}</td>
                    <td className="text-center">{item.sold}</td>
                    <td className="text-right">₹{item.revenue.toLocaleString()}</td>
                    <td className="text-right text-muted-foreground">₹{item.cost.toLocaleString()}</td>
                    <td className="text-right text-success font-medium">₹{item.profit.toLocaleString()}</td>
                    <td className={cn("text-right", item.margin >= 20 ? "text-success" : item.margin >= 15 ? "text-warning" : "text-destructive")}>
                      {item.margin.toFixed(1)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filtered.length > 0 && (
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td>Total</td>
                  <td className="text-center">{filtered.reduce((sum, i) => sum + i.sold, 0)}</td>
                  <td className="text-right">₹{totalRevenue.toLocaleString()}</td>
                  <td className="text-right">₹{totalCost.toLocaleString()}</td>
                  <td className="text-right text-success">₹{totalProfit.toLocaleString()}</td>
                  <td className="text-right">{avgMargin.toFixed(1)}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}