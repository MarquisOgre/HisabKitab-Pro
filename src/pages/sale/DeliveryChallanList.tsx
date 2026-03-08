// @ts-nocheck
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Truck, MoreHorizontal, Eye, Download, ArrowRightCircle, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface DeliveryChallan {
  id: string;
  invoice_number: string;
  invoice_date: string;
  status: string | null;
  notes: string | null;
  parties?: { name: string } | null;
}

export default function DeliveryChallanList() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [challans, setChallans] = useState<DeliveryChallan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChallans();
    }
  }, [user]);

  const fetchChallans = async () => {
    try {
      const { data, error } = await supabase
        .from("sale_invoices")
        .select("*, parties(name)")
        .eq("invoice_type", "delivery_challan")
        .or("is_deleted.is.null,is_deleted.eq.false")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChallans((data as unknown as DeliveryChallan[]) || []);
    } catch (error: any) {
      toast.error("Failed to fetch delivery challans: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this challan?")) return;
    
    try {
      const { error } = await supabase
        .from("sale_invoices")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
      toast.success("Challan deleted successfully");
      fetchChallans();
    } catch (error: any) {
      toast.error("Failed to delete challan: " + error.message);
    }
  };

  const filtered = challans.filter(
    (c) => c.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.parties?.name && c.parties.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status: string | null) => {
    const styles: Record<string, string> = {
      pending: "bg-warning/10 text-warning",
      "in-transit": "bg-primary/10 text-primary",
      delivered: "bg-success/10 text-success",
      returned: "bg-destructive/10 text-destructive",
    };
    return styles[status || "pending"] || "bg-warning/10 text-warning";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Delivery Challans</h1>
          <p className="text-muted-foreground">Track goods dispatched to customers</p>
        </div>
        <Button asChild className="btn-gradient gap-2 self-start sm:self-auto">
          <Link to="/sale/dc/new"><Plus className="w-4 h-4" /><span className="hidden sm:inline">New Challan</span><span className="sm:hidden">New</span></Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="metric-card">
          <p className="text-xs sm:text-sm text-muted-foreground">Total Challans</p>
          <p className="text-lg sm:text-2xl font-bold mt-1">{challans.length}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs sm:text-sm text-muted-foreground">In Transit</p>
          <p className="text-lg sm:text-2xl font-bold text-primary mt-1">{challans.filter(c => c.status === "in-transit").length}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs sm:text-sm text-muted-foreground">Delivered</p>
          <p className="text-lg sm:text-2xl font-bold text-success mt-1">{challans.filter(c => c.status === "delivered").length}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
          <p className="text-lg sm:text-2xl font-bold text-warning mt-1">{challans.filter(c => c.status === "pending" || !c.status).length}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search challans..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No delivery challans found</p>
          <Button asChild className="mt-4">
            <Link to="/sale/dc/new">Create your first challan</Link>
          </Button>
        </div>
      ) : (
        <div className="metric-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[600px]">
              <thead><tr><th>Challan</th><th>Date</th><th>Party</th><th>Type</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {filtered.map((dc) => (
                  <tr key={dc.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/50 flex items-center justify-center">
                          <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-accent-foreground" />
                        </div>
                        <span className="font-medium text-sm">{dc.invoice_number}</span>
                      </div>
                    </td>
                    <td className="text-muted-foreground text-sm">{format(new Date(dc.invoice_date), "dd MMM yyyy")}</td>
                    <td className="font-medium text-sm">{dc.parties?.name || "-"}</td>
                    <td className="text-muted-foreground text-sm">{dc.notes || "Supply"}</td>
                    <td><span className={cn("px-2 py-1 text-xs font-medium rounded-full capitalize", getStatusBadge(dc.status))}>{(dc.status || "pending").replace("-", " ")}</span></td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link to={`/sale/invoices/${dc.id}`}><Eye className="w-4 h-4 mr-2" />View</Link></DropdownMenuItem>
                          <DropdownMenuItem><Download className="w-4 h-4 mr-2" />Download PDF</DropdownMenuItem>
                          <DropdownMenuItem asChild><Link to={`/sale/invoice/new?from_dc=${dc.id}`}><ArrowRightCircle className="w-4 h-4 mr-2" />Convert to Invoice</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link to={`/sale/payment-in?party=${dc.parties?.name || ""}`}><CreditCard className="w-4 h-4 mr-2" />Record Payment</Link></DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(dc.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}