import { Upload, RefreshCw, Trash2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { isSuperAdminEmail } from "@/lib/superadmin";

const utilities = [
  {
    title: "Import Items",
    description: "Import products from Excel or CSV file",
    icon: Upload,
    action: "Import",
    variant: "default" as const,
  },
  {
    title: "Update Items in Bulk",
    description: "Update prices, stock, GST rates for multiple items at once",
    icon: RefreshCw,
    action: "Update",
    variant: "default" as const,
  },
  {
    title: "Recycle Bin",
    description: "View and restore recently deleted items, invoices and records",
    icon: Trash2,
    action: "Open",
    variant: "secondary" as const,
  },
  {
    title: "Reset Database",
    description: "Permanently delete all business data and start fresh. This cannot be undone!",
    icon: RotateCcw,
    action: "Reset",
    variant: "destructive" as const,
  },
];

export default function Utilities() {
  const { user, isAdmin } = useAuth();
  const showResetDatabase = isSuperAdminEmail(user?.email) || isAdmin;

  const filteredUtilities = utilities.filter(
    (u) => u.title !== "Reset Database" || showResetDatabase
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Utilities</h1>
        <p className="text-sm text-muted-foreground">Import, bulk update and manage your data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        {utilities.map(u => (
          <div key={u.title} className="stat-card">
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${u.variant === "destructive" ? "bg-destructive/10" : "bg-primary/10"}`}>
                <u.icon className={`w-6 h-6 ${u.variant === "destructive" ? "text-destructive" : "text-primary"}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{u.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{u.description}</p>
                <Button
                  variant={u.variant === "destructive" ? "destructive" : "outline"}
                  size="sm"
                  className="mt-3"
                  onClick={() => toast.info(`${u.title} feature coming soon`)}
                >
                  {u.action}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
