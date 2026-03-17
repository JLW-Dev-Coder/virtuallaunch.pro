-- VLP D1 Migration: sessions
-- Created: Phase 8
-- Worker binding: DB

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL, -- references accounts(account_id)
  email TEXT NOT NULL,
  platform TEXT NOT NULL,
  membership TEXT NOT NULL DEFAULT 'free',
  two_fa_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_account_id
  ON sessions(account_id);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
  ON sessions(expires_at);
