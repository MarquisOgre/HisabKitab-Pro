import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessSelection } from '@/contexts/BusinessSelectionContext';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface DashboardMetrics {
  totalSales: number;
  totalPurchase: number;
  totalParties: number;
  stockValue: number;
  itemCount: number;
  partiesThisMonth: number;
  salesChange: number;
  purchaseChange: number;
  salesThisMonth: number;
  purchaseThisMonth: number;
}

interface QuickStatsData {
  totalReceivables: number;
  receivablesParties: number;
  totalPayables: number;
  payablesParties: number;
  overdueAmount: number;
  overdueCount: number;
  paidThisMonth: number;
  paidCount: number;
}

interface Transaction {
  id: string;
  type: 'sale' | 'purchase';
  party: string;
  amount: number;
  date: string;
  invoice: string;
}

interface LowStockItem {
  name: string;
  stock: number;
  minStock: number;
}

interface MonthlyData {
  name: string;
  sales: number;
  purchase: number;
}

export function useDashboardData() {
  const { user } = useAuth();
  const { selectedBusiness } = useBusinessSelection();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSales: 0,
    totalPurchase: 0,
    totalParties: 0,
    stockValue: 0,
    itemCount: 0,
    partiesThisMonth: 0,
    salesChange: 0,
    purchaseChange: 0,
  });
  const [quickStats, setQuickStats] = useState<QuickStatsData>({
    totalReceivables: 0,
    receivablesParties: 0,
    totalPayables: 0,
    payablesParties: 0,
    overdueAmount: 0,
    overdueCount: 0,
    paidThisMonth: 0,
    paidCount: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    if (user && selectedBusiness) {
      fetchDashboardData();
    }
  }, [user, selectedBusiness]);

  const fetchDashboardData = async () => {
    if (!user || !selectedBusiness) return;
    setLoading(true);

    try {
      await Promise.all([
        fetchMetrics(),
        fetchQuickStats(),
        fetchRecentTransactions(),
        fetchLowStockItems(),
        fetchMonthlyChartData(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Fetch sale invoices
    const { data: saleInvoicesData } = await supabase
      .from('sale_invoices')
      .select('invoice_type, total_amount, created_at')
      .eq('is_deleted', false)
      .eq('business_id', selectedBusiness.id);

    // Fetch purchase invoices
    const { data: purchaseInvoicesData } = await supabase
      .from('purchase_invoices')
      .select('invoice_type, total_amount, created_at')
      .eq('is_deleted', false)
      .eq('business_id', selectedBusiness.id);

    // Calculate totals
    let totalSales = 0;
    let totalPurchase = 0;
    let salesThisMonth = 0;
    let salesLastMonth = 0;
    let purchaseThisMonth = 0;
    let purchaseLastMonth = 0;

    saleInvoicesData?.forEach(inv => {
      const amount = Number(inv.total_amount) || 0;
      const createdAt = new Date(inv.created_at);
      
      if (inv.invoice_type === 'sale' || inv.invoice_type === 'sale_invoice') {
        totalSales += amount;
        if (createdAt >= thisMonthStart) salesThisMonth += amount;
        if (createdAt >= lastMonthStart && createdAt <= lastMonthEnd) salesLastMonth += amount;
      }
    });

    purchaseInvoicesData?.forEach(inv => {
      const amount = Number(inv.total_amount) || 0;
      const createdAt = new Date(inv.created_at);
      
      if (inv.invoice_type === 'purchase' || inv.invoice_type === 'purchase_bill' || inv.invoice_type === 'purchase_invoice') {
        totalPurchase += amount;
        if (createdAt >= thisMonthStart) purchaseThisMonth += amount;
        if (createdAt >= lastMonthStart && createdAt <= lastMonthEnd) purchaseLastMonth += amount;
      }
    });

    // Calculate percentage changes
    const salesChange = salesLastMonth > 0 
      ? ((salesThisMonth - salesLastMonth) / salesLastMonth) * 100 
      : 0;
    const purchaseChange = purchaseLastMonth > 0 
      ? ((purchaseThisMonth - purchaseLastMonth) / purchaseLastMonth) * 100 
      : 0;

    // Fetch parties count
    const { count: partiesCount } = await supabase
      .from('parties')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', selectedBusiness.id);

    const { count: partiesThisMonth } = await supabase
      .from('parties')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', selectedBusiness.id)
      .gte('created_at', thisMonthStart.toISOString());

  // Fetch items for stock value - calculate based on opening stock + purchases - sales
    const { data: items } = await supabase
      .from('items')
      .select('id, opening_stock, purchase_price')
      .or('is_deleted.is.null,is_deleted.eq.false')
      .eq('business_id', selectedBusiness.id);

    // Fetch all purchase invoice items - only from non-deleted invoices
    const { data: purchaseItems } = await supabase
      .from('purchase_invoice_items')
      .select('item_id, quantity, purchase_invoices!inner(is_deleted)')
      .eq('purchase_invoices.is_deleted', false)
      .eq('business_id', selectedBusiness.id);

    // Fetch all sale invoice items - only from non-deleted invoices
    const { data: saleItems } = await supabase
      .from('sale_invoice_items')
      .select('item_id, quantity, sale_invoices!inner(is_deleted)')
      .eq('sale_invoices.is_deleted', false)
      .eq('business_id', selectedBusiness.id);

    // Create lookup maps for purchased and sold quantities
    const purchasedQty: Record<string, number> = {};
    const soldQty: Record<string, number> = {};

    purchaseItems?.forEach((item: any) => {
      if (item.item_id) {
        purchasedQty[item.item_id] = (purchasedQty[item.item_id] || 0) + (Number(item.quantity) || 0);
      }
    });

    saleItems?.forEach((item: any) => {
      if (item.item_id) {
        soldQty[item.item_id] = (soldQty[item.item_id] || 0) + (Number(item.quantity) || 0);
      }
    });

    let stockValue = 0;
    items?.forEach(item => {
      const openingStock = Number(item.opening_stock) || 0;
      const purchased = purchasedQty[item.id] || 0;
      const sold = soldQty[item.id] || 0;
      const currentStock = Math.max(0, openingStock + purchased - sold);
      stockValue += currentStock * (Number(item.purchase_price) || 0);
    });

    setMetrics({
      totalSales,
      totalPurchase,
      totalParties: partiesCount || 0,
      stockValue,
      itemCount: items?.length || 0,
      partiesThisMonth: partiesThisMonth || 0,
      salesChange,
      purchaseChange,
    });
  };

  const fetchQuickStats = async () => {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);

    // Fetch unpaid sale invoices (receivables)
    const { data: saleInvoicesReceivables } = await supabase
      .from('sale_invoices')
      .select('balance_due, party_id')
      .in('invoice_type', ['sale', 'sale_invoice'])
      .gt('balance_due', 0)
      .eq('is_deleted', false)
      .eq('business_id', selectedBusiness.id);

    const receivablesPartyIds = new Set(saleInvoicesReceivables?.map(i => i.party_id).filter(Boolean));
    const totalReceivables = saleInvoicesReceivables?.reduce((sum, inv) => sum + (Number(inv.balance_due) || 0), 0) || 0;

    // Fetch unpaid purchase invoices (payables)
    const { data: purchaseInvoicesPayables } = await supabase
      .from('purchase_invoices')
      .select('balance_due, party_id')
      .in('invoice_type', ['purchase', 'purchase_bill', 'purchase_invoice'])
      .gt('balance_due', 0)
      .eq('is_deleted', false)
      .eq('business_id', selectedBusiness.id);

    const payablesPartyIds = new Set(purchaseInvoicesPayables?.map(i => i.party_id).filter(Boolean));
    const totalPayables = purchaseInvoicesPayables?.reduce((sum, inv) => sum + (Number(inv.balance_due) || 0), 0) || 0;

    // Fetch overdue invoices from both tables
    const { data: overdueSaleInvoices } = await supabase
      .from('sale_invoices')
      .select('balance_due')
      .lt('due_date', now.toISOString().split('T')[0])
      .gt('balance_due', 0)
      .eq('is_deleted', false)
      .eq('business_id', selectedBusiness.id);

    const { data: overduePurchaseInvoices } = await supabase
      .from('purchase_invoices')
      .select('balance_due')
      .lt('due_date', now.toISOString().split('T')[0])
      .gt('balance_due', 0)
      .eq('is_deleted', false)
      .eq('business_id', selectedBusiness.id);

    const overdueAmount = 
      (overdueSaleInvoices?.reduce((sum, inv) => sum + (Number(inv.balance_due) || 0), 0) || 0) +
      (overduePurchaseInvoices?.reduce((sum, inv) => sum + (Number(inv.balance_due) || 0), 0) || 0);
    const overdueCount = (overdueSaleInvoices?.length || 0) + (overduePurchaseInvoices?.length || 0);

    // Fetch payments this month
    const { data: paymentsThisMonth } = await supabase
      .from('payments')
      .select('amount')
      .eq('business_id', selectedBusiness.id)
      .gte('payment_date', thisMonthStart.toISOString().split('T')[0]);

    const paidThisMonth = paymentsThisMonth?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

    setQuickStats({
      totalReceivables,
      receivablesParties: receivablesPartyIds.size,
      totalPayables,
      payablesParties: payablesPartyIds.size,
      overdueAmount,
      overdueCount,
      paidThisMonth,
      paidCount: paymentsThisMonth?.length || 0,
    });
  };

  const fetchRecentTransactions = async () => {
    // Fetch from both tables and combine
    const { data: saleInvoicesRecent } = await supabase
      .from('sale_invoices')
      .select(`
        id,
        invoice_type,
        total_amount,
        invoice_number,
        created_at,
        party_id,
        parties(name)
      `)
      .eq('is_deleted', false)
      .eq('business_id', selectedBusiness.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: purchaseInvoicesRecent } = await supabase
      .from('purchase_invoices')
      .select(`
        id,
        invoice_type,
        total_amount,
        invoice_number,
        created_at,
        party_id,
        parties(name)
      `)
      .eq('is_deleted', false)
      .eq('business_id', selectedBusiness.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Combine and sort by created_at
    const allInvoices = [
      ...(saleInvoicesRecent || []),
      ...(purchaseInvoicesRecent || []),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
     .slice(0, 5);

    const formattedTransactions: Transaction[] = allInvoices.map(inv => ({
      id: inv.id,
      type: (inv.invoice_type === 'sale' || inv.invoice_type === 'sale_invoice') ? 'sale' : 'purchase',
      party: (inv.parties as any)?.name || 'Unknown Party',
      amount: Number(inv.total_amount) || 0,
      date: formatRelativeDate(new Date(inv.created_at)),
      invoice: inv.invoice_number,
    }));

    setTransactions(formattedTransactions);
  };

  const fetchLowStockItems = async () => {
    const { data: items } = await supabase
      .from('items')
      .select('name, current_stock, low_stock_alert')
      .or('is_deleted.is.null,is_deleted.eq.false')
      .eq('business_id', selectedBusiness!.id)
      .order('current_stock', { ascending: true })
      .limit(10);

    const lowStock: LowStockItem[] = (items || [])
      .filter(item => Math.max(0, Number(item.current_stock) || 0) <= (Number(item.low_stock_alert) || 10))
      .slice(0, 4)
      .map(item => ({
        name: item.name,
        stock: Math.max(0, Number(item.current_stock) || 0),
        minStock: Number(item.low_stock_alert) || 10,
      }));

    setLowStockItems(lowStock);
  };

  const fetchMonthlyChartData = async () => {
    const months: MonthlyData[] = [];
    const now = new Date();

    for (let i = 8; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthName = format(monthDate, 'MMM');

      // Fetch from both tables
      const { data: saleInvoicesMonth } = await supabase
        .from('sale_invoices')
        .select('invoice_type, total_amount')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .eq('is_deleted', false)
        .eq('business_id', selectedBusiness!.id);

      const { data: purchaseInvoicesMonth } = await supabase
        .from('purchase_invoices')
        .select('invoice_type, total_amount')
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString())
        .eq('is_deleted', false)
        .eq('business_id', selectedBusiness!.id);

      let sales = 0;
      let purchase = 0;

      saleInvoicesMonth?.forEach(inv => {
        const amount = Number(inv.total_amount) || 0;
        if (inv.invoice_type === 'sale' || inv.invoice_type === 'sale_invoice') {
          sales += amount;
        }
      });

      purchaseInvoicesMonth?.forEach(inv => {
        const amount = Number(inv.total_amount) || 0;
        if (inv.invoice_type === 'purchase' || inv.invoice_type === 'purchase_bill' || inv.invoice_type === 'purchase_invoice') {
          purchase += amount;
        }
      });

      months.push({ name: monthName, sales, purchase });
    }

    setMonthlyData(months);
  };

  const formatRelativeDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffDays} days ago`;
    }
  };

  return {
    loading,
    metrics,
    quickStats,
    transactions,
    lowStockItems,
    monthlyData,
    refetch: fetchDashboardData,
  };
}
