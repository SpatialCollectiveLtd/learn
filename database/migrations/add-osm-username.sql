-- Migration: Add OSM username to youth_participants table
-- Date: 2025-12-08
-- Purpose: Track OSM usernames for mapper training program

-- Add osm_username column to youth_participants table
ALTER TABLE youth_participants 
ADD COLUMN IF NOT EXISTS osm_username VARCHAR(255);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_youth_osm_username ON youth_participants(osm_username);

-- Add comment to column
COMMENT ON COLUMN youth_participants.osm_username IS 'OpenStreetMap username for mapper training participants';
