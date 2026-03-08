
-- Add foreign key: items.category_id -> categories.id
ALTER TABLE public.items
  ADD CONSTRAINT fk_items_category
  FOREIGN KEY (category_id) REFERENCES public.categories(id)
  ON DELETE SET NULL;

-- Add foreign key: sale_invoices.party_id -> parties.id
ALTER TABLE public.sale_invoices
  ADD CONSTRAINT fk_sale_invoices_party
  FOREIGN KEY (party_id) REFERENCES public.parties(id)
  ON DELETE SET NULL;

-- Add foreign key: purchase_invoices.party_id -> parties.id
ALTER TABLE public.purchase_invoices
  ADD CONSTRAINT fk_purchase_invoices_party
  FOREIGN KEY (party_id) REFERENCES public.parties(id)
  ON DELETE SET NULL;
