-- Complete production database update script for Neon PostgreSQL
-- This script is safe to run multiple times (idempotent)

-- 1. Add osm_username column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'youth_participants' 
        AND column_name = 'osm_username'
    ) THEN
        ALTER TABLE youth_participants 
        ADD COLUMN osm_username VARCHAR(255);
        
        RAISE NOTICE 'Added osm_username column';
    ELSE
        RAISE NOTICE 'osm_username column already exists';
    END IF;
END $$;

-- 2. Create index for osm_username if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public'
        AND tablename = 'youth_participants' 
        AND indexname = 'idx_youth_osm_username'
    ) THEN
        CREATE INDEX idx_youth_osm_username ON youth_participants(osm_username);
        RAISE NOTICE 'Created index idx_youth_osm_username';
    ELSE
        RAISE NOTICE 'Index idx_youth_osm_username already exists';
    END IF;
END $$;

-- 3. Add test user KAYTEST001ES
INSERT INTO youth_participants (youth_id, full_name, email, phone_number, program_type, is_active)
VALUES ('KAYTEST001ES', 'Test Youth Kayole', 'kaytest@example.com', '+254700000000', 'digitization', TRUE)
ON CONFLICT (youth_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone_number = EXCLUDED.phone_number,
  program_type = EXCLUDED.program_type,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

-- 4. Verification queries
\echo '=== Test User Verification ==='
SELECT 
    youth_id, 
    full_name, 
    email, 
    program_type, 
    osm_username,
    is_active, 
    created_at 
FROM youth_participants 
WHERE youth_id = 'KAYTEST001ES';

\echo '=== OSM Username Column Statistics ==='
SELECT 
    COUNT(*) as total_users,
    COUNT(osm_username) as users_with_osm,
    COUNT(*) - COUNT(osm_username) as users_without_osm
FROM youth_participants;

\echo '=== All Youth Participants ==='
SELECT youth_id, full_name, program_type, osm_username, is_active 
FROM youth_participants 
ORDER BY created_at DESC;

\echo '=== Database update completed successfully ==='
