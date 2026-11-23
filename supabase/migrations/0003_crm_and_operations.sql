-- ==============================================================================
-- OmniFlow Migration 0003 — Enterprise CRM Pipeline Fields & Persistent Idempotency
-- Non-destructive & idempotent: preserves 100% of existing rows and content.
-- Run AFTER 0002_production_upgrade.sql in Supabase SQL Editor.
-- ==============================================================================

-- 1. Extend leads CRM table with priority, proposal value, expected close date, and lost reason
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'Medium'
    CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
  ADD COLUMN IF NOT EXISTS proposal_value NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS expected_closing_date DATE,
  ADD COLUMN IF NOT EXISTS lost_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads (priority);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads (source);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads (follow_up_date)
  WHERE follow_up_date IS NOT NULL;

-- 2. Persistent database-backed idempotency table for serverless lead submissions
CREATE TABLE IF NOT EXISTS lead_idempotency_keys (
  fingerprint TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lead_idempotency_expires ON lead_idempotency_keys (expires_at);

-- 3. Record migration in schema_migrations
INSERT INTO schema_migrations (version, description)
VALUES (
  '0003_crm_and_operations',
  'Enterprise CRM priority, proposal value, expected close date, lost reasons, and persistent idempotency'
)
ON CONFLICT (version) DO NOTHING;

-- 4. Enforce strict Row-Level Security
ALTER TABLE lead_idempotency_keys ENABLE ROW LEVEL SECURITY;
