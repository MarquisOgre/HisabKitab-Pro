CREATE POLICY "Anyone can read active license plans"
  ON public.license_plans
  FOR SELECT
  USING (true);