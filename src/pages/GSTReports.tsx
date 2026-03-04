import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const gstr1Data = [
  { type: "B2B", invoices: 45, taxable: "₹8,42,000", cgst: "₹75,780", sgst: "₹75,780", igst: "₹0", total: "₹9,93,560" },
  { type: "B2C Large", invoices: 12, taxable: "₹2,15,000", cgst: "₹19,350", sgst: "₹19,350", igst: "₹0", total: "₹2,53,700" },
  { type: "B2C Small", invoices: 128, taxable: "₹4,56,000", cgst: "₹41,040", sgst: "₹41,040", igst: "₹0", total: "₹5,38,080" },
];

export default function GSTReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">GST Reports</h1>
          <p className="text-sm text-muted-foreground">GSTR-1, GSTR-3B, HSN Summary and more</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2"><Download className="w-4 h-4" /> Excel</Button>
          <Button variant="outline" className="gap-2"><FileText className="w-4 h-4" /> PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Output GST</p><p className="text-xl font-bold text-foreground mt-1">₹2,72,340</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Input GST</p><p className="text-xl font-bold text-foreground mt-1">₹1,85,200</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Net GST Payable</p><p className="text-xl font-bold text-destructive mt-1">₹87,140</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Filing Status</p><p className="text-xl font-bold text-warning mt-1">Pending</p></div>
      </div>

      <Tabs defaultValue="gstr1" className="w-full">
        <TabsList className="bg-secondary/50 p-1">
          <TabsTrigger value="gstr1">GSTR-1</TabsTrigger>
          <TabsTrigger value="gstr3b">GSTR-3B</TabsTrigger>
          <TabsTrigger value="hsn">HSN Summary</TabsTrigger>
          <TabsTrigger value="tax">Tax Liability</TabsTrigger>
        </TabsList>

        <TabsContent value="gstr1" className="mt-4">
          <div className="stat-card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">GSTR-1 Summary - March 2026</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Invoices</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Taxable</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">CGST</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">SGST</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">IGST</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {gstr1Data.map((r) => (
                  <tr key={r.type} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3 font-medium text-foreground">{r.type}</td>
                    <td className="px-5 py-3 text-center text-muted-foreground">{r.invoices}</td>
                    <td className="px-5 py-3 text-right text-foreground">{r.taxable}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{r.cgst}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{r.sgst}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{r.igst}</td>
                    <td className="px-5 py-3 text-right font-semibold text-foreground">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {["gstr3b", "hsn", "tax"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <div className="stat-card flex items-center justify-center h-48">
              <div className="text-center">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Select period to generate report</p>
                <Button variant="outline" size="sm" className="mt-3">Generate</Button>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
