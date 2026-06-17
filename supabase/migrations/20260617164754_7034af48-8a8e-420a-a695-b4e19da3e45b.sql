
-- 1. Notifications: tighten UPDATE policy
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Profiles: drop referrer-can-read-all policy
DROP POLICY IF EXISTS "Referrers can view referred profiles" ON public.profiles;

-- 3. Site settings: restrict SELECT to authenticated
DROP POLICY IF EXISTS "Anyone can view settings" ON public.site_settings;
CREATE POLICY "Authenticated can view settings"
  ON public.site_settings FOR SELECT
  TO authenticated
  USING (true);

-- 4. Withdrawal audit log: admin-only INSERT
DROP POLICY IF EXISTS "Admins can insert audit log" ON public.withdrawal_audit_log;
CREATE POLICY "Admins can insert audit log"
  ON public.withdrawal_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Revoke EXECUTE on internal SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_team_stats(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_upline_on_investment() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_withdrawal_status_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_withdrawal_balance() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_withdrawal_sla() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_self_referral() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_upline_chain(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- 6. Storage: remove broad public listing on site-assets bucket (direct URLs still work for public bucket)
DROP POLICY IF EXISTS "Anyone can view site assets" ON storage.objects;
