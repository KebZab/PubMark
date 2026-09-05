ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS renewal_deadline_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS contract_terminated_at timestamptz NULL;

CREATE TABLE IF NOT EXISTS contract_renewal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id),
  vendor_id uuid NOT NULL REFERENCES profiles(id),
  requested_months integer NOT NULL CHECK (requested_months IN (6, 12, 24, 36)),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid NULL REFERENCES profiles(id),
  reviewed_at timestamptz NULL,
  remarks text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contract_renewals_application ON contract_renewal_requests(application_id);
CREATE INDEX IF NOT EXISTS idx_contract_renewals_vendor ON contract_renewal_requests(vendor_id);

CREATE TABLE IF NOT EXISTS renewal_deadline_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id),
  previous_deadline_at timestamptz NOT NULL,
  new_deadline_at timestamptz NOT NULL,
  reason text NOT NULL,
  extended_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
