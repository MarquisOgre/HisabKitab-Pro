import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminUserId } from "@/hooks/useAdminUserId";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { recordCashBankTransaction } from "@/hooks/useCashBankTransaction";
import { toast } from "sonner";
// @ts-nocheck
// Generic item interface for both sale and purchase
interface BaseInvoiceItem {
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
  rate: number;
  taxRate: number;
}

interface SaveInvoiceParams {
  invoiceType: string;
  invoiceNumber: string;
  invoiceDate: Date;
  dueDate?: Date;
  partyId: string;
  items: BaseInvoiceItem[];
  notes?: string;
  paymentMode?: string;
  paymentAmount?: number;
}

export function useInvoiceSave() {
  const { user } = useAuth();
  const { adminUserId } = useAdminUserId();
  const { selectedBusiness } = useBusinessSelection();
  const [loading, setLoading] = useState(false);

  const saveInvoice = async ({
    invoiceType,
    invoiceNumber,
    invoiceDate,
    dueDate,
    partyId,
    items,
    notes,
    paymentMode,
    paymentAmount,
  }: SaveInvoiceParams) => {
    if (!user || !adminUserId) {
      toast.error("Please login to save");
      return null;
    }

    if (!selectedBusiness) {
      toast.error("Please select a business");
      return null;
    }

    if (!partyId) {
      toast.error("Please select a party");
      return null;
    }

    const validItems = items.filter((item) => item.itemId);
    if (validItems.length === 0) {
      toast.error("Please add at least one item");
      return null;
    }

    // Validate that all items have quantity > 0
    for (const item of validItems) {
      if (item.quantity <= 0) {
        toast.error(`Quantity must be greater than 0 for "${item.name || 'selected item'}"`);
        return null;
      }
    }

    // Stock validation for sale invoices
    if (invoiceType === "sale_invoice") {
      for (const item of validItems) {
        const { data: itemData } = await supabase
          .from("items")
          .select("current_stock, name")
          .eq("id", item.itemId)
          .single();
        
        if (itemData && item.quantity > (itemData.current_stock || 0)) {
          toast.error(`Insufficient stock for "${itemData.name}". Available: ${itemData.current_stock || 0}, Requested: ${item.quantity}`);
          return null;
        }
      }
    }

    setLoading(true);
    try {
      // Get business settings for GST, TCS, TDS - use admin's settings filtered by business
      const { data: settings } = await supabase
        .from("business_settings")
        .select("gst_receivable, gst_payable, tcs_receivable, tcs_payable, tds_receivable, tds_payable")
        .eq("user_id", adminUserId)
        .eq("business_id", selectedBusiness.id)
        .maybeSingle();

      // Determine if it's a sale or purchase type
      const isSaleType = ["sale", "sale_invoice", "sale_return", "sale_order", "estimation", "proforma", "delivery_challan"].includes(invoiceType);

      // Get tax rates based on invoice type
      const gstRate = isSaleType 
        ? (settings?.gst_receivable ?? 0) 
        : (settings?.gst_payable ?? 0);
      const tcsRate = isSaleType 
        ? (settings?.tcs_receivable ?? 0) 
        : (settings?.tcs_payable ?? 0);
      const tdsRate = isSaleType 
        ? (settings?.tds_receivable ?? 0) 
        : (settings?.tds_payable ?? 0);

      // Calculate totals
      let subtotal = 0;
      let itemLevelTax = 0;

      validItems.forEach((item) => {
        const itemSubtotal = item.quantity * item.rate;
        // Use item's tax rate for item-level GST
        const itemTax = item.taxRate > 0 ? (itemSubtotal * item.taxRate) / 100 : 0;
        
        subtotal += itemSubtotal;
        itemLevelTax += itemTax;
      });

      // Apply global GST rate if no item-level taxes were applied
      const gstAmount = itemLevelTax > 0 ? itemLevelTax : (gstRate > 0 ? (subtotal * gstRate) / 100 : 0);
      const taxAmount = gstAmount;

      // Calculate TCS - applies on (taxable + GST)
      const tcsAmount = tcsRate > 0 
        ? ((subtotal + taxAmount) * tcsRate) / 100 
        : 0;

      // Calculate TDS - on taxable amount (deduction)
      const tdsAmount = tdsRate > 0 
        ? (subtotal * tdsRate) / 100 
        : 0;

      const totalAmount = Math.round(subtotal + taxAmount + tcsAmount - tdsAmount);

      // Calculate payment details
      const actualPayment = (paymentMode && paymentMode !== "none" && paymentAmount && paymentAmount > 0) 
        ? Math.min(paymentAmount, totalAmount) 
        : 0;
      const balanceDue = totalAmount - actualPayment;
      const status = balanceDue <= 0 ? "paid" : (actualPayment > 0 ? "partial" : "unpaid");

      // Determine which table to use based on invoice type
      const tableName = isSaleType ? "sale_invoices" : "purchase_invoices";

      // Insert invoice into appropriate table
      const { data: invoice, error: invoiceError } = await supabase
        .from(tableName)
        .insert({
          user_id: adminUserId,
          business_id: selectedBusiness.id,
          invoice_type: invoiceType,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate.toISOString().split("T")[0],
          due_date: dueDate ? dueDate.toISOString().split("T")[0] : null,
          party_id: partyId,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: 0,
          tcs_amount: tcsAmount,
          tds_amount: tdsAmount,
          total_amount: totalAmount,
          paid_amount: actualPayment,
          balance_due: balanceDue,
          notes: notes || null,
          status,
        })
        .select()
        .single();

      if (invoiceError) {
        console.error("Invoice insert error:", invoiceError);
        throw invoiceError;
      }

      // Insert items into appropriate items table
      const invoiceItemsData = validItems.map((item) => {
        const itemSubtotal = item.quantity * item.rate;
        const itemTax = (itemSubtotal * item.taxRate) / 100;
        const total = itemSubtotal + itemTax;

        return {
          item_id: item.itemId,
          item_name: item.name,
          hsn_code: null,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          discount_percent: 0,
          discount_amount: 0,
          tax_rate: item.taxRate,
          tax_amount: itemTax,
          total,
        };
      });

      if (isSaleType) {
        const saleItems = invoiceItemsData.map(item => ({
          ...item,
          sale_invoice_id: invoice.id,
          business_id: selectedBusiness.id,
        }));
        const { error: itemsError } = await supabase
          .from("sale_invoice_items")
          .insert(saleItems);
        if (itemsError) {
          console.error("Items insert error:", itemsError);
          throw itemsError;
        }
      } else {
        const purchaseItems = invoiceItemsData.map(item => ({
          ...item,
          purchase_invoice_id: invoice.id,
          business_id: selectedBusiness.id,
        }));
        const { error: itemsError } = await supabase
          .from("purchase_invoice_items")
          .insert(purchaseItems);
        if (itemsError) {
          console.error("Items insert error:", itemsError);
          throw itemsError;
        }
      }

      // Update stock based on invoice type
      for (const item of validItems) {
        const { data: currentItem } = await supabase
          .from("items")
          .select("current_stock")
          .eq("id", item.itemId)
          .single();

        if (currentItem) {
          const stockChange = isSaleType ? -item.quantity : item.quantity;
          const newStock = (currentItem.current_stock || 0) + stockChange;

          await supabase
            .from("items")
            .update({ current_stock: newStock })
            .eq("id", item.itemId);
        }
      }

      // Record payment if any amount was paid during invoice creation
      if (actualPayment > 0 && paymentMode && paymentMode !== "none") {
        // Generate payment number
        const { data: existingPayments } = await supabase
          .from("payments")
          .select("payment_number")
          .order("created_at", { ascending: false })
          .limit(1);

        let paymentNumber = "REC-001";
        if (existingPayments && existingPayments.length > 0) {
          const lastPayment = existingPayments[0].payment_number;
          const match = lastPayment.match(/(\d+)$/);
          if (match) {
            const nextNum = parseInt(match[1]) + 1;
            const prefix = lastPayment.replace(/\d+$/, "");
            paymentNumber = `${prefix}${String(nextNum).padStart(3, "0")}`;
          }
        }

        const paymentType = isSaleType ? "in" : "out";
        const invoiceIdColumn = isSaleType ? "sale_invoice_id" : "purchase_invoice_id";

        // Insert payment record
        const { error: paymentError } = await supabase
          .from("payments")
          .insert({
            user_id: adminUserId,
            business_id: selectedBusiness.id,
            party_id: partyId,
            [invoiceIdColumn]: invoice.id,
            payment_number: paymentNumber,
            payment_type: paymentType,
            payment_mode: paymentMode,
            amount: actualPayment,
            payment_date: invoiceDate.toISOString().split("T")[0],
            notes: `Payment for ${invoiceNumber}`,
          });

        if (paymentError) {
          console.error("Payment insert error:", paymentError);
          // Don't throw - invoice was saved successfully
        } else {
          // Record cash/bank transaction
          await recordCashBankTransaction({
            userId: adminUserId,
            businessId: selectedBusiness.id,
            paymentMode,
            amount: actualPayment,
            transactionType: paymentType,
            description: `Payment for ${invoiceNumber}`,
            referenceType: isSaleType ? "sale_invoice" : "purchase_invoice",
            referenceId: invoice.id,
            transactionDate: invoiceDate.toISOString().split("T")[0],
          });
        }
      }

      toast.success(`${isSaleType ? "Sale" : "Purchase"} invoice saved successfully`);
      return invoice;
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      toast.error(error.message || "Failed to save invoice");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { saveInvoice, loading };
}
