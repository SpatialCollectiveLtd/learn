-- ============================================
-- Attendance Records Table Migration
-- Purpose: Track daily attendance for youth participants
-- Features: 
--   - Record attendance by staff
--   - Delete attendance records (if wrong youth recorded)
--   - Track submission details
-- Date: January 26, 2026
-- ============================================

BEGIN;

-- ============================================
-- CREATE ATTENDANCE RECORDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS attendance_records (
  id SERIAL PRIMARY KEY,
  youth_id VARCHAR(50) NOT NULL REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_by VARCHAR(50) NOT NULL REFERENCES staff_members(staff_id) ON DELETE SET NULL,
  notes TEXT,
  UNIQUE(youth_id, attendance_date)
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_youth ON attendance_records(youth_id);
CREATE INDEX IF NOT EXISTS idx_attendance_submitted_by ON attendance_records(submitted_by);
CREATE INDEX IF NOT EXISTS idx_attendance_youth_date ON attendance_records(youth_id, attendance_date);

-- ============================================
-- ADD COMMENTS
-- ============================================

COMMENT ON TABLE attendance_records IS 'Daily attendance records for youth participants. Recorded by staff members.';
COMMENT ON COLUMN attendance_records.id IS 'Unique identifier for the attendance record';
COMMENT ON COLUMN attendance_records.youth_id IS 'Reference to youth participant';
COMMENT ON COLUMN attendance_records.attendance_date IS 'Date of attendance';
COMMENT ON COLUMN attendance_records.submitted_at IS 'Timestamp when attendance was recorded';
COMMENT ON COLUMN attendance_records.submitted_by IS 'Staff member who recorded the attendance';
COMMENT ON COLUMN attendance_records.notes IS 'Optional notes about the attendance';

COMMIT;

-- ============================================
-- USAGE NOTES
-- ============================================

-- The UNIQUE constraint on (youth_id, attendance_date) ensures:
-- - One attendance record per youth per day
-- - Prevents duplicate attendance entries
-- - If wrong youth is recorded, staff can DELETE and re-record

-- Staff can delete attendance records via:
-- DELETE FROM attendance_records WHERE id = <record_id>;

-- Or via the API:
-- DELETE /api/staff/attendance?id=<record_id>
