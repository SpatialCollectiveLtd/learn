-- Work Dashboard Implementation - Database Schema
-- Created: January 6, 2026
-- Purpose: Track youth work statistics, OSM data caching, and work days

-- ============================================
-- 1. OSM STATISTICS CACHE TABLE
-- ============================================
-- Prevents OSM API rate limiting by caching building counts
-- TTL: 5 minutes via Redis, database stores historical data

CREATE TABLE IF NOT EXISTS youth_osm_stats (
  stats_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youth_id VARCHAR(50) NOT NULL,
  osm_username VARCHAR(255) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  buildings_mapped INTEGER DEFAULT 0,
  changesets_analyzed INTEGER DEFAULT 0,
  last_changeset_id BIGINT,
  last_upload_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (youth_id) REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
  UNIQUE(youth_id, date)
);

CREATE INDEX IF NOT EXISTS idx_osm_stats_youth ON youth_osm_stats(youth_id);
CREATE INDEX IF NOT EXISTS idx_osm_stats_date ON youth_osm_stats(date);
CREATE INDEX IF NOT EXISTS idx_osm_stats_youth_date ON youth_osm_stats(youth_id, date);
CREATE INDEX IF NOT EXISTS idx_osm_stats_created ON youth_osm_stats(created_at);

COMMENT ON TABLE youth_osm_stats IS 'Caches OSM building counts to prevent API rate limiting';
COMMENT ON COLUMN youth_osm_stats.buildings_mapped IS 'Total buildings mapped on this date with project hashtag';
COMMENT ON COLUMN youth_osm_stats.changesets_analyzed IS 'Number of changesets processed for this count';

-- ============================================
-- 2. WORK DAYS TRACKING TABLE
-- ============================================
-- Tracks the 20-day work period for each youth
-- Includes approval workflow for payment processing

CREATE TABLE IF NOT EXISTS youth_work_days (
  work_day_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youth_id VARCHAR(50) NOT NULL,
  work_date DATE NOT NULL,
  buildings_count INTEGER DEFAULT 0,
  hours_worked DECIMAL(4,2),
  daily_target INTEGER DEFAULT 200,
  target_met BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  approved_by VARCHAR(50),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (youth_id) REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES staff_members(staff_id) ON DELETE SET NULL,
  UNIQUE(youth_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_work_days_youth ON youth_work_days(youth_id);
CREATE INDEX IF NOT EXISTS idx_work_days_date ON youth_work_days(work_date);
CREATE INDEX IF NOT EXISTS idx_work_days_status ON youth_work_days(status);
CREATE INDEX IF NOT EXISTS idx_work_days_youth_status ON youth_work_days(youth_id, status);
CREATE INDEX IF NOT EXISTS idx_work_days_target_met ON youth_work_days(target_met);

COMMENT ON TABLE youth_work_days IS 'Tracks individual work days within the 20-day work period';
COMMENT ON COLUMN youth_work_days.target_met IS 'Whether the daily target was met (e.g., 200 buildings)';
COMMENT ON COLUMN youth_work_days.status IS 'Workflow: pending → approved/rejected by supervisor';

-- ============================================
-- 3. SETTLEMENT WORK CONFIGURATION TABLE
-- ============================================
-- Manages work schedules, targets, and settings per settlement

CREATE TABLE IF NOT EXISTS settlement_work_config (
  config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settlement VARCHAR(100) NOT NULL,
  program_type VARCHAR(50) NOT NULL CHECK (program_type IN ('digitization', 'mobile_mapping', 'household_survey', 'microtasking')),
  start_date DATE NOT NULL,
  end_date DATE,
  total_work_days INTEGER DEFAULT 20,
  daily_target INTEGER DEFAULT 200,
  project_hashtag VARCHAR(100) DEFAULT '#DPW2025',
  timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(settlement, program_type)
);

CREATE INDEX IF NOT EXISTS idx_settlement_config_settlement ON settlement_work_config(settlement);
CREATE INDEX IF NOT EXISTS idx_settlement_config_program ON settlement_work_config(program_type);
CREATE INDEX IF NOT EXISTS idx_settlement_config_active ON settlement_work_config(is_active);

COMMENT ON TABLE settlement_work_config IS 'Configuration for work periods per settlement and program type';
COMMENT ON COLUMN settlement_work_config.total_work_days IS 'Maximum work days allowed (default: 20)';
COMMENT ON COLUMN settlement_work_config.project_hashtag IS 'OSM hashtag to filter work (e.g., #DPW2025)';

-- ============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================

CREATE TRIGGER update_youth_osm_stats_updated_at 
BEFORE UPDATE ON youth_osm_stats
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_youth_work_days_updated_at 
BEFORE UPDATE ON youth_work_days
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settlement_work_config_updated_at 
BEFORE UPDATE ON settlement_work_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: SETTLEMENT CONFIGURATIONS
-- ============================================
-- Based on actual work schedule data

INSERT INTO settlement_work_config (settlement, program_type, start_date, daily_target, project_hashtag, is_active) VALUES
  ('Kayole', 'digitization', '2025-12-09', 200, '#DPW2025', TRUE),
  ('Kariobangi Machakos', 'digitization', '2025-12-15', 200, '#DPW2025', TRUE),
  ('Mji wa Huruma', 'digitization', '2025-12-11', 200, '#DPW2025', TRUE)
ON CONFLICT (settlement, program_type) DO UPDATE SET
  start_date = EXCLUDED.start_date,
  daily_target = EXCLUDED.daily_target,
  project_hashtag = EXCLUDED.project_hashtag,
  updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- HELPFUL VIEWS FOR REPORTING
-- ============================================

-- View: Youth work summary
CREATE OR REPLACE VIEW youth_work_summary AS
SELECT 
  yp.youth_id,
  yp.full_name,
  yp.settlement,
  yp.program_type,
  swc.start_date as program_start_date,
  swc.total_work_days as max_days,
  COUNT(ywd.work_day_id) FILTER (WHERE ywd.status = 'approved') as days_worked,
  COUNT(ywd.work_day_id) FILTER (WHERE ywd.target_met = TRUE) as days_target_met,
  SUM(ywd.buildings_count) FILTER (WHERE ywd.status = 'approved') as total_buildings,
  AVG(ywd.buildings_count) FILTER (WHERE ywd.status = 'approved') as avg_buildings_per_day,
  MAX(ywd.work_date) as last_work_date
FROM youth_participants yp
LEFT JOIN settlement_work_config swc ON yp.settlement = swc.settlement AND yp.program_type = swc.program_type
LEFT JOIN youth_work_days ywd ON yp.youth_id = ywd.youth_id
WHERE yp.is_active = TRUE
GROUP BY yp.youth_id, yp.full_name, yp.settlement, yp.program_type, swc.start_date, swc.total_work_days;

COMMENT ON VIEW youth_work_summary IS 'Summary view of work progress for all active youth';

-- ============================================
-- VALIDATION & DATA INTEGRITY
-- ============================================

-- Function to validate work day is within allowed period
CREATE OR REPLACE FUNCTION validate_work_day()
RETURNS TRIGGER AS $$
DECLARE
  v_start_date DATE;
  v_total_days INTEGER;
  v_days_worked INTEGER;
BEGIN
  -- Get settlement config
  SELECT start_date, total_work_days INTO v_start_date, v_total_days
  FROM settlement_work_config swc
  JOIN youth_participants yp ON yp.settlement = swc.settlement AND yp.program_type = swc.program_type
  WHERE yp.youth_id = NEW.youth_id AND swc.is_active = TRUE;
  
  -- Check if work date is before start date
  IF NEW.work_date < v_start_date THEN
    RAISE EXCEPTION 'Work date cannot be before settlement start date %', v_start_date;
  END IF;
  
  -- Count existing approved work days
  SELECT COUNT(*) INTO v_days_worked
  FROM youth_work_days
  WHERE youth_id = NEW.youth_id AND status = 'approved';
  
  -- Check if exceeding maximum work days (when approving)
  IF NEW.status = 'approved' AND v_days_worked >= v_total_days THEN
    RAISE EXCEPTION 'Youth has already completed maximum % work days', v_total_days;
  END IF;
  
  -- Update target_met flag
  NEW.target_met := (NEW.buildings_count >= NEW.daily_target);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_work_day_validity
BEFORE INSERT OR UPDATE ON youth_work_days
FOR EACH ROW EXECUTE FUNCTION validate_work_day();

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('youth_osm_stats', 'youth_work_days', 'settlement_work_config')
ORDER BY tablename;

-- Verify indexes
SELECT 
  indexname,
  tablename
FROM pg_indexes 
WHERE tablename IN ('youth_osm_stats', 'youth_work_days', 'settlement_work_config')
ORDER BY tablename, indexname;

COMMENT ON SCHEMA public IS 'Work dashboard schema migration completed on 2026-01-06';
