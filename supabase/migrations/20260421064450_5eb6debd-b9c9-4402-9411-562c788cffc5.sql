-- Allow referrers to view profiles of users they referred
CREATE POLICY "Referrers can view referred profiles"
ON public.profiles
FOR SELECT
USING (referred_by = auth.uid());