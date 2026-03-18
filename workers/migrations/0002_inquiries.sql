CREATE TABLE IF NOT EXISTS inquiries (
  inquiry_id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  business_types TEXT,
  irs_notice_received TEXT,
  irs_notice_type TEXT,
  irs_notice_date TEXT,
  budget_preference TEXT,
  tax_years_affected TEXT,
  services_needed TEXT,
  preferred_state TEXT,
  preferred_city TEXT,
  prior_audit_experience INTEGER NOT NULL DEFAULT 0,
  membership_interest TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  assigned_professional_id TEXT,
  response_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);
