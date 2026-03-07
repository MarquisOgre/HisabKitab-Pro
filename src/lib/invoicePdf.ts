import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

interface InvoiceItem {
  item_name: string;
  quantity: number;
  rate: number;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number;
  unit: string | null;
  item_id?: string | null;
}

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
  tcs_amount?: number | null;
  tds_amount?: number | null;
  status: string | null;
  notes: string | null;
  terms: string | null;
  parties?: {
    name: string;
    phone: string | null;
    email: string | null;
    billing_address: string | null;
    gstin: string | null;
  } | null;
}

interface BusinessSettings {
  business_name: string | null;
  gstin: string | null;
  phone: string | null;
  email: string | null;
  business_address: string | null;
  logo_url: string | null;
  tcs_receivable?: number | null;
  tcs_payable?: number | null;
  tds_receivable?: number | null;
  tds_payable?: number | null;
  use_global_logo?: boolean | null;
  global_logo_url?: string | null;
  // Print settings
  show_logo_on_invoice?: boolean | null;
  show_bank_details?: boolean | null;
  show_qr_code?: boolean | null;
  // Bank details for printing
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  upi_id?: string | null;
}

interface GeneratePDFParams {
  invoice: Invoice;
  items: InvoiceItem[];
  settings: BusinessSettings | null;
  type: "sale" | "purchase";
}

// Helper function to format currency properly
function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function buildInvoicePDFDoc({ invoice, items, settings, type }: GeneratePDFParams): Promise<jsPDF> {
  const doc = new jsPDF();
  
  // Filter out empty rows (items without valid item_id or item_name)
  const validItems = items.filter(item => item.item_name && item.item_name.trim() !== '');
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;

  const headerY = 18;
  const leftColX = 14;
  const rightColX = pageWidth - 14;

  // Check if logo should be shown (default to true if not set)
  const showLogo = settings?.show_logo_on_invoice ?? true;
  const showBankDetails = settings?.show_bank_details ?? true;
  const showQrCode = settings?.show_qr_code ?? false;

  // Calculate header content heights first to determine vertical centering
  const logoHeight = 40; // Fixed logo height
  const logoWidth = 40;  // Fixed logo width
  const headerRowHeight = Math.max(logoHeight, 28); // Minimum height for header row
  const verticalCenterY = headerY + headerRowHeight / 2;

  // LEFT COLUMN - Business Name and details (vertically centered)
  const leftLines: string[] = [];
  const businessName = settings?.business_name || "Your Business";
  leftLines.push(businessName);
  if (settings?.business_address) leftLines.push(settings.business_address);
  if (settings?.phone) leftLines.push(`Phone: ${settings.phone}`);
  if (settings?.gstin) leftLines.push(`GSTIN: ${settings.gstin}`);
  const leftContentHeight = 6 + (leftLines.length - 1) * 4;

  let leftStartY = verticalCenterY - leftContentHeight / 2;

  // Business name in a distinctive color (dark blue)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(25, 65, 133); // Dark blue color for business name
  doc.text(leftLines[0], leftColX, leftStartY);
  leftStartY += 6;

  // Reset to black for other details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  for (let i = 1; i < leftLines.length; i++) {
    doc.text(leftLines[i], leftColX, leftStartY);
    leftStartY += 4;
  }

  // CENTER COLUMN - hisabkitab Logo (always show hisabkitab_logo.png from public folder)
  const centerLogoY = verticalCenterY - logoHeight / 2;

  // Always use the hisabkitab logo from public folder
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = "/hisabkitab_logo.png";
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(img, 0, 0);
    const dataURL = canvas.toDataURL("image/png");

    // Fixed logo dimensions to prevent squeezing
    const fixedLogoWidth = 40;
    const fixedLogoHeight = 40;
    doc.addImage(dataURL, "PNG", centerX - fixedLogoWidth / 2, centerLogoY, fixedLogoWidth, fixedLogoHeight);
  } catch (error) {
    console.error("Failed to load logo:", error);
  }

  // RIGHT COLUMN - Invoice title and details (vertically centered)
  const rightLines: string[] = [];
  const title = type === "sale" ? "TAX INVOICE" : "PURCHASE INVOICE";
  rightLines.push(title);
  rightLines.push(`Invoice #: ${invoice.invoice_number}`);
  rightLines.push(`Date: ${format(new Date(invoice.invoice_date), "dd MMM yyyy")}`);
  if (invoice.due_date) {
    rightLines.push(`Due: ${format(new Date(invoice.due_date), "dd MMM yyyy")}`);
  }
  const rightContentHeight = 6 + (rightLines.length - 1) * 4;

  let rightStartY = verticalCenterY - rightContentHeight / 2;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(rightLines[0], rightColX, rightStartY, { align: "right" });
  rightStartY += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  for (let i = 1; i < rightLines.length; i++) {
    doc.text(rightLines[i], rightColX, rightStartY, { align: "right" });
    rightStartY += 4;
  }

  // Calculate yPos after header row
  let yPos = headerY + headerRowHeight + 5;

  // Party Info Box
  const partyLabel = type === "sale" ? "Bill To:" : "Supplier:";
  yPos += 10;

  doc.setFillColor(245, 245, 245);
  doc.rect(14, yPos, pageWidth - 28, 30, "F");

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(partyLabel, 18, yPos + 8);

  doc.setFont("helvetica", "normal");
  doc.text(invoice.parties?.name || "Walk-in Customer", 18, yPos + 15);

  let partyY = yPos + 21;
  if (invoice.parties?.billing_address) {
    doc.text(invoice.parties.billing_address, 18, partyY);
    partyY += 5;
  }
  if (invoice.parties?.gstin) {
    doc.text(`GSTIN: ${invoice.parties.gstin}`, 18, partyY);
  }

  // Items Table
  yPos += 40;

  // Check if any item has tax > 0
  const hasTax = validItems.some(item => (item.tax_rate || 0) > 0 || (item.tax_amount || 0) > 0);

  // Build table data conditionally (using validItems)
  const tableData = validItems.map((item, index) => {
    const row: string[] = [
      (index + 1).toString(),
      item.item_name,
      item.quantity.toString(),
      item.unit || "pcs",
      formatCurrency(item.rate),
    ];
    if (hasTax) {
      row.push(item.tax_rate ? `${item.tax_rate}%` : "-");
    }
    row.push(formatCurrency(item.total));
    return row;
  });

  // Build headers conditionally (HSN removed)
  const tableHeaders = ["#", "Item", "Qty", "Unit", "Rate"];
  if (hasTax) {
    tableHeaders.push("Tax");
  }
  tableHeaders.push("Amount");

  const tableFn = (autoTable as any) || (doc as any).autoTable;
  if (typeof tableFn !== "function") {
    throw new Error("PDF table generator not available (jspdf-autotable not loaded)");
  }

  // Build column styles conditionally (HSN column removed)
  const columnStyles: Record<number, any> = {
    0: { cellWidth: 10 },
    1: { cellWidth: "auto" },
    2: { cellWidth: 18, halign: "right" },
    3: { cellWidth: 18 },
    4: { cellWidth: 28, halign: "right" },
  };
  
  if (hasTax) {
    columnStyles[5] = { cellWidth: 20, halign: "right" };
    columnStyles[6] = { cellWidth: 32, halign: "right" };
  } else {
    columnStyles[5] = { cellWidth: 32, halign: "right" };
  }

  tableFn(doc, {
    startY: yPos,
    head: [tableHeaders],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles,
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const summaryX = pageWidth - 85;

  const subtotal = invoice.subtotal || 0;
  const taxAmount = invoice.tax_amount || 0;
  const discountAmount = invoice.discount_amount || 0;

  // Get TCS and TDS from invoice
  const tcsRate = type === "sale" ? (settings?.tcs_receivable ?? 0) : (settings?.tcs_payable ?? 0);
  const tdsRate = type === "sale" ? (settings?.tds_receivable ?? 0) : (settings?.tds_payable ?? 0);
  const tcsAmount = invoice.tcs_amount ?? (tcsRate > 0 ? ((subtotal - discountAmount + taxAmount) * tcsRate) / 100 : 0);
  const tdsAmount = invoice.tds_amount ?? (tdsRate > 0 ? (subtotal * tdsRate) / 100 : 0);

  const totalAmount = invoice.total_amount || 0;
  const paidAmount = invoice.paid_amount || 0;
  const balanceDue = totalAmount - paidAmount;

  doc.setFontSize(10);
  let summaryY = finalY;

  doc.text("Subtotal:", summaryX, summaryY);
  doc.text(formatCurrency(subtotal), pageWidth - 14, summaryY, { align: "right" });
  summaryY += 6;

  if (discountAmount > 0) {
    doc.text("Discount:", summaryX, summaryY);
    doc.text(`-${formatCurrency(discountAmount)}`, pageWidth - 14, summaryY, { align: "right" });
    summaryY += 6;
  }

  // Only show GST line if tax amount > 0
  if (taxAmount > 0) {
    doc.text("GST:", summaryX, summaryY);
    doc.text(formatCurrency(taxAmount), pageWidth - 14, summaryY, { align: "right" });
    summaryY += 6;
  }

  if (tcsAmount > 0) {
    doc.text(`TCS @ ${tcsRate}%:`, summaryX, summaryY);
    doc.text(formatCurrency(tcsAmount), pageWidth - 14, summaryY, { align: "right" });
    summaryY += 6;
  }

  if (tdsAmount > 0) {
    doc.text(`TDS @ ${tdsRate}%:`, summaryX, summaryY);
    doc.text(`-${formatCurrency(tdsAmount)}`, pageWidth - 14, summaryY, { align: "right" });
    summaryY += 6;
  }

  summaryY += 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total:", summaryX, summaryY);
  doc.text(formatCurrency(totalAmount), pageWidth - 14, summaryY, { align: "right" });
  summaryY += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Paid:", summaryX, summaryY);
  doc.text(formatCurrency(paidAmount), pageWidth - 14, summaryY, { align: "right" });
  summaryY += 6;

  doc.setFont("helvetica", "bold");
  doc.text("Balance Due:", summaryX, summaryY);
  doc.text(formatCurrency(balanceDue), pageWidth - 14, summaryY, { align: "right" });

  // Notes & Terms
  let footerY = summaryY;
  if (invoice.notes || invoice.terms) {
    footerY += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    if (invoice.notes) {
      doc.setFont("helvetica", "bold");
      doc.text("Notes:", 14, footerY);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.notes, 14, footerY + 5, { maxWidth: 80 });
    }

    if (invoice.terms) {
      doc.setFont("helvetica", "bold");
      doc.text("Terms & Conditions:", 100, footerY);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.terms, 100, footerY + 5, { maxWidth: 80 });
    }
  }

  // Bank Details Section (if enabled)
  if (showBankDetails && type === "sale") {
    footerY += 30;
    
    // Draw a separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, footerY, pageWidth - 14, footerY);
    footerY += 8;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details:", 14, footerY);
    footerY += 5;
    
    doc.setFont("helvetica", "normal");
    if (settings?.bank_name) {
      doc.text(`Bank: ${settings.bank_name}`, 14, footerY);
      footerY += 4;
    }
    if (settings?.bank_account_number) {
      doc.text(`A/C No: ${settings.bank_account_number}`, 14, footerY);
      footerY += 4;
    }
    if (settings?.bank_ifsc) {
      doc.text(`IFSC: ${settings.bank_ifsc}`, 14, footerY);
      footerY += 4;
    }
    if (settings?.upi_id) {
      doc.text(`UPI: ${settings.upi_id}`, 14, footerY);
      footerY += 4;
    }
  }

  // QR Code placeholder (if enabled)
  if (showQrCode && settings?.upi_id && type === "sale") {
    // Note: Actual QR code generation would require a QR library
    // For now, we'll add a placeholder text indicating UPI payment option
    const qrX = pageWidth - 60;
    const qrY = footerY - 25;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("Scan to Pay:", qrX, qrY);
    doc.text(settings.upi_id, qrX, qrY + 4);
    
    // Draw a placeholder box for QR
    doc.setDrawColor(150, 150, 150);
    doc.rect(qrX, qrY + 8, 40, 40);
    doc.setFontSize(7);
    doc.text("UPI QR Code", qrX + 5, qrY + 30);
  }

  return doc;
}

export async function generateInvoicePDF(params: GeneratePDFParams) {
  const doc = await buildInvoicePDFDoc(params);
  doc.save(`${params.invoice.invoice_number}.pdf`);
}

export async function printInvoicePDF(params: GeneratePDFParams) {
  // Open immediately to avoid popup blockers (must be inside user gesture)
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("Could not open print window");
  }

  // Provide immediate feedback in case PDF generation takes time
  printWindow.document.open();
  printWindow.document.write(`<!doctype html><html><head><title>${params.invoice.invoice_number}</title>
    <meta charset="utf-8" />
    <style>
      html,body{margin:0;padding:0;height:100%;background:#fff;}
      .wrap{height:100%;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;}
      a{color:inherit;}
    </style>
  </head><body><div class="wrap">Preparing invoice PDF…</div></body></html>`);
  printWindow.document.close();

  const doc = await buildInvoicePDFDoc(params);

  // Ask PDF viewers to auto-open the print dialog when possible
  try {
    (doc as any).autoPrint?.({ variant: "non-conform" });
  } catch {
    // ignore
  }

  // Prefer blob output if available; fallback to arraybuffer for older/newer jsPDF versions.
  let blob: Blob;
  try {
    const maybeBlob = doc.output("blob") as unknown;
    blob = maybeBlob instanceof Blob ? maybeBlob : new Blob([doc.output("arraybuffer") as ArrayBuffer], { type: "application/pdf" });
  } catch {
    blob = new Blob([doc.output("arraybuffer") as ArrayBuffer], { type: "application/pdf" });
  }

  const blobUrl = URL.createObjectURL(blob);

  // Navigate the opened window directly to the PDF.
  // This is more reliable than embedding PDF in an iframe across browsers/PDF viewers.
  try {
    printWindow.location.href = blobUrl;
  } catch {
    // If navigation fails, show a clickable link as a last resort.
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><title>${params.invoice.invoice_number}</title></head>
      <body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:16px;">
        <p>Could not open the print preview automatically.</p>
        <p><a href="${blobUrl}" target="_self" rel="noreferrer">Click here to open the invoice PDF</a></p>
      </body></html>`);
    printWindow.document.close();
  }

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
