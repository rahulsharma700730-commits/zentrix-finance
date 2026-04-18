CREATE OR REPLACE FUNCTION public.get_user_id_by_referral_code(_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_id FROM public.profiles WHERE referral_code = _code LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_id_by_referral_code(text) TO anon, authenticated;