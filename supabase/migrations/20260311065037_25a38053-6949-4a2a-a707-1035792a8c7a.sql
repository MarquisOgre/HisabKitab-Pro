
CREATE OR REPLACE FUNCTION public.increment_discount_usage(_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE public.discount_codes
  SET used_count = used_count + 1, updated_at = now()
  WHERE code = _code;
$$;
