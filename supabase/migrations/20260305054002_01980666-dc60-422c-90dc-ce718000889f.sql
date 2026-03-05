
-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own categories" ON public.categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  hsn_code TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  opening_stock INTEGER NOT NULL DEFAULT 0,
  current_stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  gst_rate NUMERIC(5,2) DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 10,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own products" ON public.products FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  mobile TEXT,
  email TEXT,
  gst_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  balance NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own customers" ON public.customers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Suppliers table
CREATE TABLE public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  mobile TEXT,
  email TEXT,
  gst_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  balance NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own suppliers" ON public.suppliers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Invoices (Sales)
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_type TEXT NOT NULL DEFAULT 'sales', -- sales, delivery_challan
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  gst_amount NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'unpaid', -- unpaid, partial, paid
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own invoices" ON public.invoices FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Invoice Items
CREATE TABLE public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  gst_rate NUMERIC(5,2) DEFAULT 0,
  gst_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0
);
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own invoice items" ON public.invoice_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid())
);

-- Purchases
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  purchase_number TEXT NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  gst_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own purchases" ON public.purchases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Purchase Items
CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.purchases(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_rate NUMERIC(5,2) DEFAULT 0,
  gst_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0
);
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own purchase items" ON public.purchase_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.purchases WHERE purchases.id = purchase_items.purchase_id AND purchases.user_id = auth.uid())
);

-- Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expense_number TEXT,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_mode TEXT DEFAULT 'cash',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own expenses" ON public.expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bank Accounts
CREATE TABLE public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_name TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  account_type TEXT DEFAULT 'savings',
  balance NUMERIC(12,2) DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bank accounts" ON public.bank_accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Payments (Payment In / Payment Out)
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payment_number TEXT,
  payment_type TEXT NOT NULL, -- payment_in, payment_out
  party_type TEXT, -- customer, supplier
  party_id UUID,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_mode TEXT DEFAULT 'cash',
  bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own payments" ON public.payments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Stock Movements
CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  movement_type TEXT NOT NULL, -- in, out, adjustment
  quantity INTEGER NOT NULL,
  reference_type TEXT, -- invoice, purchase, adjustment
  reference_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own stock movements" ON public.stock_movements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  owner_name TEXT,
  mobile TEXT,
  email TEXT,
  gst_number TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  logo_url TEXT,
  cash_in_hand NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
