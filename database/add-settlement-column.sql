-- Add settlement column to youth_participants table
-- This script is idempotent (safe to run multiple times)

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'youth_participants' 
        AND column_name = 'settlement'
    ) THEN
        ALTER TABLE youth_participants 
        ADD COLUMN settlement VARCHAR(100);
        
        RAISE NOTICE 'Added settlement column';
    ELSE
        RAISE NOTICE 'settlement column already exists';
    END IF;
END $$;

-- Create index for settlement searches
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public'
        AND tablename = 'youth_participants' 
        AND indexname = 'idx_youth_settlement'
    ) THEN
        CREATE INDEX idx_youth_settlement ON youth_participants(settlement);
        RAISE NOTICE 'Created index idx_youth_settlement';
    ELSE
        RAISE NOTICE 'Index idx_youth_settlement already exists';
    END IF;
END $$;

-- Update existing Kayole youth with settlement name
UPDATE youth_participants 
SET settlement = 'Kayole' 
WHERE youth_id LIKE 'KAY%' AND settlement IS NULL;

\echo '=== Settlement Column Added Successfully ==='
\echo 'Verifying settlement data:'
SELECT 
    settlement,
    COUNT(*) as youth_count
FROM youth_participants 
GROUP BY settlement
ORDER BY youth_count DESC;
