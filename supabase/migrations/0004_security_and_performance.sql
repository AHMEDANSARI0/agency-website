-- ==============================================================================
-- OmniFlow Migration 0004: Security Atomicity & Indexed Query Performance
-- 100% Idempotent & Non-Destructive (PostgreSQL 15+ / Supabase Free Tier)
-- ==============================================================================

-- 1. Ensure persistent lead idempotency table & RLS exist
CREATE TABLE IF NOT EXISTS lead_idempotency_keys (
  fingerprint TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

ALTER TABLE lead_idempotency_keys ENABLE ROW LEVEL SECURITY;

-- 2. Indexed lookup paths for O(log N) single-row & filter queries
CREATE INDEX IF NOT EXISTS idx_lead_idempotency_expires
  ON lead_idempotency_keys (expires_at);

CREATE INDEX IF NOT EXISTS idx_leads_email_lower
  ON leads (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_leads_created_desc
  ON leads (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_case_studies_status_updated
  ON case_studies (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_posts_updated_desc
  ON blog_posts (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_recovery_hash
  ON users (recovery_token_hash)
  WHERE recovery_token_hash IS NOT NULL;

-- 3. Record schema migration version if schema_migrations table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'schema_migrations'
  ) THEN
    INSERT INTO schema_migrations (version, description)
    VALUES (
      '0004_security_and_performance',
      'Persistent lead idempotency enforcement and indexed single-row query paths'
    )
    ON CONFLICT (version) DO NOTHING;
  END IF;
END $$;
