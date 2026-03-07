import { useState, useEffect } from "react";
import { Trash2, RotateCcw, Search, FileText, Package, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

interface DeletedItem {
  id: string;
  name: string;
  type: 'item' | 'sale_invoice' | 'purchase_invoice';
  deletedOn: string;
  daysLeft: number;
  table: string;
}

export default function RecycleBin() {
  const { user } = useAuth();
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchDeletedItems();
    }
  }, [user]);

  const fetchDeletedItems = async () => {
    setLoading(true);
    try {
      const deletedItems: DeletedItem[] = [];
      const now = new Date();

      // Fetch deleted items
      const { data: deletedProducts } = await supabase
        .from('items')
        .select('id, name, deleted_at')
        .eq('is_deleted', true)
        .not('deleted_at', 'is', null);

      deletedProducts?.forEach(item => {
        const deletedAt = new Date(item.deleted_at!);
        const daysLeft = 30 - differenceInDays(now, deletedAt);
        if (daysLeft > 0) {
          deletedItems.push({
            id: item.id,
            name: item.name,
            type: 'item',
            deletedOn: format(deletedAt, 'dd MMM yyyy'),
            daysLeft,
            table: 'items',
          });
        }
      });

      // Fetch deleted sale invoices
      const { data: deletedSaleInvoices } = await supabase
        .from('sale_invoices')
        .select('id, invoice_number, invoice_type, deleted_at')
        .eq('is_deleted', true)
        .not('deleted_at', 'is', null);

      deletedSaleInvoices?.forEach(invoice => {
        const deletedAt = new Date(invoice.deleted_at!);
        const daysLeft = 30 - differenceInDays(now, deletedAt);
        if (daysLeft > 0) {
          deletedItems.push({
            id: invoice.id,
            name: `${invoice.invoice_number} (${invoice.invoice_type})`,
            type: 'sale_invoice',
            deletedOn: format(deletedAt, 'dd MMM yyyy'),
            daysLeft,
            table: 'sale_invoices',
          });
        }
      });

      // Fetch deleted purchase invoices
      const { data: deletedPurchaseInvoices } = await supabase
        .from('purchase_invoices')
        .select('id, invoice_number, invoice_type, deleted_at')
        .eq('is_deleted', true)
        .not('deleted_at', 'is', null);

      deletedPurchaseInvoices?.forEach(invoice => {
        const deletedAt = new Date(invoice.deleted_at!);
        const daysLeft = 30 - differenceInDays(now, deletedAt);
        if (daysLeft > 0) {
          deletedItems.push({
            id: invoice.id,
            name: `${invoice.invoice_number} (${invoice.invoice_type})`,
            type: 'purchase_invoice',
            deletedOn: format(deletedAt, 'dd MMM yyyy'),
            daysLeft,
            table: 'purchase_invoices',
          });
        }
      });

      // Sort by days left (most urgent first)
      deletedItems.sort((a, b) => a.daysLeft - b.daysLeft);
      setItems(deletedItems);
    } catch (error) {
      console.error('Error fetching deleted items:', error);
      toast.error('Failed to load recycle bin');
    } finally {
      setLoading(false);
    }
  };

  const filtered = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter || 
      (typeFilter === "invoice" && (item.type === "sale_invoice" || item.type === "purchase_invoice"));
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "item":
        return <Package className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "item":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
  };

  const restoreItem = async (item: DeletedItem) => {
    setActionLoading(item.id);
    try {
      const { error } = await supabase
        .from(item.table as 'items' | 'sale_invoices' | 'purchase_invoices')
        .update({ is_deleted: false, deleted_at: null })
        .eq('id', item.id);

      if (error) throw error;

      setItems(items.filter(i => i.id !== item.id));
      toast.success(`${item.name} restored successfully`);
    } catch (error: any) {
      console.error('Error restoring item:', error);
      toast.error('Failed to restore: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const permanentDelete = async (item: DeletedItem) => {
    setActionLoading(item.id);
    try {
      // For invoices, first delete invoice items from the appropriate table
      if (item.table === 'sale_invoices') {
        await supabase
          .from('sale_invoice_items')
          .delete()
          .eq('sale_invoice_id', item.id);
      } else if (item.table === 'purchase_invoices') {
        await supabase
          .from('purchase_invoice_items')
          .delete()
          .eq('purchase_invoice_id', item.id);
      }

      const { error } = await supabase
        .from(item.table as 'items' | 'sale_invoices' | 'purchase_invoices')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      setItems(items.filter(i => i.id !== item.id));
      toast.success(`${item.name} permanently deleted`);
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const emptyRecycleBin = async () => {
    setActionLoading('all');
    try {
      // Delete all sale invoice items for deleted sale invoices
      const saleInvoiceIds = items.filter(i => i.table === 'sale_invoices').map(i => i.id);
      if (saleInvoiceIds.length > 0) {
        await supabase
          .from('sale_invoice_items')
          .delete()
          .in('sale_invoice_id', saleInvoiceIds);

        await supabase
          .from('sale_invoices')
          .delete()
          .in('id', saleInvoiceIds);
      }

      // Delete all purchase invoice items for deleted purchase invoices
      const purchaseInvoiceIds = items.filter(i => i.table === 'purchase_invoices').map(i => i.id);
      if (purchaseInvoiceIds.length > 0) {
        await supabase
          .from('purchase_invoice_items')
          .delete()
          .in('purchase_invoice_id', purchaseInvoiceIds);

        await supabase
          .from('purchase_invoices')
          .delete()
          .in('id', purchaseInvoiceIds);
      }

      // Delete all items
      const itemIds = items.filter(i => i.table === 'items').map(i => i.id);
      if (itemIds.length > 0) {
        await supabase
          .from('items')
          .delete()
          .in('id', itemIds);
      }

      setItems([]);
      toast.success('Recycle bin emptied successfully');
    } catch (error: any) {
      console.error('Error emptying recycle bin:', error);
      toast.error('Failed to empty recycle bin: ' + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recycle Bin</h1>
          <p className="text-muted-foreground">Restore or permanently delete items</p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="gap-2" 
              disabled={items.length === 0 || actionLoading === 'all'}
            >
              {actionLoading === 'all' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Empty Recycle Bin
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Empty Recycle Bin?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all {items.length} items in the recycle bin. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={emptyRecycleBin} className="bg-destructive text-destructive-foreground">
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Info Banner */}
      <div className="metric-card bg-warning/10 border-warning/20">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-warning" />
          <div>
            <h3 className="font-semibold">Items in recycle bin will be permanently deleted after 30 days</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Restore items before they expire to recover your data. Once permanently deleted, data cannot be recovered.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search deleted items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="item">Items</SelectItem>
            <SelectItem value="invoice">Invoices</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items List */}
      {filtered.length === 0 ? (
        <div className="metric-card text-center py-12">
          <Trash2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Recycle Bin is Empty</h3>
          <p className="text-muted-foreground">Deleted items will appear here for 30 days</p>
        </div>
      ) : (
        <div className="metric-card overflow-hidden p-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Deleted On</th>
                <th>Days Left</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      {item.name}
                    </div>
                  </td>
                  <td>
                    <span className={cn("px-2 py-1 text-xs font-medium rounded-full capitalize", getTypeBadgeColor(item.type))}>
                      {item.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{item.deletedOn}</td>
                  <td>
                    <span className={cn(
                      "font-medium",
                      item.daysLeft <= 7 ? "text-destructive" : item.daysLeft <= 14 ? "text-warning" : "text-muted-foreground"
                    )}>
                      {item.daysLeft} days
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => restoreItem(item)}
                        disabled={actionLoading === item.id}
                      >
                        {actionLoading === item.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        Restore
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive gap-1"
                            disabled={actionLoading === item.id}
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Permanently Delete?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{item.name}". This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => permanentDelete(item)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete Permanently
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}