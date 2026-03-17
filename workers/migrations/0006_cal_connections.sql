-- VLP D1 Migration: cal_connections
-- Created: Phase 8
-- Worker binding: DB

CREATE TABLE IF NOT EXISTS cal_connections (
  account_id TEXT PRIMARY KEY, -- references accounts(account_id)
  cal_account_id TEXT,
  cal_access_token TEXT,
  cal_refresh_token TEXT,
  cal_token_expires_at TEXT,
  cal_booking_url TEXT,
  connected_at TEXT NOT NULL,
  updated_at TEXT
);
