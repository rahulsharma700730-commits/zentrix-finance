
-- Extend withdrawal_status enum
ALTER TYPE withdrawal_status ADD VALUE IF NOT EXISTS 'sent';
ALTER TYPE withdrawal_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE withdrawal_status ADD VALUE IF NOT EXISTS 'on_hold';

-- Add tx_hash for USDT sent proof
ALTER TABLE public.withdrawals
  ADD COLUMN IF NOT EXISTS tx_hash text DEFAULT '',
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_due_at timestamptz;

-- Default SLA = 5 hours from creation
CREATE OR REPLACE FUNCTION public.set_withdrawal_sla()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.sla_due_at IS NULL THEN
    NEW.sla_due_at := COALESCE(NEW.created_at, now()) + interval '5 hours';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_withdrawal_sla ON public.withdrawals;
CREATE TRIGGER trg_withdrawal_sla
BEFORE INSERT ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.set_withdrawal_sla();

-- Withdrawal audit log table
CREATE TABLE IF NOT EXISTS public.withdrawal_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id uuid NOT NULL,
  from_status text,
  to_status text NOT NULL,
  actor_id uuid,
  note text,
  tx_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wd_audit_wd ON public.withdrawal_audit_log(withdrawal_id);

ALTER TABLE public.withdrawal_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all audit log" ON public.withdrawal_audit_log;
CREATE POLICY "Admins can view all audit log" ON public.withdrawal_audit_log
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own audit log" ON public.withdrawal_audit_log;
CREATE POLICY "Users can view own audit log" ON public.withdrawal_audit_log
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.withdrawals w WHERE w.id = withdrawal_id AND w.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can insert audit log" ON public.withdrawal_audit_log;
CREATE POLICY "Admins can insert audit log" ON public.withdrawal_audit_log
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() IS NOT NULL);

-- Trigger to log status transitions automatically
CREATE OR REPLACE FUNCTION public.log_withdrawal_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.withdrawal_audit_log(withdrawal_id, from_status, to_status, actor_id, note)
    VALUES (NEW.id, NULL, NEW.status::text, NEW.user_id, 'Withdrawal requested');
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.tx_hash IS DISTINCT FROM OLD.tx_hash THEN
    INSERT INTO public.withdrawal_audit_log(withdrawal_id, from_status, to_status, actor_id, note, tx_hash)
    VALUES (
      NEW.id, OLD.status::text, NEW.status::text,
      COALESCE(NEW.processed_by, auth.uid()),
      COALESCE(NEW.rejection_reason, NULL),
      NEW.tx_hash
    );
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_wd_status ON public.withdrawals;
CREATE TRIGGER trg_log_wd_status
AFTER INSERT OR UPDATE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.log_withdrawal_status_change();

-- Enforce ROI cap & available balance on new withdrawal request
CREATE OR REPLACE FUNCTION public.validate_withdrawal_balance()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
  -- ROI cap: 200% of confirmed investments
  SELECT COALESCE(SUM(amount * 2), 0) INTO _cap FROM public.investments
    WHERE user_id = NEW.user_id AND status IN ('confirmed','completed');

  _available := LEAST(_earned + _mlm + _legacy, _cap) - _withdrawn - _pending;

  IF NEW.amount < 20 THEN
    RAISE EXCEPTION 'Minimum withdrawal is $20';
  END IF;
  IF NEW.amount > _available THEN
    RAISE EXCEPTION 'Withdrawal exceeds available balance ($%). ROI cap or balance limit reached.', round(_available, 2);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_wd ON public.withdrawals;
CREATE TRIGGER trg_validate_wd
BEFORE INSERT ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal_balance();
