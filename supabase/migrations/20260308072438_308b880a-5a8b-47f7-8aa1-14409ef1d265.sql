
-- Fix the stale user_id for marquisogre@gmail.com
UPDATE public.license_settings 
SET user_id = 'b2505138-5df3-4cf9-b2e7-795ff6f7124d'
WHERE user_email = 'marquisogre@gmail.com';

-- Recreate function with email fallback
CREATE OR REPLACE FUNCTION public.get_effective_license_settings(_user_id text)
RETURNS SETOF public.license_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Try direct license by user_id
  SELECT * FROM public.license_settings WHERE user_id = _user_id
  UNION ALL
  -- Fallback: match by user_email from auth.users
  SELECT ls.* FROM public.license_settings ls
  JOIN auth.users au ON au.email = ls.user_email
  WHERE au.id::text = _user_id
  AND NOT EXISTS (SELECT 1 FROM public.license_settings WHERE user_id = _user_id)
  UNION ALL
  -- Then try parent's license (child account)
  SELECT ls.* FROM public.license_settings ls
  JOIN public.user_roles ur ON ur.parent_user_id = ls.user_id
  WHERE ur.user_id = _user_id
  AND NOT EXISTS (SELECT 1 FROM public.license_settings WHERE user_id = _user_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.license_settings ls2
    JOIN auth.users au2 ON au2.email = ls2.user_email
    WHERE au2.id::text = _user_id
  )
  LIMIT 1;
$$;
