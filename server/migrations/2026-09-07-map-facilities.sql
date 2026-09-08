CREATE TABLE IF NOT EXISTS map_facilities (
  id uuid PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('entrance', 'cr', 'stairs', 'office')),
  name text NOT NULL,
  floor text NOT NULL CHECK (floor IN ('1', '2')),
  geometry jsonb NOT NULL,
  connected_floors jsonb,
  is_accessible boolean NOT NULL DEFAULT false,
  notes text,
  created_by uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_map_facilities_floor ON map_facilities(floor);
CREATE INDEX IF NOT EXISTS idx_map_facilities_type ON map_facilities(type);
