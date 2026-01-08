-- ============================================
-- Module Expansion Migration Script
-- Adds support for 4 modules: Digitization, Microtasking, Mobile Mapping, Household Survey
-- Date: 2026-01-07
-- ============================================

BEGIN;

-- ============================================
-- 1. CREATE NEW TABLES
-- ============================================

-- Youth Personal Information (Extended)
CREATE TABLE IF NOT EXISTS youth_personal_info (
  youth_id VARCHAR(50) PRIMARY KEY REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  id_number VARCHAR(50) UNIQUE,
  date_of_birth DATE,
  age INTEGER,
  gender VARCHAR(20),
  ward VARCHAR(100),
  has_disability BOOLEAN DEFAULT FALSE,
  disability_details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_youth_personal_info_id_number ON youth_personal_info(id_number);
CREATE INDEX idx_youth_personal_info_has_disability ON youth_personal_info(has_disability);

-- Program Module Definitions
CREATE TABLE IF NOT EXISTS program_modules (
  module_id SERIAL PRIMARY KEY,
  module_name VARCHAR(50) UNIQUE NOT NULL,
  module_description TEXT,
  settlement VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  daily_target INTEGER,
  payment_rate_per_unit DECIMAL(10,2),
  unit_name VARCHAR(50), -- e.g., 'buildings', 'tasks', 'surveys'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert module definitions
INSERT INTO program_modules (module_name, module_description, daily_target, payment_rate_per_unit, unit_name) VALUES
('digitization', 'Building digitization using JOSM and OSM', 200, 1.00, 'buildings'),
('microtasking', 'Remote micro-tasks (image tagging, data verification, etc.)', 500, 0.50, 'tasks'),
('mobile_mapping', 'Field data collection using mobile apps and GPS', 100, 2.00, 'POIs'),
('household_survey', 'Door-to-door household surveys and data collection', 50, 3.00, 'surveys')
ON CONFLICT (module_name) DO NOTHING;

-- Youth Module Assignment History
CREATE TABLE IF NOT EXISTS youth_module_history (
  assignment_id SERIAL PRIMARY KEY,
  youth_id VARCHAR(50) REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
  module_name VARCHAR(50) NOT NULL,
  settlement VARCHAR(100),
  assigned_date DATE DEFAULT CURRENT_DATE,
  start_date DATE,
  end_date DATE,
  assignment_reason TEXT,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_youth_module_history_youth_id ON youth_module_history(youth_id);
CREATE INDEX idx_youth_module_history_is_current ON youth_module_history(is_current);

-- Generic Module Work Stats (replaces youth_osm_stats for all modules)
CREATE TABLE IF NOT EXISTS youth_module_stats (
  stat_id SERIAL PRIMARY KEY,
  youth_id VARCHAR(50) REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
  module_name VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  units_completed INTEGER DEFAULT 0,
  daily_target INTEGER,
  percentage_complete DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  payment_amount DECIMAL(10,2),
  verified BOOLEAN DEFAULT FALSE,
  verified_by VARCHAR(100),
  verified_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(youth_id, module_name, date)
);

CREATE INDEX idx_youth_module_stats_youth_id ON youth_module_stats(youth_id);
CREATE INDEX idx_youth_module_stats_date ON youth_module_stats(date);
CREATE INDEX idx_youth_module_stats_module ON youth_module_stats(module_name);

-- ============================================
-- 2. UPDATE EXISTING TABLES
-- ============================================

-- Add new columns to youth_participants if they don't exist
ALTER TABLE youth_participants 
  ADD COLUMN IF NOT EXISTS has_disability BOOLEAN DEFAULT FALSE;

ALTER TABLE youth_participants 
  ADD COLUMN IF NOT EXISTS ward VARCHAR(100);

-- Rename program_type to module_name for clarity (if column exists)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='youth_participants' AND column_name='program_type'
  ) THEN
    ALTER TABLE youth_participants RENAME COLUMN program_type TO module_name;
  END IF;
END $$;

-- Add constraint for valid modules (drop first if exists)
ALTER TABLE youth_participants 
  DROP CONSTRAINT IF EXISTS valid_module_name;

ALTER TABLE youth_participants
  ADD CONSTRAINT valid_module_name 
  CHECK (module_name IN ('digitization', 'microtasking', 'mobile_mapping', 'household_survey'));

-- ============================================
-- 3. MIGRATE EXISTING DATA
-- ============================================

-- Populate youth_personal_info from existing youth_participants
-- Note: This creates basic records - full data will be populated from the 300-youth list
INSERT INTO youth_personal_info (
  youth_id, 
  first_name, 
  last_name, 
  has_disability
)
SELECT 
  youth_id,
  SPLIT_PART(full_name, ' ', 1) as first_name,
  CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(full_name, ' '), 1) > 1 
    THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
    ELSE ''
  END as last_name,
  COALESCE(has_disability, FALSE)
FROM youth_participants
ON CONFLICT (youth_id) DO NOTHING;

-- Create module assignment history for existing digitization youth
INSERT INTO youth_module_history (
  youth_id,
  module_name,
  settlement,
  assigned_date,
  start_date,
  is_current,
  assignment_reason
)
SELECT 
  youth_id,
  module_name,
  settlement,
  created_at::DATE,
  created_at::DATE,
  is_active,
  'Initial digitization cohort'
FROM youth_participants
WHERE module_name = 'digitization'
ON CONFLICT DO NOTHING;

-- Migrate youth_osm_stats to youth_module_stats
-- Keep original table for now, create equivalent records in new table
INSERT INTO youth_module_stats (
  youth_id,
  module_name,
  date,
  units_completed,
  daily_target,
  percentage_complete,
  quality_score,
  payment_amount,
  created_at,
  updated_at
)
SELECT 
  youth_id,
  'digitization' as module_name,
  date,
  buildings_mapped as units_completed,
  200 as daily_target, -- Default digitization target
  CASE 
    WHEN buildings_mapped > 0 
    THEN ROUND((buildings_mapped::DECIMAL / 200) * 100, 2)
    ELSE 0
  END as percentage_complete,
  NULL as quality_score, -- Not tracked in old system
  buildings_mapped * 1.00 as payment_amount, -- KES 1 per building
  created_at,
  updated_at
FROM youth_osm_stats
ON CONFLICT (youth_id, module_name, date) DO NOTHING;

-- ============================================
-- 4. CREATE VIEWS FOR BACKWARD COMPATIBILITY
-- ============================================

-- View to maintain compatibility with old OSM stats queries
CREATE OR REPLACE VIEW youth_osm_stats_view AS
SELECT 
  stat_id,
  youth_id,
  date,
  units_completed as buildings_mapped,
  0 as changesets_analyzed, -- Not tracked in new system
  NULL as last_changeset_id,
  NULL as last_upload_time,
  created_at,
  updated_at
FROM youth_module_stats
WHERE module_name = 'digitization';

-- ============================================
-- 5. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to calculate payment for a youth on a specific date
CREATE OR REPLACE FUNCTION calculate_module_payment(
  p_youth_id VARCHAR,
  p_module_name VARCHAR,
  p_date DATE
) RETURNS DECIMAL AS $$
DECLARE
  v_units INTEGER;
  v_rate DECIMAL;
  v_payment DECIMAL;
BEGIN
  -- Get units completed
  SELECT units_completed INTO v_units
  FROM youth_module_stats
  WHERE youth_id = p_youth_id 
    AND module_name = p_module_name 
    AND date = p_date;
  
  -- Get payment rate
  SELECT payment_rate_per_unit INTO v_rate
  FROM program_modules
  WHERE module_name = p_module_name;
  
  -- Calculate payment
  v_payment := COALESCE(v_units, 0) * COALESCE(v_rate, 0);
  
  RETURN v_payment;
END;
$$ LANGUAGE plpgsql;

-- Function to get current module assignment
CREATE OR REPLACE FUNCTION get_youth_current_module(p_youth_id VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_module VARCHAR;
BEGIN
  SELECT module_name INTO v_module
  FROM youth_module_history
  WHERE youth_id = p_youth_id 
    AND is_current = TRUE
  ORDER BY assigned_date DESC
  LIMIT 1;
  
  RETURN v_module;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

-- Grant permissions to application user (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these after migration to verify:

-- Check module definitions
-- SELECT * FROM program_modules;

-- Check youth counts by module
-- SELECT module_name, COUNT(*) as count 
-- FROM youth_participants 
-- GROUP BY module_name;

-- Check personal info migration
-- SELECT COUNT(*) FROM youth_personal_info;

-- Check module history
-- SELECT module_name, COUNT(*) as assignments
-- FROM youth_module_history 
-- WHERE is_current = TRUE
-- GROUP BY module_name;

-- Check stats migration
-- SELECT module_name, COUNT(*) as records
-- FROM youth_module_stats
-- GROUP BY module_name;
