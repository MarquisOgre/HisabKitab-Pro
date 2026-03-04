import { Plus, FileText, Wallet, Package, Users, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  { label: "Create Invoice", icon: FileText, path: "/sales", color: "hsl(209, 79%, 28%)" },
  { label: "Record Expense", icon: Wallet, path: "/expenses", color: "hsl(0, 72%, 51%)" },
  { label: "Add Product", icon: Package, path: "/inventory", color: "hsl(142, 71%, 45%)" },
  { label: "Add Customer", icon: Users, path: "/customers", color: "hsl(38, 92%, 50%)" },
  { label: "Add Supplier", icon: Truck, path: "/suppliers", color: "hsl(262, 83%, 58%)" },
];

export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="stat-card">
      <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ backgroundColor: action.color + "15", color: action.color }}
            >
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-foreground text-center">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
