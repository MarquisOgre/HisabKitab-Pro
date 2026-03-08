
-- ============================================================
-- 1. ADD PRIMARY KEY CONSTRAINTS TO ALL 28 TABLES
-- ============================================================
-- Remove rows with NULL ids first (cleanup)
DELETE FROM public.profiles WHERE id IS NULL AND user_id IS NULL;

-- Add NOT NULL + PRIMARY KEY to all tables
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'active_sessions','backup_settings','backups','bank_accounts',
    'bank_transactions','business_settings','businesses','cash_transactions',
    'categories','contact_submissions','email_settings','expenses',
    'items','license_plans','license_settings','notifications',
    'parties','payment_settings','payments','plan_payments',
    'profiles','purchase_invoice_items','purchase_invoices',
    'sale_invoice_items','sale_invoices','trial_requests','units','user_roles'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    -- Delete rows with NULL id
    EXECUTE format('DELETE FROM public.%I WHERE id IS NULL', tbl);
    -- Set NOT NULL
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET NOT NULL', tbl);
    -- Set default uuid
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN id SET DEFAULT gen_random_uuid()::text', tbl);
    -- Add primary key
    EXECUTE format('ALTER TABLE public.%I ADD PRIMARY KEY (id)', tbl);
  END LOOP;
END
$$;

-- ============================================================
-- 2. FIX PROFILES DATA
-- ============================================================
-- Fix marquisogre profile: update user_id to match auth.users
UPDATE public.profiles 
SET user_id = 'b2505138-5df3-4cf9-b2e7-795ff6f7124d'
WHERE email = 'marquisogre@gmail.com' AND user_id = '8b5bb7bc-7dae-435a-8573-afcc2d7b7084';

-- Delete duplicate marquisogre profile with wrong/null user_id
DELETE FROM public.profiles 
WHERE email = 'marquisogre@gmail.com' AND user_id != 'b2505138-5df3-4cf9-b2e7-795ff6f7124d';

-- Insert missing profile for admin@gmail.com
INSERT INTO public.profiles (id, user_id, email, full_name)
VALUES (gen_random_uuid()::text, 'c7822b21-5514-496f-9152-670d2e043864', 'admin@gmail.com', 'Super Admin')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. FIX handle_new_user TRIGGER to also set user_id
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, full_name)
  VALUES (
    gen_random_uuid()::text,
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL)
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- 4. FIX PROFILES RLS - SuperAdmins & admins can view profiles
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = (auth.uid())::text 
  OR user_id = get_effective_user_id((auth.uid())::text)
  OR is_superadmin((auth.uid())::text)
);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = (auth.uid())::text OR is_superadmin((auth.uid())::text));

-- ============================================================
-- 5. ENSURE user_roles for both SuperAdmins
-- ============================================================
INSERT INTO public.user_roles (id, user_id, role)
SELECT gen_random_uuid()::text, 'c7822b21-5514-496f-9152-670d2e043864', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = 'c7822b21-5514-496f-9152-670d2e043864');

INSERT INTO public.user_roles (id, user_id, role)
SELECT gen_random_uuid()::text, 'b2505138-5df3-4cf9-b2e7-795ff6f7124d', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = 'b2505138-5df3-4cf9-b2e7-795ff6f7124d');
