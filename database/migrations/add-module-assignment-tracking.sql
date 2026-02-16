-- ============================================
-- YOUTH MODULE ASSIGNMENT HISTORY TABLE
-- Purpose: Track module assignments over time for flexible work transitions
-- Date: February 3, 2026
-- ============================================

BEGIN;

-- ============================================
-- CREATE MODULE ASSIGNMENT HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS youth_module_assignments (
  assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youth_id VARCHAR(50) NOT NULL REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
  program_type VARCHAR(50) NOT NULL CHECK (program_type IN ('digitization', 'mobile_mapping', 'household_survey', 'microtasking')),
  start_date DATE NOT NULL,
  end_date DATE NULL, -- NULL means currently active assignment
  assigned_by VARCHAR(50) REFERENCES staff_members(staff_id) ON DELETE SET NULL,
  assignment_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Business rules
  CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date),
  CONSTRAINT one_active_per_youth UNIQUE (youth_id, is_active) DEFERRABLE INITIALLY DEFERRED
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_module_assignments_youth ON youth_module_assignments(youth_id);
CREATE INDEX IF NOT EXISTS idx_module_assignments_active ON youth_module_assignments(youth_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_module_assignments_program ON youth_module_assignments(program_type);
CREATE INDEX IF NOT EXISTS idx_module_assignments_date_range ON youth_module_assignments(start_date, end_date);

-- ============================================
-- ADD COMMENTS
-- ============================================

COMMENT ON TABLE youth_module_assignments IS 'Tracks module assignment history for youth who work multiple programs during their 20-day employment period';
COMMENT ON COLUMN youth_module_assignments.end_date IS 'NULL means currently active assignment';
COMMENT ON COLUMN youth_module_assignments.is_active IS 'Only one active assignment per youth allowed';
COMMENT ON CONSTRAINT one_active_per_youth ON youth_module_assignments IS 'Ensures only one active assignment per youth at any time';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get active module assignment for a youth on a specific date
CREATE OR REPLACE FUNCTION get_active_module_assignment(p_youth_id VARCHAR(50), p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(assignment_id UUID, program_type VARCHAR(50), start_date DATE, end_date DATE) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    yma.assignment_id,
    yma.program_type,
    yma.start_date,
    yma.end_date
  FROM youth_module_assignments yma
  WHERE yma.youth_id = p_youth_id
  AND p_date >= yma.start_date
  AND (yma.end_date IS NULL OR p_date <= yma.end_date)
  ORDER BY yma.start_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to safely transition youth between modules
CREATE OR REPLACE FUNCTION transition_youth_module(
  p_youth_id VARCHAR(50),
  p_new_program_type VARCHAR(50),
  p_transition_date DATE,
  p_assigned_by VARCHAR(50) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_current_assignment_id UUID;
  v_new_assignment_id UUID;
BEGIN
  -- End current active assignment (if any)
  UPDATE youth_module_assignments 
  SET 
    end_date = p_transition_date - INTERVAL '1 day',
    is_active = FALSE,
    updated_at = CURRENT_TIMESTAMP
  WHERE youth_id = p_youth_id 
  AND is_active = TRUE
  RETURNING assignment_id INTO v_current_assignment_id;

  -- Create new assignment
  INSERT INTO youth_module_assignments (
    youth_id, 
    program_type, 
    start_date, 
    assigned_by, 
    assignment_notes,
    is_active
  ) VALUES (
    p_youth_id,
    p_new_program_type,
    p_transition_date,
    p_assigned_by,
    p_notes,
    TRUE
  ) RETURNING assignment_id INTO v_new_assignment_id;

  -- Update youth_participants current program_type for compatibility
  UPDATE youth_participants 
  SET 
    program_type = p_new_program_type,
    updated_at = CURRENT_TIMESTAMP
  WHERE youth_id = p_youth_id;

  RETURN v_new_assignment_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MIGRATION: Populate Historical Data
-- ============================================

-- Create assignment records for all existing youth based on their current program_type
-- Assume they started their current assignment on their settlement's start date
INSERT INTO youth_module_assignments (
  youth_id,
  program_type,
  start_date,
  assignment_notes,
  is_active
)
SELECT 
  yp.youth_id,
  yp.program_type,
  COALESCE(swc.start_date, '2025-12-01'::date) as start_date,
  'Migrated from existing program_type assignment' as assignment_notes,
  TRUE as is_active
FROM youth_participants yp
LEFT JOIN settlement_work_config swc ON yp.settlement = swc.settlement AND yp.program_type = swc.program_type
WHERE yp.is_active = TRUE
ON CONFLICT (youth_id, is_active) DO NOTHING; -- Skip if already exists

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check assignment counts by program type
SELECT 
  program_type,
  COUNT(*) as active_assignments,
  MIN(start_date) as earliest_start,
  MAX(start_date) as latest_start
FROM youth_module_assignments 
WHERE is_active = TRUE 
GROUP BY program_type 
ORDER BY program_type;

-- Sample youth with assignments
SELECT 
  yma.youth_id,
  yp.full_name,
  yp.settlement,
  yma.program_type,
  yma.start_date,
  yma.end_date,
  yma.is_active
FROM youth_module_assignments yma
JOIN youth_participants yp ON yma.youth_id = yp.youth_id
ORDER BY yma.youth_id, yma.start_date
LIMIT 10;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Example 1: Transition youth KAY1234 from mobile_mapping to microtasking
-- SELECT transition_youth_module('KAY1234', 'microtasking', '2026-02-05', 'STEA0001SA', 'Reassigned to complete microtasking training');

-- Example 2: Get current module for youth on specific date
-- SELECT * FROM get_active_module_assignment('KAY1234', '2026-02-03');

-- Example 3: Check work history across modules
-- SELECT 
--   ywd.work_date,
--   ywd.buildings_count,
--   yma.program_type as module_at_time
-- FROM youth_work_days ywd
-- LEFT JOIN LATERAL get_active_module_assignment(ywd.youth_id, ywd.work_date) yma ON true
-- WHERE ywd.youth_id = 'KAY1234'
-- ORDER BY ywd.work_date;