ALTER TABLE map_facilities DROP CONSTRAINT IF EXISTS map_facilities_type_check;
ALTER TABLE map_facilities ADD CONSTRAINT map_facilities_type_check
  CHECK (type IN ('entrance', 'cr', 'stairs', 'office', 'technical_room'));

-- Older office records were point markers. Convert each one into a small,
-- editable rectangular footprint centered on its original position.
UPDATE map_facilities
SET geometry = jsonb_build_object(
  'type', 'Polygon',
  'coordinates', jsonb_build_array(jsonb_build_array(
    jsonb_build_array((geometry->'coordinates'->>0)::double precision - 0.00001, (geometry->'coordinates'->>1)::double precision - 0.00001),
    jsonb_build_array((geometry->'coordinates'->>0)::double precision + 0.00001, (geometry->'coordinates'->>1)::double precision - 0.00001),
    jsonb_build_array((geometry->'coordinates'->>0)::double precision + 0.00001, (geometry->'coordinates'->>1)::double precision + 0.00001),
    jsonb_build_array((geometry->'coordinates'->>0)::double precision - 0.00001, (geometry->'coordinates'->>1)::double precision + 0.00001),
    jsonb_build_array((geometry->'coordinates'->>0)::double precision - 0.00001, (geometry->'coordinates'->>1)::double precision - 0.00001)
  )),
  updated_at = now()
WHERE type = 'office' AND geometry->>'type' = 'Point';

UPDATE map_facilities
SET name = CASE type
  WHEN 'entrance' THEN 'Entrance'
  WHEN 'cr' THEN 'CR'
  WHEN 'stairs' THEN 'Stairs'
  WHEN 'office' THEN 'Office'
  WHEN 'technical_room' THEN 'Technical Room'
  ELSE name
END,
updated_at = now();
