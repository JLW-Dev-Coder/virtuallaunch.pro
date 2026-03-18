-- VLP D1 Migration: cal token columns on accounts
-- Adds cal_access_token, cal_refresh_token, cal_token_expiry to accounts
-- so /v1/cal/status can do a fast single-table lookup.

ALTER TABLE accounts ADD COLUMN cal_access_token TEXT;
ALTER TABLE accounts ADD COLUMN cal_refresh_token TEXT;
ALTER TABLE accounts ADD COLUMN cal_token_expiry TEXT;
