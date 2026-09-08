ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS approved_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS permit_uploaded_at timestamptz NULL;
