
-- Add foreign keys between invoice items and invoices tables
ALTER TABLE public.purchase_invoice_items
  ADD CONSTRAINT fk_purchase_invoice_items_invoice
  FOREIGN KEY (purchase_invoice_id)
  REFERENCES public.purchase_invoices(id)
  ON DELETE CASCADE;

ALTER TABLE public.sale_invoice_items
  ADD CONSTRAINT fk_sale_invoice_items_invoice
  FOREIGN KEY (sale_invoice_id)
  REFERENCES public.sale_invoices(id)
  ON DELETE CASCADE;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
