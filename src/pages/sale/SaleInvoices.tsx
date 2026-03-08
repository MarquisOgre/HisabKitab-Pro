// @ts-nocheck
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  MoreHorizontal,
  FileText,
  Download,
  Eye,
  Loader2,
  CreditCard,
  Printer,
  Calendar,
} from "lucide-react";
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
import { useRoleAccess } from "@/components/RoleGuard";
import { toast } from "sonner";
import { format } from "date-fns";
import { generateInvoicePDF, printInvoicePDF } from "@/lib/invoicePdf";
import { MonthFilter, filterByMonth } from "@/components/MonthFilter";

interface Invoice {
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

export default function SaleInvoices() {
  const { user } = useAuth();
  const { businessSettings } = useBusinessSettings();
  const { selectedBusiness } = useBusinessSelection();
  const { canWrite, isAdmin } = useRoleAccess();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && selectedBusiness) {
      fetchInvoices();
    }
  }, [user, selectedBusiness]);

  const fetchInvoices = async () => {
    if (!selectedBusiness) return;
    try {
      const { data, error } = await supabase
        .from("sale_invoices")
        .select("*, parties(name)")
        .in("invoice_type", ["sale", "sale_invoice", "invoice"])
        .eq("is_deleted", false)
        .eq("business_id", selectedBusiness.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvoices((data as unknown as Invoice[]) || []);
    } catch (error: any) {
      toast.error("Failed to fetch invoices: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    
    try {
      // First, get invoice items to restore stock
      const { data: invoiceItems } = await supabase
        .from("sale_invoice_items")
        .select("item_id, quantity")
        .eq("sale_invoice_id", id);

      // Restore stock for each item
      if (invoiceItems && invoiceItems.length > 0) {
        for (const invoiceItem of invoiceItems) {
          if (invoiceItem.item_id) {
            const { data: itemData } = await supabase
              .from("items")
              .select("current_stock")
              .eq("id", invoiceItem.item_id)
              .single();

            if (itemData) {
              const newStock = (itemData.current_stock || 0) + invoiceItem.quantity;
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
        .from("sale_invoices")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success("Invoice deleted and stock restored successfully");
      fetchInvoices();
    } catch (error: any) {
      toast.error("Failed to delete invoice: " + error.message);
    }
  };

  // Filter by month first, then by search
  const monthFilteredInvoices = filterByMonth(invoices, selectedMonth);
  
  const filteredInvoices = monthFilteredInvoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.parties?.name && inv.parties.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status: string | null) => {
    const styles: Record<string, string> = {
      paid: "bg-success/10 text-success",
      partial: "bg-warning/10 text-warning",
      unpaid: "bg-destructive/10 text-destructive",
    };
    return styles[status || "unpaid"] || "";
  };

  // Calculate summary based on filtered invoices
  const totalAmount = monthFilteredInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
  const paidAmount = monthFilteredInvoices.reduce((sum, inv) => sum + Number(inv.paid_amount || 0), 0);
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
          <h1 className="text-2xl font-bold">Sale Invoices</h1>
          <p className="text-muted-foreground">Manage your sales and invoices</p>
        </div>
        {/* Allow all roles (including viewer) to create sale invoices */}
        <Button asChild className="btn-gradient gap-2">
          <Link to="/sale/invoices/new">
            <Plus className="w-4 h-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <p className="text-sm text-muted-foreground">Total Invoices</p>
          <p className="text-2xl font-bold mt-1">₹{totalAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">{invoices.length} invoices</p>
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
          <p className="text-sm text-muted-foreground">Invoice Count</p>
          <p className="text-2xl font-bold text-primary mt-1">{monthFilteredInvoices.length}</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number or party..."
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

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No invoices found</p>
          <Button asChild className="mt-4">
            <Link to="/sale/invoices/new">Create your first invoice</Link>
          </Button>
        </div>
      ) : (
        <div className="metric-card overflow-hidden p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Party</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Paid</th>
                <th className="text-right">Balance</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const amount = invoice.total_amount || 0;
                const paid = invoice.paid_amount || 0;
                
                return (
                  <tr key={invoice.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium">{invoice.invoice_number}</span>
                      </div>
                    </td>
                    <td className="text-muted-foreground">
                      {format(new Date(invoice.invoice_date), "dd MMM yyyy")}
                    </td>
                    <td className="font-medium">{invoice.parties?.name || "-"}</td>
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
                          getStatusBadge(invoice.status)
                        )}
                      >
                        {invoice.status || "unpaid"}
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
                          <DropdownMenuItem onSelect={() => navigate(`/sale/invoices/${invoice.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={async () => {
                              const { data: items } = await supabase
                                .from("sale_invoice_items")
                                .select("*")
                                .eq("sale_invoice_id", invoice.id);

                              const { data: partyData } = await supabase
                                .from("parties")
                                .select("name, phone, email, billing_address, gstin")
                                .eq("id", invoice.party_id)
                                .single();

                              generateInvoicePDF({
                                invoice: { ...invoice, parties: partyData },
                                items: items || [],
                                settings: businessSettings,
                                type: "sale",
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
                                  .from("sale_invoice_items")
                                  .select("*")
                                  .eq("sale_invoice_id", invoice.id);

                                const { data: partyData } = await supabase
                                  .from("parties")
                                  .select("name, phone, email, billing_address, gstin")
                                  .eq("id", invoice.party_id)
                                  .single();

                                await printInvoicePDF({
                                  invoice: { ...invoice, parties: partyData },
                                  items: items || [],
                                  settings: businessSettings,
                                  type: "sale",
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
                            <DropdownMenuItem onSelect={() => navigate(`/sale/payment-in/new?invoice=${invoice.id}`)}>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Record Payment
                            </DropdownMenuItem>
                          )}
                          {/* Edit/Delete - admin only (supervisors can't edit invoices) */}
                          {isAdmin && (
                            <>
                              <DropdownMenuItem onSelect={() => navigate(`/sale/invoices/${invoice.id}/edit`)}>
                                Edit Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onSelect={() => handleDelete(invoice.id)}
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