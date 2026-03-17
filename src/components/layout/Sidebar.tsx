import { useState, createContext, useContext, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessSettings } from "@/contexts/BusinessContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { useRoleAccess } from "@/components/RoleGuard";
import { useLicenseDisplay } from "@/hooks/useLicenseDisplay";
import { isSuperAdminEmail } from "@/lib/superadmin";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Wallet,
  BarChart3,
  Cloud,
  Settings,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  Crown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Context for sidebar collapsed state
interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isCollapsed: false,
  setIsCollapsed: () => {},
});

export const useSidebarState = () => useContext(SidebarContext);

// Global state for sidebar collapsed (shared between components)
let globalIsCollapsed = false;
let globalSetIsCollapsedCallbacks: Set<(value: boolean) => void> = new Set();
let previousSidebarState = false;

// Register a callback to be called when global state changes
const registerSidebarCallback = (callback: (value: boolean) => void) => {
  globalSetIsCollapsedCallbacks.add(callback);
  return () => globalSetIsCollapsedCallbacks.delete(callback);
};

// Update all registered callbacks
const setGlobalCollapsed = (value: boolean) => {
  globalIsCollapsed = value;
  globalSetIsCollapsedCallbacks.forEach(cb => cb(value));
};

export const useGlobalSidebarState = () => {
  const [isCollapsed, setIsCollapsed] = useState(globalIsCollapsed);
  
  useEffect(() => {
    // Sync with global state
    setIsCollapsed(globalIsCollapsed);
    
    // Register callback to receive updates
    const unregister = registerSidebarCallback(setIsCollapsed);
    return () => { unregister(); };
  }, []);
  
  return {
    isCollapsed,
    setIsCollapsed: (value: boolean) => {
      setGlobalCollapsed(value);
    }
  };
};

// Hook to auto-hide sidebar on invoice pages
export const useAutoHideSidebar = (shouldHide: boolean) => {
  useEffect(() => {
    if (shouldHide) {
      // Store current state before hiding (only on mount)
      previousSidebarState = globalIsCollapsed;
      // Collapse the sidebar
      setGlobalCollapsed(true);
    }
    
    // Cleanup on unmount to restore sidebar
    return () => {
      if (shouldHide) {
        // Restore previous state when leaving the page
        setGlobalCollapsed(previousSidebarState);
      }
    };
  }, []); // Only run on mount/unmount
};

// Function to restore sidebar after save
export const restoreSidebarAfterSave = () => {
  setGlobalCollapsed(previousSidebarState);
};

type AppRole = "admin" | "supervisor" | "viewer";

interface NavItem {
  title: string;
  href?: string;
  icon: React.ReactNode;
  children?: { title: string; href: string; requireWrite?: boolean; requireAdmin?: boolean }[];
  /** Only show for these roles */
  allowedRoles?: AppRole[];
  /** Only show for admin/supervisor */
  requireWrite?: boolean;
  /** Only show for admin */
  requireAdmin?: boolean;
}

const businessNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    title: "Parties",
    icon: <Users className="w-5 h-5" />,
    children: [
      { title: "Add Party", href: "/parties/add", requireWrite: true },
      { title: "All Parties", href: "/parties" },      
    ],
  },
  {
    title: "Items",
    icon: <Package className="w-5 h-5" />,
    children: [
      { title: "Categories", href: "/items/categories" },
      { title: "UOM", href: "/items/units" },
      { title: "Add Item", href: "/items/add", requireWrite: true },
      { title: "All Items", href: "/items" },
    ],
  },
  {
    title: "Sales",
    icon: <ShoppingCart className="w-5 h-5" />,
    children: [
      { title: "Sale Invoices", href: "/sale/invoices" },
      { title: "Payment In", href: "/sale/payment-in" },
      { title: "Delivery Challan", href: "/sale/dc" },
    ],
  },
  {
    title: "Purchases",
    icon: <FileText className="w-5 h-5" />,
    children: [
      { title: "Purchase Invoices", href: "/purchase/bills" },
      { title: "Payment Out", href: "/purchase/payment-out" },
      { title: "Expenses", href: "/purchase/expenses" },
    ],
  },
  {
    title: "Cash & Bank",
    icon: <Wallet className="w-5 h-5" />,
    children: [
      { title: "Bank Accounts", href: "/cash-bank/accounts" },
      { title: "Cash in Hand", href: "/cash-bank/cash" },
    ],
  },
  {
    title: "Reports",
    icon: <BarChart3 className="w-5 h-5" />,
    children: [
      { title: "Sale Report", href: "/reports/sale" },
      { title: "Purchase Report", href: "/reports/purchase" },
      { title: "Profit & Loss", href: "/reports/pnl" },
      { title: "Bill Wise P&L", href: "/reports/bill-wise-pnl" },
      { title: "Balance Sheet", href: "/reports/balance-sheet" },
      { title: "Stock Report", href: "/reports/stock" },
      { title: "Item Wise P&L", href: "/reports/item-wise-pnl" },
      { title: "Taxes - TCS", href: "/reports/taxes" },
      { title: "Expense Report", href: "/reports/expense" },
    ],
  },
  {
    title: "Sync & Backup",
    icon: <Cloud className="w-5 h-5" />,
    requireAdmin: true,
    children: [
      { title: "Sync & Share", href: "/backup/sync" },
      { title: "Auto Backup", href: "/backup/auto" },
      { title: "Backup to Computer", href: "/backup/download" },
      { title: "Restore Backup", href: "/backup/restore" },
    ],
  },
  {
    title: "Utilities",
    icon: <Settings className="w-5 h-5" />,
    requireAdmin: true,
    children: [
      { title: "Import Items", href: "/utilities/import" },
      { title: "Update Items in Bulk", href: "/utilities/bulk-update" },
      { title: "Recycle Bin", href: "/utilities/recycle-bin" },
      { title: "Reset Database", href: "/utilities/reset" },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="w-5 h-5" />,
  },
];

// SuperAdmin sidebar: settings tabs individually + business as a group
const superAdminNavItems: NavItem[] = [
  {
    title: "Business Settings",
    href: "/settings?tab=business",
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    title: "Users",
    href: "/settings?tab=users",
    icon: <User className="w-5 h-5" />,
  },
  {
    title: "Security",
    href: "/settings?tab=security",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    title: "License",
    href: "/settings?tab=license",
    icon: <Crown className="w-5 h-5" />,
  },
  {
    title: "Payments",
    href: "/settings?tab=payments",
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    title: "Super Admin",
    href: "/settings?tab=superadmin",
    icon: <Crown className="w-5 h-5" />,
  },
  {
    title: "Business",
    icon: <LayoutDashboard className="w-5 h-5" />,
    children: [
      { title: "Dashboard", href: "/dashboard" },
      { title: "Parties", href: "/parties" },
      { title: "Items", href: "/items" },
      { title: "Sales", href: "/sale/invoices" },
      { title: "Purchases", href: "/purchase/bills" },
      { title: "Cash & Bank", href: "/cash-bank/accounts" },
      { title: "Reports", href: "/reports" },
      { title: "Sync & Backup", href: "/backup/sync" },
      { title: "Utilities", href: "/utilities" },
    ],
  },
];

function SidebarContent({ onClose, isCollapsed = false }: { onClose?: () => void; isCollapsed?: boolean }) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(["Sale"]);
  const { businessSettings, getCurrentFinancialYear } = useBusinessSettings();
  const { canWrite, isAdmin } = useRoleAccess();
  const { selectedBusiness } = useBusinessSelection();
  const { licenseType, isInherited, isLoading: licenseLoading } = useLicenseDisplay();
  const isSuperAdmin = isSuperAdminEmail(user?.email);

  // License badge color based on type
  const getLicenseBadgeClass = (type: string | null) => {
    switch (type?.toLowerCase()) {
      case 'platinum':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0';
      case 'gold':
        return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-0';
      case 'silver':
        return 'bg-gradient-to-r from-gray-400 to-slate-500 text-white border-0';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href;
  };

  const isParentActive = (children?: { href: string }[]) => {
    if (!children) return false;
    return children.some((child) => location.pathname.startsWith(child.href));
  };

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  // Filter nav items based on role
  const filteredNavItems = navItems.filter((item) => {
    if (item.requireAdmin && !isAdmin) return false;
    if (item.requireWrite && !canWrite) return false;
    return true;
  });

  // Filter children based on role
  const getFilteredChildren = (children?: { title: string; href: string; requireWrite?: boolean; requireAdmin?: boolean }[]) => {
    if (!children) return [];
    return children.filter((child) => {
      if (child.requireAdmin && !isAdmin) return false;
      if (child.requireWrite && !canWrite) return false;
      return true;
    });
  };

  return (
    <div className="h-full bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Logo - navigates to Dashboard for all users (authenticated via AppLayout) */}
      <div className={cn("p-4 border-b border-sidebar-border", isCollapsed && "p-2")}>
        <Link to="/dashboard" className="flex justify-center" onClick={handleLinkClick}>
          {isCollapsed ? (
            <img
              src="/favicon.png"
              alt="Hisab Kitab Logo"
              className="w-8 h-8 object-contain"
            />
          ) : (
            <img
              src="/logo.png"
              alt="Hisab Kitab Logo"
              className="w-full max-w-[180px] h-auto object-contain"
            />
          )}
        </Link>
      </div>

      {/* Business Name - uses selectedBusiness from context (hidden for SuperAdmin) */}
      {!isCollapsed && !isSuperAdmin && (
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-bold text-sidebar-primary">
                {selectedBusiness?.name?.charAt(0)?.toUpperCase() || businessSettings?.business_name?.charAt(0)?.toUpperCase() || 'B'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-sidebar-foreground">
                {selectedBusiness?.name || businessSettings?.business_name || 'My Business'}
              </p>
              <p className="text-xs text-sidebar-foreground/60">FY {getCurrentFinancialYear()}</p>
            </div>
          </div>
          {/* License Badge for child accounts */}
          {!licenseLoading && licenseType && isInherited && (
            <div className="mt-2">
              <Badge className={cn("gap-1 text-[10px] w-full justify-center", getLicenseBadgeClass(licenseType))}>
                <Crown className="w-3 h-3" />
                Parent License: {licenseType}
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto py-4", isCollapsed ? "px-1" : "px-3")}>
        <ul className="space-y-1">
          {filteredNavItems.map((item) => {
            const filteredChildren = getFilteredChildren(item.children);
            
            return (
              <li key={item.title}>
                {item.href ? (
                  <Link
                    to={item.href}
                    className={cn(
                      "sidebar-link",
                      isActive(item.href) && "active",
                      isCollapsed && "justify-center px-2"
                    )}
                    onClick={handleLinkClick}
                    title={isCollapsed ? item.title : undefined}
                  >
                    {item.icon}
                    {!isCollapsed && <span className="font-medium">{item.title}</span>}
                  </Link>
                ) : (
                  <>
                    {isCollapsed ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn(
                              "sidebar-link w-full justify-center px-2",
                              isParentActive(item.children) && "bg-sidebar-accent"
                            )}
                          >
                            {item.icon}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" className="w-48">
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                            {item.title}
                          </div>
                          {filteredChildren.map((child) => (
                            <DropdownMenuItem key={child.href} asChild>
                              <Link
                                to={child.href}
                                className={cn(
                                  "cursor-pointer",
                                  isActive(child.href) && "bg-accent"
                                )}
                                onClick={handleLinkClick}
                              >
                                {child.title}
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <button
                        onClick={() => toggleExpand(item.title)}
                        className={cn(
                          "sidebar-link w-full justify-between",
                          isParentActive(item.children) && "bg-sidebar-accent"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {item.icon}
                          <span className="font-medium">{item.title}</span>
                        </div>
                        {expandedItems.includes(item.title) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {!isCollapsed && expandedItems.includes(item.title) && filteredChildren.length > 0 && (
                      <ul className="ml-4 mt-1 space-y-1 animate-fade-in">
                        {filteredChildren.map((child) => (
                          <li key={child.href}>
                            <Link
                              to={child.href}
                              className={cn(
                                "sidebar-link pl-8 text-sm",
                                isActive(child.href) && "active"
                              )}
                              onClick={handleLinkClick}
                            >
                              {child.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout button */}
      <div className={cn("mt-auto border-t border-border p-2", isCollapsed && "flex justify-center")}>
        <Button
          variant="ghost"
          className={cn(
            "w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10",
            isCollapsed ? "justify-center px-2" : "justify-start"
          )}
          onClick={async () => {
            await signOut();
            window.location.href = "/auth";
          }}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useGlobalSidebarState();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed top-3 left-3 z-50 md:hidden bg-background shadow-md border"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <SidebarContent onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <aside 
        className={cn(
          "fixed left-0 top-0 h-[calc(100vh-3rem)] z-50 hidden md:block transition-all duration-300",
          isCollapsed ? "w-14" : "w-64"
        )}
      >
        <SidebarContent isCollapsed={isCollapsed} />
        {/* Toggle button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-0 h-12 w-12 rounded-full border bg-background shadow-md hover:bg-accent"
        >
          {isCollapsed ? (
            <PanelLeft className="h-3 w-3" />
          ) : (
            <PanelLeftClose className="h-3 w-3" />
          )}
        </Button>
      </aside>
    </SidebarContext.Provider>
  );
}
