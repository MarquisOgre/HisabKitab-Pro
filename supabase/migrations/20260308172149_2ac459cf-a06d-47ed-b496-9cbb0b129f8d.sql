
-- Fix: For party-level payments (no linked invoice), distribute to matching invoices
-- Find the invoice for party f1cdfc70 with balance 850 and mark it paid
UPDATE sale_invoices
SET paid_amount = total_amount::text,
    balance_due = 0,
    status = 'paid'
WHERE party_id = 'f1cdfc70-5973-4cab-92f5-33a83ecf313e'
  AND (is_deleted IS NULL OR is_deleted = false)
  AND balance_due > 0;
