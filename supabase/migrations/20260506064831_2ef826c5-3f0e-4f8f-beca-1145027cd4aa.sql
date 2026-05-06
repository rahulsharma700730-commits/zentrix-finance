CREATE OR REPLACE FUNCTION public.validate_withdrawal_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _earned numeric := 0;
  _mlm numeric := 0;
  _legacy numeric := 0;
  _withdrawn numeric := 0;
  _pending numeric := 0;
  _cap numeric := 0;
  _available numeric := 0;
BEGIN
  SELECT COALESCE(SUM(amount),0) INTO _earned FROM public.daily_earnings WHERE user_id = NEW.user_id;
  SELECT COALESCE(SUM(amount),0) INTO _mlm FROM public.mlm_commissions WHERE referrer_id = NEW.user_id;
  SELECT COALESCE(SUM(amount),0) INTO _legacy FROM public.referral_commissions WHERE referrer_id = NEW.user_id;
  SELECT COALESCE(SUM(amount),0) INTO _withdrawn FROM public.withdrawals
    WHERE user_id = NEW.user_id AND status IN ('approved','sent','confirmed');
  SELECT COALESCE(SUM(amount),0) INTO _pending FROM public.withdrawals
    WHERE user_id = NEW.user_id AND status IN ('pending','on_hold') AND id <> NEW.id;
  -- ROI cap (200% of confirmed investments) applies ONLY to own daily earnings,
  -- not to MLM/referral commissions which are separate income.
  SELECT COALESCE(SUM(amount * 2), 0) INTO _cap FROM public.investments
    WHERE user_id = NEW.user_id AND status IN ('confirmed','completed');

  _available := LEAST(_earned, _cap) + _mlm + _legacy - _withdrawn - _pending;

  IF NEW.amount < 20 THEN
    RAISE EXCEPTION 'Minimum withdrawal is $20';
  END IF;
  IF NEW.amount > _available THEN
    RAISE EXCEPTION 'Withdrawal exceeds available balance ($%).', round(_available, 2);
  END IF;
  RETURN NEW;
END $function$;