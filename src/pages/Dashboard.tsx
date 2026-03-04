import { motion } from "framer-motion";
import {
  ShoppingCart,
  Package,
  Wallet,
  IndianRupee,
  Landmark,
  AlertCircle,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import SalesChart from "@/components/dashboard/SalesChart";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import QuickActions from "@/components/dashboard/QuickActions";

const stats = [
  { title: "Total Sales Today", value: "₹48,520", icon: ShoppingCart, trend: "12% vs yesterday", trendUp: true, color: "#1565C0" },
  { title: "Total Purchases", value: "₹22,300", icon: Package, trend: "8% vs yesterday", trendUp: false, color: "#E65100" },
  { title: "Total Expenses", value: "₹5,840", icon: Wallet, trend: "3% vs yesterday", trendUp: true, color: "#C62828" },
  { title: "Cash Balance", value: "₹1,24,500", icon: IndianRupee, color: "#2E7D32" },
  { title: "Bank Balance", value: "₹3,85,200", icon: Landmark, color: "#6A1B9A" },
  { title: "Outstanding", value: "₹67,800", icon: AlertCircle, color: "#F57F17" },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Charts + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <QuickStatItem label="Top Product" value="Basmati Rice 25kg" sub="142 units sold" />
            <QuickStatItem label="Best Customer" value="Rajesh Traders" sub="₹2,45,000 total" />
            <QuickStatItem label="Pending Payments" value="12 invoices" sub="₹67,800 total" />
            <QuickStatItem label="Low Stock Items" value="8 products" sub="Reorder needed" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Recent Transactions */}
      <RecentTransactions />
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
