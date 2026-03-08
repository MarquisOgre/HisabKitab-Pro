WITH purchase_qty AS (
  SELECT pii.item_id, COALESCE(SUM(pii.quantity), 0) as total_purchased
  FROM purchase_invoice_items pii
  JOIN purchase_invoices pi ON pi.id = pii.purchase_invoice_id
  WHERE (pi.is_deleted IS NULL OR pi.is_deleted = false)
  GROUP BY pii.item_id
),
sale_qty AS (
  SELECT sii.item_id, COALESCE(SUM(sii.quantity), 0) as total_sold
  FROM sale_invoice_items sii
  JOIN sale_invoices si ON si.id = sii.sale_invoice_id
  WHERE (si.is_deleted IS NULL OR si.is_deleted = false)
  GROUP BY sii.item_id
)
UPDATE items it
SET current_stock = (
  GREATEST(0, 
    COALESCE(CAST(NULLIF(it.opening_stock, '') AS numeric), 0) 
    + COALESCE(pq.total_purchased, 0) 
    - COALESCE(sq.total_sold, 0)
  )
)::text
FROM (SELECT id FROM items) i2
LEFT JOIN purchase_qty pq ON pq.item_id = i2.id
LEFT JOIN sale_qty sq ON sq.item_id = i2.id
WHERE it.id = i2.id;