-- VLP D1 Migration: memberships
-- Created: Phase 8
-- Worker binding: DB

CREATE TABLE IF NOT EXISTS memberships (
  membership_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL, -- references accounts(account_id)
  plan_key TEXT NOT NULL,
  billing_interval TEXT,
  status TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_memberships_account_id
  ON memberships(account_id);

CREATE INDEX IF NOT EXISTS idx_memberships_status
  ON memberships(status);

CREATE INDEX IF NOT EXISTS idx_memberships_stripe_subscription_id
  ON memberships(stripe_subscription_id);
