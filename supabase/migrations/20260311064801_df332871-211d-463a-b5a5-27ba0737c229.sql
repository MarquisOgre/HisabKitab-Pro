
CREATE TABLE public.discount_codes (
  id text NOT NULL DEFAULT (gen_random_uuid())::text PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL DEFAULT 0,
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expiry_date timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active discount codes (to validate at checkout)
CREATE POLICY "Authenticated can read discount codes"
ON public.discount_codes
FOR SELECT
TO authenticated
USING (true);

-- Only SuperAdmin can manage discount codes
CREATE POLICY "SuperAdmin can manage discount codes"
ON public.discount_codes
FOR ALL
TO authenticated
USING (is_superadmin((auth.uid())::text))
WITH CHECK (is_superadmin((auth.uid())::text));
