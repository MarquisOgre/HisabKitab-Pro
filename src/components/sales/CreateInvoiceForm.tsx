import { useState, useEffect, useMemo } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface InvoiceItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  discount: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function CreateInvoiceForm({ onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("customers").select("id, name").eq("user_id", user.id),
      supabase.from("products").select("*").eq("user_id", user.id).eq("is_deleted", false),
    ]).then(([c, p]) => {
      if (c.data) setCustomers(c.data);
      if (p.data) setProducts(p.data);
    });
  }, [user]);

  const addItem = () => {
    setItems([...items, { product_id: "", product_name: "", quantity: 1, price: 0, discount: 0, gst_rate: 0, gst_amount: 0, total: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === "product_id") {
      const prod = products.find(p => p.id === value);
      if (prod) {
        item.product_name = prod.name;
        item.price = Number(prod.sale_price);
        item.gst_rate = Number(prod.gst_rate || 0);
      }
    }

    const subtotal = item.quantity * item.price;
    const afterDiscount = subtotal - item.discount;
    item.gst_amount = Math.round((afterDiscount * item.gst_rate / 100) * 100) / 100;
    item.total = Math.round((afterDiscount + item.gst_amount) * 100) / 100;

    updated[index] = item;
    setItems(updated);
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + (i.quantity * i.price - i.discount), 0);
    const gst = items.reduce((s, i) => s + i.gst_amount, 0);
    const total = items.reduce((s, i) => s + i.total, 0);
    return { subtotal: Math.round(subtotal * 100) / 100, gst: Math.round(gst * 100) / 100, total: Math.round(total * 100) / 100 };
  }, [items]);

  const handleSave = async () => {
    if (!user) return;
    if (items.length === 0) { toast.error("Add at least one item"); return; }

    setSaving(true);
    try {
      const invNum = `INV-${Date.now().toString(36).toUpperCase()}`;
      const { data: invoice, error: invErr } = await supabase.from("invoices").insert({
        user_id: user.id,
        invoice_number: invNum,
        invoice_type: "sales",
        invoice_date: invoiceDate,
        customer_id: customerId || null,
        subtotal: totals.subtotal,
        gst_amount: totals.gst,
        total: totals.total,
        status: "unpaid",
      }).select().single();

      if (invErr) throw invErr;

      const invItems = items.map(i => ({
        invoice_id: invoice.id,
        product_id: i.product_id || null,
        product_name: i.product_name,
        quantity: i.quantity,
        price: i.price,
        discount: i.discount,
        gst_rate: i.gst_rate,
        gst_amount: i.gst_amount,
        total: i.total,
      }));

      const { error: itemsErr } = await supabase.from("invoice_items").insert(invItems);
      if (itemsErr) throw itemsErr;

      toast.success(`Invoice ${invNum} created!`);
      onSaved();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-8 overflow-y-auto">
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-4xl mx-4 mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Create Sales Invoice</h2>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger><SelectValue placeholder="Select customer (optional)" /></SelectTrigger>
                <SelectContent>
                  {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Invoice Date</Label>
              <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
            </div>
          </div>

          {/* Items table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold">Items</Label>
              <Button size="sm" variant="outline" onClick={addItem} className="gap-1 text-xs"><Plus className="w-3.5 h-3.5" /> Add Item</Button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary/50 text-xs text-muted-foreground uppercase">
                    <th className="text-left px-3 py-2">Product</th>
                    <th className="text-center px-3 py-2 w-20">Qty</th>
                    <th className="text-center px-3 py-2 w-24">Price</th>
                    <th className="text-center px-3 py-2 w-20">Disc</th>
                    <th className="text-center px-3 py-2 w-20">GST%</th>
                    <th className="text-right px-3 py-2 w-24">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="px-3 py-2">
                        <Select value={item.product_id} onValueChange={v => updateItem(i, "product_id", v)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select product" /></SelectTrigger>
                          <SelectContent>
                            {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2 py-2"><Input type="number" min={1} value={item.quantity} onChange={e => updateItem(i, "quantity", Number(e.target.value))} className="h-8 text-xs text-center" /></td>
                      <td className="px-2 py-2"><Input type="number" min={0} value={item.price} onChange={e => updateItem(i, "price", Number(e.target.value))} className="h-8 text-xs text-center" /></td>
                      <td className="px-2 py-2"><Input type="number" min={0} value={item.discount} onChange={e => updateItem(i, "discount", Number(e.target.value))} className="h-8 text-xs text-center" /></td>
                      <td className="px-2 py-2"><Input type="number" min={0} value={item.gst_rate} onChange={e => updateItem(i, "gst_rate", Number(e.target.value))} className="h-8 text-xs text-center" /></td>
                      <td className="px-3 py-2 text-right font-semibold text-xs">₹{item.total.toLocaleString()}</td>
                      <td className="px-2 py-2"><button onClick={() => removeItem(i)} className="p-1 hover:bg-destructive/10 rounded text-destructive"><Trash2 className="w-3.5 h-3.5" /></button></td>
                    </tr>
                  ))}
                  {items.length === 0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground text-xs">Click "Add Item" to add products</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">₹{totals.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span className="font-medium">₹{totals.gst.toLocaleString()}</span></div>
              <div className="flex justify-between border-t border-border pt-2"><span className="font-semibold">Grand Total</span><span className="font-bold text-lg">₹{totals.total.toLocaleString()}</span></div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Invoice"}</Button>
        </div>
      </div>
    </div>
  );
}
