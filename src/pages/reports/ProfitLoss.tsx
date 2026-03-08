// @ts-nocheck
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { generateReportPDF, downloadPDF } from "@/lib/pdf";
import { printTable } from "@/lib/print";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DateRangeFilter, getDefaultDateRange, DateRange } from "@/components/DateRangeFilter";
import { useBusinessSettings } from "@/contexts/BusinessContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";

interface PLData {
  // Revenue / Receipts (+) - main items (included in total)
  sale: number;
  debitNote: number;
  paymentOut: number;
  closingStock: number;
  otherIncomes: number;
  // Revenue info items (NOT included in total)
  gstReceivable: number;
  tcsReceivable: number;
  tdsReceivable: number;
  // Expenses / Payments (-) - main items (included in total)
  purchase: number;
  creditNote: number;
  paymentIn: number;
  openingStock: number;
  otherExpense: number;
  // Expense info items (NOT included in total)
  gstPayable: number;
  tcsPayable: number;
  tdsPayable: number;
}

export default function ProfitLoss() {
  const { businessSettings } = useBusinessSettings();
  const { selectedBusiness } = useBusinessSelection();
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [loading, setLoading] = useState(true);
  const [plData, setPlData] = useState<PLData>({
    sale: 0,
    debitNote: 0,
    paymentOut: 0,
    closingStock: 0,
    otherIncomes: 0,
    gstReceivable: 0,
    tcsReceivable: 0,
    tdsReceivable: 0,
    purchase: 0,
    creditNote: 0,
    paymentIn: 0,
    openingStock: 0,
    otherExpense: 0,
    gstPayable: 0,
    tcsPayable: 0,
    tdsPayable: 0,
  });

  useEffect(() => {
    if (selectedBusiness) {
      fetchProfitLossData();
    }
  }, [dateRange, selectedBusiness]);

  const fetchProfitLossData = async () => {
    if (!selectedBusiness) return;
    try {
      setLoading(true);
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      // =====================
      // Get sales data
      // =====================
      const { data: salesInvoices } = await supabase
        .from('sale_invoices')
        .select('total_amount, tax_amount, tcs_amount')
        .eq('is_deleted', false)
        .eq('business_id', selectedBusiness.id)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

      // Sale total (total_amount includes TCS, so use it for matching Bill-wise P&L)
      const saleTotal = (salesInvoices || []).reduce(
        (sum, inv) => sum + Number(inv.total_amount || 0),
        0
      );

      // GST Receivable (tax collected on sales)
      const gstReceivable = (salesInvoices || []).reduce(
        (sum, inv) => sum + Number(inv.tax_amount || 0),
        0
      );

      // TCS Receivable (TCS collected on sales)
      const tcsReceivable = (salesInvoices || []).reduce(
        (sum, inv) => sum + Number(inv.tcs_amount || 0),
        0
      );

      // =====================
      // PURCHASES
      // =====================
      const { data: purchaseInvoices } = await supabase
        .from('purchase_invoices')
        .select('total_amount, tax_amount, tcs_amount')
        .eq('is_deleted', false)
        .eq('business_id', selectedBusiness.id)
        .gte('invoice_date', startDate)
        .lte('invoice_date', endDate);

      // Purchase total (use total_amount for consistency)
      const purchaseTotal = (purchaseInvoices || []).reduce(
        (sum, inv) => sum + Number(inv.total_amount || 0),
        0
      );

      // GST Payable (tax paid on purchases)
      const gstPayable = (purchaseInvoices || []).reduce(
        (sum, inv) => sum + Number(inv.tax_amount || 0),
        0
      );

      // TCS Payable
      const tcsPayable = (purchaseInvoices || []).reduce(
        (sum, inv) => sum + Number(inv.tcs_amount || 0),
        0
      );

      // Get payment in (received from customers)
      const { data: paymentsIn } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_type', 'payment_in')
        .eq('business_id', selectedBusiness.id)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

      const paymentInTotal = (paymentsIn || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);

      // Get payment out (paid to suppliers)
      const { data: paymentsOut } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_type', 'payment_out')
        .eq('business_id', selectedBusiness.id)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

      const paymentOutTotal = (paymentsOut || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);

      // Get other expenses
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('business_id', selectedBusiness.id)
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

      const expenseTotal = (expenses || []).reduce((sum, e) => sum + Number(e.amount || 0), 0);

      // Get stock values - Opening stock is current_stock at start, Closing stock is current value
      const { data: items } = await supabase
        .from('items')
        .select('current_stock, purchase_price, opening_stock')
        .eq('is_deleted', false)
        .eq('business_id', selectedBusiness.id);

      const closingStockValue = (items || []).reduce((sum, item) => {
        return sum + (Number(item.current_stock || 0) * Number(item.purchase_price || 0));
      }, 0);

      const openingStockValue = (items || []).reduce((sum, item) => {
        return sum + (Number(item.opening_stock || 0) * Number(item.purchase_price || 0));
      }, 0);

      setPlData({
        sale: saleTotal,
        debitNote: 0, // Purchase returns (not implemented yet)
        paymentOut: paymentOutTotal,
        closingStock: closingStockValue,
        otherIncomes: 0,
        gstReceivable,
        tcsReceivable,
        tdsReceivable: 0, // TDS receivable (not implemented yet)
        purchase: purchaseTotal,
        creditNote: 0, // Sale returns (not implemented yet)
        paymentIn: paymentInTotal,
        openingStock: openingStockValue,
        otherExpense: expenseTotal,
        gstPayable,
        tcsPayable,
        tdsPayable: 0, // TDS payable (not implemented yet)
      });
    } catch (error) {
      console.error('Error fetching P&L data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals EXCLUDING GST/TCS/TDS items to match Bill-wise P&L
  const totalRevenue = plData.sale + plData.debitNote + plData.paymentOut + 
    plData.closingStock + plData.otherIncomes;

  const totalExpenses = plData.purchase + plData.creditNote + plData.paymentIn + 
    plData.openingStock + plData.otherExpense;

  const netProfit = totalRevenue - totalExpenses;

  const dateRangeLabel = `${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`;

  // Main items that are included in totals
  const revenueItems = [
    { label: "Sale", amount: plData.sale },
    { label: "Debit Note / Purchase Return", amount: plData.debitNote },
    { label: "Payment Out", amount: plData.paymentOut },
    { label: "Closing Stock", amount: plData.closingStock },
    { label: "Other Incomes", amount: plData.otherIncomes },
  ];

  // Main expense items that are included in totals
  const expenseItems = [
    { label: "Purchase", amount: plData.purchase },
    { label: "Credit Note / Sale Return", amount: plData.creditNote },
    { label: "Payment In", amount: plData.paymentIn },
    { label: "Opening Stock", amount: plData.openingStock },
    { label: "Other Expense", amount: plData.otherExpense },
  ];

  // Combined items for rendering (only main items, no tax info items)
  const allRevenueItems = [...revenueItems];
  const allExpenseItems = [...expenseItems];

  const handlePrint = () => {
    const allRows: (string | number)[][] = [];
    
    // Build rows matching the side-by-side format
    for (let i = 0; i < Math.max(allRevenueItems.length, allExpenseItems.length); i++) {
      const rev = allRevenueItems[i] || { label: "", amount: 0 };
      const exp = allExpenseItems[i] || { label: "", amount: 0 };
      allRows.push([
        rev.label,
        rev.amount > 0 ? `₹${rev.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "0",
        exp.label,
        exp.amount > 0 ? `₹${exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "0",
      ]);
    }

    // Add totals
    allRows.push([
      "Total Revenue / Receipts",
      `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      "Total Expenses / Payments",
      `₹${totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ]);

    allRows.push([
      "",
      "",
      "Net Profit",
      `₹${netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ]);

    printTable({
      title: "Profit & Loss Report",
      subtitle: dateRangeLabel,
      columns: ["Revenue / Receipts (+)", "Amount (₹)", "Expenses / Payments (−)", "Amount (₹)"],
      rows: allRows,
      summary: []
    });
  };

  const handleExportPDF = async () => {
    const allRows: (string | number)[][] = [];
    
    for (let i = 0; i < Math.max(allRevenueItems.length, allExpenseItems.length); i++) {
      const rev = allRevenueItems[i] || { label: "", amount: 0 };
      const exp = allExpenseItems[i] || { label: "", amount: 0 };
      allRows.push([
        rev.label,
        rev.amount > 0 ? `₹${rev.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "0",
        exp.label,
        exp.amount > 0 ? `₹${exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "0",
      ]);
    }

    allRows.push([
      "Total Revenue / Receipts",
      `₹${totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      "Total Expenses / Payments",
      `₹${totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ]);

    allRows.push([
      "",
      "",
      "Net Profit",
      `₹${netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
    ]);

    const doc = await generateReportPDF({
      title: "Profit & Loss Report",
      subtitle: businessSettings?.business_name || "HisabKitab",
      dateRange: dateRangeLabel,
      columns: ["Revenue / Receipts (+)", "Amount (₹)", "Expenses / Payments (−)", "Amount (₹)"],
      rows: allRows,
      summary: [],
      logoUrl: businessSettings?.logo_url || undefined
    });
    downloadPDF(doc, `profit-loss-${new Date().toISOString().split('T')[0]}`);
  };

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
          <h1 className="text-2xl font-bold">Profit & Loss Report</h1>
          <p className="text-muted-foreground">Financial performance overview</p>
        </div>
        <div className="flex gap-3">
          <PrintButton onPrint={handlePrint} onExportPDF={handleExportPDF} />
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-wrap gap-4 items-center">
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* P&L Statement Table */}
      <div className="metric-card overflow-hidden p-0">
        <div className="bg-muted/50 py-3 px-4 text-center font-semibold border-b border-border">
          Profit & Loss Report
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium w-1/4">Revenue / Receipts (+)</th>
                <th className="text-right py-3 px-4 font-medium w-1/4">Amount (₹)</th>
                <th className="text-left py-3 px-4 font-medium w-1/4">Expenses / Payments (−)</th>
                <th className="text-right py-3 px-4 font-medium w-1/4">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {/* Main items (included in totals) */}
              {revenueItems.map((rev, idx) => {
                const exp = expenseItems[idx] || { label: "", amount: 0 };
                return (
                  <tr key={idx} className="border-b border-border">
                    <td className="py-2.5 px-4">{rev.label}</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {rev.amount > 0 ? rev.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0"}
                    </td>
                    <td className="py-2.5 px-4">{exp.label}</td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {exp.amount > 0 ? exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : "0"}
                    </td>
                  </tr>
                );
              })}
              {/* Totals Row */}
              <tr className="border-b border-border bg-muted/50 font-semibold">
                <td className="py-3 px-4">Total Revenue / Receipts</td>
                <td className="py-3 px-4 text-right font-mono text-success">
                  {totalRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-4">Total Expenses / Payments</td>
                <td className="py-3 px-4 text-right font-mono text-destructive">
                  {totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {/* Net Profit Row */}
              <tr className="bg-primary/10">
                <td colSpan={2}></td>
                <td className="py-4 px-4 font-bold text-lg">Net Profit</td>
                <td className={`py-4 px-4 text-right font-bold text-lg font-mono ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
