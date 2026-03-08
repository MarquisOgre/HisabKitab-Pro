
-- Drop overly permissive policies on email_settings and payment_settings
DROP POLICY IF EXISTS "Authenticated can manage email settings" ON public.email_settings;
DROP POLICY IF EXISTS "Authenticated can manage payment settings" ON public.payment_settings;

-- Create a helper to check if user is a superadmin by checking a known list
-- We use the license_settings table: superadmins have license_type = 'Unlimited'
-- But simpler: just restrict write to specific known superadmin user IDs
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = _user_id 
    AND email IN ('admin@gmail.com', 'marquisogre@gmail.com', 'prakashgroup555@gmail.com', 'adarshbharadwaj1234@gmail.com')
  );
$$;

-- Email settings: only superadmin can write
CREATE POLICY "SuperAdmin can manage email settings" ON public.email_settings
  FOR ALL TO authenticated 
  USING (public.is_superadmin(auth.uid()::text))
  WITH CHECK (public.is_superadmin(auth.uid()::text));

-- Payment settings: only superadmin can write  
CREATE POLICY "SuperAdmin can manage payment settings" ON public.payment_settings
  FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()::text))
  WITH CHECK (public.is_superadmin(auth.uid()::text));
