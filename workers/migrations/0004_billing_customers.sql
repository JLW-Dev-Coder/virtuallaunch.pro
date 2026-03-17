-- VLP D1 Migration: billing_customers
-- Created: Phase 8
-- Worker binding: DB

CREATE TABLE IF NOT EXISTS billing_customers (
  account_id TEXT PRIMARY KEY, -- references accounts(account_id)
  stripe_customer_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_billing_customers_stripe_customer_id
  ON billing_customers(stripe_customer_id);
