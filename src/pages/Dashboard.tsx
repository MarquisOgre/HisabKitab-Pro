import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { LowStockAlerts } from "@/components/dashboard/LowStockAlerts";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PullToRefreshIndicator } from "@/components/PullToRefreshIndicator";
import { toast } from "sonner";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Dashboard() {
  const { loading, metrics, quickStats, transactions, lowStockItems, monthlyData, refetch } = useDashboardData();
  const isMobile = useIsMobile();

  const handleRefresh = async () => {
    if (refetch) {
      await refetch();
      toast.success("Dashboard refreshed!");
    }
  };

  const { pullDistance, isRefreshing, progress } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  if (loading) {
    return (
      <div className="space-y-4 md:space-y-6 pt-12 md:pt-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
          {!isMobile && (
            <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 md:h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <Skeleton className="lg:col-span-2 h-64 md:h-96 rounded-xl" />
          <Skeleton className="h-64 md:h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Pull to refresh indicator for mobile */}
      {isMobile && (
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          progress={progress}
        />
      )}
      <div className="space-y-4 md:space-y-6 pt-12 md:pt-0">
        {/* Page Header */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
          {!isMobile && (
            <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
          )}
        </div>

      {/* Metrics Grid - 2 columns on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard
          title="Total Sales"
          value={formatCurrency(metrics.totalSales)}
          change={metrics.salesChange !== 0 
            ? `${metrics.salesChange > 0 ? '+' : ''}${metrics.salesChange.toFixed(1)}% from last month` 
            : metrics.salesCountThisMonth > 0 
              ? `${metrics.salesCountThisMonth} invoice${metrics.salesCountThisMonth > 1 ? 's' : ''} this month`
              : 'No sales this month'}
          changeType={metrics.salesChange > 0 ? "positive" : metrics.salesChange < 0 ? "negative" : metrics.salesCountThisMonth > 0 ? "positive" : "neutral"}
          icon={TrendingUp}
          iconColor="text-success"
        />
        <MetricCard
          title="Total Purchase"
          value={formatCurrency(metrics.totalPurchase)}
          change={metrics.purchaseChange !== 0 
            ? `${metrics.purchaseChange > 0 ? '+' : ''}${metrics.purchaseChange.toFixed(1)}% from last month` 
            : metrics.purchaseCountThisMonth > 0 
              ? `${metrics.purchaseCountThisMonth} invoice${metrics.purchaseCountThisMonth > 1 ? 's' : ''} this month`
              : 'No purchases this month'}
          changeType={metrics.purchaseChange > 0 ? "negative" : metrics.purchaseChange < 0 ? "positive" : metrics.purchaseCountThisMonth > 0 ? "positive" : "neutral"}
          icon={ShoppingCart}
          iconColor="text-warning"
        />
        <MetricCard
          title="Total Parties"
          value={metrics.totalParties.toString()}
          change={`${metrics.partiesThisMonth} added this month`}
          changeType="neutral"
          icon={Users}
          iconColor="text-primary"
        />
        <MetricCard
          title="Stock Value"
          value={formatCurrency(metrics.stockValue)}
          change={`${metrics.itemCount} items`}
          changeType="neutral"
          icon={Package}
          iconColor="text-accent"
        />
      </div>

      {/* Charts and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <SalesChart data={monthlyData} />
        </div>
        <div>
          <QuickStats data={quickStats} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <RecentTransactions transactions={transactions} />
        <LowStockAlerts items={lowStockItems} />
      </div>
      </div>
    </>
  );
}
