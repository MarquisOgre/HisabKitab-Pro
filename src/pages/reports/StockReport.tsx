// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Printer, Download, ClipboardList, Search, Filter, Package, TrendingUp, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRangeFilter, getDefaultDateRange, filterByDateRange, DateRange } from "@/components/DateRangeFilter";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";

interface StockItem {
  id: string;
  name: string;
  unit: string;
  category: string;
  hsn: string;
  openingQty: number;
  openingAvgPrice: number;
  openingAmt: number;
  purchaseQty: number;
  purchaseAvgPrice: number;
  purchaseAmt: number;
  closingQty: number;
  closingPrice: number;
  saleQty: number;
  saleAvgPrice: number;
  saleAmt: number;
  purchaseRate: number;
  saleRate: number;
  lowStockAlert: number;
  status: string;
}

interface StockMovement {
  id: string;
  date: string;
  item: string;
  itemId: string;
  type: string;
  qty: number;
  reference: string;
}

const MONTHS = [
  { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
  { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
  { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
];

export default function StockReport() {
  const { selectedBusiness } = useBusinessSelection();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(currentDate.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(currentDate.getFullYear()));
  const [loading, setLoading] = useState(true);
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "in-stock" | "out-of-stock" | "low-stock">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange());
  const [categories, setCategories] = useState<string[]>([]);
  const [movementTypeFilter, setMovementTypeFilter] = useState("all");

  const yearOptions = useMemo(() => {
    const years = [];
    for (let i = 0; i < 5; i++) years.push(String(currentDate.getFullYear() - i));
    return years;
  }, []);

  const fetchStockData = async () => {
    if (!selectedBusiness) return;
    setLoading(true);
    try {
      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);
      const periodStart = new Date(year, month - 1, 1);
      const periodEnd = new Date(year, month, 0);
      const beforePeriodStart = new Date(year, month - 1, 1);

      const { data: items } = await supabase
        .from("items")
        .select("id, name, unit, opening_stock, purchase_price, sale_price, hsn_code, low_stock_alert, category_id, categories (name)")
        .or("is_deleted.is.null,is_deleted.eq.false")
        .eq("business_id", selectedBusiness.id);

      const { data: purchaseInvoices } = await supabase
        .from("purchase_invoices")
        .select("id, invoice_date, invoice_number")
        .or("is_deleted.is.null,is_deleted.eq.false")
        .eq("business_id", selectedBusiness.id);

      const { data: saleInvoices } = await supabase
        .from("sale_invoices")
        .select("id, invoice_date, invoice_number")
        .eq("is_deleted", false)
        .eq("business_id", selectedBusiness.id);

      const purchaseInvoiceIds = purchaseInvoices?.map(i => i.id) || [];
      const saleInvoiceIds = saleInvoices?.map(i => i.id) || [];
      const purchaseInvoiceMap = new Map(purchaseInvoices?.map(inv => [inv.id, inv]) || []);
      const saleInvoiceMap = new Map(saleInvoices?.map(inv => [inv.id, inv]) || []);

      let purchaseItems: any[] = [];
      let saleItems: any[] = [];

      if (purchaseInvoiceIds.length > 0) {
        const { data } = await supabase.from("purchase_invoice_items").select("*").in("purchase_invoice_id", purchaseInvoiceIds);
        purchaseItems = data || [];
      }

      if (saleInvoiceIds.length > 0) {
        const { data } = await supabase.from("sale_invoice_items").select("*").in("sale_invoice_id", saleInvoiceIds);
        saleItems = data || [];
      }

      // Build movements
      const movements: StockMovement[] = [];
      purchaseItems.forEach((item: any) => {
        const invoice = purchaseInvoiceMap.get(item.purchase_invoice_id);
        if (invoice) {
          movements.push({ id: item.id, date: invoice.invoice_date || '', item: item.item_name, itemId: item.item_id || '', type: 'purchase', qty: item.quantity, reference: invoice.invoice_number || '' });
        }
      });
      saleItems.forEach((item: any) => {
        const invoice = saleInvoiceMap.get(item.sale_invoice_id);
        if (invoice) {
          movements.push({ id: item.id, date: invoice.invoice_date || '', item: item.item_name, itemId: item.item_id || '', type: 'sale', qty: item.quantity, reference: invoice.invoice_number || '' });
        }
      });
      movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setStockMovements(movements);

      // Filter invoices by period
      const periodPurchaseIds = new Set(purchaseInvoices?.filter(i => { const d = new Date(i.invoice_date); return d >= periodStart && d <= periodEnd; }).map(i => i.id) || []);
      const periodSaleIds = new Set(saleInvoices?.filter(i => { const d = new Date(i.invoice_date); return d >= periodStart && d <= periodEnd; }).map(i => i.id) || []);
      const beforePurchaseIds = new Set(purchaseInvoices?.filter(i => new Date(i.invoice_date) < beforePeriodStart).map(i => i.id) || []);
      const beforeSaleIds = new Set(saleInvoices?.filter(i => new Date(i.invoice_date) < beforePeriodStart).map(i => i.id) || []);

      const stockItems: StockItem[] = (items || []).map((item: any) => {
        let beforePurchaseQty = 0, beforePurchaseAmt = 0, beforeSaleQty = 0;
        let purchaseQty = 0, purchaseAmt = 0, saleQty = 0, saleAmt = 0;

        purchaseItems.forEach(invItem => {
          if (invItem.item_id === item.id) {
            if (beforePurchaseIds.has(invItem.purchase_invoice_id)) { beforePurchaseQty += Number(invItem.quantity) || 0; beforePurchaseAmt += Number(invItem.total) || 0; }
            else if (periodPurchaseIds.has(invItem.purchase_invoice_id)) { purchaseQty += Number(invItem.quantity) || 0; purchaseAmt += Number(invItem.total) || 0; }
          }
        });
        saleItems.forEach(invItem => {
          if (invItem.item_id === item.id) {
            if (beforeSaleIds.has(invItem.sale_invoice_id)) beforeSaleQty += Number(invItem.quantity) || 0;
            else if (periodSaleIds.has(invItem.sale_invoice_id)) { saleQty += Number(invItem.quantity) || 0; saleAmt += Number(invItem.total) || 0; }
          }
        });

        const openingQty = Math.max(0, (Number(item.opening_stock) || 0) + beforePurchaseQty - beforeSaleQty);
        const openingAvgPrice = openingQty > 0 ? (Number(item.purchase_price) || 0) : 0;
        const purchaseAvgPrice = purchaseQty > 0 ? purchaseAmt / purchaseQty : 0;
        const closingQty = Math.max(0, openingQty + purchaseQty - saleQty);
        const closingPrice = closingQty > 0 ? (purchaseQty > 0 ? purchaseAvgPrice : openingAvgPrice) : 0;
        const saleAvgPrice = saleQty > 0 ? saleAmt / saleQty : 0;
        const lowStockAlert = item.low_stock_alert || 10;
        let status = 'in-stock';
        if (closingQty === 0) status = 'out';
        else if (closingQty < lowStockAlert) status = 'low';

        return {
          id: item.id,
          name: item.name,
          unit: item.unit || "PCS",
          category: (item.categories as any)?.name || 'Uncategorized',
          hsn: item.hsn_code || '-',
          openingQty,
          openingAvgPrice,
          openingAmt: openingQty * openingAvgPrice,
          purchaseQty,
          purchaseAvgPrice,
          purchaseAmt,
          closingQty,
          closingPrice,
          saleQty,
          saleAvgPrice,
          saleAmt,
          purchaseRate: Number(item.purchase_price || 0),
          saleRate: Number(item.sale_price || 0),
          lowStockAlert,
          status,
        };
      });

      setStockData(stockItems);
      setCategories([...new Set(stockItems.map(i => i.category))]);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      toast.error("Failed to fetch stock data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (selectedBusiness) fetchStockData(); }, [selectedMonth, selectedYear, selectedBusiness]);

  const formatNumber = (num: number, decimals = 2) => num.toFixed(decimals);

  const filteredStockData = useMemo(() => {
    return stockData.filter((item) => {
      const matchesSearch = searchQuery === "" || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.hsn.includes(searchQuery);
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      let matchesFilter = true;
      if (filterType === "in-stock") matchesFilter = item.closingQty > 0;
      else if (filterType === "out-of-stock") matchesFilter = item.closingQty <= 0;
      else if (filterType === "low-stock") matchesFilter = item.closingQty > 0 && item.closingQty <= item.lowStockAlert;
      return matchesSearch && matchesFilter && matchesCategory;
    });
  }, [stockData, searchQuery, filterType, categoryFilter]);

  const filteredMovementsByDate = filterByDateRange(stockMovements, dateRange, "date");
  const filteredMovements = filteredMovementsByDate.filter((m) => {
    const matchesSearch = m.item.toLowerCase().includes(searchQuery.toLowerCase()) || m.reference.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = movementTypeFilter === "all" || m.type === movementTypeFilter;
    return matchesSearch && matchesType;
  });

  const totals = useMemo(() => filteredStockData.reduce((acc, item) => ({
    openingQty: acc.openingQty + item.openingQty, openingAmt: acc.openingAmt + item.openingAmt,
    purchaseQty: acc.purchaseQty + item.purchaseQty, purchaseAmt: acc.purchaseAmt + item.purchaseAmt,
    closingQty: acc.closingQty + item.closingQty, saleQty: acc.saleQty + item.saleQty, saleAmt: acc.saleAmt + item.saleAmt,
  }), { openingQty: 0, openingAmt: 0, purchaseQty: 0, purchaseAmt: 0, closingQty: 0, saleQty: 0, saleAmt: 0 }), [filteredStockData]);

  const totalItems = stockData.length;
  const totalValue = stockData.reduce((sum, s) => sum + (s.closingQty * s.purchaseRate), 0);
  const lowStockItems = stockData.filter(s => s.status === "low").length;
  const outOfStock = stockData.filter(s => s.status === "out").length;
  const totalIn = filteredMovements.filter(m => m.type === "purchase").reduce((sum, m) => sum + m.qty, 0);
  const totalOut = filteredMovements.filter(m => m.type === "sale").reduce((sum, m) => sum + m.qty, 0);

  const getStatusBadge = (status: string) => {
    switch (status) { case "in-stock": return "bg-success/10 text-success"; case "low": return "bg-warning/10 text-warning"; case "out": return "bg-destructive/10 text-destructive"; default: return ""; }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("stock-table");
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const monthName = MONTHS.find(m => m.value === selectedMonth)?.label;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Stock Report - ${monthName} ${selectedYear}</title><style>body { font-family: Arial, sans-serif; padding: 20px; } h1 { text-align: center; } table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; } th, td { border: 1px solid #ddd; padding: 6px; text-align: right; } th { background-color: #f5f5f5; } td:nth-child(1), td:nth-child(2), td:nth-child(3) { text-align: left; } th:nth-child(1), th:nth-child(2), th:nth-child(3) { text-align: left; } @media print { body { -webkit-print-color-adjust: exact; } }</style></head><body><h1>Stock Report - ${monthName} ${selectedYear}</h1>${printContent.outerHTML}</body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleExport = () => {
    const monthName = MONTHS.find(m => m.value === selectedMonth)?.label;
    const headers = ["Item", "Category", "HSN", "Unit", "Opening Qty", "Opening Amt", "Purchase Qty", "Purchase Amt", "Sale Qty", "Sale Amt", "Closing Qty", "Status"];
    const rows = filteredStockData.map(item => [item.name, item.category, item.hsn, item.unit, item.openingQty, item.openingAmt.toFixed(2), item.purchaseQty, item.purchaseAmt.toFixed(2), item.saleQty, item.saleAmt.toFixed(2), item.closingQty, item.status]);
    const csvContent = [`Stock Report - ${monthName} ${selectedYear}`, "", headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stock_report_${monthName}_${selectedYear}.csv`;
    link.click();
    toast.success("Report exported successfully");
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><ClipboardList className="h-5 sm:h-6 w-5 sm:w-6" />Stock Report</h1>
          <p className="text-muted-foreground text-sm">Comprehensive stock register, summary & movements</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[100px] sm:w-[130px]"><SelectValue placeholder="Month" /></SelectTrigger>
            <SelectContent>{MONTHS.map(month => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[70px] sm:w-[90px]"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>{yearOptions.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex"><Printer className="h-4 w-4 mr-2" />Print</Button>
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Export</span></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Items</p>
            <Package className="w-4 h-4 text-primary flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2">{totalItems}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Stock Value</p>
            <TrendingUp className="w-4 h-4 text-success flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 truncate">₹{totalValue.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Low Stock</p>
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 text-warning">{lowStockItems}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">Out of Stock</p>
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold mt-2 text-destructive">{outOfStock}</p>
        </div>
      </div>

      <Tabs defaultValue="register" className="space-y-4">
        <TabsList className="w-full overflow-x-auto flex-nowrap">
          <TabsTrigger value="register" className="text-xs sm:text-sm">Register</TabsTrigger>
          <TabsTrigger value="summary" className="text-xs sm:text-sm">Summary</TabsTrigger>
          <TabsTrigger value="movements" className="text-xs sm:text-sm">Movements</TabsTrigger>
          <TabsTrigger value="items" className="text-xs sm:text-sm">Details</TabsTrigger>
        </TabsList>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[150px]"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <Filter className="h-4 w-4 mr-2" /><SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              <SelectItem value="low-stock">Low Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="register">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Stock Register - {MONTHS.find(m => m.value === selectedMonth)?.label} {selectedYear}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Opening Qty + Purchase Qty - Sale Qty = Closing Qty</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 overflow-x-auto">
              <div className="min-w-[900px]">
                <Table id="stock-table">
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-12 text-center">Sl.No</TableHead>
                      <TableHead className="min-w-[150px]">Item</TableHead>
                      <TableHead className="w-16 text-center">Unit</TableHead>
                      <TableHead colSpan={3} className="text-center bg-blue-50 dark:bg-blue-950">Opening</TableHead>
                      <TableHead colSpan={3} className="text-center bg-green-50 dark:bg-green-950">Purchase</TableHead>
                      <TableHead colSpan={3} className="text-center bg-orange-50 dark:bg-orange-950">Sale</TableHead>
                      <TableHead colSpan={2} className="text-center bg-purple-50 dark:bg-purple-950">Closing</TableHead>
                    </TableRow>
                    <TableRow className="bg-muted/30">
                      <TableHead></TableHead><TableHead></TableHead><TableHead></TableHead>
                      <TableHead className="text-right text-xs bg-blue-50 dark:bg-blue-950">Qty</TableHead>
                      <TableHead className="text-right text-xs bg-blue-50 dark:bg-blue-950">Price</TableHead>
                      <TableHead className="text-right text-xs bg-blue-50 dark:bg-blue-950">Amt</TableHead>
                      <TableHead className="text-right text-xs bg-green-50 dark:bg-green-950">Qty</TableHead>
                      <TableHead className="text-right text-xs bg-green-50 dark:bg-green-950">Price</TableHead>
                      <TableHead className="text-right text-xs bg-green-50 dark:bg-green-950">Amt</TableHead>
                      <TableHead className="text-right text-xs bg-orange-50 dark:bg-orange-950">Qty</TableHead>
                      <TableHead className="text-right text-xs bg-orange-50 dark:bg-orange-950">Price</TableHead>
                      <TableHead className="text-right text-xs bg-orange-50 dark:bg-orange-950">Amt</TableHead>
                      <TableHead className="text-right text-xs bg-purple-50 dark:bg-purple-950">Qty</TableHead>
                      <TableHead className="text-right text-xs bg-purple-50 dark:bg-purple-950">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStockData.length === 0 ? <TableRow><TableCell colSpan={14} className="text-center py-8 text-muted-foreground">No items found</TableCell></TableRow> :
                      filteredStockData.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-center text-muted-foreground">{item.unit}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.openingQty)}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.openingAvgPrice)}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.openingAmt)}</TableCell>
                          <TableCell className="text-right text-success">{formatNumber(item.purchaseQty)}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.purchaseAvgPrice)}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.purchaseAmt)}</TableCell>
                          <TableCell className="text-right text-destructive">{formatNumber(item.saleQty)}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.saleAvgPrice)}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.saleAmt)}</TableCell>
                          <TableCell className="text-right font-medium">{formatNumber(item.closingQty)}</TableCell>
                          <TableCell className="text-right">{formatNumber(item.closingPrice)}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                  {filteredStockData.length > 0 && <tfoot><TableRow className="bg-muted/50 font-semibold"><TableCell colSpan={3}>Total</TableCell><TableCell className="text-right">{formatNumber(totals.openingQty)}</TableCell><TableCell></TableCell><TableCell className="text-right">{formatNumber(totals.openingAmt)}</TableCell><TableCell className="text-right text-success">{formatNumber(totals.purchaseQty)}</TableCell><TableCell></TableCell><TableCell className="text-right">{formatNumber(totals.purchaseAmt)}</TableCell><TableCell className="text-right text-destructive">{formatNumber(totals.saleQty)}</TableCell><TableCell></TableCell><TableCell className="text-right">{formatNumber(totals.saleAmt)}</TableCell><TableCell className="text-right font-bold">{formatNumber(totals.closingQty)}</TableCell><TableCell></TableCell></TableRow></tfoot>}
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <div className="metric-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="data-table min-w-[700px]">
                <thead><tr><th>Item Name</th><th>Category</th><th className="text-center">Current Stock</th><th className="text-right">Purchase Price</th><th className="text-center">Min Stock</th><th className="text-right">Stock Value</th><th>Status</th></tr></thead>
                <tbody>{filteredStockData.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No items found</td></tr> : filteredStockData.map((item) => (<tr key={item.id}><td className="font-medium">{item.name}</td><td className="text-muted-foreground">{item.category}</td><td className="text-center">{item.closingQty}</td><td className="text-right">₹{item.purchaseRate.toLocaleString()}</td><td className="text-center text-muted-foreground">{item.lowStockAlert}</td><td className="text-right font-medium">₹{(item.closingQty * item.purchaseRate).toLocaleString()}</td><td><span className={cn("px-2 py-1 text-xs font-medium rounded-full capitalize", getStatusBadge(item.status))}>{item.status === "in-stock" ? "In Stock" : item.status === "low" ? "Low Stock" : "Out of Stock"}</span></td></tr>))}</tbody>
                {filteredStockData.length > 0 && <tfoot><tr className="bg-muted/50 font-semibold"><td colSpan={2}>Total</td><td className="text-center font-bold">{filteredStockData.reduce((sum, s) => sum + s.closingQty, 0)}</td><td></td><td></td><td className="text-right">₹{filteredStockData.reduce((sum, s) => sum + (s.closingQty * s.purchaseRate), 0).toLocaleString()}</td><td></td></tr></tfoot>}
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="movements">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch sm:items-center mb-4">
            <Select value={movementTypeFilter} onValueChange={setMovementTypeFilter}>
              <SelectTrigger className="w-full sm:w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="purchase">Stock In</SelectItem>
                <SelectItem value="sale">Stock Out</SelectItem>
              </SelectContent>
            </Select>
            <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4">
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Stock In</p>
                <ArrowUpCircle className="w-4 h-4 text-success" />
              </div>
              <p className="text-lg sm:text-2xl font-bold mt-2 text-success">{totalIn} units</p>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-muted-foreground">Total Stock Out</p>
                <ArrowDownCircle className="w-4 h-4 text-destructive" />
              </div>
              <p className="text-lg sm:text-2xl font-bold mt-2 text-destructive">{totalOut} units</p>
            </div>
            <div className="metric-card">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-muted-foreground">Net Movement</p>
                <Package className="w-4 h-4 text-primary" />
              </div>
              <p className="text-lg sm:text-2xl font-bold mt-2 text-primary">{totalIn - totalOut} units</p>
            </div>
          </div>
          <div className="metric-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="data-table min-w-[500px]">
                <thead><tr><th>Date</th><th>Item</th><th>Type</th><th>Reference</th><th className="text-center">Quantity</th></tr></thead>
                <tbody>{filteredMovements.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No movements found</td></tr> : filteredMovements.map((m) => (<tr key={m.id}><td className="text-muted-foreground">{m.date ? format(new Date(m.date), 'dd MMM yyyy') : '-'}</td><td className="font-medium">{m.item}</td><td><span className={cn("inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full", m.type === "purchase" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>{m.type === "purchase" ? <ArrowUpCircle className="w-3 h-3" /> : <ArrowDownCircle className="w-3 h-3" />}{m.type === "purchase" ? "In" : "Out"}</span></td><td className="font-medium">{m.reference}</td><td className={cn("text-center font-medium", m.type === "purchase" ? "text-success" : "text-destructive")}>{m.type === "purchase" ? "+" : "-"}{m.qty}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="items">
          <div className="metric-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="data-table min-w-[600px]">
                <thead><tr><th>Item Name</th><th>HSN</th><th>Category</th><th className="text-center">Stock</th><th className="text-right">Purchase Rate</th><th className="text-right">Sale Rate</th><th className="text-right">Margin</th></tr></thead>
                <tbody>{filteredStockData.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No items found</td></tr> : filteredStockData.map((item) => { const margin = item.purchaseRate > 0 ? ((item.saleRate - item.purchaseRate) / item.purchaseRate * 100).toFixed(1) : '0.0'; return (<tr key={item.id}><td className="font-medium">{item.name}</td><td className="text-muted-foreground">{item.hsn}</td><td>{item.category}</td><td className="text-center">{item.closingQty}</td><td className="text-right">₹{item.purchaseRate.toLocaleString()}</td><td className="text-right">₹{item.saleRate.toLocaleString()}</td><td className="text-right text-success">{margin}%</td></tr>); })}</tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
