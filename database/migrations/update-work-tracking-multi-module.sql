-- ============================================
-- UPDATED WORK TRACKING FUNCTIONS
-- Purpose: Support multi-module work tracking with assignment history
-- Date: February 3, 2026
-- ============================================

BEGIN;

-- ============================================
-- UPDATED WORK DAY VALIDATION FUNCTION
-- ============================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS check_work_day_validity ON youth_work_days;
DROP FUNCTION IF EXISTS validate_work_day();

-- New validation function that uses module assignment history
CREATE OR REPLACE FUNCTION validate_work_day()
RETURNS TRIGGER AS $$
DECLARE
  v_start_date DATE;
  v_total_days INTEGER;
  v_days_worked INTEGER;
  v_program_type VARCHAR(50);
  v_settlement VARCHAR(100);
BEGIN
  -- Get youth settlement
  SELECT settlement INTO v_settlement
  FROM youth_participants 
  WHERE youth_id = NEW.youth_id;
  
  -- Get active module assignment for this work date
  SELECT program_type INTO v_program_type
  FROM get_active_module_assignment(NEW.youth_id, NEW.work_date);
  
  -- If no assignment found, use current program_type (backward compatibility)
  IF v_program_type IS NULL THEN
    SELECT program_type INTO v_program_type
    FROM youth_participants
    WHERE youth_id = NEW.youth_id;
  END IF;
  
  -- Get settlement config for the active program type
  SELECT start_date, total_work_days INTO v_start_date, v_total_days
  FROM settlement_work_config
  WHERE settlement = v_settlement 
  AND program_type = v_program_type 
  AND is_active = TRUE;
  
  -- Check if configuration exists
  IF v_start_date IS NULL THEN
    RAISE EXCEPTION 'No active work configuration found for settlement % and program %', v_settlement, v_program_type;
  END IF;
  
  -- Check if work date is before start date
  IF NEW.work_date < v_start_date THEN
    RAISE EXCEPTION 'Work date % cannot be before settlement start date %', NEW.work_date, v_start_date;
  END IF;
  
  -- Count existing approved work days (ACROSS ALL MODULES for 20-day total limit)
  SELECT COUNT(*) INTO v_days_worked
  FROM youth_work_days
  WHERE youth_id = NEW.youth_id AND status = 'approved';
  
  -- Check if exceeding maximum work days (when approving)
  IF NEW.status = 'approved' AND v_days_worked >= v_total_days THEN
    RAISE EXCEPTION 'Youth has already completed maximum % work days across all modules', v_total_days;
  END IF;
  
  -- Update target_met flag (use daily_target from current assignment's config)
  NEW.target_met := (NEW.buildings_count >= NEW.daily_target);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
CREATE TRIGGER check_work_day_validity
BEFORE INSERT OR UPDATE ON youth_work_days
FOR EACH ROW EXECUTE FUNCTION validate_work_day();

-- ============================================
-- UPDATED YOUTH WORK SUMMARY VIEW
-- ============================================

DROP VIEW IF EXISTS youth_work_summary;

-- New view that shows work summary across all module assignments
CREATE OR REPLACE VIEW youth_work_summary AS
SELECT 
  yp.youth_id,
  yp.full_name,
  yp.settlement,
  yp.program_type as current_program_type,
  
  -- Overall work period info (use earliest assignment start date)
  MIN(yma.start_date) as employment_start_date,
  20 as max_employment_days, -- Standard across all programs
  
  -- Work statistics (across all modules)
  COUNT(ywd.work_day_id) FILTER (WHERE ywd.status = 'approved') as total_days_worked,
  COUNT(ywd.work_day_id) FILTER (WHERE ywd.target_met = TRUE) as days_target_met,
  SUM(ywd.buildings_count) FILTER (WHERE ywd.status = 'approved') as total_buildings,
  AVG(ywd.buildings_count) FILTER (WHERE ywd.status = 'approved') as avg_buildings_per_day,
  MAX(ywd.work_date) as last_work_date,
  
  -- Module assignment summary
  STRING_AGG(DISTINCT yma.program_type, ', ' ORDER BY yma.program_type) as modules_worked,
  COUNT(DISTINCT yma.program_type) as module_count,
  
  -- Current assignment info
  (SELECT yma2.program_type FROM youth_module_assignments yma2 
   WHERE yma2.youth_id = yp.youth_id AND yma2.is_active = TRUE) as current_assignment,
  (SELECT yma2.start_date FROM youth_module_assignments yma2 
   WHERE yma2.youth_id = yp.youth_id AND yma2.is_active = TRUE) as current_assignment_start

FROM youth_participants yp
LEFT JOIN youth_module_assignments yma ON yp.youth_id = yma.youth_id
LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
WHERE yp.is_active = TRUE
GROUP BY yp.youth_id, yp.full_name, yp.settlement, yp.program_type;

COMMENT ON VIEW youth_work_summary IS 'Enhanced work summary supporting multi-module assignments and preserving complete work history';

-- ============================================
-- HELPER VIEWS FOR REPORTING
-- ============================================

-- View: Work days with module context
CREATE OR REPLACE VIEW youth_work_days_with_module AS
SELECT 
  ywd.work_day_id,
  ywd.youth_id,
  yp.full_name,
  yp.settlement,
  ywd.work_date,
  ywd.buildings_count,
  ywd.daily_target,
  ywd.target_met,
  ywd.status,
  ywd.approved_by,
  ywd.approved_at,
  
  -- Get module assignment active on this work date
  (SELECT yma.program_type FROM get_active_module_assignment(ywd.youth_id, ywd.work_date) yma) as module_at_time,
  (SELECT yma.assignment_id FROM get_active_module_assignment(ywd.youth_id, ywd.work_date) yma) as assignment_id

FROM youth_work_days ywd
JOIN youth_participants yp ON ywd.youth_id = yp.youth_id
WHERE yp.is_active = TRUE;

COMMENT ON VIEW youth_work_days_with_module IS 'Work days enriched with module assignment context for each work date';

-- View: Module assignment summary  
CREATE OR REPLACE VIEW youth_module_assignment_summary AS
SELECT 
  yp.youth_id,
  yp.full_name,
  yp.settlement,
  yp.program_type as current_program_type,
  
  -- Assignment history
  COUNT(yma.assignment_id) as assignment_count,
  MIN(yma.start_date) as first_assignment_date,
  MAX(CASE WHEN yma.is_active THEN yma.start_date END) as current_assignment_date,
  STRING_AGG(yma.program_type || ' (' || yma.start_date || 
             CASE WHEN yma.end_date IS NULL THEN ' - current)' 
                  ELSE ' - ' || yma.end_date || ')' END, 
             ' | ' ORDER BY yma.start_date) as assignment_history,
  
  -- Work statistics per module
  (SELECT COUNT(*) FROM youth_work_days ywd 
   WHERE ywd.youth_id = yp.youth_id AND ywd.status = 'approved') as total_work_days,
  
  -- Days remaining (20-day limit across all modules)
  GREATEST(0, 20 - (SELECT COUNT(*) FROM youth_work_days ywd 
                    WHERE ywd.youth_id = yp.youth_id AND ywd.status = 'approved')) as days_remaining

FROM youth_participants yp
LEFT JOIN youth_module_assignments yma ON yp.youth_id = yma.youth_id
WHERE yp.is_active = TRUE
GROUP BY yp.youth_id, yp.full_name, yp.settlement, yp.program_type;

COMMENT ON VIEW youth_module_assignment_summary IS 'Complete assignment history and work summary for each youth';

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Test the updated work summary view
SELECT 
  youth_id,
  full_name,
  current_program_type,
  employment_start_date,
  total_days_worked,
  modules_worked,
  current_assignment
FROM youth_work_summary
WHERE total_days_worked > 0
ORDER BY total_days_worked DESC
LIMIT 5;

-- Check work days with module context
SELECT 
  youth_id,
  work_date,
  buildings_count,
  module_at_time,
  status
FROM youth_work_days_with_module
WHERE youth_id LIKE 'KAY%'
ORDER BY youth_id, work_date
LIMIT 10;