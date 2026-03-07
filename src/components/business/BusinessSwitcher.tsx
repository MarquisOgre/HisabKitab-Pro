import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Check, ChevronDown, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { BusinessDialog } from "./BusinessDialog";
import { cn } from "@/lib/utils";

export function BusinessSwitcher() {
  const navigate = useNavigate();
  const { businesses, selectedBusiness, selectBusiness, canCreateBusiness, maxBusinesses, canManageBusinesses } = useBusinessSelection();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState(false);

  if (!selectedBusiness && businesses.length === 0) {
    // Only show create button for admins
    if (!canManageBusinesses) {
      return (
        <Button variant="outline" size="sm" disabled className="gap-2">
          <Building2 className="h-4 w-4" />
          No Business
        </Button>
      );
    }
    return (
      <>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowCreateDialog(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Business
        </Button>
        <BusinessDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog}
          mode="create"
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 max-w-[200px]">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{selectedBusiness?.name || 'Select Business'}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[220px]">
          {businesses.map((business) => (
            <DropdownMenuItem
              key={business.id}
              onClick={() => selectBusiness(business)}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                selectedBusiness?.id === business.id && "bg-accent"
              )}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate flex-1">{business.name}</span>
              {selectedBusiness?.id === business.id && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          
          {/* Admin-only options */}
          {canManageBusinesses && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowManageDialog(true)} className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Manage Businesses
              </DropdownMenuItem>
              {canCreateBusiness ? (
                <DropdownMenuItem onClick={() => setShowCreateDialog(true)} className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Business
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                  Max {maxBusinesses} businesses allowed
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <BusinessDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        mode="create"
      />
      
      <BusinessDialog 
        open={showManageDialog} 
        onOpenChange={setShowManageDialog}
        mode="manage"
      />
    </>
  );
}
