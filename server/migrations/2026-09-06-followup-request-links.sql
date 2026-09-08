-- Run this in the Supabase project's SQL editor (Database -> SQL Editor).
-- Adds the metadata that identifies a check request as a violation follow-up
-- and links its completion back to the original violation.

ALTER TABLE violation_requests
  ADD COLUMN IF NOT EXISTS category text NULL,
  ADD COLUMN IF NOT EXISTS violation_id uuid NULL REFERENCES violations(id) ON DELETE SET NULL;

ALTER TABLE check_requests
  ADD COLUMN IF NOT EXISTS category text NULL;

CREATE INDEX IF NOT EXISTS idx_violation_requests_violation_id
  ON violation_requests(violation_id);
