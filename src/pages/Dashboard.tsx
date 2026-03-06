import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart, Package, Wallet, IndianRupee, Landmark, AlertCircle,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import SalesChart from "@/components/dashboard/SalesChart";
import QuickActions from "@/components/dashboard/QuickActions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0, totalPurchases: 0, totalExpenses: 0,
    cashBalance: 0, bankBalance: 0, outstanding: 0,
    lowStockCount: 0, customerCount: 0, supplierCount: 0,
    recentInvoices: [] as any[],
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const today = new Date().toISOString().split("T")[0];
      const [salesRes, purchasesRes, expensesRes, profileRes, bankRes, customersRes, suppliersRes, productsRes, recentRes] = await Promise.all([
        supabase.from("invoices").select("total").eq("invoice_type", "sales"),
        supabase.from("purchases").select("total"),
        supabase.from("expenses").select("amount"),
        supabase.from("profiles").select("cash_in_hand").eq("id", user.id).single(),
        supabase.from("bank_accounts").select("balance"),
        supabase.from("customers").select("id, balance"),
        supabase.from("suppliers").select("id"),
        supabase.from("products").select("id, current_stock, low_stock_alert").eq("is_deleted", false),
        supabase.from("invoices").select("*, customers(name)").eq("invoice_type", "sales").order("created_at", { ascending: false }).limit(5),
      ]);

      const totalSales = (salesRes.data || []).reduce((s, i) => s + Number(i.total || 0), 0);
      const totalPurchases = (purchasesRes.data || []).reduce((s, i) => s + Number(i.total || 0), 0);
      const totalExpenses = (expensesRes.data || []).reduce((s, i) => s + Number(i.amount || 0), 0);
      const cashBalance = Number(profileRes.data?.cash_in_hand || 0);
      const bankBalance = (bankRes.data || []).reduce((s, b) => s + Number(b.balance || 0), 0);
      const outstanding = (customersRes.data || []).reduce((s, c) => s + Number(c.balance || 0), 0);
      const lowStockCount = (productsRes.data || []).filter(p => p.current_stock <= (p.low_stock_alert || 10)).length;

      setStats({
        totalSales, totalPurchases, totalExpenses,
        cashBalance, bankBalance, outstanding, lowStockCount,
        customerCount: customersRes.data?.length || 0,
        supplierCount: suppliersRes.data?.length || 0,
        recentInvoices: recentRes.data || [],
      });
    };
    load();
  }, [user]);

  const statCards = [
    { title: "Total Sales", value: `₹${stats.totalSales.toLocaleString()}`, icon: ShoppingCart, color: "#059669" },
    { title: "Total Purchases", value: `₹${stats.totalPurchases.toLocaleString()}`, icon: Package, color: "#d97706" },
    { title: "Total Expenses", value: `₹${stats.totalExpenses.toLocaleString()}`, icon: Wallet, color: "#dc2626" },
    { title: "Cash Balance", value: `₹${stats.cashBalance.toLocaleString()}`, icon: IndianRupee, color: "#2563eb" },
    { title: "Bank Balance", value: `₹${stats.bankBalance.toLocaleString()}`, icon: Landmark, color: "#7c3aed" },
    { title: "Outstanding", value: `₹${stats.outstanding.toLocaleString()}`, icon: AlertCircle, color: "#ea580c" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's your business overview.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <QuickStatItem label="Total Customers" value={String(stats.customerCount)} sub="Active accounts" />
            <QuickStatItem label="Total Suppliers" value={String(stats.supplierCount)} sub="Active vendors" />
            <QuickStatItem label="Low Stock Items" value={`${stats.lowStockCount} products`} sub="Reorder needed" />
            <QuickStatItem label="Net Profit" value={`₹${(stats.totalSales - stats.totalPurchases - stats.totalExpenses).toLocaleString()}`} sub="Sales - Purchases - Expenses" />
          </div>
        </div>
      </div>

      <QuickActions />

      {/* Recent Transactions */}
      <div className="stat-card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">Recent Sales Invoices</h3>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-secondary/50">
            <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Invoice #</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Customer</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Date</th>
            <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Amount</th>
            <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
          </tr></thead>
          <tbody>
            {stats.recentInvoices.map(inv => (
              <tr key={inv.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="px-5 py-3 font-medium">{inv.invoice_number}</td>
                <td className="px-5 py-3 text-muted-foreground">{inv.customers?.name || "-"}</td>
                <td className="px-5 py-3 text-muted-foreground">{inv.invoice_date}</td>
                <td className="px-5 py-3 text-right font-semibold">₹{Number(inv.total).toLocaleString()}</td>
                <td className="px-5 py-3 text-center text-xs capitalize">{inv.status}</td>
              </tr>
            ))}
            {stats.recentInvoices.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No invoices yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function QuickStatItem({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="p-3 rounded-lg bg-secondary/50 border border-border/30">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
