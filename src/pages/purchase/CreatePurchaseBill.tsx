// @ts-nocheck
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Printer, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PartySelector } from "@/components/sale/PartySelector";
import { PurchaseInvoiceItemsTable, PurchaseInvoiceItem } from "@/components/purchase/PurchaseInvoiceItemsTable";
import { TaxSummary } from "@/components/sale/TaxSummary";
import { InvoicePreview } from "@/components/sale/InvoicePreview";
import { useInvoiceSave } from "@/hooks/useInvoiceSave";
import { useAuth } from "@/contexts/AuthContext";
import { useBusinessSettings } from "@/contexts/BusinessContext";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format } from "date-fns";
import { useAutoHideSidebar, restoreSidebarAfterSave } from "@/components/layout/Sidebar";

export default function CreatePurchaseBill() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { businessSettings } = useBusinessSettings();
  const { selectedBusiness } = useBusinessSelection();
  const { saveInvoice, loading } = useInvoiceSave();
  
  // Auto-hide sidebar when on this page
  useAutoHideSidebar(true);
  
  const today = new Date();
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(format(today, "yyyy-MM-dd"));
  const [dueDate, setDueDate] = useState(format(addDays(today, 30), "yyyy-MM-dd"));
  const [selectedParty, setSelectedParty] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [items, setItems] = useState<PurchaseInvoiceItem[]>([
    { id: 1, itemId: "", categoryId: "", name: "", quantity: 1, unit: "Bottles", rate: 0, taxRate: 0, amount: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [paymentMode, setPaymentMode] = useState<string>("");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Generate bill number on mount - filtered by business_id
  useEffect(() => {
    if (user && selectedBusiness) {
      generateBillNumber();
    }
  }, [user, selectedBusiness]);

  // Update due date when bill date changes
  useEffect(() => {
    if (billDate) {
      const newDueDate = addDays(new Date(billDate), businessSettings?.default_payment_terms || 30);
      setDueDate(format(newDueDate, "yyyy-MM-dd"));
    }
  }, [billDate, businessSettings?.default_payment_terms]);

  const generateBillNumber = async () => {
    if (!selectedBusiness) return;
    
    try {
      const prefix = businessSettings?.purchase_prefix || "PUR-";
      
      // Get ALL invoice numbers to find the highest number
      const { data: existingInvoices } = await supabase
        .from("purchase_invoices")
        .select("invoice_number")
        .eq("business_id", selectedBusiness.id)
        .ilike("invoice_number", `${prefix}%`);

      let maxNum = 0;
      if (existingInvoices && existingInvoices.length > 0) {
        for (const inv of existingInvoices) {
          const match = inv.invoice_number?.match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
          }
        }
      }

      setBillNumber(`${prefix}${String(maxNum + 1).padStart(3, "0")}`);
    } catch (error) {
      console.error("Error generating bill number:", error);
      setBillNumber("PUR-001");
    }
  };

  const handleSave = async () => {
    const result = await saveInvoice({
      invoiceType: "purchase_bill",
      invoiceNumber: billNumber,
      invoiceDate: new Date(billDate),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      partyId: selectedParty,
      items,
      notes,
      paymentMode,
      paymentAmount,
    });

    if (result) {
      restoreSidebarAfterSave();
      navigate("/purchase/bills");
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link to="/purchase/bills">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-2xl font-bold truncate">New Purchase Invoice</h1>
            <p className="text-muted-foreground text-sm hidden md:block">Create a new purchase invoice</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="gap-2 flex-1 md:flex-none" onClick={() => setShowPreview(true)} size="sm">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button className="btn-gradient gap-2 flex-1 md:flex-none" onClick={handleSave} disabled={loading} size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Bill Details */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Invocie Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billNo">Invocie Number</Label>
                <Input id="billNo" value={billNumber} onChange={(e) => setBillNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billDate">Invoice Date</Label>
                <Input
                  id="billDate"
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Supplier Selection */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Supplier Details</h3>
            <PartySelector
              value={selectedParty}
              onChange={setSelectedParty}
              partyType="supplier"
              label="Select Supplier"
            />
          </div>

          {/* Items Table */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Items</h3>
            <PurchaseInvoiceItemsTable items={items} onItemsChange={setItems} />
          </div>

          {/* Payment */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Payment</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Amount</Label>
                <NumberInput
                  value={paymentAmount}
                  onChange={(val) => setPaymentAmount(val)}
                  disabled={!paymentMode || paymentMode === "none"}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              If payment is made, select the mode and enter amount. Leave empty for credit invoice.
            </p>
          </div>

          {/* Notes */}
          <div className="metric-card">
            <h3 className="font-semibold mb-4">Notes</h3>
            <Textarea
              placeholder="Add any notes or terms..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="metric-card sticky top-4 p-3">
            <h2 className="text-sm font-semibold mb-2">Invoice Summary</h2>
            <TaxSummary items={items} invoiceType="purchase" paymentAmount={paymentAmount} />
          </div>
        </div>
      </div>

      {/* Invoice Preview Dialog */}
      <InvoicePreview
        open={showPreview}
        onOpenChange={setShowPreview}
        documentType="Purchase Invoice"
        documentNumber={billNumber}
        date={billDate}
        partyId={selectedParty}
        items={items}
        notes={notes}
      />
    </div>
  );
}
