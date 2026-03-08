// @ts-nocheck
import { useState, useEffect } from "react";
import { Download, IndianRupee, FileText, Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DateRangeFilter, getDefaultDateRange, DateRange } from "@/components/DateRangeFilter";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";

interface TaxSummary { 
  period: string; 
  taxableValue: number; 
  cgst: number; 
  sgst: number; 
  igst: number; 
  tcs: number;
  tds: number;
  total: number; 
}

interface TCSDetail { 
  id: string; 
  date: string; 
  party: string; 
  invoice: string; 
  amount: number; 
  tcsAmount: number; 
  type: 'sale' | 'purchase'; 
}

export default function TaxesReport() {
  const { selectedBusiness } = useBusinessSelection();
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [gstData, setGstData] = useState<TaxSummary[]>([]);
  const [tcsData, setTcsData] = useState<TCSDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    if (selectedBusiness) {
      fetchTaxData(); 
    }
  }, [dateRange, selectedBusiness]);

  const fetchTaxData = async () => {
    if (!selectedBusiness) return;
    try {
      setLoading(true);

      // Fetch sale invoices with TCS
      const { data: saleInvoices } = await supabase
        .from('sale_invoices')
        .select(`id, invoice_number, invoice_date, subtotal, tax_amount, total_amount, tcs_amount, party_id, parties (name)`)
        .eq('is_deleted', false)
        .eq('business_id', selectedBusiness.id)
        .gte('invoice_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('invoice_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('invoice_date', { ascending: false });

      // Fetch purchase invoices with TCS
      const { data: purchaseInvoices } = await supabase
        .from('purchase_invoices')
        .select(`id, invoice_number, invoice_date, subtotal, tax_amount, total_amount, tcs_amount, party_id, parties (name)`)
        .eq('is_deleted', false)
        .eq('business_id', selectedBusiness.id)
        .gte('invoice_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('invoice_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('invoice_date', { ascending: false });

      // GST Summary from sale invoices
      const monthlyTotals: { [key: string]: TaxSummary } = {};
      (saleInvoices || []).forEach((inv: any) => {
        const monthKey = format(new Date(inv.invoice_date), 'MMM yyyy');
        if (!monthlyTotals[monthKey]) { 
          monthlyTotals[monthKey] = { 
            period: monthKey, 
            taxableValue: 0, 
            cgst: 0, 
            sgst: 0, 
            igst: 0, 
            tcs: 0,
            tds: 0,
            total: 0 
          }; 
        }
        const taxAmount = Number(inv.tax_amount || 0);
        const tcsAmount = Number(inv.tcs_amount || 0);
        monthlyTotals[monthKey].taxableValue += Number(inv.subtotal || 0);
        monthlyTotals[monthKey].cgst += taxAmount / 2;
        monthlyTotals[monthKey].sgst += taxAmount / 2;
        monthlyTotals[monthKey].tcs += tcsAmount;
        monthlyTotals[monthKey].total += taxAmount;
      });
      
      // Add taxable value and TDS from purchase invoices
      (purchaseInvoices || []).forEach((inv: any) => {
        const monthKey = format(new Date(inv.invoice_date), 'MMM yyyy');
        if (!monthlyTotals[monthKey]) { 
          monthlyTotals[monthKey] = { 
            period: monthKey, 
            taxableValue: 0, 
            cgst: 0, 
            sgst: 0, 
            igst: 0, 
            tcs: 0,
            tds: 0,
            total: 0 
          }; 
        }
        const tcsAmount = Number(inv.tcs_amount || 0);
        // Add purchase invoice subtotal to taxable value
        monthlyTotals[monthKey].taxableValue += Number(inv.subtotal || 0);
        // For purchase invoices, TCS is TDS (tax deducted at source)
        monthlyTotals[monthKey].tds += tcsAmount;
      });
      
      setGstData(Object.values(monthlyTotals));

      // TCS from both sale and purchase invoices
      const tcsDetails: TCSDetail[] = [];
      
      (saleInvoices || []).filter((inv: any) => (inv.tcs_amount || 0) > 0).forEach((inv: any) => {
        tcsDetails.push({
          id: inv.id, 
          date: inv.invoice_date, 
          party: inv.parties?.name || 'Unknown', 
          invoice: inv.invoice_number, 
          amount: Number(inv.total_amount || 0), 
          tcsAmount: Number(inv.tcs_amount || 0), 
          type: 'sale'
        });
      });

      (purchaseInvoices || []).filter((inv: any) => (inv.tcs_amount || 0) > 0).forEach((inv: any) => {
        tcsDetails.push({
          id: inv.id, 
          date: inv.invoice_date, 
          party: inv.parties?.name || 'Unknown',
          invoice: inv.invoice_number, 
          amount: Number(inv.total_amount || 0),
          tcsAmount: Number(inv.tcs_amount || 0), 
          type: 'purchase'
        });
      });

      tcsDetails.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTcsData(tcsDetails);
    } catch (error) { 
      console.error('Error fetching tax data:', error); 
    } finally { 
      setLoading(false); 
    }
  };

  const totalTaxable = gstData.reduce((sum, g) => sum + g.taxableValue, 0);
  const totalGST = gstData.reduce((sum, g) => sum + g.total, 0);
  const totalTCS = gstData.reduce((sum, g) => sum + g.tcs, 0);
  const totalTDS = gstData.reduce((sum, g) => sum + g.tds, 0);

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
          <h1 className="text-xl sm:text-2xl font-bold">Taxes Report (GST & TCS/TDS)</h1>
          <p className="text-muted-foreground text-sm">Tax collection and liability summary</p>
        </div>
        <Button variant="outline" className="gap-2 self-start sm:self-auto">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Taxable</p>
            <IndianRupee className="w-4 h-4 text-primary flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 truncate">₹{totalTaxable.toLocaleString("en-IN")}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">GST Collected</p>
            <Calculator className="w-4 h-4 text-success flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 text-success truncate">₹{totalGST.toLocaleString("en-IN")}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">TCS Collected</p>
            <FileText className="w-4 h-4 text-warning flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 text-warning truncate">₹{totalTCS.toLocaleString("en-IN")}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">TDS Deducted</p>
            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 text-primary truncate">₹{totalTDS.toLocaleString("en-IN")}</p>
        </div>
        <div className="metric-card col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Tax Liability</p>
            <IndianRupee className="w-4 h-4 text-destructive flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 truncate">₹{(totalGST + totalTCS).toLocaleString("en-IN")}</p>
        </div>
      </div>

      <Tabs defaultValue="gst" className="space-y-6">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="gst" className="flex-1 sm:flex-none">GST Summary</TabsTrigger>
          <TabsTrigger value="tcs" className="flex-1 sm:flex-none">TCS/TDS Details</TabsTrigger>
        </TabsList>
        <TabsContent value="gst">
          <div className="metric-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="data-table min-w-[700px]">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th className="text-right">Taxable Value</th>
                    <th className="text-right">CGST</th>
                    <th className="text-right">SGST</th>
                    <th className="text-right">IGST</th>
                    <th className="text-right">TCS</th>
                    <th className="text-right">TDS</th>
                    <th className="text-right">Total GST</th>
                  </tr>
                </thead>
                <tbody>
                  {gstData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">No GST data found</td>
                    </tr>
                  ) : (
                    gstData.map((gst, idx) => (
                      <tr key={idx}>
                        <td className="font-medium">{gst.period}</td>
                        <td className="text-right">₹{gst.taxableValue.toLocaleString("en-IN")}</td>
                        <td className="text-right">₹{gst.cgst.toLocaleString("en-IN")}</td>
                        <td className="text-right">₹{gst.sgst.toLocaleString("en-IN")}</td>
                        <td className="text-right">₹{gst.igst.toLocaleString("en-IN")}</td>
                        <td className="text-right text-warning">₹{gst.tcs.toLocaleString("en-IN")}</td>
                        <td className="text-right text-primary">₹{gst.tds.toLocaleString("en-IN")}</td>
                        <td className="text-right font-medium text-success">₹{gst.total.toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {gstData.length > 0 && (
                  <tfoot>
                    <tr className="bg-muted/50 font-semibold">
                      <td>Total</td>
                      <td className="text-right">₹{totalTaxable.toLocaleString("en-IN")}</td>
                      <td className="text-right">₹{gstData.reduce((s, g) => s + g.cgst, 0).toLocaleString("en-IN")}</td>
                      <td className="text-right">₹{gstData.reduce((s, g) => s + g.sgst, 0).toLocaleString("en-IN")}</td>
                      <td className="text-right">₹0</td>
                      <td className="text-right text-warning">₹{totalTCS.toLocaleString("en-IN")}</td>
                      <td className="text-right text-primary">₹{totalTDS.toLocaleString("en-IN")}</td>
                      <td className="text-right text-success">₹{totalGST.toLocaleString("en-IN")}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="tcs">
          <div className="metric-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="data-table min-w-[600px]">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Party</th>
                    <th>Invoice</th>
                    <th className="text-right">Invoice Amount</th>
                    <th className="text-right">TCS/TDS Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {tcsData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">No TCS/TDS data found</td>
                    </tr>
                  ) : (
                    tcsData.map((tcs) => (
                      <tr key={tcs.id}>
                        <td className="text-muted-foreground">{format(new Date(tcs.date), 'dd MMM yyyy')}</td>
                        <td>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${tcs.type === 'sale' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                            {tcs.type === 'sale' ? 'TCS (Sale)' : 'TDS (Purchase)'}
                          </span>
                        </td>
                        <td className="font-medium">{tcs.party}</td>
                        <td>{tcs.invoice}</td>
                        <td className="text-right">₹{tcs.amount.toLocaleString("en-IN")}</td>
                        <td className="text-right font-medium text-warning">₹{tcs.tcsAmount.toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                {tcsData.length > 0 && (
                  <tfoot>
                    <tr className="bg-muted/50 font-semibold">
                      <td colSpan={5}>Total TCS/TDS</td>
                      <td className="text-right text-warning">₹{tcsData.reduce((sum, t) => sum + t.tcsAmount, 0).toLocaleString("en-IN")}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
