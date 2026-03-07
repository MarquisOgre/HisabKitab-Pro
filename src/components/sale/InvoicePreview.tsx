import { useState, useEffect } from "react";
import { FileText, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessSettings } from "@/contexts/BusinessContext";

// Generic base item interface that works for both sale and purchase
interface BaseItem {
  id: number;
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
  amount: number;
}

interface InvoicePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: string;
  documentNumber: string;
  date: string;
  dueDate?: string;
  partyId: string;
  items: BaseItem[];
  notes?: string;
  invoiceType?: "sale" | "purchase";
}

interface Party {
  id: string;
  name: string;
  gstin: string | null;
  phone: string | null;
  billing_address: string | null;
}

export function InvoicePreview({
  open,
  onOpenChange,
  documentType,
  documentNumber,
  date,
  dueDate,
  partyId,
  items,
  notes,
  invoiceType = "sale",
}: InvoicePreviewProps) {
  const [party, setParty] = useState<Party | null>(null);
  const { businessSettings } = useBusinessSettings();

  useEffect(() => {
    if (partyId && open) {
      fetchParty();
    }
  }, [partyId, open]);

  const fetchParty = async () => {
    const { data } = await supabase
      .from("parties")
      .select("id, name, gstin, phone, billing_address")
      .eq("id", partyId)
      .maybeSingle();
    if (data) setParty(data);
  };

  // Calculate totals including TCS
  const validItems = items.filter(item => item.itemId);
  
  const grossSubtotal = validItems.reduce((acc, item) => acc + (item.quantity * item.rate), 0);

  const taxableAmount = grossSubtotal;

  const totalTax = validItems.reduce((acc, item) => {
    const itemSubtotal = item.quantity * item.rate;
    return acc + (itemSubtotal * item.taxRate) / 100;
  }, 0);

  // Calculate TCS (only for sale invoices)
  const tcsRate = businessSettings?.tcs_receivable ?? 0;
  const tcsAmount = invoiceType === "sale" && tcsRate > 0 
    ? ((taxableAmount + totalTax) * tcsRate) / 100 
    : 0;

  const grandTotal = Math.round(taxableAmount + totalTax + tcsAmount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Preview {documentType}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-white border border-border rounded-lg p-8 text-foreground">
          {/* Centered Header: Business Name, Logo, Document Type */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold">{businessSettings?.business_name || "Your Business"}</h1>
            
            {businessSettings?.logo_url ? (
              <div className="flex justify-center my-4">
                <img 
                  src={businessSettings.logo_url} 
                  alt="Business Logo" 
                  className="w-16 h-16 rounded-xl object-contain"
                />
              </div>
            ) : (
              <div className="flex justify-center my-4">
                <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-primary uppercase">{documentType}</h2>
          </div>
          
          {/* Two columns: Business Info (left) and Invoice Details (right) */}
          <div className="flex justify-between items-start mb-8">
            <div>
              {businessSettings?.business_address && (
                <p className="text-sm text-muted-foreground">{businessSettings.business_address}</p>
              )}
              {businessSettings?.gstin && (
                <p className="text-sm text-muted-foreground">GSTIN: {businessSettings.gstin}</p>
              )}
              {businessSettings?.phone && (
                <p className="text-sm text-muted-foreground">Phone: {businessSettings.phone}</p>
              )}
            </div>
            <div className="text-right">
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Number:</span> <span className="font-medium">{documentNumber}</span></p>
                <p><span className="text-muted-foreground">Date:</span> <span className="font-medium">{date}</span></p>
                {dueDate && <p><span className="text-muted-foreground">Due Date:</span> <span className="font-medium">{dueDate}</span></p>}
              </div>
            </div>
          </div>

          <div className="mb-8 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-2">Bill To:</p>
            {party ? (
              <div>
                <p className="font-bold text-lg">{party.name}</p>
                <p className="text-sm text-muted-foreground">{party.billing_address || "N/A"}</p>
                <p className="text-sm text-muted-foreground">GSTIN: {party.gstin || "N/A"}</p>
                <p className="text-sm text-muted-foreground">Phone: {party.phone || "N/A"}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No party selected</p>
            )}
          </div>

          <div className="mb-8 border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">#</th>
                  <th className="text-left py-3 px-4 font-medium">Item</th>
                  <th className="text-center py-3 px-4 font-medium">Qty</th>
                  <th className="text-right py-3 px-4 font-medium">Rate</th>
                  <th className="text-right py-3 px-4 font-medium">Tax</th>
                  <th className="text-right py-3 px-4 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {validItems.map((item, index) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4 font-medium">{item.name}</td>
                    <td className="py-3 px-4 text-center">{item.quantity} {item.unit}</td>
                    <td className="py-3 px-4 text-right">₹{item.rate.toLocaleString("en-IN")}</td>
                    <td className="py-3 px-4 text-right">{item.taxRate}%</td>
                    <td className="py-3 px-4 text-right font-medium">₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{grossSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>₹{totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              {tcsAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">TCS @ {tcsRate}%</span>
                  <span>₹{tcsAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Grand Total</span>
                <span className="text-primary">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {notes && (
            <div className="mt-8 pt-4 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-1">Notes:</p>
              <p className="text-sm">{notes}</p>
            </div>
          )}

          <div className="mt-12 pt-4 border-t border-border flex justify-between">
            <div className="text-sm text-muted-foreground">
              <p>Terms & Conditions Apply</p>
              <p>Thank you for your business!</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-8">Authorized Signature</p>
              <div className="w-32 h-0.5 bg-border"></div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
