
-- Fix dummy data: reduce amounts to reasonable values (max ~10 lakhs)
-- Update sale invoices
UPDATE sale_invoices SET subtotal = 55800, tax_amount = '10044', total_amount = 65844, paid_amount = '65844', balance_due = 0 WHERE id = 'sinv-001';
UPDATE sale_invoices SET subtotal = 24000, tax_amount = '4320', total_amount = 27820, paid_amount = '15000', balance_due = 12820 WHERE id = 'sinv-002';
UPDATE sale_invoices SET subtotal = 8500, tax_amount = '1530', total_amount = 10030, paid_amount = '0', balance_due = 10030 WHERE id = 'sinv-003';

-- Update purchase invoices  
UPDATE purchase_invoices SET subtotal = 90000, tax_amount = '16200', total_amount = 106200, paid_amount = '106200', balance_due = 0 WHERE id = 'pinv-001';
UPDATE purchase_invoices SET subtotal = 27000, tax_amount = '4860', total_amount = 30860, paid_amount = '0', balance_due = 30860 WHERE id = 'pinv-002';

-- Update payments amounts (ensure they're proper numbers as text)
UPDATE payments SET amount = '65844' WHERE id = 'pay-001';
UPDATE payments SET amount = '15000' WHERE id = 'pay-002';
UPDATE payments SET amount = '106200' WHERE id = 'pay-003';
