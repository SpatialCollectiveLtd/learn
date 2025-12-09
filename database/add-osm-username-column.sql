-- Add osm_username column to youth_participants table
-- This stores the OpenStreetMap username for each youth participant

ALTER TABLE youth_participants 
ADD COLUMN IF NOT EXISTS osm_username VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_youth_osm_username ON youth_participants(osm_username);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'youth_participants' 
AND column_name = 'osm_username';
