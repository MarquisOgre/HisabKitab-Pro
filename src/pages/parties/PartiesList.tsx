// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  MoreHorizontal,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { RoleGuard, useRoleAccess } from "@/components/RoleGuard";
import { toast } from "sonner";

interface Party {
  id: string;
  name: string;
  party_type: string | null;
  phone: string | null;
  email: string | null;
  opening_balance: number | null;
  billing_address: string | null;
  gstin: string | null;
}

interface PartyWithTotals extends Party {
  invoiceAmount: number;
  paymentsAmount: number;
  netDue: number;
}

export default function PartiesList() {
  const { user } = useAuth();
  const { selectedBusiness } = useBusinessSelection();
  const { canWrite } = useRoleAccess();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "customer" | "supplier">("all");
  const [parties, setParties] = useState<PartyWithTotals[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && selectedBusiness) {
      fetchParties();
    }
  }, [user, selectedBusiness]);

  const fetchParties = async () => {
    if (!selectedBusiness) return;
    try {
      // Fetch parties
      const { data: partiesData, error: partiesError } = await supabase
        .from("parties")
        .select("*")
        .eq("business_id", selectedBusiness.id)
        .order("created_at", { ascending: false });

      if (partiesError) throw partiesError;

      // Fetch purchase invoices totals per party (for suppliers)
      const { data: purchaseData, error: purchaseError } = await supabase
        .from("purchase_invoices")
        .select("party_id, total_amount")
        .or("is_deleted.is.null,is_deleted.eq.false")
        .eq("business_id", selectedBusiness.id);

      if (purchaseError) throw purchaseError;

      // Fetch sale invoices totals per party (for customers)
      const { data: saleData, error: saleError } = await supabase
        .from("sale_invoices")
        .select("party_id, total_amount")
        .eq("is_deleted", false)
        .eq("business_id", selectedBusiness.id);

      if (saleError) throw saleError;

      // Fetch payment out totals per party (for suppliers)
      // Note: payment_type can be 'out' or 'payment_out' depending on how it was created
      const { data: paymentsOutData, error: paymentsOutError } = await supabase
        .from("payments")
        .select("party_id, amount, payment_type")
        .or("payment_type.eq.payment_out,payment_type.eq.out")
        .eq("business_id", selectedBusiness.id);

      if (paymentsOutError) throw paymentsOutError;

      // Fetch payment in totals per party (for customers)
      // Note: payment_type can be 'in' or 'payment_in' depending on how it was created
      const { data: paymentsInData, error: paymentsInError } = await supabase
        .from("payments")
        .select("party_id, amount, payment_type")
        .or("payment_type.eq.payment_in,payment_type.eq.in")
        .eq("business_id", selectedBusiness.id);

      if (paymentsInError) throw paymentsInError;

      // Calculate purchase totals per party
      const purchaseTotals: Record<string, number> = {};
      purchaseData?.forEach((inv) => {
        if (inv.party_id) {
          purchaseTotals[inv.party_id] = (purchaseTotals[inv.party_id] || 0) + Number(inv.total_amount || 0);
        }
      });

      // Calculate sale totals per party
      const saleTotals: Record<string, number> = {};
      saleData?.forEach((inv) => {
        if (inv.party_id) {
          saleTotals[inv.party_id] = (saleTotals[inv.party_id] || 0) + Number(inv.total_amount || 0);
        }
      });

      // Calculate payment out totals per party
      const paymentOutTotals: Record<string, number> = {};
      paymentsOutData?.forEach((pay) => {
        if (pay.party_id) {
          paymentOutTotals[pay.party_id] = (paymentOutTotals[pay.party_id] || 0) + Number(pay.amount || 0);
        }
      });

      // Calculate payment in totals per party
      const paymentInTotals: Record<string, number> = {};
      paymentsInData?.forEach((pay) => {
        if (pay.party_id) {
          paymentInTotals[pay.party_id] = (paymentInTotals[pay.party_id] || 0) + Number(pay.amount || 0);
        }
      });

      // Combine data
      const partiesWithTotals: PartyWithTotals[] = (partiesData || []).map((party) => {
        const openingBalance = Number(party.opening_balance || 0);
        const isCustomer = party.party_type === "customer";
        
        // For customers: use sale invoices and payment in
        // For suppliers: use purchase invoices and payment out
        const invoiceAmount = isCustomer 
          ? (saleTotals[party.id] || 0) 
          : (purchaseTotals[party.id] || 0);
        const paymentsAmount = isCustomer 
          ? (paymentInTotals[party.id] || 0) 
          : (paymentOutTotals[party.id] || 0);
        
        // Net Due = Opening Balance + Invoice Amount - Payments
        const netDue = openingBalance + invoiceAmount - paymentsAmount;

        return {
          ...party,
          invoiceAmount,
          paymentsAmount,
          netDue,
        };
      });

      setParties(partiesWithTotals);
    } catch (error: any) {
      toast.error("Failed to fetch parties: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this party?")) return;
    
    try {
      const { error } = await supabase.from("parties").delete().eq("id", id);
      if (error) throw error;
      toast.success("Party deleted successfully");
      fetchParties();
    } catch (error: any) {
      toast.error("Failed to delete party: " + error.message);
    }
  };

  const filteredParties = parties.filter((party) => {
    const matchesSearch =
      party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (party.phone && party.phone.includes(searchQuery)) ||
      (party.email && party.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filter === "all" || party.party_type === filter;
    return matchesSearch && matchesFilter;
  });

  // Calculate totals - separate for suppliers (payable) and customers (receivable)
  const totals = useMemo(() => {
    const supplierTotals = filteredParties
      .filter(p => p.party_type === "supplier")
      .reduce(
        (acc, party) => ({
          openingBalance: acc.openingBalance + Number(party.opening_balance || 0),
          invoiceAmount: acc.invoiceAmount + (party.invoiceAmount || 0),
          paymentsAmount: acc.paymentsAmount + (party.paymentsAmount || 0),
          netDue: acc.netDue + (party.netDue || 0),
        }),
        { openingBalance: 0, invoiceAmount: 0, paymentsAmount: 0, netDue: 0 }
      );

    const customerTotals = filteredParties
      .filter(p => p.party_type === "customer" || !p.party_type)
      .reduce(
        (acc, party) => ({
          openingBalance: acc.openingBalance + Number(party.opening_balance || 0),
          invoiceAmount: acc.invoiceAmount + (party.invoiceAmount || 0),
          paymentsAmount: acc.paymentsAmount + (party.paymentsAmount || 0),
          netDue: acc.netDue + (party.netDue || 0),
        }),
        { openingBalance: 0, invoiceAmount: 0, paymentsAmount: 0, netDue: 0 }
      );

    const allTotals = filteredParties.reduce(
      (acc, party) => ({
        openingBalance: acc.openingBalance + Number(party.opening_balance || 0),
        invoiceAmount: acc.invoiceAmount + (party.invoiceAmount || 0),
        paymentsAmount: acc.paymentsAmount + (party.paymentsAmount || 0),
        netDue: acc.netDue + (party.netDue || 0),
      }),
      { openingBalance: 0, invoiceAmount: 0, paymentsAmount: 0, netDue: 0 }
    );

    // Supplier is Payable (Red), Customer is Receivable (Green)
    // Net = Customer Receivable - Supplier Payable
    const netBalance = customerTotals.netDue - supplierTotals.netDue;

    return {
      all: allTotals,
      supplier: supplierTotals,
      customer: customerTotals,
      netBalance, // Positive = Net Receivable, Negative = Net Payable
    };
  }, [filteredParties]);

  return (
    <div className="space-y-4 md:space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Parties</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Manage your customers and suppliers</p>
        </div>
        <RoleGuard requireWrite>
          <Button asChild size="sm" className="btn-gradient gap-2">
            <Link to="/parties/add">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Party</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </Button>
        </RoleGuard>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="metric-card p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">Total Receivable</div>
          <div className="mt-1 text-lg sm:text-2xl font-bold text-success">
            ₹{Math.abs(totals.customer.netDue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted-foreground">Customers</div>
        </div>

        <div className="metric-card p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">Total Payable</div>
          <div className="mt-1 text-lg sm:text-2xl font-bold text-destructive">
            ₹{Math.abs(totals.supplier.netDue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted-foreground">Suppliers</div>
        </div>

        <div className="metric-card p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">
            {totals.netBalance >= 0 ? "Net Receivable" : "Net Payable"}
          </div>
          <div className={cn("mt-1 text-lg sm:text-2xl font-bold", totals.netBalance >= 0 ? "text-success" : "text-destructive")}>
            ₹{Math.abs(totals.netBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-muted-foreground">Overall</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-full sm:w-auto justify-center">
          {["all", "customer", "supplier"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none",
                filter === type
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Parties Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredParties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No parties found</p>
          <Button asChild className="mt-4">
            <Link to="/parties/add">Add your first party</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Party Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Opening</TableHead>
                <TableHead className="text-right">Invoice</TableHead>
                <TableHead className="text-right">Payments</TableHead>
                <TableHead className="text-right">Net Due</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParties.map((party) => (
                <TableRow 
                  key={party.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/parties/${party.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                          party.party_type === "customer"
                            ? "bg-success/10 text-success"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {party.name.charAt(0)}
                      </div>
                      <span className={cn(
                        party.party_type === "customer" ? "text-success" : "text-destructive"
                      )}>
                        {party.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-xs px-2 py-1 rounded-full capitalize",
                        party.party_type === "customer"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      )}
                    >
                      {party.party_type || "customer"}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {party.phone || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{Number(party.opening_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    ₹{(party.invoiceAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right text-success">
                    ₹{(party.paymentsAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-semibold",
                    // For customers: positive net due = receivable = green
                    // For suppliers: positive net due = payable = red
                    party.party_type === "customer"
                      ? (party.netDue || 0) > 0 ? "text-success" : (party.netDue || 0) < 0 ? "text-destructive" : ""
                      : (party.netDue || 0) > 0 ? "text-destructive" : (party.netDue || 0) < 0 ? "text-success" : ""
                  )}>
                    ₹{(party.netDue || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/parties/${party.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        {canWrite && (
                          <DropdownMenuItem onClick={() => navigate(`/parties/edit/${party.id}`)}>
                            Edit Party
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => navigate(`/parties/${party.id}/transactions`)}>
                          View Transactions
                        </DropdownMenuItem>
                        {canWrite && (
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(party.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              {/* Supplier Totals - Payable */}
              <TableRow className="bg-destructive/5">
                <TableCell colSpan={3} className="font-semibold text-destructive">
                  Supplier (Payable)
                </TableCell>
                <TableCell className="text-right text-destructive">
                  ₹
                  {totals.supplier.openingBalance.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right text-destructive">
                  ₹
                  {totals.supplier.invoiceAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right text-destructive">
                  ₹
                  {totals.supplier.paymentsAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right font-bold text-destructive">
                  ₹
                  {totals.supplier.netDue.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* Customer Totals - Receivable */}
              <TableRow className="bg-success/5">
                <TableCell colSpan={3} className="font-semibold text-success">
                  Customer (Receivable)
                </TableCell>
                <TableCell className="text-right text-success">
                  ₹
                  {totals.customer.openingBalance.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right text-success">
                  ₹
                  {totals.customer.invoiceAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right text-success">
                  ₹
                  {totals.customer.paymentsAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right font-bold text-success">
                  ₹
                  {totals.customer.netDue.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>

              {/* Net Balance Row */}
              <TableRow className="bg-muted font-bold">
                <TableCell colSpan={6} className="text-right text-lg">
                  {totals.netBalance >= 0 ? "Net Receivable" : "Net Payable"}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right text-lg",
                    totals.netBalance >= 0 ? "text-success" : "text-destructive"
                  )}
                >
                  ₹
                  {Math.abs(totals.netBalance).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
