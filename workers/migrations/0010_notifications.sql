-- VLP D1 Migration: notifications
-- Created: Phase 8
-- Worker binding: DB

CREATE TABLE IF NOT EXISTS notifications (
  notification_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL, -- references accounts(account_id)
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  dismissed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_notifications_account_id
  ON notifications(account_id);

CREATE INDEX IF NOT EXISTS idx_notifications_read
  ON notifications(read);
