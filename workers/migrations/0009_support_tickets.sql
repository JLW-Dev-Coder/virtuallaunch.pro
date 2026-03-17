-- VLP D1 Migration: support_tickets
-- Created: Phase 8
-- Worker binding: DB

CREATE TABLE IF NOT EXISTS support_tickets (
  ticket_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL, -- references accounts(account_id)
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_account_id
  ON support_tickets(account_id);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status
  ON support_tickets(status);

CREATE INDEX IF NOT EXISTS idx_support_tickets_priority
  ON support_tickets(priority);
