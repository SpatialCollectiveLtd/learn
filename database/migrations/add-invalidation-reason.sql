-- Add missing invalidation_reason column to signed_contracts table
-- Run this migration on your Neon PostgreSQL database

ALTER TABLE signed_contracts 
ADD COLUMN IF NOT EXISTS invalidation_reason TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'signed_contracts' 
AND column_name = 'invalidation_reason';
