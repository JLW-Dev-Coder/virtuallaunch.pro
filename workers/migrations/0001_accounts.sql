-- VLP D1 Migration: accounts
-- Created: Phase 8
-- Worker binding: DB

CREATE TABLE IF NOT EXISTS accounts (
  account_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  timezone TEXT,
  platform TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  two_factor_enabled INTEGER NOT NULL DEFAULT 0,
  totp_secret TEXT,
  totp_pending_secret TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_accounts_email
  ON accounts(email);

CREATE INDEX IF NOT EXISTS idx_accounts_platform
  ON accounts(platform);

CREATE INDEX IF NOT EXISTS idx_accounts_status
  ON accounts(status);
