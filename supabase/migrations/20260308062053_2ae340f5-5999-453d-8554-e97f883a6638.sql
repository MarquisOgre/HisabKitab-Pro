
CREATE OR REPLACE FUNCTION public.get_effective_license_settings(_user_id text)
RETURNS SETOF public.license_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- First try direct license by user_id
  SELECT * FROM public.license_settings WHERE user_id = _user_id
  UNION ALL
  -- Then try parent's license (child account)
  SELECT ls.* FROM public.license_settings ls
  JOIN public.user_roles ur ON ur.parent_user_id = ls.user_id
  WHERE ur.user_id = _user_id
  AND NOT EXISTS (SELECT 1 FROM public.license_settings WHERE user_id = _user_id)
  LIMIT 1;
$$;

-- Insert unlimited license for SuperAdmin admin@gmail.com
INSERT INTO public.license_settings (
  id, user_id, user_email, expiry_date, license_type, licensed_to,
  support_email, support_phone, support_whatsapp,
  max_users, max_simultaneous_logins, max_businesses,
  created_at, updated_at
) VALUES (
  gen_random_uuid()::text,
  'c7822b21-5514-496f-9152-670d2e043864',
  'admin@gmail.com',
  '2099-12-31',
  'Unlimited',
  'SuperAdmin',
  'support@hisabkitab.com',
  '+91 98765 43210',
  '+919876543210',
  999,
  99,
  999,
  now(),
  now()
);
