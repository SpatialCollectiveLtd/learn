-- Migration: Add mobile_mapping to youth_training_progress module_type constraint
-- Required for Mobile Mapping module launch

-- Drop the existing constraint
ALTER TABLE youth_training_progress 
DROP CONSTRAINT IF EXISTS youth_training_progress_module_type_check;

-- Add new constraint with all module types
ALTER TABLE youth_training_progress 
ADD CONSTRAINT youth_training_progress_module_type_check 
CHECK (module_type IN ('mapper', 'validator', 'mobile_mapping', 'household_survey', 'microtasking'));

-- Verify the change
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'youth_training_progress'::regclass 
  AND contype = 'c';
