// @ts-nocheck
import { useState, useEffect } from "react";
import { TrendingDown, IndianRupee, Package, Loader2 } from "lucide-react";
import { PrintButton } from "@/components/PrintButton";
import { generateReportPDF, downloadPDF } from "@/lib/pdf";
import { printTable } from "@/lib/print";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DateRangeFilter, getDefaultDateRange, filterByDateRange, DateRange } from "@/components/DateRangeFilter";
import { useBusinessSettings } from "@/contexts/BusinessContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";

interface PurchaseData {
  id: string;
  invoice_number: string;
  invoice_date: string;
  party_name: string;
  items_count: number;
  total_amount: number;
  paid_amount: number;
  tcs_amount: number;
  tds_amount: number;
}

export default function PurchaseReport() {
  const { businessSettings } = useBusinessSettings();
  const { selectedBusiness } = useBusinessSelection();
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [purchaseData, setPurchaseData] = useState<PurchaseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedBusiness) {
      fetchPurchaseData();
    }
  }, [selectedBusiness]);

  const fetchPurchaseData = async () => {
    if (!selectedBusiness) return;
    try {
      const { data: invoices, error } = await supabase
        .from('purchase_invoices')
        .select(`
          id,
          invoice_number,
          invoice_date,
          total_amount,
          paid_amount,
          tcs_amount,
          tds_amount,
          party_id,
          parties (name)
        `)
        .eq('is_deleted', false)
        .eq('business_id', selectedBusiness.id)
        .order('invoice_date', { ascending: false });

      if (error) throw error;

      const purchasesWithItems = await Promise.all(
        (invoices || []).map(async (inv: any) => {
          const { count } = await supabase
            .from('purchase_invoice_items')
            .select('*', { count: 'exact', head: true })
            .eq('purchase_invoice_id', inv.id);

          return {
            id: inv.id,
            invoice_number: inv.invoice_number,
            invoice_date: inv.invoice_date,
            party_name: inv.parties?.name || 'Unknown Supplier',
            items_count: count || 0,
            total_amount: Number(inv.total_amount || 0),
            paid_amount: Number(inv.paid_amount || 0),
            tcs_amount: Number(inv.tcs_amount || 0),
            tds_amount: Number(inv.tds_amount || 0),
          };
        })
      );

      setPurchaseData(purchasesWithItems);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = filterByDateRange(purchaseData, dateRange, "invoice_date");

  const totalPurchase = filteredData.reduce((sum, p) => sum + p.total_amount, 0);
  const totalPaid = filteredData.reduce((sum, p) => sum + p.paid_amount, 0);
  const totalTcs = filteredData.reduce((sum, p) => sum + p.tcs_amount, 0);
  const totalPending = totalPurchase - totalPaid;

  const dateRangeLabel = `${format(dateRange.from, 'dd MMM yyyy')} - ${format(dateRange.to, 'dd MMM yyyy')}`;

  const handlePrint = () => {
    printTable({
      title: "Purchase Report",
      subtitle: dateRangeLabel,
      columns: ["Bill No.", "Date", "Supplier", "Items", "Amount", "TCS", "Paid", "Balance"],
      rows: filteredData.map(p => [
        p.invoice_number,
        format(new Date(p.invoice_date), 'dd MMM yyyy'),
        p.party_name,
        p.items_count,
        `₹${p.total_amount.toLocaleString()}`,
        `₹${p.tcs_amount.toLocaleString()}`,
        `₹${p.paid_amount.toLocaleString()}`,
        `₹${(p.total_amount - p.paid_amount).toLocaleString()}`
      ]),
      summary: [
        { label: "Total Purchase", value: `₹${totalPurchase.toLocaleString()}` },
        { label: "Total TCS", value: `₹${totalTcs.toLocaleString()}` },
        { label: "Total Paid", value: `₹${totalPaid.toLocaleString()}` },
        { label: "Pending Payment", value: `₹${totalPending.toLocaleString()}` },
      ]
    });
  };

  const handleExportPDF = async () => {
    const doc = await generateReportPDF({
      title: "Purchase Report",
      subtitle: businessSettings?.business_name || "HisabKitab",
      dateRange: dateRangeLabel,
      columns: ["Bill No.", "Date", "Supplier", "Items", "Amount", "TCS", "Paid", "Balance"],
      rows: filteredData.map(p => [
        p.invoice_number,
        format(new Date(p.invoice_date), 'dd MMM yyyy'),
        p.party_name,
        p.items_count,
        `₹${p.total_amount.toLocaleString()}`,
        `₹${p.tcs_amount.toLocaleString()}`,
        `₹${p.paid_amount.toLocaleString()}`,
        `₹${(p.total_amount - p.paid_amount).toLocaleString()}`
      ]),
      summary: [
        { label: "Total Purchase", value: `₹${totalPurchase.toLocaleString()}` },
        { label: "Total TCS", value: `₹${totalTcs.toLocaleString()}` },
        { label: "Total Paid", value: `₹${totalPaid.toLocaleString()}` },
        { label: "Pending Payment", value: `₹${totalPending.toLocaleString()}` },
      ],
      logoUrl: businessSettings?.logo_url || undefined
    });
    downloadPDF(doc, `purchase-report-${new Date().toISOString().split('T')[0]}`);
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
          <h1 className="text-2xl font-bold">Purchase Report</h1>
          <p className="text-muted-foreground">Track your purchase transactions</p>
        </div>
        <PrintButton onPrint={handlePrint} onExportPDF={handleExportPDF} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Purchase</p>
            <IndianRupee className="w-4 h-4 text-primary flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 truncate">₹{totalPurchase.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Amount Paid</p>
            <TrendingDown className="w-4 h-4 text-success flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 text-success truncate">₹{totalPaid.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1 hidden sm:block">
            {totalPurchase > 0 ? ((totalPaid / totalPurchase) * 100).toFixed(1) : 0}% of total
          </p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Pending</p>
            <IndianRupee className="w-4 h-4 text-warning flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 text-warning truncate">₹{totalPending.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Bills</p>
            <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2">{filteredData.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* Data Table */}
      <div className="metric-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[800px]">
            <thead>
              <tr>
                <th>Bill No.</th>
                <th>Date</th>
                <th>Supplier</th>
                <th className="text-center">Items</th>
                <th className="text-right">Amount</th>
                <th className="text-right">TCS</th>
                <th className="text-right">Paid</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-muted-foreground">
                    No purchases found
                  </td>
                </tr>
              ) : (
                filteredData.map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="font-medium">{purchase.invoice_number}</td>
                    <td className="text-muted-foreground">
                      {format(new Date(purchase.invoice_date), 'dd MMM yyyy')}
                    </td>
                    <td>{purchase.party_name}</td>
                    <td className="text-center">{purchase.items_count}</td>
                    <td className="text-right font-medium">₹{purchase.total_amount.toLocaleString()}</td>
                    <td className="text-right">₹{purchase.tcs_amount.toLocaleString()}</td>
                    <td className="text-right text-success">₹{purchase.paid_amount.toLocaleString()}</td>
                    <td className="text-right text-warning">
                      ₹{(purchase.total_amount - purchase.paid_amount).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot>
                <tr className="bg-muted/50 font-semibold">
                  <td colSpan={4}>Total</td>
                  <td className="text-right">₹{totalPurchase.toLocaleString()}</td>
                  <td className="text-right">₹{totalTcs.toLocaleString()}</td>
                  <td className="text-right text-success">₹{totalPaid.toLocaleString()}</td>
                  <td className="text-right text-warning">₹{totalPending.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}