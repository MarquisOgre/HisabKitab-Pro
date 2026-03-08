
-- Add foreign key: payments.party_id -> parties.id
ALTER TABLE public.payments
  ADD CONSTRAINT fk_payments_party
  FOREIGN KEY (party_id) REFERENCES public.parties(id)
  ON DELETE SET NULL;

-- Add foreign key: payments.sale_invoice_id -> sale_invoices.id
ALTER TABLE public.payments
  ADD CONSTRAINT fk_payments_sale_invoice
  FOREIGN KEY (sale_invoice_id) REFERENCES public.sale_invoices(id)
  ON DELETE SET NULL;

-- Add foreign key: payments.purchase_invoice_id -> purchase_invoices.id
ALTER TABLE public.payments
  ADD CONSTRAINT fk_payments_purchase_invoice
  FOREIGN KEY (purchase_invoice_id) REFERENCES public.purchase_invoices(id)
  ON DELETE SET NULL;
