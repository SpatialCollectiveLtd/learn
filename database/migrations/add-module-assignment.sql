-- Migration: Add module_assignment column to youth_participants
-- Purpose: Store whether a digitization youth is a mapper or validator
-- Date: 2026-01-06
-- Priority: CRITICAL - Required to fix training completion check

-- ============================================
-- STEP 1: ADD module_assignment COLUMN
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'youth_participants' 
        AND column_name = 'module_assignment'
    ) THEN
        ALTER TABLE youth_participants 
        ADD COLUMN module_assignment VARCHAR(20) 
        CHECK (module_assignment IN ('mapper', 'validator'));
        
        -- Add comment
        COMMENT ON COLUMN youth_participants.module_assignment IS 
        'Role within digitization program (mapper or validator). NULL for non-digitization programs (mobile_mapping, household_survey, microtasking).';
        
        RAISE NOTICE 'Added module_assignment column';
    ELSE
        RAISE NOTICE 'module_assignment column already exists';
    END IF;
END $$;

-- ============================================
-- STEP 2: CREATE INDEX FOR FILTERING
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public'
        AND tablename = 'youth_participants' 
        AND indexname = 'idx_youth_module_assignment'
    ) THEN
        CREATE INDEX idx_youth_module_assignment ON youth_participants(module_assignment);
        RAISE NOTICE 'Created index idx_youth_module_assignment';
    ELSE
        RAISE NOTICE 'Index idx_youth_module_assignment already exists';
    END IF;
END $$;

-- ============================================
-- STEP 3: AUTO-ASSIGN ROLES BASED ON TRAINING PROGRESS
-- ============================================
-- For digitization youths, detect their role from existing training progress
-- If they have completed mapper steps, assign 'mapper'
-- If they have completed validator steps, assign 'validator'
-- If both (edge case), prioritize the one with more steps

UPDATE youth_participants yp
SET module_assignment = (
  SELECT module_type
  FROM youth_training_progress ytp
  WHERE ytp.youth_id = yp.youth_id
  GROUP BY module_type
  ORDER BY COUNT(*) DESC  -- Use the role with most completed steps
  LIMIT 1
)
WHERE program_type = 'digitization'
  AND module_assignment IS NULL;

-- ============================================
-- STEP 4: DEFAULT REMAINING DIGITIZATION YOUTHS TO MAPPER
-- ============================================
-- For digitization youths with no training progress yet, default to mapper
UPDATE youth_participants
SET module_assignment = 'mapper'
WHERE program_type = 'digitization'
  AND module_assignment IS NULL;

-- ============================================
-- STEP 5: VERIFICATION
-- ============================================
DO $$
DECLARE
  mapper_count INTEGER;
  validator_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO mapper_count 
  FROM youth_participants 
  WHERE program_type = 'digitization' AND module_assignment = 'mapper';
  
  SELECT COUNT(*) INTO validator_count 
  FROM youth_participants 
  WHERE program_type = 'digitization' AND module_assignment = 'validator';
  
  RAISE NOTICE 'Module Assignment Summary:';
  RAISE NOTICE '  Mappers: %', mapper_count;
  RAISE NOTICE '  Validators: %', validator_count;
  RAISE NOTICE '  Total: %', mapper_count + validator_count;
END $$;
