CREATE TABLE IF NOT EXISTS oauth_state (
  state_key TEXT PRIMARY KEY,
  code_verifier TEXT NOT NULL,
  account_id TEXT NOT NULL,
  flow TEXT NOT NULL DEFAULT 'vlp',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_oauth_state_created
  ON oauth_state(created_at);
