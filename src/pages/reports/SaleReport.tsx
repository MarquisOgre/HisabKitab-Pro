// @ts-nocheck
import { useState, useEffect } from "react";
import { TrendingUp, IndianRupee, Calendar, Loader2 } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { generateReportPDF, downloadPDF } from "@/lib/pdf";
import { printTable } from "@/lib/print";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DateRangeFilter, getDefaultDateRange, filterByDateRange, DateRange } from "@/components/DateRangeFilter";
import { useBusinessSettings } from "@/contexts/BusinessContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";

interface SaleData {
  id: string;
  invoice_number: string;
  invoice_date: string;
  party_name: string;
  items_count: number;
  total_amount: number;
  tcs_amount: number;
  cost_price: number;
  sold_qty: number;
}

export default function SaleReport() {
  const { businessSettings } = useBusinessSettings();
  const { selectedBusiness } = useBusinessSelection();
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [salesData, setSalesData] = useState<SaleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedBusiness) {
      fetchSalesData();
    }
  }, [selectedBusiness]);

  const fetchSalesData = async () => {
    if (!selectedBusiness) return;
    try {
      const { data: invoices, error } = await supabase
        .from('sale_invoices')
        .select(`
          id,
          invoice_number,
          invoice_date,
          total_amount,
          tcs_amount,
          party_id,
          parties (name)
        `)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .eq('business_id', selectedBusiness.id)
        .order('invoice_date', { ascending: false });

      if (error) throw error;

      // Get item details including cost price for each invoice
      const salesWithDetails = await Promise.all(
        (invoices || []).map(async (inv: any) => {
          // Get sale invoice items with item details
          const { data: saleItems } = await supabase
            .from('sale_invoice_items')
            .select(`
              quantity,
              item_id,
              items (purchase_price)
            `)
            .eq('sale_invoice_id', inv.id);

          // Calculate total cost price and sold quantity
          let totalCostPrice = 0;
          let totalSoldQty = 0;
          
          (saleItems || []).forEach((item: any) => {
            const qty = Number(item.quantity) || 0;
            const purchasePrice = Number(item.items?.purchase_price) || 0;
            totalCostPrice += qty * purchasePrice;
            totalSoldQty += qty;
          });

          return {
            id: inv.id,
            invoice_number: inv.invoice_number,
            invoice_date: inv.invoice_date,
            party_name: inv.parties?.name || 'Walk-in Customer',
            items_count: saleItems?.length || 0,
            total_amount: Number(inv.total_amount || 0),
            tcs_amount: Number(inv.tcs_amount || 0),
            cost_price: totalCostPrice,
            sold_qty: totalSoldQty,
          };
        })
      );

      setSalesData(salesWithDetails);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = filterByDateRange(salesData, dateRange, "invoice_date");

  const totalSales = filteredData.reduce((sum, s) => sum + s.total_amount, 0);
  const totalTcs = filteredData.reduce((sum, s) => sum + s.tcs_amount, 0);
  const totalCost = filteredData.reduce((sum, s) => sum + s.cost_price, 0);
  // Profit = Sales Amount - TCS - (Cost Price * Sold Qty)
  // Since cost_price already includes qty calculation, formula is: Sales - TCS - Cost
  const totalProfit = totalSales - totalTcs - totalCost;
  const avgOrderValue = filteredData.length > 0 ? totalSales / filteredData.length : 0;

  const dateRangeLabel = `${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`;

  const handlePrint = () => {
    printTable({
      title: "Sale Report",
      subtitle: dateRangeLabel,
      columns: ["Invoice", "Date", "Party", "Items", "Amount", "TCS", "Cost", "Profit"],
      rows: filteredData.map(sale => {
        const profit = sale.total_amount - sale.tcs_amount - sale.cost_price;
        return [
          sale.invoice_number,
          format(new Date(sale.invoice_date), 'dd MMM yyyy'),
          sale.party_name,
          sale.items_count,
          `₹${sale.total_amount.toLocaleString("en-IN")}`,
          `₹${sale.tcs_amount.toLocaleString("en-IN")}`,
          `₹${sale.cost_price.toLocaleString("en-IN")}`,
          `₹${profit.toLocaleString("en-IN")}`,
        ];
      }),
      summary: [
        { label: "Total Sales", value: `₹${totalSales.toLocaleString("en-IN")}` },
        { label: "Total Profit", value: `₹${totalProfit.toLocaleString("en-IN")}` },
        { label: "Total Invoices", value: filteredData.length.toString() },
      ]
    });
  };

  const handleExportPDF = async () => {
    const doc = await generateReportPDF({
      title: "Sale Report",
      subtitle: businessSettings?.business_name || "HisabKitab",
      dateRange: dateRangeLabel,
      columns: ["Invoice", "Date", "Party", "Items", "Amount", "TCS", "Cost", "Profit"],
      rows: filteredData.map(sale => {
        const profit = sale.total_amount - sale.tcs_amount - sale.cost_price;
        return [
          sale.invoice_number,
          format(new Date(sale.invoice_date), 'dd MMM yyyy'),
          sale.party_name,
          sale.items_count,
          `₹${sale.total_amount.toLocaleString("en-IN")}`,
          `₹${sale.tcs_amount.toLocaleString("en-IN")}`,
          `₹${sale.cost_price.toLocaleString("en-IN")}`,
          `₹${profit.toLocaleString("en-IN")}`,
        ];
      }),
      summary: [
        { label: "Total Sales", value: `₹${totalSales.toLocaleString("en-IN")}` },
        { label: "Total Profit", value: `₹${totalProfit.toLocaleString("en-IN")}` },
        { label: "Total Invoices", value: filteredData.length.toString() },
      ],
      logoUrl: businessSettings?.logo_url || undefined
    });
    downloadPDF(doc, `sale-report-${new Date().toISOString().split('T')[0]}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Sale Report</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Analyze your sales performance</p>
        </div>
        <PrintButton onPrint={handlePrint} onExportPDF={handleExportPDF} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="metric-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Sales</p>
            <IndianRupee className="w-4 h-4 text-primary hidden sm:block" />
          </div>
          <p className="text-lg md:text-2xl font-bold mt-1">₹{totalSales.toLocaleString("en-IN")}</p>
        </div>
        <div className="metric-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Profit</p>
            <TrendingUp className="w-4 h-4 text-success hidden sm:block" />
          </div>
          <p className={`text-lg md:text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
            ₹{totalProfit.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Margin: {totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0}%
          </p>
        </div>
        <div className="metric-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Invoices</p>
            <Calendar className="w-4 h-4 text-muted-foreground hidden sm:block" />
          </div>
          <p className="text-lg md:text-2xl font-bold mt-1">{filteredData.length}</p>
        </div>
        <div className="metric-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground">Avg Order</p>
            <IndianRupee className="w-4 h-4 text-muted-foreground hidden sm:block" />
          </div>
          <p className="text-lg md:text-2xl font-bold mt-1">₹{Math.round(avgOrderValue).toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* Data Table */}
      <div className="metric-card overflow-hidden p-0">
        <div className="overflow-x-auto">
        <table className="data-table min-w-[700px]">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Party</th>
              <th className="text-center">Items</th>
              <th className="text-right">Amount</th>
              <th className="text-right">TCS</th>
              <th className="text-right">Cost</th>
              <th className="text-right">Profit</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-muted-foreground">
                  No sales found
                </td>
              </tr>
            ) : (
              filteredData.map((sale) => {
                const profit = sale.total_amount - sale.tcs_amount - sale.cost_price;
                return (
                  <tr key={sale.id}>
                    <td className="font-medium">{sale.invoice_number}</td>
                    <td className="text-muted-foreground">
                      {format(new Date(sale.invoice_date), 'dd MMM yyyy')}
                    </td>
                    <td>{sale.party_name}</td>
                    <td className="text-center">{sale.items_count}</td>
                    <td className="text-right font-medium">₹{sale.total_amount.toLocaleString("en-IN")}</td>
                    <td className="text-right text-muted-foreground">₹{sale.tcs_amount.toLocaleString("en-IN")}</td>
                    <td className="text-right text-muted-foreground">₹{sale.cost_price.toLocaleString("en-IN")}</td>
                    <td className={`text-right font-medium ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ₹{profit.toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {filteredData.length > 0 && (
            <tfoot>
              <tr className="bg-muted/50 font-semibold">
                <td colSpan={4}>Total</td>
                <td className="text-right">₹{totalSales.toLocaleString("en-IN")}</td>
                <td className="text-right">₹{totalTcs.toLocaleString("en-IN")}</td>
                <td className="text-right">₹{totalCost.toLocaleString("en-IN")}</td>
                <td className={`text-right ${totalProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ₹{totalProfit.toLocaleString("en-IN")}
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