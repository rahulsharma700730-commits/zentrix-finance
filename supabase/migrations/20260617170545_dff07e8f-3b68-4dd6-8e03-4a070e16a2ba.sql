
CREATE TABLE public.email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('signup','password_reset')),
  attempts INT NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX email_otps_lookup_idx ON public.email_otps (email, purpose, created_at DESC);

GRANT ALL ON public.email_otps TO service_role;
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: only edge functions (service_role) may read/write.
