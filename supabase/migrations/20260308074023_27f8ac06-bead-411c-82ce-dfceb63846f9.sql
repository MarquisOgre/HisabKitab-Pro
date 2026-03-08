
-- Insert Categories
INSERT INTO categories (id, user_id, business_id, name, description) VALUES
('cat-001', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Electronics', 'Electronic items and gadgets'),
('cat-002', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Stationery', 'Office stationery supplies'),
('cat-003', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Furniture', 'Office and home furniture');

-- Insert Items
INSERT INTO items (id, user_id, business_id, name, category_id, hsn_code, sale_price, purchase_price, unit, opening_stock, current_stock, low_stock_alert, is_deleted) VALUES
('item-001', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Laptop HP 15', 'cat-001', '8471', '55000', '45000', 'PCS', '10', '10', '3', 'false'),
('item-002', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Wireless Mouse', 'cat-001', '8471', '800', '500', 'PCS', '50', '50', '10', 'false'),
('item-003', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'A4 Paper Ream', 'cat-002', '4802', '350', '250', 'PCS', '100', '100', '20', 'false'),
('item-004', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Ballpoint Pen (Box)', 'cat-002', '9608', '150', '90', 'BOX', '200', '200', '30', 'false'),
('item-005', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Office Chair', 'cat-003', '9401', '8500', '6000', 'PCS', '15', '15', '5', 'false'),
('item-006', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'USB Keyboard', 'cat-001', '8471', '1200', '800', 'PCS', '30', '30', '8', 'false'),
('item-007', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Monitor 24 inch', 'cat-001', '8528', '12000', '9000', 'PCS', '8', '8', '2', 'false'),
('item-008', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Desk Lamp', 'cat-003', '9405', '1500', '900', 'PCS', '25', '25', '5', 'false');

-- Insert Parties (Customers)
INSERT INTO parties (id, user_id, business_id, name, phone, email, party_type, billing_address, gstin, opening_balance) VALUES
('party-001', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Rajesh Kumar', '9876543210', 'rajesh@example.com', 'customer', '45 MG Road, Hyderabad', '36AABCU9603R1ZM', '0'),
('party-002', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Priya Electronics', '9988776655', 'priya@electronics.com', 'customer', '12 Ameerpet, Hyderabad', '36BBBPU1234R1ZN', '5000'),
('party-003', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Tech Solutions Pvt Ltd', '9112233445', 'info@techsolutions.in', 'customer', '78 Jubilee Hills, Hyderabad', '36CCCPT5678R1ZP', '12000'),
('party-004', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Amit Traders', '8877665544', 'amit@traders.com', 'supplier', '23 Begumpet, Hyderabad', '36DDDPA9012R1ZQ', '0'),
('party-005', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Global Imports', '7766554433', 'contact@globalimports.in', 'supplier', '56 Banjara Hills, Hyderabad', '36EEEPG3456R1ZR', '8000'),
('party-006', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'Sri Lakshmi Enterprises', '9001122334', 'lakshmi@enterprise.com', 'supplier', '89 Kukatpally, Hyderabad', '36FFFPS7890R1ZS', '3500');

-- Insert Sale Invoices
INSERT INTO sale_invoices (id, user_id, business_id, invoice_number, invoice_date, due_date, party_id, subtotal, tax_amount, discount_amount, total_amount, paid_amount, balance_due, status, invoice_type, is_deleted) VALUES
('sinv-001', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'INV-001', '2026-03-01', '2026-03-31', 'party-001', 55800, '10044', '0', 65844, '65844', 0, 'paid', 'invoice', false),
('sinv-002', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'INV-002', '2026-03-03', '2026-04-02', 'party-002', 24000, '4320', '500', 27820, '15000', 12820, 'partial', 'invoice', false),
('sinv-003', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'INV-003', '2026-03-05', '2026-04-04', 'party-003', 8500, '1530', '0', 10030, '0', 10030, 'unpaid', 'invoice', false);

-- Insert Sale Invoice Items
INSERT INTO sale_invoice_items (id, sale_invoice_id, item_id, item_name, hsn_code, quantity, rate, unit, tax_rate, tax_amount, discount_percent, discount_amount, total, business_id) VALUES
('sii-001', 'sinv-001', 'item-001', 'Laptop HP 15', '8471', 1, 55000, 'PCS', '18', '9900', '0', '0', 64900, '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de'),
('sii-002', 'sinv-001', 'item-002', 'Wireless Mouse', '8471', 1, 800, 'PCS', '18', '144', '0', '0', 944, '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de'),
('sii-003', 'sinv-002', 'item-007', 'Monitor 24 inch', '8528', 2, 12000, 'PCS', '18', '4320', '0', '500', 27820, '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de'),
('sii-004', 'sinv-003', 'item-005', 'Office Chair', '9401', 1, 8500, 'PCS', '18', '1530', '0', '0', 10030, '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de');

-- Insert Purchase Invoices
INSERT INTO purchase_invoices (id, user_id, business_id, invoice_number, invoice_date, due_date, party_id, subtotal, tax_amount, discount_amount, total_amount, paid_amount, balance_due, status, invoice_type, is_deleted) VALUES
('pinv-001', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'PUR-001', '2026-02-25', '2026-03-25', 'party-004', 90000, '16200', '0', 106200, '106200', 0, 'paid', 'purchase', false),
('pinv-002', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'PUR-002', '2026-03-02', '2026-04-01', 'party-005', 27000, '4860', '1000', 30860, '0', 30860, 'unpaid', 'purchase', false);

-- Insert Purchase Invoice Items
INSERT INTO purchase_invoice_items (id, purchase_invoice_id, item_id, item_name, hsn_code, quantity, rate, unit, tax_rate, tax_amount, discount_percent, discount_amount, total, business_id) VALUES
('pii-001', 'pinv-001', 'item-001', 'Laptop HP 15', '8471', 2, 45000, 'PCS', '18', '16200', '0', '0', 106200, '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de'),
('pii-002', 'pinv-002', 'item-007', 'Monitor 24 inch', '8528', 3, 9000, 'PCS', '18', '4860', '0', '1000', 30860, '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de');

-- Insert Payments (Payment In)
INSERT INTO payments (id, user_id, business_id, payment_number, payment_date, amount, payment_mode, payment_type, party_id, sale_invoice_id, reference_number, notes) VALUES
('pay-001', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'REC-001', '2026-03-02', '65844', 'bank_transfer', 'payment_in', 'party-001', 'sinv-001', 'NEFT123456', 'Full payment for INV-001'),
('pay-002', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'REC-002', '2026-03-05', '15000', 'upi', 'payment_in', 'party-002', 'sinv-002', 'UPI789012', 'Partial payment for INV-002');

-- Insert Payments (Payment Out)
INSERT INTO payments (id, user_id, business_id, payment_number, payment_date, amount, payment_mode, payment_type, party_id, purchase_invoice_id, reference_number, notes) VALUES
('pay-003', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'PAY-001', '2026-02-28', '106200', 'bank_transfer', 'payment_out', 'party-004', 'pinv-001', 'NEFT654321', 'Full payment for PUR-001');

-- Insert Expenses
INSERT INTO expenses (id, user_id, business_id, expense_number, category, amount, expense_date, payment_mode, reference_number, notes) VALUES
('exp-001', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'EXP-001', 'Office Rent', '25000', '2026-03-01', 'bank_transfer', 'RENT-MAR-2026', 'Monthly office rent'),
('exp-002', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'EXP-002', 'Internet', '1500', '2026-03-01', 'upi', 'NET-MAR-2026', 'Monthly internet bill'),
('exp-003', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'EXP-003', 'Travel', '3500', '2026-03-04', 'cash', null, 'Client visit travel expenses');

-- Insert Bank Account
INSERT INTO bank_accounts (id, user_id, business_id, bank_name, account_name, account_number, ifsc_code, opening_balance, current_balance, is_primary) VALUES
('bank-001', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'State Bank of India', 'Dexorzo Creations', '1234567890123', 'SBIN0001234', '100000', '100000', 'true');

-- Insert Cash Transactions
INSERT INTO cash_transactions (id, user_id, business_id, transaction_date, amount, transaction_type, description, reference_type) VALUES
('ct-001', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', '2026-03-01', '50000', 'in', 'Opening cash balance', 'opening'),
('ct-002', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', '2026-03-04', '3500', 'out', 'Travel expense payment', 'expense');

-- Insert Bank Transactions
INSERT INTO bank_transactions (id, user_id, business_id, bank_account_id, transaction_date, amount, transaction_type, description, reference_type) VALUES
('bt-001', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'bank-001', '2026-03-02', '65844', 'credit', 'Payment received from Rajesh Kumar', 'payment_in'),
('bt-002', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'bank-001', '2026-02-28', '106200', 'debit', 'Payment to Amit Traders', 'payment_out'),
('bt-003', 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', '2cf0aa41-360c-4bac-a8ce-0fa718bfe7de', 'bank-001', '2026-03-01', '25000', 'debit', 'Office rent payment', 'expense');
