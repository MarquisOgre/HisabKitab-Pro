
-- Recalculate paid_amount and balance_due for sale_invoices based on actual payments
WITH sale_payments AS (
  SELECT 
    sale_invoice_id,
    COALESCE(SUM(CAST(amount AS numeric)), 0) as total_paid
  FROM payments
  WHERE payment_type = 'in' AND sale_invoice_id IS NOT NULL
  GROUP BY sale_invoice_id
),
-- Also calculate distributed payments (party-level payments without linked invoice)
party_distributed AS (
  SELECT 
    si.id as invoice_id,
    si.party_id,
    CAST(si.total_amount AS numeric) as total_amount,
    COALESCE(sp.total_paid, 0) as linked_paid
  FROM sale_invoices si
  LEFT JOIN sale_payments sp ON sp.sale_invoice_id = si.id
  WHERE (si.is_deleted IS NULL OR si.is_deleted = false)
)
UPDATE sale_invoices si
SET 
  paid_amount = COALESCE(sp.total_paid, 0)::text,
  balance_due = GREATEST(0, COALESCE(CAST(si.total_amount AS numeric), 0) - COALESCE(sp.total_paid, 0))::bigint,
  status = CASE 
    WHEN COALESCE(sp.total_paid, 0) >= COALESCE(CAST(si.total_amount AS numeric), 0) THEN 'paid'
    WHEN COALESCE(sp.total_paid, 0) > 0 THEN 'partial'
    ELSE COALESCE(si.status, 'unpaid')
  END
FROM sale_payments sp
WHERE si.id = sp.sale_invoice_id;

-- Also fix sale invoices with no payments - reset corrupted values
UPDATE sale_invoices si
SET 
  paid_amount = '0',
  balance_due = GREATEST(0, COALESCE(CAST(si.total_amount AS numeric), 0))::bigint,
  status = CASE WHEN si.status = 'paid' THEN 'unpaid' ELSE COALESCE(si.status, 'unpaid') END
WHERE si.id NOT IN (SELECT DISTINCT sale_invoice_id FROM payments WHERE sale_invoice_id IS NOT NULL AND payment_type = 'in')
  AND (CAST(COALESCE(NULLIF(si.paid_amount, ''), '0') AS numeric) != 0 OR si.balance_due != COALESCE(CAST(si.total_amount AS numeric), 0)::bigint);

-- Same fix for purchase_invoices
WITH purchase_payments AS (
  SELECT 
    purchase_invoice_id,
    COALESCE(SUM(CAST(amount AS numeric)), 0) as total_paid
  FROM payments
  WHERE payment_type = 'out' AND purchase_invoice_id IS NOT NULL
  GROUP BY purchase_invoice_id
)
UPDATE purchase_invoices pi
SET 
  paid_amount = COALESCE(pp.total_paid, 0)::text,
  balance_due = GREATEST(0, COALESCE(CAST(pi.total_amount AS numeric), 0) - COALESCE(pp.total_paid, 0))::bigint,
  status = CASE 
    WHEN COALESCE(pp.total_paid, 0) >= COALESCE(CAST(pi.total_amount AS numeric), 0) THEN 'paid'
    WHEN COALESCE(pp.total_paid, 0) > 0 THEN 'partial'
    ELSE COALESCE(pi.status, 'unpaid')
  END
FROM purchase_payments pp
WHERE pi.id = pp.purchase_invoice_id;
