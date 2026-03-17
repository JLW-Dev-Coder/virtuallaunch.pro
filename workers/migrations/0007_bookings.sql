-- VLP D1 Migration: bookings
-- Created: Phase 8
-- Worker binding: DB

CREATE TABLE IF NOT EXISTS bookings (
  booking_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,      -- references accounts(account_id)
  professional_id TEXT NOT NULL, -- references profiles(professional_id)
  booking_type TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  timezone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  cal_booking_uid TEXT,
  cal_booking_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_bookings_account_id
  ON bookings(account_id);

CREATE INDEX IF NOT EXISTS idx_bookings_professional_id
  ON bookings(professional_id);

CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at
  ON bookings(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_bookings_cal_booking_uid
  ON bookings(cal_booking_uid);
