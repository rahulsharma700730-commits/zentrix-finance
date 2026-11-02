CREATE OR REPLACE FUNCTION public.get_referrer_info(_user_id uuid)
RETURNS TABLE (full_name text, referral_code text)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.full_name, p.referral_code
  FROM public.profiles p
  WHERE p.user_id = (
    SELECT pr.referred_by FROM public.profiles pr WHERE pr.user_id = _user_id
  )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_referrer_info(uuid) TO authenticated;
