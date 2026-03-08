
-- Add screenshot_url column to plan_payments
ALTER TABLE public.plan_payments ADD COLUMN IF NOT EXISTS screenshot_url text;

-- Set default for created_at so it's never null
ALTER TABLE public.plan_payments ALTER COLUMN created_at SET DEFAULT now();

-- Fix existing null created_at values
UPDATE public.plan_payments SET created_at = now() WHERE created_at IS NULL;

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to payment-screenshots
CREATE POLICY "Authenticated users can upload payment screenshots"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'payment-screenshots');

-- Allow public read access
CREATE POLICY "Public can view payment screenshots"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'payment-screenshots');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own payment screenshots"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'payment-screenshots' AND (auth.uid())::text = (storage.foldername(name))[1]);
