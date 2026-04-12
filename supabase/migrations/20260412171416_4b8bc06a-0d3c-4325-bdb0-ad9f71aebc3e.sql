
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'investor');

-- Create investment_status enum
CREATE TYPE public.investment_status AS ENUM ('pending', 'confirmed', 'rejected', 'completed');

-- Create withdrawal_status enum
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected');

-- Create transaction_type enum
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'withdrawal', 'referral_commission', 'daily_earning');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  wallet_address TEXT DEFAULT '',
  referral_code TEXT UNIQUE DEFAULT substring(gen_random_uuid()::text from 1 for 8),
  referred_by UUID REFERENCES auth.users(id),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Investments table
CREATE TABLE public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(18,2) NOT NULL CHECK (amount > 0),
  status investment_status NOT NULL DEFAULT 'pending',
  tx_hash TEXT DEFAULT '',
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  daily_return DECIMAL(18,6) DEFAULT 0,
  total_days INTEGER DEFAULT 600,
  days_paid INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Daily earnings table
CREATE TABLE public.daily_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  amount DECIMAL(18,6) NOT NULL,
  earned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_earnings ENABLE ROW LEVEL SECURITY;

-- Withdrawals table
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(18,2) NOT NULL CHECK (amount >= 20),
  wallet_address TEXT NOT NULL,
  status withdrawal_status NOT NULL DEFAULT 'pending',
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Referral commissions table
CREATE TABLE public.referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id UUID NOT NULL REFERENCES public.investments(id) ON DELETE CASCADE,
  amount DECIMAL(18,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

-- Transactions ledger
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  description TEXT DEFAULT '',
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Site settings (admin managed)
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usdt_address TEXT NOT NULL DEFAULT '',
  qr_code_url TEXT DEFAULT '',
  total_invested_display DECIMAL(18,2) DEFAULT 0,
  active_investors_display INTEGER DEFAULT 0,
  total_payouts_display DECIMAL(18,2) DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- ========== RLS POLICIES ==========

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own investments" ON public.investments
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create investments" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update investments" ON public.investments
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own earnings" ON public.daily_earnings
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert earnings" ON public.daily_earnings
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update withdrawals" ON public.withdrawals
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own commissions" ON public.referral_commissions
  FOR SELECT USING (auth.uid() = referrer_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert commissions" ON public.referral_commissions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Anyone can view settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update settings" ON public.site_settings
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings" ON public.site_settings
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ========== TRIGGERS ==========

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawals_updated_at BEFORE UPDATE ON public.withdrawals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== AUTO-CREATE PROFILE ON SIGNUP ==========

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    substring(gen_random_uuid()::text from 1 for 8)
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'investor');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default site settings
INSERT INTO public.site_settings (usdt_address, total_invested_display, active_investors_display, total_payouts_display)
VALUES ('TRC20_ADDRESS_HERE', 500000, 1250, 125000);
