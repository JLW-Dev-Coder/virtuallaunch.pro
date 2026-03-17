-- VLP D1 Migration: vlp_preferences
-- Created: Phase 8
-- Worker binding: DB

CREATE TABLE IF NOT EXISTS vlp_preferences (
  account_id TEXT PRIMARY KEY, -- references accounts(account_id)
  appearance TEXT NOT NULL DEFAULT 'system',
  timezone TEXT,
  default_dashboard TEXT,
  accent_color TEXT,
  in_app_enabled INTEGER NOT NULL DEFAULT 1,
  sms_enabled INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT
);
