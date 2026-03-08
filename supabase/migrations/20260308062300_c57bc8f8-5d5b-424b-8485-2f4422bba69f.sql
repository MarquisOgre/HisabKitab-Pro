
-- Helper function: get effective user id (returns own id or parent's id for child accounts)
CREATE OR REPLACE FUNCTION public.get_effective_user_id(_user_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT parent_user_id FROM public.user_roles WHERE user_id = _user_id AND parent_user_id IS NOT NULL LIMIT 1),
    _user_id
  );
$$;

-- ============ PROFILES ============
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

-- ============ USER_ROLES ============
CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()::text 
    OR parent_user_id = auth.uid()::text
  );
CREATE POLICY "Admins can manage child roles" ON public.user_roles
  FOR ALL TO authenticated USING (
    parent_user_id = auth.uid()::text 
    OR user_id = auth.uid()::text
  );

-- ============ BUSINESSES ============
CREATE POLICY "Users can access own businesses" ON public.businesses
  FOR ALL TO authenticated USING (
    user_id = public.get_effective_user_id(auth.uid()::text)
    OR user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ BUSINESS_SETTINGS ============
CREATE POLICY "Users can access own business settings" ON public.business_settings
  FOR ALL TO authenticated USING (
    user_id = public.get_effective_user_id(auth.uid()::text)
    OR user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ PARTIES ============
CREATE POLICY "Users can access own parties" ON public.parties
  FOR ALL TO authenticated USING (
    user_id = public.get_effective_user_id(auth.uid()::text)
    OR user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ ITEMS ============
CREATE POLICY "Users can access own items" ON public.items
  FOR ALL TO authenticated USING (
    user_id = public.get_effective_user_id(auth.uid()::text)
    OR user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ CATEGORIES ============
CREATE POLICY "Users can access own categories" ON public.categories
  FOR ALL TO authenticated USING (
    user_id = public.get_effective_user_id(auth.uid()::text)
    OR user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ SALE_INVOICES ============
CREATE POLICY "Users can access own sale invoices" ON public.sale_invoices
  FOR ALL TO authenticated USING (
    user_id = public.get_effective_user_id(auth.uid()::text)
    OR user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ SALE_INVOICE_ITEMS ============
CREATE POLICY "Users can access own sale invoice items" ON public.sale_invoice_items
  FOR ALL TO authenticated USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = public.get_effective_user_id(auth.uid()::text) OR user_id = auth.uid()::text)
  ) WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()::text)
  );

-- ============ PURCHASE_INVOICES ============
CREATE POLICY "Users can access own purchase invoices" ON public.purchase_invoices
  FOR ALL TO authenticated USING (
    user_id = public.get_effective_user_id(auth.uid()::text)
    OR user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ PURCHASE_INVOICE_ITEMS ============
CREATE POLICY "Users can access own purchase invoice items" ON public.purchase_invoice_items
  FOR ALL TO authenticated USING (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = public.get_effective_user_id(auth.uid()::text) OR user_id = auth.uid()::text)
  ) WITH CHECK (
    business_id IN (SELECT id FROM public.businesses WHERE user_id = auth.uid()::text)
  );

-- ============ PAYMENTS ============
CREATE POLICY "Users can access own payments" ON public.payments
  FOR ALL TO authenticated USING (
    user_id = public.get_effective_user_id(auth.uid()::text)
    OR user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ EXPENSES ============
CREATE POLICY "Users can access own expenses" ON public.expenses
  FOR ALL TO authenticated USING (
    user_id = public.get_effective_user_id(auth.uid()::text)
    OR user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ BANK_ACCOUNTS ============
CREATE POLICY "Users can access own bank accounts" ON public.bank_accounts
  FOR ALL TO authenticated USING (
    user_id = public.get_effective_user_id(auth.uid()::text)
    OR user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ BANK_TRANSACTIONS ============
CREATE POLICY "Users can access own bank transactions" ON public.bank_transactions
  FOR ALL TO authenticated USING (
    user_id = public.get_effective_user_id(auth.uid()::text)
    OR user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ CASH_TRANSACTIONS ============
CREATE POLICY "Users can access own cash transactions" ON public.cash_transactions
  FOR ALL TO authenticated USING (
    user_id = public.get_effective_user_id(auth.uid()::text)
    OR user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ NOTIFICATIONS ============
CREATE POLICY "Users can access own notifications" ON public.notifications
  FOR ALL TO authenticated USING (
    user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ ACTIVE_SESSIONS ============
CREATE POLICY "Users can access own sessions" ON public.active_sessions
  FOR ALL TO authenticated USING (
    user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ BACKUP_SETTINGS ============
CREATE POLICY "Users can access own backup settings" ON public.backup_settings
  FOR ALL TO authenticated USING (
    user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ BACKUPS ============
CREATE POLICY "Users can access own backups" ON public.backups
  FOR ALL TO authenticated USING (
    user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );

-- ============ LICENSE_SETTINGS ============
CREATE POLICY "Users can view own license" ON public.license_settings
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()::text
    OR user_id = public.get_effective_user_id(auth.uid()::text)
  );
CREATE POLICY "Users can update own license" ON public.license_settings
  FOR UPDATE TO authenticated USING (user_id = auth.uid()::text);
CREATE POLICY "Users can insert own license" ON public.license_settings
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);

-- ============ UNITS ============
CREATE POLICY "Anyone can read units" ON public.units
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage own units" ON public.units
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "Users can delete own units" ON public.units
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text);

-- ============ CONTACT_SUBMISSIONS ============
CREATE POLICY "Anyone can submit contact" ON public.contact_submissions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can read contacts" ON public.contact_submissions
  FOR SELECT TO authenticated USING (true);

-- ============ TRIAL_REQUESTS ============
CREATE POLICY "Anyone can submit trial request" ON public.trial_requests
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can read trial requests" ON public.trial_requests
  FOR SELECT TO authenticated USING (true);

-- ============ PLAN_PAYMENTS ============
CREATE POLICY "Users can access own plan payments" ON public.plan_payments
  FOR ALL TO authenticated USING (
    user_id = auth.uid()::text
  ) WITH CHECK (
    user_id = auth.uid()::text
  );
-- SuperAdmin needs to see all plan payments
CREATE POLICY "SuperAdmin can view all plan payments" ON public.plan_payments
  FOR SELECT TO authenticated USING (true);

-- ============ PAYMENT_SETTINGS ============
CREATE POLICY "Anyone can read payment settings" ON public.payment_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage payment settings" ON public.payment_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ EMAIL_SETTINGS ============
CREATE POLICY "Authenticated can read email settings" ON public.email_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage email settings" ON public.email_settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
