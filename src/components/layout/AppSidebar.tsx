import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  Truck,
  Landmark,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  RefreshCw,
  Wrench,
} from "lucide-react";

const menuItems = [
  { title: "Dashboard", path: "/", icon: LayoutDashboard },
  { title: "Items", path: "/items", icon: Boxes },
  { title: "Sales", path: "/sales", icon: ShoppingCart },
  { title: "Purchases", path: "/purchases", icon: Package },
  { title: "Cash & Bank", path: "/cash-bank", icon: Landmark },
  { title: "Customers", path: "/customers", icon: Users },
  { title: "Suppliers", path: "/suppliers", icon: Truck },
  { title: "Reports", path: "/reports", icon: BarChart3 },
  { title: "Sync & Backup", path: "/sync-backup", icon: RefreshCw },
  { title: "Utilities", path: "/utilities", icon: Wrench },
  { title: "Settings", path: "/settings", icon: Settings },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 260 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-screen bg-primary z-40 flex flex-col shadow-xl overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border/20 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
          <IndianRupee className="w-5 h-5 text-accent-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <h1 className="text-lg font-bold text-primary-foreground tracking-wide">HISABKITAB</h1>
              <p className="text-[10px] text-primary-foreground/50 -mt-1">Accounting Software</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden scrollbar-thin">
        <ul className="space-y-0.5 px-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                    isActive
                      ? "bg-sidebar-accent text-primary-foreground font-medium"
                      : "text-primary-foreground/70 hover:bg-sidebar-accent/50 hover:text-primary-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className="w-5 h-5 shrink-0" />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm whitespace-nowrap"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Button */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-12 border-t border-sidebar-border/20 text-primary-foreground/60 hover:text-primary-foreground transition-colors shrink-0"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </motion.aside>
  );
}
