import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PartySelector } from "@/components/sale/PartySelector";
import { SaleInvoiceItemsTable, type InvoiceItem } from "@/components/sale/SaleInvoiceItemsTable";
import { TaxSummary, calculateTotals } from "@/components/sale/TaxSummary";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAutoHideSidebar, restoreSidebarAfterSave } from "@/components/layout/Sidebar";

export default function EditSaleInvoice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Auto-hide sidebar when on this page
  useAutoHideSidebar(true);
  
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [partyId, setPartyId] = useState<string | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");

  useEffect(() => {
    if (user && id) {
      fetchInvoice();
    }
  }, [user, id]);

  const fetchInvoice = async () => {
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("sale_invoices")
        .select("*")
        .eq("id", id)
        .single();

      if (invoiceError) throw invoiceError;
      
      setInvoiceNumber(invoiceData.invoice_number);
      setInvoiceDate(invoiceData.invoice_date);
      setDueDate(invoiceData.due_date || "");
      setPartyId(invoiceData.party_id);
      setNotes(invoiceData.notes || "");
      setTerms(invoiceData.terms || "");

      // Fetch items linked to this sale invoice
      const { data: itemsData } = await supabase
        .from("sale_invoice_items")
        .select("*")
        .eq("sale_invoice_id", id);
      
      // Fetch current stock for all items to display available stock
      const { data: allDbItems } = await supabase
        .from("items")
        .select("id, current_stock")
        .eq("is_deleted", false);
      
      const stockMap: Record<string, number> = {};
      allDbItems?.forEach(item => {
        stockMap[item.id] = item.current_stock || 0;
      });
      
      setItems((itemsData || []).map((item, index) => {
        // Available stock = current stock + quantity sold (since the sale already deducted it)
        const currentStock = item.item_id ? (stockMap[item.item_id] || 0) : 0;
        const availableStock = currentStock + item.quantity;
        const closingStock = availableStock - item.quantity;
        
        return {
          id: Date.now() + index,
          itemId: item.item_id || "",
          categoryId: "",
          name: item.item_name,
          quantity: item.quantity,
          rate: item.rate,
          taxRate: item.tax_rate || 0,
          amount: item.total,
          availableStock: availableStock,
          closingStock: closingStock,
          unit: item.unit || "Bottles",
        };
      }));
    } catch (error: any) {
      toast.error("Failed to fetch invoice: " + error.message);
      navigate("/sale/invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setSaving(true);
    try {
      const { subtotal, totalTax, grandTotal } = calculateTotals(items);

      // Update invoice
      const { error: invoiceError } = await supabase
        .from("sale_invoices")
        .update({
          invoice_date: invoiceDate,
          due_date: dueDate || null,
          party_id: partyId,
          subtotal,
          discount_amount: 0,
          tax_amount: totalTax,
          total_amount: grandTotal,
          notes,
          terms,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (invoiceError) throw invoiceError;

      // Delete existing items
      await supabase.from("sale_invoice_items").delete().eq("sale_invoice_id", id);

      // Insert updated items
      const itemsToInsert = items.filter(item => item.itemId).map(item => {
        const itemSubtotal = item.quantity * item.rate;
        const taxAmount = (itemSubtotal * item.taxRate) / 100;
        
        return {
          sale_invoice_id: id,
          item_id: item.itemId || null,
          item_name: item.name,
          quantity: item.quantity,
          rate: item.rate,
          tax_rate: item.taxRate,
          tax_amount: taxAmount,
          discount_percent: 0,
          discount_amount: 0,
          total: item.amount,
          hsn_code: null,
          unit: item.unit,
        };
      });

      const { error: itemsError } = await supabase
        .from("sale_invoice_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success("Invoice updated successfully");
      restoreSidebarAfterSave();
      navigate(`/sale/invoices/${id}`);
    } catch (error: any) {
      toast.error("Failed to update invoice: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/sale/invoices")} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold truncate">Edit Invoice {invoiceNumber}</h1>
            <p className="text-muted-foreground text-sm hidden md:block">Update invoice details</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={() => navigate(`/sale/invoices/${id}`)} className="flex-1 md:flex-none" size="sm">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1 md:flex-none" size="sm">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Invoice Details */}
          <div className="metric-card p-4 md:p-6">
            <h3 className="font-semibold mb-4">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Invoice Number</Label>
                <Input value={invoiceNumber} disabled />
              </div>
              <div>
                <Label>Invoice Date</Label>
                <Input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Party Selection */}
          <div className="metric-card p-4 md:p-6">
            <h3 className="font-semibold mb-4">Customer</h3>
            <PartySelector
              partyType="customer"
              value={partyId}
              onChange={setPartyId}
            />
          </div>

          {/* Items */}
          <div className="metric-card p-4 md:p-6">
            <h3 className="font-semibold mb-4">Items</h3>
            <SaleInvoiceItemsTable items={items} onItemsChange={setItems} />
          </div>

          {/* Notes & Terms */}
          <div className="metric-card p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Notes</Label>
                <Textarea
                  placeholder="Add notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Terms & Conditions</Label>
                <Textarea
                  placeholder="Add terms..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-4 md:space-y-6">
          <div className="metric-card p-4 md:p-6">
            <h3 className="font-semibold mb-4">Summary</h3>
            <TaxSummary items={items} />
          </div>
        </div>
      </div>
    </div>
  );
}
