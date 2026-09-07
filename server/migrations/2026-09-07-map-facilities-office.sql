ALTER TABLE map_facilities DROP CONSTRAINT IF EXISTS map_facilities_type_check;
ALTER TABLE map_facilities ADD CONSTRAINT map_facilities_type_check
  CHECK (type IN ('entrance', 'cr', 'stairs', 'office'));

UPDATE map_facilities
SET name = CASE type
  WHEN 'entrance' THEN 'Entrance'
  WHEN 'cr' THEN 'CR'
  WHEN 'stairs' THEN 'Stairs'
  WHEN 'office' THEN 'Office'
  ELSE name
END,
updated_at = now();
