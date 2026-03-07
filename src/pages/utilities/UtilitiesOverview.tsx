import { Link } from "react-router-dom";
import {
  Upload,
  RefreshCw,
  Trash2,
  FileSpreadsheet,
  Download,
  Database,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const utilities = [
  {
    title: "Import Items",
    description: "Import items from Excel or CSV file",
    icon: Upload,
    href: "/utilities/import",
    color: "text-primary bg-primary/10",
  },
  {
    title: "Update Items in Bulk",
    description: "Update prices, stock, or other details in bulk",
    icon: RefreshCw,
    href: "/utilities/bulk-update",
    color: "text-accent bg-accent/10",
  },
  {
    title: "Export Data",
    description: "Export your data to Excel or CSV",
    icon: Download,
    href: "/backup/download",
    color: "text-success bg-success/10",
  },
  {
    title: "Recycle Bin",
    description: "Recover deleted items, invoices, and parties",
    icon: Trash2,
    href: "/utilities/recycle-bin",
    color: "text-warning bg-warning/10",
  },
  {
    title: "Reset Database",
    description: "Clear all data and start fresh (Admin only)",
    icon: Database,
    href: "/utilities/reset",
    color: "text-destructive bg-destructive/10",
  },
];

const recycleBinStats = [
  { label: "Deleted Items", count: 12 },
  { label: "Deleted Invoices", count: 5 },
  { label: "Deleted Parties", count: 3 },
];

export default function UtilitiesOverview() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Utilities</h1>
        <p className="text-muted-foreground">Tools to manage and maintain your data</p>
      </div>

      {/* Utilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {utilities.map((utility) => (
          <Link
            key={utility.title}
            to={utility.href}
            className="metric-card group hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className={cn("p-3 rounded-xl", utility.color)}>
                <utility.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{utility.title}</h3>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {utility.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recycle Bin Summary */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Recycle Bin</h3>
              <p className="text-sm text-muted-foreground">
                Items will be permanently deleted after 30 days
              </p>
            </div>
          </div>
          <Link
            to="/utilities/recycle-bin"
            className="text-sm text-primary font-medium hover:underline"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {recycleBinStats.map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-lg bg-muted/30 text-center"
            >
              <p className="text-2xl font-bold">{stat.count}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="metric-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Data Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage your business data efficiently
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="text-xl font-bold">324</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">Total Parties</p>
            <p className="text-xl font-bold">248</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-xl font-bold">1,542</p>
          </div>
        </div>
      </div>
    </div>
  );
}
