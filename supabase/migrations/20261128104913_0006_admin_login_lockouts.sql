CREATE TABLE IF NOT EXISTS public.admin_login_lockouts (
  device_key TEXT PRIMARY KEY,
  failed_attempts SMALLINT NOT NULL DEFAULT 0
    CHECK (failed_attempts BETWEEN 0 AND 4),
  lockout_count INTEGER NOT NULL DEFAULT 0
    CHECK (lockout_count >= 0),
  locked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_login_lockouts_updated_at
  ON public.admin_login_lockouts (updated_at);

ALTER TABLE public.admin_login_lockouts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_login_lockouts FROM PUBLIC, anon, authenticated;

INSERT INTO public.schema_migrations (version, description)
VALUES (
  '0006_admin_login_lockouts',
  'Progressive server-side admin login lockouts'
)
ON CONFLICT (version) DO NOTHING;