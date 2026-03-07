import { Bell, Search, Plus, Settings, LogOut, User, Shield, Check, Trash2, X, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { BusinessSwitcher } from "@/components/business/BusinessSwitcher";
import { useLicenseDisplay } from "@/hooks/useLicenseDisplay";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isSuperAdminEmail } from "@/lib/superadmin";

export function Header() {
  const { user, role, signOut, canWrite } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();
  const isMobile = useIsMobile();
  const { licenseType, isInherited, isLoading: licenseLoading } = useLicenseDisplay();

  const isSuperAdmin = isSuperAdminEmail(user?.email);

  const getRoleBadgeVariant = (role: string | null) => {
    if (isSuperAdmin) return 'destructive';
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'supervisor':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getDisplayRole = () => {
    if (isSuperAdmin) return 'Super Admin';
    return role || 'user';
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-primary';
    }
  };

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

  return (
    <header className={cn(
      "h-14 md:h-16 bg-card border-b border-border flex items-center justify-between px-3 md:px-6 sticky top-0 z-40",
      isMobile && "pl-14" // Leave space for hamburger menu
    )}>
      {/* Mobile: Logo + Business Switcher */}
      {isMobile && (
        <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
          <Link to="/dashboard" className="shrink-0">
            <img
              src="/hisabkitab_dark_logo.png"
              alt="Hisab Kitab"
              className="h-6 w-auto object-contain"
            />
          </Link>
          <BusinessSwitcher />
        </div>
      )}

      {/* Desktop: Business Switcher & Search */}
      {!isMobile && (
        <div className="flex items-center gap-3 flex-1">
          <BusinessSwitcher />
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions, parties, items..."
                className="pl-10 bg-muted/50 border-0 focus-visible:ring-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {canWrite && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="btn-gradient gap-1 md:gap-2 h-8 md:h-10 px-2 md:px-4" size="sm">
                <Plus className="w-4 h-4" />
                {!isMobile && "Quick Add"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/sale/invoices/new">New Sale Invoice</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/purchase/bills/new">New Purchase Invoice</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/parties/add">Add Party</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/items/add">Add Item</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/purchase/expenses/new">Add Expense</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8 md:h-10 md:w-10">
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 md:-top-1 md:-right-1 w-4 h-4 md:w-5 md:h-5 bg-destructive rounded-full text-[9px] md:text-[10px] text-white flex items-center justify-center font-medium">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="font-semibold">Notifications</span>
              {notifications.length > 0 && (
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllAsRead}>
                      <Check className="w-3 h-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={clearAll}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            <ScrollArea className="h-[300px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "px-3 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                      !notification.is_read && "bg-primary/5"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-2 h-2 rounded-full mt-2", getNotificationIcon(notification.type))} 
                           style={{ backgroundColor: 'currentColor' }} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </DropdownMenuContent>
        </DropdownMenu>

        {!isMobile && (
          <Button variant="ghost" size="icon" asChild className="h-8 w-8 md:h-10 md:w-10">
            <Link to="/settings">
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
          </Button>
        )}

        {/* License Badge (for child accounts) */}
        {!licenseLoading && licenseType && isInherited && !isMobile && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className={cn("gap-1 text-[10px] cursor-help", getLicenseBadgeClass(licenseType))}>
                <Crown className="w-3 h-3" />
                {licenseType}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Using Parent License</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-1.5 md:gap-2 pl-1.5 md:pl-2 h-8 md:h-10">
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
              </div>
              {!isMobile && (
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium truncate max-w-[120px]">
                    {user?.email?.split('@')[0] || 'User'}
                  </span>
                  <Badge variant={getRoleBadgeVariant(role)} className="text-[10px] px-1.5 py-0">
                    {getDisplayRole()}
                  </Badge>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <Shield className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground capitalize">{getDisplayRole()} Access</span>
              </div>
              {/* License info in dropdown */}
              {licenseType && (
                <div className="flex items-center gap-1 mt-1">
                  <Crown className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {isInherited ? `Parent License: ${licenseType}` : `License: ${licenseType}`}
                  </span>
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={async () => {
                await signOut();
                window.location.href = "/";
              }} 
              className="gap-2 text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
