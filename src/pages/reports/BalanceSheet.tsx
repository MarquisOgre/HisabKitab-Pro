// @ts-nocheck
import { useState, useEffect } from "react";
import { Building2, Wallet, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { generateReportPDF, downloadPDF } from "@/lib/pdf";
import { printTable } from "@/lib/print";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DateRangeFilter, getDefaultDateRange, DateRange } from "@/components/DateRangeFilter";
import { useBusinessSettings } from "@/contexts/BusinessContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";

export default function BalanceSheet() {
  const { businessSettings } = useBusinessSettings();
  const { selectedBusiness } = useBusinessSelection();
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [loading, setLoading] = useState(true);
  const [cashInHand, setCashInHand] = useState(0);
  const [bankBalance, setBankBalance] = useState(0);
  const [receivables, setReceivables] = useState(0);
  const [inventory, setInventory] = useState(0);
  const [payables, setPayables] = useState(0);

  useEffect(() => {
    if (selectedBusiness) {
      fetchBalanceSheetData();
    }
  }, [dateRange, selectedBusiness]);

  const fetchBalanceSheetData = async () => {
    if (!selectedBusiness) return;
    try {
      setLoading(true);

      // Get cash transactions up to the end date
      const { data: cashTxns } = await supabase
        .from('cash_transactions')
        .select('amount, transaction_type, transaction_date')
        .eq('business_id', selectedBusiness.id)
        .lte('transaction_date', format(dateRange.to, 'yyyy-MM-dd'));

      let cash = 0;
      (cashTxns || []).forEach(txn => {
        if (txn.transaction_type === 'in') {
          cash += txn.amount;
        } else {
          cash -= txn.amount;
        }
      });
      setCashInHand(cash);

      // Get bank accounts balance
      const { data: bankAccounts } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('business_id', selectedBusiness.id);

      const bankTotal = (bankAccounts || []).reduce((sum, acc) => sum + Number(acc.current_balance || 0), 0);
      setBankBalance(bankTotal);

      // Get receivables (unpaid sales) up to end date
      const { data: salesInvoices } = await supabase
        .from('sale_invoices')
        .select('balance_due, invoice_date')
        .or('is_deleted.is.null,is_deleted.eq.false')
        .eq('business_id', selectedBusiness.id)
        .lte('invoice_date', format(dateRange.to, 'yyyy-MM-dd'));

      const totalReceivables = (salesInvoices || []).reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0);
      setReceivables(totalReceivables);

      // Get payables (unpaid purchases) up to end date
      const { data: purchaseInvoices } = await supabase
        .from('purchase_invoices')
        .select('balance_due, invoice_date')
        .or('is_deleted.is.null,is_deleted.eq.false')
        .eq('business_id', selectedBusiness.id)
        .lte('invoice_date', format(dateRange.to, 'yyyy-MM-dd'));

      const totalPayables = (purchaseInvoices || []).reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0);
      setPayables(totalPayables);

      // Get inventory value
      const { data: items } = await supabase
        .from('items')
        .select('current_stock, purchase_price')
        .or('is_deleted.is.null,is_deleted.eq.false')
        .eq('business_id', selectedBusiness.id);

      const inventoryValue = (items || []).reduce((sum, item) => 
        sum + (Number(item.current_stock || 0) * Number(item.purchase_price || 0)), 0);
      setInventory(inventoryValue);

    } catch (error) {
      console.error('Error fetching balance sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const assets = {
    current: [
      { name: "Cash in Hand", amount: cashInHand },
      { name: "Bank Accounts", amount: bankBalance },
      { name: "Accounts Receivable", amount: receivables },
      { name: "Inventory", amount: inventory },
    ],
  };

  const liabilities = {
    current: [
      { name: "Accounts Payable", amount: payables },
    ],
  };

  const totalCurrentAssets = assets.current.reduce((sum, a) => sum + a.amount, 0);
  const totalAssets = totalCurrentAssets;
  const totalCurrentLiabilities = liabilities.current.reduce((sum, l) => sum + l.amount, 0);
  const totalLiabilities = totalCurrentLiabilities;
  const totalEquity = totalAssets - totalLiabilities;

  const dateRangeLabel = `As on ${format(dateRange.to, 'dd MMM yyyy')}`;

  const handlePrint = () => {
    const allRows = [
      ["ASSETS", "", ""],
      ["Current Assets", "", ""],
      ...assets.current.map(a => ["", a.name, `₹${a.amount.toLocaleString()}`]),
      ["", "Total Current Assets", `₹${totalCurrentAssets.toLocaleString()}`],
      ["", "TOTAL ASSETS", `₹${totalAssets.toLocaleString()}`],
      ["", "", ""],
      ["LIABILITIES & EQUITY", "", ""],
      ["Current Liabilities", "", ""],
      ...liabilities.current.map(l => ["", l.name, `₹${l.amount.toLocaleString()}`]),
      ["", "Total Liabilities", `₹${totalLiabilities.toLocaleString()}`],
      ["Owner's Equity", "", ""],
      ["", "Net Worth", `₹${totalEquity.toLocaleString()}`],
      ["", "TOTAL LIABILITIES + EQUITY", `₹${totalAssets.toLocaleString()}`],
    ];

    printTable({
      title: "Balance Sheet",
      subtitle: dateRangeLabel,
      columns: ["Section", "Particulars", "Amount"],
      rows: allRows,
    });
  };

  const handleExportPDF = async () => {
    const allRows = [
      ["ASSETS", "", ""],
      ["Current Assets", "", ""],
      ...assets.current.map(a => ["", a.name, `₹${a.amount.toLocaleString()}`]),
      ["", "Total Current Assets", `₹${totalCurrentAssets.toLocaleString()}`],
      ["", "TOTAL ASSETS", `₹${totalAssets.toLocaleString()}`],
      ["", "", ""],
      ["LIABILITIES & EQUITY", "", ""],
      ["Current Liabilities", "", ""],
      ...liabilities.current.map(l => ["", l.name, `₹${l.amount.toLocaleString()}`]),
      ["", "Total Liabilities", `₹${totalLiabilities.toLocaleString()}`],
      ["Owner's Equity", "", ""],
      ["", "Net Worth", `₹${totalEquity.toLocaleString()}`],
      ["", "TOTAL LIABILITIES + EQUITY", `₹${totalAssets.toLocaleString()}`],
    ];

    const doc = await generateReportPDF({
      title: "Balance Sheet",
      subtitle: businessSettings?.business_name || "HisabKitab",
      dateRange: dateRangeLabel,
      columns: ["Section", "Particulars", "Amount"],
      rows: allRows,
      logoUrl: businessSettings?.logo_url || undefined
    });
    downloadPDF(doc, `balance-sheet-${new Date().toISOString().split('T')[0]}`);
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
          <h1 className="text-2xl font-bold">Balance Sheet</h1>
          <p className="text-muted-foreground">Financial position statement</p>
        </div>
        <div className="flex gap-3">
          <PrintButton onPrint={handlePrint} onExportPDF={handleExportPDF} />
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-wrap gap-4 items-center">
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Assets</p>
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2">₹{totalAssets.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground">Total Liabilities</p>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2">₹{totalLiabilities.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground">Net Worth</p>
            <Wallet className="w-4 h-4 text-success" />
          </div>
          <p className={`text-lg sm:text-2xl font-bold mt-2 ${totalEquity >= 0 ? 'text-success' : 'text-destructive'}`}>
            ₹{totalEquity.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Assets */}
        <div className="metric-card">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Assets
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Assets</h4>
              {assets.current.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm">{item.name}</span>
                  <span className="font-medium text-sm">₹{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 bg-muted/50 px-2 rounded mt-2">
                <span className="font-medium text-sm">Total Current Assets</span>
                <span className="font-bold text-sm">₹{totalCurrentAssets.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between py-3 bg-primary/10 px-3 rounded-lg">
              <span className="font-semibold text-sm">Total Assets</span>
              <span className="font-bold text-primary text-sm">₹{totalAssets.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Liabilities & Equity */}
        <div className="metric-card">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-destructive" />
            Liabilities & Equity
          </h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Current Liabilities</h4>
              {liabilities.current.map((item, idx) => (
                <div key={idx} className="flex justify-between py-2 border-b border-border">
                  <span className="text-sm">{item.name}</span>
                  <span className="font-medium text-sm">₹{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between py-2 bg-muted/50 px-2 rounded mt-2">
                <span className="font-medium text-sm">Total Liabilities</span>
                <span className="font-bold text-sm">₹{totalLiabilities.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Owner's Equity</h4>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-sm">Net Worth</span>
                <span className={`font-medium text-sm ${totalEquity >= 0 ? 'text-success' : 'text-destructive'}`}>
                  ₹{totalEquity.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-between py-3 bg-primary/10 px-3 rounded-lg">
              <span className="font-semibold text-sm">Total Liabilities + Equity</span>
              <span className="font-bold text-primary text-sm">₹{totalAssets.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}