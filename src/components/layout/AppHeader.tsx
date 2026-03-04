import { Search, Bell, ChevronDown, User, Building2, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AppHeaderProps {
  sidebarCollapsed: boolean;
}

export default function AppHeader({ sidebarCollapsed }: AppHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header
      className="fixed top-0 right-0 h-16 bg-card border-b border-border z-30 flex items-center justify-between px-6 transition-all duration-250"
      style={{ left: sidebarCollapsed ? 68 : 260 }}
    >
      {/* Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers, products, invoices..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Business Name */}
      <div className="hidden md:flex items-center gap-2 px-4">
        <Building2 className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">My Business</span>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Branch Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-secondary/50 transition-colors">
            <span className="text-muted-foreground">Branch:</span>
            <span className="font-medium text-foreground">Main</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Main Branch</DropdownMenuItem>
            <DropdownMenuItem>Branch 2</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>+ Add Branch</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary/50 transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-secondary/50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="w-4 h-4 mr-2" /> My Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" /> Business Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
