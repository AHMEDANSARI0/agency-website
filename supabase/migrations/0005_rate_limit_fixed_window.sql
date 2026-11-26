-- Non-destructive, idempotent schema upgrade for atomic fixed-window limits.
-- Run after migrations 0001–0004. Existing JSONB hits are preserved.
ALTER TABLE public.rate_limits
  ADD COLUMN IF NOT EXISTS count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON public.rate_limits (expires_at);
INSERT INTO public.schema_migrations (version, description)
VALUES ('0005_rate_limit_fixed_window', 'Atomic fixed-window rate limiter columns')
ON CONFLICT (version) DO NOTHING;
