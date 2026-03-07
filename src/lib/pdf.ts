import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  partyName: string;
  partyAddress?: string;
  partyGstin?: string;
  items: Array<{
    name: string;
    hsn?: string;
    quantity: number;
    rate: number;
    taxRate: number;
    taxAmount: number;
    total: number;
  }>;
  subtotal: number;
  taxAmount: number;
  discount?: number;
  total: number;
  businessName?: string;
  businessAddress?: string;
  businessGstin?: string;
  notes?: string;
  terms?: string;
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.businessName || 'INVOICE', 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (data.businessAddress) {
    doc.text(data.businessAddress, 14, 28);
  }
  if (data.businessGstin) {
    doc.text(`GSTIN: ${data.businessGstin}`, 14, 34);
  }
  
  // Invoice details
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - 14, 20, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${data.invoiceNumber}`, pageWidth - 14, 28, { align: 'right' });
  doc.text(`Date: ${data.invoiceDate}`, pageWidth - 14, 34, { align: 'right' });
  if (data.dueDate) {
    doc.text(`Due Date: ${data.dueDate}`, pageWidth - 14, 40, { align: 'right' });
  }
  
  // Bill To
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, 50);
  doc.setFont('helvetica', 'normal');
  doc.text(data.partyName, 14, 56);
  if (data.partyAddress) {
    doc.text(data.partyAddress, 14, 62);
  }
  if (data.partyGstin) {
    doc.text(`GSTIN: ${data.partyGstin}`, 14, 68);
  }
  
  // Items table
  const tableData = data.items.map((item, index) => [
    index + 1,
    item.name,
    item.hsn || '-',
    item.quantity,
    `₹${item.rate.toFixed(2)}`,
    `${item.taxRate}%`,
    `₹${item.taxAmount.toFixed(2)}`,
    `₹${item.total.toFixed(2)}`,
  ]);
  
  doc.autoTable({
    startY: 75,
    head: [['#', 'Item', 'HSN', 'Qty', 'Rate', 'Tax', 'Tax Amt', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20 },
      3: { cellWidth: 15 },
      4: { cellWidth: 25 },
      5: { cellWidth: 15 },
      6: { cellWidth: 25 },
      7: { cellWidth: 25 },
    },
  });
  
  // Get the final Y position after the table
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  // Totals
  const totalsX = pageWidth - 70;
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, finalY);
  doc.text(`₹${data.subtotal.toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });
  
  doc.text('Tax:', totalsX, finalY + 6);
  doc.text(`₹${data.taxAmount.toFixed(2)}`, pageWidth - 14, finalY + 6, { align: 'right' });
  
  if (data.discount && data.discount > 0) {
    doc.text('Discount:', totalsX, finalY + 12);
    doc.text(`-₹${data.discount.toFixed(2)}`, pageWidth - 14, finalY + 12, { align: 'right' });
  }
  
  doc.setFont('helvetica', 'bold');
  const totalY = data.discount ? finalY + 20 : finalY + 14;
  doc.text('Total:', totalsX, totalY);
  doc.text(`₹${data.total.toFixed(2)}`, pageWidth - 14, totalY, { align: 'right' });
  
  // Notes and Terms
  if (data.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', 14, totalY + 15);
    doc.setFont('helvetica', 'normal');
    doc.text(data.notes, 14, totalY + 21);
  }
  
  if (data.terms) {
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', 14, totalY + 30);
    doc.setFont('helvetica', 'normal');
    doc.text(data.terms, 14, totalY + 36);
  }
  
  return doc;
}

interface ReportData {
  title: string;
  subtitle?: string;
  dateRange?: string;
  columns: string[];
  rows: (string | number)[][];
  summary?: { label: string; value: string }[];
  logoUrl?: string;
}

export async function generateReportPDF(data: ReportData): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let headerY = 15;
  
  // Add Logo if provided
  if (data.logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = data.logoUrl!;
      });
      
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL("image/png");
      
      // Add logo at top center
      const logoWidth = 25;
      const logoHeight = 25;
      doc.addImage(dataURL, "PNG", pageWidth / 2 - logoWidth / 2, headerY, logoWidth, logoHeight);
      headerY += logoHeight + 5;
    } catch (error) {
      console.error("Failed to load logo for report:", error);
    }
  }
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, pageWidth / 2, headerY + 5, { align: 'center' });
  headerY += 10;
  
  if (data.subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(data.subtitle, pageWidth / 2, headerY + 3, { align: 'center' });
    headerY += 8;
  }
  
  if (data.dateRange) {
    doc.setFontSize(10);
    doc.text(data.dateRange, pageWidth / 2, headerY + 3, { align: 'center' });
    headerY += 8;
  }
  
  // Table
  doc.autoTable({
    startY: headerY + 5,
    head: [data.columns],
    body: data.rows,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246], textColor: 255 },
    styles: { fontSize: 9 },
  });
  
  // Summary
  if (data.summary && data.summary.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, finalY);
    
    doc.setFont('helvetica', 'normal');
    data.summary.forEach((item, index) => {
      doc.text(`${item.label}:`, 14, finalY + 8 + (index * 6));
      doc.text(item.value, 80, finalY + 8 + (index * 6));
    });
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(`${filename}.pdf`);
}
