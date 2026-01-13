-- ============================================
-- Database Optimization Migration
-- Date: January 13, 2026
-- Purpose: Performance improvements, schema consolidation, and data integrity
-- ============================================

BEGIN;

-- ============================================
-- 1. CREATE ENUM TYPES
-- ============================================

DO $$
BEGIN
  -- Create module_type enum if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'module_type') THEN
    CREATE TYPE module_type AS ENUM (
      'digitization', 'mobile_mapping', 'household_survey', 'microtasking'
    );
  END IF;
  
  -- Create staff_role enum if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'staff_role') THEN
    CREATE TYPE staff_role AS ENUM ('trainer', 'admin', 'superadmin');
  END IF;
  
  -- Create work_status enum if not exists  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_status') THEN
    CREATE TYPE work_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
  
  -- Create user_type enum if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
    CREATE TYPE user_type AS ENUM ('youth', 'staff');
  END IF;
END $$;

-- ============================================
-- 2. CREATE SETTLEMENTS TABLE (NORMALIZATION)
-- ============================================

CREATE TABLE IF NOT EXISTS settlements (
  settlement_id SERIAL PRIMARY KEY,
  settlement_name VARCHAR(100) UNIQUE NOT NULL,
  settlement_code VARCHAR(10) UNIQUE,
  region VARCHAR(100),
  county VARCHAR(100) DEFAULT 'Nairobi',
  timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert existing settlements
INSERT INTO settlements (settlement_name, settlement_code, region) VALUES
  ('Kayole', 'KAY', 'Eastlands'),
  ('Kariobangi Machakos', 'KAR', 'Eastlands'),
  ('Mji wa Huruma', 'HUR', 'Eastlands')
ON CONFLICT (settlement_name) DO NOTHING;

-- Create trigger for settlements updated_at
DROP TRIGGER IF EXISTS update_settlements_updated_at ON settlements;
CREATE TRIGGER update_settlements_updated_at 
BEFORE UPDATE ON settlements
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. CREATE AUDIT LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS audit_log (
  audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  record_id VARCHAR(100) NOT NULL,
  operation VARCHAR(10) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by VARCHAR(50),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  session_id VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON audit_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_changed_by ON audit_log(changed_by);

COMMENT ON TABLE audit_log IS 'Tracks all data changes for compliance and debugging';

-- ============================================
-- 4. COMPOSITE INDEXES FOR PERFORMANCE
-- ============================================

-- Youth participants: Common query patterns
DROP INDEX IF EXISTS idx_youth_program_settlement_active;
CREATE INDEX idx_youth_program_settlement_active 
  ON youth_participants(program_type, settlement) 
  WHERE is_active = TRUE;

DROP INDEX IF EXISTS idx_youth_login_active;
CREATE INDEX idx_youth_login_active 
  ON youth_participants(youth_id, is_active)
  WHERE is_active = TRUE;

-- Work days: Frequently queried together
DROP INDEX IF EXISTS idx_work_days_youth_date_status;
CREATE INDEX IF NOT EXISTS idx_work_days_youth_date_status 
  ON youth_work_days(youth_id, work_date, status);

DROP INDEX IF EXISTS idx_work_days_approval_pending;
CREATE INDEX idx_work_days_approval_pending 
  ON youth_work_days(youth_id, work_date) 
  WHERE status = 'pending';

-- OSM Stats: Daily lookups
DROP INDEX IF EXISTS idx_osm_stats_lookup;
CREATE INDEX IF NOT EXISTS idx_osm_stats_lookup 
  ON youth_osm_stats(youth_id, date DESC);

-- Signed contracts: Valid contract lookups
DROP INDEX IF EXISTS idx_contracts_valid_youth;
CREATE INDEX idx_contracts_valid_youth 
  ON signed_contracts(youth_id, signed_at DESC) 
  WHERE is_valid = TRUE;

-- Auth logs: Recent activity lookups
DROP INDEX IF EXISTS idx_auth_recent_user;
CREATE INDEX idx_auth_recent_user 
  ON auth_logs(user_id, created_at DESC);

-- Staff members: Active staff lookup
DROP INDEX IF EXISTS idx_staff_active_role;
CREATE INDEX idx_staff_active_role 
  ON staff_members(role, full_name) 
  WHERE is_active = TRUE;

-- ============================================
-- 5. DATA INTEGRITY CONSTRAINTS
-- ============================================

-- Ensure work_date is not in the future
ALTER TABLE youth_work_days 
  DROP CONSTRAINT IF EXISTS check_work_date_not_future;
ALTER TABLE youth_work_days 
  ADD CONSTRAINT check_work_date_not_future 
  CHECK (work_date <= CURRENT_DATE);

-- Ensure buildings_count is non-negative
ALTER TABLE youth_work_days 
  DROP CONSTRAINT IF EXISTS check_positive_buildings;
ALTER TABLE youth_work_days 
  ADD CONSTRAINT check_positive_buildings 
  CHECK (buildings_count >= 0);

-- Ensure daily_target is positive
ALTER TABLE youth_work_days 
  DROP CONSTRAINT IF EXISTS check_positive_target;
ALTER TABLE youth_work_days 
  ADD CONSTRAINT check_positive_target 
  CHECK (daily_target > 0);

-- Ensure hours_worked is reasonable (0-24)
ALTER TABLE youth_work_days 
  DROP CONSTRAINT IF EXISTS check_hours_range;
ALTER TABLE youth_work_days 
  ADD CONSTRAINT check_hours_range 
  CHECK (hours_worked IS NULL OR (hours_worked >= 0 AND hours_worked <= 24));

-- Youth OSM Stats constraints
ALTER TABLE youth_osm_stats 
  DROP CONSTRAINT IF EXISTS check_buildings_non_negative;
ALTER TABLE youth_osm_stats 
  ADD CONSTRAINT check_buildings_non_negative 
  CHECK (buildings_mapped >= 0);

-- ============================================
-- 6. MATERIALIZED VIEW FOR DASHBOARD
-- ============================================

DROP MATERIALIZED VIEW IF EXISTS mv_youth_dashboard_stats;
CREATE MATERIALIZED VIEW mv_youth_dashboard_stats AS
SELECT 
  yp.youth_id,
  yp.full_name,
  yp.settlement,
  yp.program_type,
  yp.osm_username,
  yp.email,
  yp.is_active,
  -- Work statistics (using CASE instead of FILTER for broader compatibility)
  COUNT(DISTINCT CASE WHEN ywd.status = 'approved' THEN ywd.work_date END) as days_worked,
  COUNT(DISTINCT CASE WHEN ywd.target_met = TRUE AND ywd.status = 'approved' THEN ywd.work_date END) as days_target_met,
  COALESCE(SUM(CASE WHEN ywd.status = 'approved' THEN ywd.buildings_count ELSE 0 END), 0) as total_buildings,
  ROUND(AVG(CASE WHEN ywd.status = 'approved' THEN ywd.buildings_count END)::numeric, 1) as avg_buildings_per_day,
  MAX(ywd.work_date) as last_work_date,
  -- Contract status
  EXISTS(SELECT 1 FROM signed_contracts sc WHERE sc.youth_id = yp.youth_id AND sc.is_valid = TRUE) as has_contract,
  -- Training progress
  (SELECT COUNT(*) FROM youth_training_progress tp WHERE tp.youth_id = yp.youth_id) as training_steps_completed,
  -- Last login
  yp.last_login
FROM youth_participants yp
LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
WHERE yp.is_active = TRUE
GROUP BY yp.youth_id, yp.full_name, yp.settlement, yp.program_type, 
         yp.osm_username, yp.email, yp.is_active, yp.last_login;

CREATE UNIQUE INDEX ON mv_youth_dashboard_stats(youth_id);
CREATE INDEX ON mv_youth_dashboard_stats(settlement);
CREATE INDEX ON mv_youth_dashboard_stats(program_type);

COMMENT ON MATERIALIZED VIEW mv_youth_dashboard_stats IS 'Pre-computed dashboard statistics - refresh every 5 minutes';

-- ============================================
-- 7. REFRESH FUNCTION FOR MATERIALIZED VIEW
-- ============================================

CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_youth_dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. AUDIT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (table_name, record_id, operation, old_data, changed_at)
    VALUES (TG_TABLE_NAME, OLD.youth_id::text, 'DELETE', row_to_json(OLD), NOW());
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (table_name, record_id, operation, old_data, new_data, changed_at)
    VALUES (TG_TABLE_NAME, NEW.youth_id::text, 'UPDATE', row_to_json(OLD), row_to_json(NEW), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (table_name, record_id, operation, new_data, changed_at)
    VALUES (TG_TABLE_NAME, NEW.youth_id::text, 'INSERT', row_to_json(NEW), NOW());
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to critical tables
DROP TRIGGER IF EXISTS audit_youth_participants ON youth_participants;
CREATE TRIGGER audit_youth_participants
AFTER INSERT OR UPDATE OR DELETE ON youth_participants
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_youth_work_days ON youth_work_days;
CREATE TRIGGER audit_youth_work_days
AFTER INSERT OR UPDATE OR DELETE ON youth_work_days
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Function to get youth work summary
CREATE OR REPLACE FUNCTION get_youth_work_summary(p_youth_id VARCHAR)
RETURNS TABLE (
  days_worked INTEGER,
  days_remaining INTEGER,
  total_buildings BIGINT,
  avg_daily_buildings NUMERIC,
  target_met_percentage NUMERIC,
  estimated_earnings NUMERIC
) AS $$
DECLARE
  v_max_days INTEGER := 20;
  v_rate DECIMAL := 1.00; -- KES per building
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(CASE WHEN status = 'approved' THEN 1 END)::INTEGER as days_worked,
    (v_max_days - COUNT(CASE WHEN status = 'approved' THEN 1 END))::INTEGER as days_remaining,
    COALESCE(SUM(CASE WHEN status = 'approved' THEN buildings_count ELSE 0 END), 0)::BIGINT as total_buildings,
    ROUND(AVG(CASE WHEN status = 'approved' THEN buildings_count END)::numeric, 1) as avg_daily_buildings,
    ROUND(
      (COUNT(CASE WHEN target_met = TRUE AND status = 'approved' THEN 1 END)::NUMERIC / 
       NULLIF(COUNT(CASE WHEN status = 'approved' THEN 1 END), 0)) * 100, 
      1
    ) as target_met_percentage,
    (COALESCE(SUM(CASE WHEN status = 'approved' THEN buildings_count ELSE 0 END), 0) * v_rate) as estimated_earnings
  FROM youth_work_days
  WHERE youth_id = p_youth_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id VARCHAR,
  p_action VARCHAR,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM auth_logs
  WHERE user_id = p_user_id
    AND action = p_action
    AND success = FALSE
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
  
  RETURN v_count < p_max_attempts;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. CLEANUP OLD DATA
-- ============================================

-- Create function to clean old auth logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_auth_logs()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM auth_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean old audit logs (keep 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM audit_log 
  WHERE changed_at < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. GRANT PERMISSIONS
-- ============================================

-- Grant permissions to application role (adjust as needed)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO neondb_owner;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO neondb_owner;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES (Run after migration)
-- ============================================

-- Check new indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename;

-- Check new tables
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check materialized view
-- SELECT * FROM mv_youth_dashboard_stats LIMIT 5;

-- Check enums
-- SELECT typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid;

-- Test helper function
-- SELECT * FROM get_youth_work_summary('KAY1278MK');

