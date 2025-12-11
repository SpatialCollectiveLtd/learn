-- Complete script to add new settlements and youth participants
-- This script adds:
-- 1. Settlement column to youth_participants table
-- 2. 7 youth from Mji wa Huruma settlement
-- 3. 21 youth from Kariobangi Machakos settlement
-- Total: 28 new youth participants

-- ============================================
-- STEP 1: ADD SETTLEMENT COLUMN
-- ============================================
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

\echo '=== Settlement column added ==='

-- ============================================
-- STEP 2: INSERT MJI WA HURUMA YOUTH (7 participants)
-- ============================================
INSERT INTO youth_participants (youth_id, full_name, program_type, settlement, is_active)
VALUES 
  ('HUR728CM', 'Catherine Mararo', 'digitization', 'Mji wa Huruma', TRUE),
  ('HUR801DN', 'Dennis Njuguna', 'digitization', 'Mji wa Huruma', TRUE),
  ('HUR478JM', 'John Mbugua', 'digitization', 'Mji wa Huruma', TRUE),
  ('HUR765JN', 'John Ngigi', 'digitization', 'Mji wa Huruma', TRUE),
  ('HUR564KM', 'Lydia Mwove', 'digitization', 'Mji wa Huruma', TRUE),
  ('HUR455MM', 'Martin Mbugua', 'digitization', 'Mji wa Huruma', TRUE),
  ('HUR768SW', 'Stephen Wanjiru', 'digitization', 'Mji wa Huruma', TRUE)
ON CONFLICT (youth_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  program_type = EXCLUDED.program_type,
  settlement = EXCLUDED.settlement,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

\echo '=== Added 7 Mji wa Huruma youth ==='

-- ============================================
-- STEP 3: INSERT KARIOBANGI MACHAKOS YOUTH (21 participants)
-- ============================================
-- Note: Denis Musau excluded (no youth_id provided)
INSERT INTO youth_participants (youth_id, full_name, program_type, settlement, is_active)
VALUES 
  ('KAR119BN', 'Bill Njiru', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR412CM', 'Caroline Mumina', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR225CT', 'Charity Titus', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR298DK', 'Diana Kasyula', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR386DM', 'Domitilla Mutunga', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR327EM', 'Eddis Maina', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR322FK', 'Festus Kaluki', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR224FM', 'Fredinah Mbai', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR074GA', 'George Alaka', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR369JJ', 'Jeremiah James', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR083JK', 'Joel Kihuria', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR019JM', 'Joseph Muta', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR399JM', 'Josephat Mwanthi', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR158KK', 'Kelvin Kinyatta', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR078KM', 'Kelvin Mulela', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR339PM', 'Peter Muia', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR282PM', 'Prisca Musau', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR268SM', 'Samuel Matheka', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR187SM', 'Samuel Mutuku', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR115SO', 'Sophie Gesare', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR181SM', 'Stacey Mutheu', 'digitization', 'Kariobangi Machakos', TRUE)
ON CONFLICT (youth_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  program_type = EXCLUDED.program_type,
  settlement = EXCLUDED.settlement,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

\echo '=== Added 21 Kariobangi Machakos youth ==='
\echo '=== Note: Denis Musau excluded (no youth_id provided) ==='

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
\echo ''
\echo '=== SUMMARY BY SETTLEMENT ==='
SELECT 
    COALESCE(settlement, 'No Settlement') as settlement,
    COUNT(*) as youth_count
FROM youth_participants 
GROUP BY settlement
ORDER BY youth_count DESC;

\echo ''
\echo '=== MJI WA HURUMA YOUTH (7) ==='
SELECT 
    youth_id, 
    full_name, 
    program_type, 
    settlement,
    is_active 
FROM youth_participants 
WHERE settlement = 'Mji wa Huruma'
ORDER BY full_name;

\echo ''
\echo '=== KARIOBANGI MACHAKOS YOUTH (21) ==='
SELECT 
    youth_id, 
    full_name, 
    program_type, 
    settlement,
    is_active 
FROM youth_participants 
WHERE settlement = 'Kariobangi Machakos'
ORDER BY full_name;

\echo ''
\echo '=== TOTAL YOUTH COUNT ==='
SELECT COUNT(*) as total_youth FROM youth_participants;

\echo ''
\echo '=== ✅ All youth participants added successfully! ==='
