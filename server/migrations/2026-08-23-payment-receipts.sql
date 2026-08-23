-- Run this in the Supabase project's SQL editor (Database -> SQL Editor).
-- Adds the payment_receipts table used by the vendor / officer receipt
-- submission feature and the admin/super-admin review queue.

CREATE TABLE IF NOT EXISTS payment_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stall_id uuid NOT NULL REFERENCES stalls(id),
  vendor_id uuid NOT NULL REFERENCES profiles(id),
  submitted_by uuid NOT NULL REFERENCES profiles(id),
  amount numeric(12,2) NULL,
  receipt_date date NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  file_size bigint NOT NULL,
  notes text NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  reviewed_by uuid NULL REFERENCES profiles(id),
  reviewed_at timestamptz NULL,
  remarks text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
