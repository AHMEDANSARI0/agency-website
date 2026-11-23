-- ==============================================================================
-- OmniFlow Migration 0002 — Production Security, Session Revocation,
-- Rate Limiting & Safe Transactional Database Backups
-- Non-destructive & idempotent: preserves 100% of existing rows and content.
-- Run AFTER 0001_omniflow_schema.sql in Supabase SQL Editor.
-- ==============================================================================

-- 1. Extend staff users table with first-login password rotation, session revocation,
--    and single-use hashed account recovery tokens
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recovery_token_hash TEXT,
  ADD COLUMN IF NOT EXISTS recovery_expires_at TIMESTAMPTZ;

-- 2. Track applied SQL schema migrations for Production Readiness & Health checks
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (version, description)
VALUES
  ('0001_omniflow_schema', 'Initial OmniFlow relational schema and RLS policies'),
  ('0002_production_upgrade', 'Session revocation, forced password rotation, rate limits, and DB backups')
ON CONFLICT (version) DO NOTHING;

-- 3. Serverless-safe sliding-window rate limit buckets (zero paid Redis/VM needed)
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket_key TEXT PRIMARY KEY,
  hits JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_updated_at ON rate_limits (updated_at);

-- 4. Safe on-demand & pre-restore database backup snapshots
CREATE TABLE IF NOT EXISTS database_backups (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  created_by TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  size_bytes INTEGER NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_database_backups_created_at ON database_backups (created_at DESC);

-- 5. Enforce strict Row-Level Security (zero public/anon PostgREST access)
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_backups ENABLE ROW LEVEL SECURITY;
