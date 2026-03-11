-- Add applicable_plans and banner_text columns to discount_codes
ALTER TABLE public.discount_codes
  ADD COLUMN IF NOT EXISTS applicable_plans text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS banner_text text DEFAULT NULL;

-- Update Platinum price from 9999 to 8999
UPDATE public.license_plans SET price = 8999 WHERE LOWER(plan_name) = 'platinum';

-- Update Diamond price from 17999 to 16999  
UPDATE public.license_plans SET price = 16999 WHERE LOWER(plan_name) = 'diamond';