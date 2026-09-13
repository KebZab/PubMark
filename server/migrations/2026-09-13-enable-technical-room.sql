-- Enable the type already supported by web/mobile without modifying existing facilities.
ALTER TABLE map_facilities DROP CONSTRAINT IF EXISTS map_facilities_type_check;
ALTER TABLE map_facilities ADD CONSTRAINT map_facilities_type_check
  CHECK (type IN ('entrance', 'cr', 'stairs', 'office', 'technical_room'));
