
-- Fix user_roles RLS: SuperAdmins can see ALL user roles
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = (auth.uid())::text 
  OR parent_user_id = (auth.uid())::text
  OR is_superadmin((auth.uid())::text)
);

-- Fix user_roles management: SuperAdmins can manage all roles
DROP POLICY IF EXISTS "Admins can manage child roles" ON public.user_roles;
CREATE POLICY "Admins can manage child roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  parent_user_id = (auth.uid())::text 
  OR user_id = (auth.uid())::text
  OR is_superadmin((auth.uid())::text)
)
WITH CHECK (
  parent_user_id = (auth.uid())::text 
  OR user_id = (auth.uid())::text
  OR is_superadmin((auth.uid())::text)
);

-- Allow SuperAdmin to delete plan_payments
DROP POLICY IF EXISTS "Users can access own plan payments" ON public.plan_payments;
CREATE POLICY "Users can access own plan payments"
ON public.plan_payments
FOR ALL
TO authenticated
USING (
  user_id = (auth.uid())::text
  OR is_superadmin((auth.uid())::text)
)
WITH CHECK (
  user_id = (auth.uid())::text
  OR is_superadmin((auth.uid())::text)
);

-- Allow SuperAdmin to delete license_settings
DROP POLICY IF EXISTS "Users can view own license" ON public.license_settings;
DROP POLICY IF EXISTS "Users can insert own license" ON public.license_settings;
DROP POLICY IF EXISTS "Users can update own license" ON public.license_settings;

CREATE POLICY "Users can view own license"
ON public.license_settings
FOR SELECT
TO authenticated
USING (
  user_id = (auth.uid())::text 
  OR user_id = get_effective_user_id((auth.uid())::text)
  OR is_superadmin((auth.uid())::text)
);

CREATE POLICY "Users can insert own license"
ON public.license_settings
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (auth.uid())::text
  OR is_superadmin((auth.uid())::text)
);

CREATE POLICY "Users can update own license"
ON public.license_settings
FOR UPDATE
TO authenticated
USING (
  user_id = (auth.uid())::text
  OR is_superadmin((auth.uid())::text)
);

CREATE POLICY "SuperAdmin can delete license"
ON public.license_settings
FOR DELETE
TO authenticated
USING (is_superadmin((auth.uid())::text));

-- Allow SuperAdmin to delete profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (auth.uid())::text
  OR is_superadmin((auth.uid())::text)
);

CREATE POLICY "SuperAdmin can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_superadmin((auth.uid())::text));
