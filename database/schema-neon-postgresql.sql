-- Spatial Collective Learning Platform - Neon PostgreSQL Schema
-- Database: Neon PostgreSQL
-- Created: December 5, 2025

-- Drop existing tables if they exist (in correct order due to foreign keys)
DROP VIEW IF EXISTS recent_auth_activity CASCADE;
DROP VIEW IF EXISTS youth_contract_status CASCADE;
DROP TABLE IF EXISTS auth_logs CASCADE;
DROP TABLE IF EXISTS signed_contracts CASCADE;
DROP TABLE IF EXISTS contract_templates CASCADE;
DROP TABLE IF EXISTS youth_participants CASCADE;
DROP TABLE IF EXISTS staff_members CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STAFF MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS staff_members (
  staff_id VARCHAR(50) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(50),
  role VARCHAR(20) NOT NULL CHECK (role IN ('trainer', 'admin', 'superadmin')),
  created_by VARCHAR(50), -- Staff ID of the person who created this account
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (created_by) REFERENCES staff_members(staff_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_staff_email ON staff_members(email);
CREATE INDEX IF NOT EXISTS idx_staff_active ON staff_members(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff_members(role);

-- ============================================
-- YOUTH PARTICIPANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS youth_participants (
  youth_id VARCHAR(50) PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone_number VARCHAR(50),
  program_type VARCHAR(50) NOT NULL CHECK (program_type IN ('digitization', 'mobile_mapping', 'household_survey', 'microtasking')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_youth_email ON youth_participants(email);
CREATE INDEX IF NOT EXISTS idx_youth_program ON youth_participants(program_type);
CREATE INDEX IF NOT EXISTS idx_youth_active ON youth_participants(is_active);

-- ============================================
-- CONTRACT TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contract_templates (
  template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_type VARCHAR(50) NOT NULL CHECK (program_type IN ('digitization', 'mobile_mapping', 'household_survey', 'microtasking')),
  version VARCHAR(50) NOT NULL,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  pdf_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES staff_members(staff_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_template_program ON contract_templates(program_type);
CREATE INDEX IF NOT EXISTS idx_template_active ON contract_templates(is_active);

-- ============================================
-- SIGNED CONTRACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS signed_contracts (
  contract_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youth_id VARCHAR(50) NOT NULL,
  template_id UUID NOT NULL,
  signature_data TEXT NOT NULL,
  ip_address VARCHAR(100),
  user_agent TEXT,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  pdf_url TEXT,
  is_valid BOOLEAN DEFAULT TRUE,
  invalidated_at TIMESTAMP WITH TIME ZONE,
  invalidated_by VARCHAR(50),
  invalidation_reason TEXT,
  FOREIGN KEY (youth_id) REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES contract_templates(template_id) ON DELETE CASCADE,
  FOREIGN KEY (invalidated_by) REFERENCES staff_members(staff_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contract_youth ON signed_contracts(youth_id);
CREATE INDEX IF NOT EXISTS idx_contract_template ON signed_contracts(template_id);
CREATE INDEX IF NOT EXISTS idx_contract_valid ON signed_contracts(is_valid);
CREATE INDEX IF NOT EXISTS idx_contract_signed ON signed_contracts(signed_at);

-- ============================================
-- AUTHENTICATION LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS auth_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(50) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('youth', 'staff')),
  action VARCHAR(50) NOT NULL,
  success BOOLEAN NOT NULL,
  ip_address VARCHAR(100),
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_user ON auth_logs(user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_auth_created ON auth_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_success ON auth_logs(success);

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON staff_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_youth_participants_updated_at BEFORE UPDATE ON youth_participants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON contract_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: STAFF MEMBERS
-- ============================================
INSERT INTO staff_members (staff_id, full_name, email, role) VALUES
  ('SC001', 'Admin User', 'admin@spatialcollective.com', 'admin'),
  ('SC002', 'Validator One', 'validator1@spatialcollective.com', 'validator'),
  ('SC003', 'Validator Two', 'validator2@spatialcollective.com', 'validator')
ON CONFLICT (staff_id) DO NOTHING;

-- ============================================
-- SEED DATA: YOUTH PARTICIPANTS
-- ============================================
INSERT INTO youth_participants (youth_id, full_name, email, phone_number, program_type) VALUES
  ('KAYTEST001ES', 'Test Youth Kayole', 'kaytest@example.com', '+254700000000', 'digitization')
ON CONFLICT (youth_id) DO NOTHING;

-- ============================================
-- SEED DATA: CONTRACT TEMPLATES
-- ============================================
INSERT INTO contract_templates (program_type, version, title, content, created_by) VALUES
  ('digitization', '1.0', 'Digitization Training Agreement', 
   E'# Digitization Training Agreement\n\nThis agreement outlines the terms and conditions for participating in the Spatial Collective Digitization Training Program.\n\n## Terms\n1. Participants agree to attend all training sessions\n2. Participants will maintain confidentiality of project data\n3. Participants commit to quality standards in mapping\n\n## Duration\nThis agreement is valid for the duration of the training program.', 
   'SC001'),
  ('mobile_mapping', '1.0', 'Mobile Mapping Training Agreement',
   E'# Mobile Mapping Training Agreement\n\nThis agreement covers participation in mobile data collection training.\n\n## Terms\n1. Proper use of mobile devices and applications\n2. Data quality and accuracy standards\n3. Field safety protocols\n\n## Duration\nValid for the training period.',
   'SC001')
ON CONFLICT DO NOTHING;

-- ============================================
-- VIEW: Active Youth with Contract Status
-- ============================================
CREATE OR REPLACE VIEW youth_contract_status AS
SELECT 
  yp.youth_id,
  yp.full_name,
  yp.email,
  yp.phone_number,
  yp.program_type,
  yp.last_login,
  CASE 
    WHEN sc.contract_id IS NOT NULL THEN TRUE 
    ELSE FALSE 
  END AS has_signed_contract,
  sc.signed_at,
  ct.title AS contract_title,
  ct.version AS contract_version
FROM youth_participants yp
LEFT JOIN signed_contracts sc ON yp.youth_id = sc.youth_id AND sc.is_valid = TRUE
LEFT JOIN contract_templates ct ON sc.template_id = ct.template_id
WHERE yp.is_active = TRUE;

-- ============================================
-- VIEW: Recent Authentication Activity
-- ============================================
CREATE OR REPLACE VIEW recent_auth_activity AS
SELECT 
  al.log_id,
  al.user_id,
  al.user_type,
  CASE 
    WHEN al.user_type = 'youth' THEN yp.full_name
    WHEN al.user_type = 'staff' THEN sm.full_name
  END AS user_name,
  al.action,
  al.success,
  al.ip_address,
  al.created_at
FROM auth_logs al
LEFT JOIN youth_participants yp ON al.user_id = yp.youth_id AND al.user_type = 'youth'
LEFT JOIN staff_members sm ON al.user_id = sm.staff_id AND al.user_type = 'staff'
ORDER BY al.created_at DESC
LIMIT 100;

-- ============================================
-- GRANT PERMISSIONS (adjust as needed)
-- ============================================
-- Grant permissions to neondb_owner (adjust if using different user)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neondb_owner;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO neondb_owner;
