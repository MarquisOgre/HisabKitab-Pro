// @ts-nocheck
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Eye, Calendar, Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { PartySelector } from "@/components/sale/PartySelector";
import { SaleInvoiceItemsTable, type InvoiceItem } from "@/components/sale/SaleInvoiceItemsTable";
import { TaxSummary } from "@/components/sale/TaxSummary";
import { InvoicePreview } from "@/components/sale/InvoicePreview";
import { useInvoiceSave } from "@/hooks/useInvoiceSave";
import { useAutoHideSidebar, restoreSidebarAfterSave } from "@/components/layout/Sidebar";

export default function CreateDeliveryChallan() {
  const navigate = useNavigate();
  const { saveInvoice, loading } = useInvoiceSave();
  
  // Auto-hide sidebar when on this page
  useAutoHideSidebar(true);
  const [dcNumber, setDcNumber] = useState("DC-001");
  const [dcDate, setDcDate] = useState<Date>(new Date());
  const [challanType, setChallanType] = useState("supply");
  const [transportMode, setTransportMode] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, itemId: "", categoryId: "", name: "", quantity: 0, availableStock: 0, saleQty: 0, unit: "pcs", rate: 0, taxRate: 0, amount: 0 },
  ]);

  const handleSave = async () => {
    const result = await saveInvoice({
      invoiceType: "delivery_challan",
      invoiceNumber: dcNumber,
      invoiceDate: dcDate,
      partyId: selectedParty,
      items,
      notes: `${notes}\nChallan Type: ${challanType}\nTransport: ${transportMode}\nVehicle: ${vehicleNumber}`,
    });

    if (result) {
      restoreSidebarAfterSave();
      navigate("/sale/dc");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/sale/dc"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create Delivery Challan</h1>
            <p className="text-muted-foreground">Generate delivery challan for goods dispatch</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-2">
            <Eye className="w-4 h-4" />Preview
          </Button>
          <Button onClick={handleSave} className="btn-gradient gap-2" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="metric-card">
            <h2 className="text-lg font-semibold mb-4">Challan Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Challan Number</Label>
                <Input value={dcNumber} onChange={(e) => setDcNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />{format(dcDate, "dd MMM yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={dcDate} onSelect={(d) => d && setDcDate(d)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Challan Type</Label>
                <Select value={challanType} onValueChange={setChallanType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supply">Supply</SelectItem>
                    <SelectItem value="job-work">Job Work</SelectItem>
                    <SelectItem value="exhibition">For Exhibition</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Transport Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Transport Mode</Label>
                <Select value={transportMode} onValueChange={setTransportMode}>
                  <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="road">Road</SelectItem>
                    <SelectItem value="rail">Rail</SelectItem>
                    <SelectItem value="air">Air</SelectItem>
                    <SelectItem value="ship">Ship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="MH 12 AB 1234" />
              </div>
            </div>
          </div>

          <div className="metric-card">
            <h2 className="text-lg font-semibold mb-4">Consignee Details</h2>
            <PartySelector value={selectedParty} onChange={setSelectedParty} partyType="customer" />
          </div>

          <div className="metric-card">
            <h2 className="text-lg font-semibold mb-4">Items</h2>
            <SaleInvoiceItemsTable items={items} onItemsChange={setItems} />
          </div>

          <div className="metric-card">
            <h2 className="text-lg font-semibold mb-4">Remarks</h2>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add remarks..." rows={3} />
          </div>
        </div>

        <div className="metric-card sticky top-6 h-fit">
          <h2 className="text-lg font-semibold mb-4">Summary</h2>
          <TaxSummary items={items} />
        </div>
      </div>

      <InvoicePreview open={showPreview} onOpenChange={setShowPreview} documentType="Delivery Challan" documentNumber={dcNumber} date={format(dcDate, "dd MMM yyyy")} partyId={selectedParty} items={items} notes={notes} />
    </div>
  );
}
