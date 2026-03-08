import { useBusinessSettings } from "@/contexts/BusinessContext";

// Generic item interface that works for both sale and purchase
interface BaseInvoiceItem {
  quantity: number;
  rate: number;
  taxRate: number;
  amount?: number;
}

interface TaxSummaryProps {
  items: BaseInvoiceItem[];
  additionalCharges?: number;
  roundOff?: boolean;
  invoiceType?: "sale" | "purchase";
  paymentAmount?: number;
}

interface TaxBreakdown {
  rate: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export function TaxSummary({ 
  items, 
  additionalCharges = 0, 
  roundOff = true,
  invoiceType = "sale",
  paymentAmount = 0
}: TaxSummaryProps) {
  const { businessSettings } = useBusinessSettings();
  
  // Get tax rates from settings based on invoice type
  const gstRate = Number(invoiceType === "sale" 
    ? (businessSettings?.gst_receivable ?? 0) 
    : (businessSettings?.gst_payable ?? 0));
  const tcsRate = Number(invoiceType === "sale" 
    ? (businessSettings?.tcs_receivable ?? 0) 
    : (businessSettings?.tcs_payable ?? 0));
  const tdsRate = Number(invoiceType === "sale" 
    ? (businessSettings?.tds_receivable ?? 0) 
    : (businessSettings?.tds_payable ?? 0));
  
  // Calculate subtotal (before discount)
  const grossSubtotal = items.reduce((acc, item) => {
    return acc + (item.quantity * item.rate);
  }, 0);

  // Taxable amount = subtotal
  const taxableAmount = grossSubtotal;

  // Calculate GST on taxable amount using settings rate
  const gstAmount = gstRate > 0 ? (taxableAmount * gstRate) / 100 : 0;
  
  // Calculate TCS - applies on (taxable + GST)
  const tcsAmount = tcsRate > 0 
    ? ((taxableAmount + gstAmount) * tcsRate) / 100 
    : 0;
  
  // Calculate TDS - on taxable amount (deduction)
  const tdsAmount = tdsRate > 0 
    ? (taxableAmount * tdsRate) / 100 
    : 0;

  const grandTotalBeforeRound = taxableAmount + gstAmount + additionalCharges + tcsAmount - tdsAmount;
  const roundOffAmount = roundOff ? Math.round(grandTotalBeforeRound) - grandTotalBeforeRound : 0;
  const grandTotal = roundOff ? Math.round(grandTotalBeforeRound) : grandTotalBeforeRound;
  const netPayable = grandTotal - paymentAmount;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-muted/30 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>₹{grossSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Taxable Amount</span>
          <span>₹{taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        {gstRate > 0 && gstAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">GST @ {gstRate}%</span>
            <span>₹{gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        {tcsRate > 0 && tcsAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">TCS @ {tcsRate}%</span>
            <span>₹{tcsAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        {tdsRate > 0 && tdsAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">TDS @ {tdsRate}%</span>
            <span className="text-success">-₹{tdsAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        {additionalCharges > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Additional Charges</span>
            <span>₹{additionalCharges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        )}
        {roundOff && roundOffAmount !== 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Round Off</span>
            <span>{roundOffAmount >= 0 ? "+" : ""}₹{roundOffAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
          <span>Grand Total</span>
          <span className="text-primary">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        {paymentAmount > 0 && (
          <>
            <div className="flex justify-between text-sm text-success">
              <span>Payment Received</span>
              <span>-₹{paymentAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>Net {invoiceType === "purchase" ? "Payable" : "Receivable"}</span>
              <span className={netPayable > 0 ? "text-destructive" : "text-success"}>
                ₹{netPayable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function calculateTotals(items: BaseInvoiceItem[], additionalCharges = 0) {
  const subtotal = items.reduce((acc, item) => {
    const itemSubtotal = item.quantity * item.rate;
    return acc + itemSubtotal;
  }, 0);

  const totalTax = items.reduce((acc, item) => {
    const itemSubtotal = item.quantity * item.rate;
    return acc + (itemSubtotal * item.taxRate) / 100;
  }, 0);

  const grandTotal = Math.round(subtotal + totalTax + additionalCharges);

  return { subtotal, totalTax, grandTotal };
}
