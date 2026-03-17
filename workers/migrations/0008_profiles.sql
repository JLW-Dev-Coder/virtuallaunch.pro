-- VLP D1 Migration: profiles
-- Created: Phase 8
-- Worker binding: DB

CREATE TABLE IF NOT EXISTS profiles (
  professional_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL UNIQUE, -- references accounts(account_id)
  display_name TEXT,
  bio TEXT,
  specialties TEXT,
  cal_booking_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_profiles_account_id
  ON profiles(account_id);

CREATE INDEX IF NOT EXISTS idx_profiles_status
  ON profiles(status);
