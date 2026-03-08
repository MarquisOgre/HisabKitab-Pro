-- Fix existing invoices with NULL created_at by using invoice_date
UPDATE sale_invoices SET created_at = (invoice_date || 'T00:00:00Z')::timestamptz WHERE created_at IS NULL AND invoice_date IS NOT NULL;
UPDATE sale_invoices SET created_at = now() WHERE created_at IS NULL;

UPDATE purchase_invoices SET created_at = (invoice_date || 'T00:00:00Z')::timestamptz WHERE created_at IS NULL AND invoice_date IS NOT NULL;
UPDATE purchase_invoices SET created_at = now() WHERE created_at IS NULL;