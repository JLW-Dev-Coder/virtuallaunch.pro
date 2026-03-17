-- VLP D1 Migration: tokens
-- Created: Phase 8
-- Worker binding: DB

CREATE TABLE IF NOT EXISTS tokens (
  account_id TEXT PRIMARY KEY, -- references accounts(account_id)
  tax_game_tokens INTEGER NOT NULL DEFAULT 0,
  transcript_tokens INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
