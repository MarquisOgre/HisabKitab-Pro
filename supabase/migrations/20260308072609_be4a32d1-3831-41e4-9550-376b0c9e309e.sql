
-- Update is_superadmin function to remove admin@gmail.com
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
    AND email IN ('marquisogre@gmail.com', 'prakashgroup555@gmail.com', 'adarshbharadwaj1234@gmail.com')
  );
$$;
