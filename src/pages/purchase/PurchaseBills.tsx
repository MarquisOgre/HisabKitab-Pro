// @ts-nocheck
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, MoreHorizontal, FileText, Loader2, Download, Printer, Eye, CreditCard, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessSettings } from "@/contexts/BusinessContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { RoleGuard, useRoleAccess } from "@/components/RoleGuard";
import { toast } from "sonner";
import { format } from "date-fns";
import { generateInvoicePDF, printInvoicePDF } from "@/lib/invoicePdf";
import { MonthFilter, filterByMonth } from "@/components/MonthFilter";

interface PurchaseBill {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  total_amount: number | null;
  paid_amount: number | null;
  subtotal: number | null;
  tax_amount: number | null;
  discount_amount: number | null;
  status: string | null;
  notes: string | null;
  terms: string | null;
  party_id: string | null;
  parties?: { name: string } | null;
}

export default function PurchaseBills() {
  const { user } = useAuth();
  const { businessSettings } = useBusinessSettings();
  const { selectedBusiness } = useBusinessSelection();
  const { canWrite, isAdmin } = useRoleAccess();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && selectedBusiness) {
      fetchBills();
    }
  }, [user, selectedBusiness]);

  const fetchBills = async () => {
    if (!selectedBusiness) return;
    try {
      const { data, error } = await supabase
        .from("purchase_invoices")
        .select("*, parties(name)")
        .in("invoice_type", ["purchase", "purchase_bill", "purchase_invoice"])
        .eq("is_deleted", false)
        .eq("business_id", selectedBusiness.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBills((data as unknown as PurchaseBill[]) || []);
    } catch (error: any) {
      toast.error("Failed to fetch purchase invoices: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    
    try {
      // First, get invoice items to deduct stock (purchase adds stock, so deletion removes it)
      const { data: invoiceItems } = await supabase
        .from("purchase_invoice_items")
        .select("item_id, quantity")
        .eq("purchase_invoice_id", id);

      // Deduct stock for each item
      if (invoiceItems && invoiceItems.length > 0) {
        for (const invoiceItem of invoiceItems) {
          if (invoiceItem.item_id) {
            const { data: itemData } = await supabase
              .from("items")
              .select("current_stock")
              .eq("id", invoiceItem.item_id)
              .single();

            if (itemData) {
              const newStock = Math.max(0, (itemData.current_stock || 0) - invoiceItem.quantity);
              await supabase
                .from("items")
                .update({ current_stock: newStock })
                .eq("id", invoiceItem.item_id);
            }
          }
        }
      }

      // Mark invoice as deleted
      const { error } = await supabase
        .from("purchase_invoices")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success("Purchase invoice deleted and stock adjusted successfully");
      fetchBills();
    } catch (error: any) {
      toast.error("Failed to delete purchase invoice: " + error.message);
    }
  };

  // Filter by month first, then by search
  const monthFilteredBills = filterByMonth(bills, selectedMonth);
  
  const filteredBills = monthFilteredBills.filter(
    (bill) =>
      bill.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bill.parties?.name && bill.parties.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status: string | null) => {
    const styles: Record<string, string> = {
      paid: "bg-success/10 text-success",
      partial: "bg-warning/10 text-warning",
      unpaid: "bg-destructive/10 text-destructive",
    };
    return styles[status || "unpaid"] || "";
  };

  const totalAmount = monthFilteredBills.reduce((sum, b) => sum + (b.total_amount || 0), 0);
  const paidAmount = monthFilteredBills.reduce((sum, b) => sum + (b.paid_amount || 0), 0);
  const unpaidAmount = totalAmount - paidAmount;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Invoices</h1>
          <p className="text-muted-foreground">Manage your purchase transactions</p>
        </div>
        <RoleGuard requireWrite>
          <Button asChild className="btn-gradient gap-2">
            <Link to="/purchase/bills/new">
              <Plus className="w-4 h-4" />
              New Purchase Invoice
            </Link>
          </Button>
        </RoleGuard>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Total Bills</p>
          <p className="text-2xl font-bold mt-1">₹{totalAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{bills.length} bills</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Paid</p>
          <p className="text-2xl font-bold text-success mt-1">₹{paidAmount.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Unpaid</p>
          <p className="text-2xl font-bold text-destructive mt-1">₹{unpaidAmount.toLocaleString()}</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Bill Count</p>
          <p className="text-2xl font-bold text-warning mt-1">{monthFilteredBills.length}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by bill number or party..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <MonthFilter selectedMonth={selectedMonth} onMonthChange={setSelectedMonth} />
        </div>
      </div>

      {/* Bills Table */}
      {filteredBills.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No purchase invoices found</p>
          <Button asChild className="mt-4">
            <Link to="/purchase/bills/new">Create your first purchase invoice</Link>
          </Button>
        </div>
      ) : (
        <div className="metric-card overflow-hidden p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bill No.</th>
                <th>Date</th>
                <th>Supplier</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Paid</th>
                <th className="text-right">Balance</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => {
                const amount = bill.total_amount || 0;
                const paid = bill.paid_amount || 0;
                
                return (
                  <tr key={bill.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-accent" />
                        </div>
                        <span className="font-medium">{bill.invoice_number}</span>
                      </div>
                    </td>
                    <td className="text-muted-foreground">
                      {format(new Date(bill.invoice_date), "dd MMM yyyy")}
                    </td>
                    <td className="font-medium">{bill.parties?.name || "-"}</td>
                    <td className="text-right font-medium">
                      ₹{amount.toLocaleString()}
                    </td>
                    <td className="text-right text-muted-foreground">
                      ₹{paid.toLocaleString()}
                    </td>
                    <td className="text-right font-medium">
                      ₹{(amount - paid).toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full capitalize",
                          getStatusBadge(bill.status)
                        )}
                      >
                        {bill.status || "unpaid"}
                      </span>
                    </td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => navigate(`/purchase/bills/${bill.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={async () => {
                              const { data: items } = await supabase
                                .from("purchase_invoice_items")
                                .select("*")
                                .eq("purchase_invoice_id", bill.id);

                              const { data: partyData } = await supabase
                                .from("parties")
                                .select("name, phone, email, billing_address, gstin")
                                .eq("id", bill.party_id)
                                .single();

                              generateInvoicePDF({
                                invoice: { ...bill, parties: partyData },
                                items: items || [],
                                settings: businessSettings,
                                type: "purchase",
                              });
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={async () => {
                              try {
                                const { data: items } = await supabase
                                  .from("purchase_invoice_items")
                                  .select("*")
                                  .eq("purchase_invoice_id", bill.id);

                                const { data: partyData } = await supabase
                                  .from("parties")
                                  .select("name, phone, email, billing_address, gstin")
                                  .eq("id", bill.party_id)
                                  .single();

                                await printInvoicePDF({
                                  invoice: { ...bill, parties: partyData },
                                  items: items || [],
                                  settings: businessSettings,
                                  type: "purchase",
                                });
                              } catch (e: any) {
                                toast.error(e?.message || "Failed to print invoice");
                              }
                            }}
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Print
                          </DropdownMenuItem>
                          {/* Record Payment - admin/supervisor only */}
                          {canWrite && (
                            <DropdownMenuItem onSelect={() => navigate(`/purchase/payment-out/new?invoice=${bill.id}`)}>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Record Payment
                            </DropdownMenuItem>
                          )}
                          {/* Edit/Delete - admin only (supervisors can't edit invoices) */}
                          {isAdmin && (
                            <>
                              <DropdownMenuItem onSelect={() => navigate(`/purchase/bills/${bill.id}/edit`)}>
                                Edit Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onSelect={() => handleDelete(bill.id)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}