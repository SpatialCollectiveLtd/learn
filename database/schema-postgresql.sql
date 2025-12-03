-- Spatial Collective Learning Platform Database Schema (PostgreSQL)
-- Compatible with Neon PostgreSQL
-- Generated: December 3, 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MODULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modules_slug ON modules(slug);
CREATE INDEX IF NOT EXISTS idx_modules_active_order ON modules(is_active, display_order);

-- ============================================
-- ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  UNIQUE (module_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_roles_module_active ON roles(module_id, is_active);

-- ============================================
-- TRAINING SECTIONS TABLE
-- ============================================
CREATE TYPE content_type_enum AS ENUM ('text', 'checklist', 'steps', 'warning', 'tip', 'code');

CREATE TABLE IF NOT EXISTS training_sections (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  content_type content_type_enum DEFAULT 'text',
  content TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  parent_section_id INTEGER,
  is_required BOOLEAN DEFAULT TRUE,
  estimated_time INTEGER DEFAULT 0, -- Estimated time in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_section_id) REFERENCES training_sections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_training_sections_role_order ON training_sections(role_id, display_order);
CREATE INDEX IF NOT EXISTS idx_training_sections_parent ON training_sections(parent_section_id);

-- ============================================
-- USERS TABLE (For future authentication)
-- ============================================
CREATE TYPE user_role_enum AS ENUM ('employee', 'trainer', 'admin');

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  role user_role_enum DEFAULT 'employee',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- ============================================
-- USER PROGRESS TABLE (For future tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  section_id INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  time_spent INTEGER DEFAULT 0, -- Time spent in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (section_id) REFERENCES training_sections(id) ON DELETE CASCADE,
  UNIQUE (user_id, section_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(completed_at);

-- ============================================
-- STAFF MEMBERS TABLE (Authentication)
-- ============================================
CREATE TYPE staff_role_enum AS ENUM ('validator', 'admin');

CREATE TABLE IF NOT EXISTS staff_members (
  id SERIAL PRIMARY KEY,
  staff_id VARCHAR(10) UNIQUE NOT NULL, -- Format: SC###
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  role staff_role_enum DEFAULT 'validator',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_staff_members_staff_id ON staff_members(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_members_email ON staff_members(email);
CREATE INDEX IF NOT EXISTS idx_staff_members_role ON staff_members(role);

-- ============================================
-- YOUTH PARTICIPANTS TABLE
-- ============================================
CREATE TYPE program_type_enum AS ENUM ('digitization', 'mobile_mapping', 'household_survey', 'microtasking');

CREATE TABLE IF NOT EXISTS youth_participants (
  id SERIAL PRIMARY KEY,
  youth_id VARCHAR(10) UNIQUE NOT NULL, -- Format: YT###
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  program_type program_type_enum NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  has_signed_contract BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_youth_participants_youth_id ON youth_participants(youth_id);
CREATE INDEX IF NOT EXISTS idx_youth_participants_program_type ON youth_participants(program_type);
CREATE INDEX IF NOT EXISTS idx_youth_participants_has_signed_contract ON youth_participants(has_signed_contract);

-- ============================================
-- CONTRACT TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contract_templates (
  id SERIAL PRIMARY KEY,
  program_type program_type_enum NOT NULL,
  version VARCHAR(10) NOT NULL DEFAULT '1.0',
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_program_type ON contract_templates(program_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(program_type, is_active) WHERE is_active = true;

-- ============================================
-- SIGNED CONTRACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS signed_contracts (
  id SERIAL PRIMARY KEY,
  youth_id INTEGER NOT NULL,
  template_id INTEGER NOT NULL,
  signature_data TEXT NOT NULL, -- Base64 encoded signature image
  pdf_data BYTEA, -- PDF document binary data
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45),
  user_agent TEXT,
  FOREIGN KEY (youth_id) REFERENCES youth_participants(id) ON DELETE CASCADE,
  FOREIGN KEY (template_id) REFERENCES contract_templates(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_signed_contracts_youth_id ON signed_contracts(youth_id);
CREATE INDEX IF NOT EXISTS idx_signed_contracts_signed_at ON signed_contracts(signed_at);

-- ============================================
-- AUTHENTICATION LOGS TABLE
-- ============================================
CREATE TYPE auth_user_type_enum AS ENUM ('staff', 'youth');

CREATE TABLE IF NOT EXISTS auth_logs (
  id SERIAL PRIMARY KEY,
  user_type auth_user_type_enum NOT NULL,
  user_identifier VARCHAR(10) NOT NULL, -- Staff ID or Youth ID
  success BOOLEAN NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  failure_reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_logs_user_type ON auth_logs(user_type);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_identifier ON auth_logs(user_identifier);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_logs_success ON auth_logs(success);

-- ============================================
-- TRIGGER FOR UPDATED_AT TIMESTAMPS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_sections_updated_at BEFORE UPDATE ON training_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_members_updated_at BEFORE UPDATE ON staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_youth_participants_updated_at BEFORE UPDATE ON youth_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contract_templates_updated_at BEFORE UPDATE ON contract_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: MODULES
-- ============================================
INSERT INTO modules (name, slug, description, icon, display_order) VALUES
('Digitization', 'digitization', 'Digital mapping and satellite image interpretation', '🗺️', 1),
('Mobile Mapping', 'mobile-mapping', 'Field data collection using mobile devices', '📱', 2),
('Household Survey', 'household-survey', 'Conducting comprehensive household surveys', '🏠', 3),
('Microtasking', 'microtasking', 'Small task completion and validation', '✓', 4)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order;

-- ============================================
-- SEED DATA: ROLES FOR DIGITIZATION
-- ============================================
INSERT INTO roles (module_id, name, slug, description, display_order)
SELECT
  m.id,
  'Mapper',
  'mapper',
  'Learn digital mapping, building digitization, and task workflows',
  1
FROM modules m WHERE m.slug = 'digitization'
ON CONFLICT (module_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

INSERT INTO roles (module_id, name, slug, description, display_order)
SELECT
  m.id,
  'Validator',
  'validator',
  'Learn to validate and ensure quality of mapped data',
  2
FROM modules m WHERE m.slug = 'digitization'
ON CONFLICT (module_id, slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order;

-- ============================================
-- SEED DATA: TEST STAFF MEMBERS
-- ============================================
INSERT INTO staff_members (staff_id, full_name, email, role, is_active) VALUES
('SC001', 'John Mwangi', 'john.mwangi@spatialcollective.com', 'admin', TRUE),
('SC002', 'Sarah Wanjiku', 'sarah.wanjiku@spatialcollective.com', 'validator', TRUE)
ON CONFLICT (staff_id) DO NOTHING;

-- ============================================
-- SEED DATA: TEST YOUTH PARTICIPANTS
-- ============================================
INSERT INTO youth_participants (youth_id, full_name, email, phone, program_type, is_active, has_signed_contract) VALUES
('YT001', 'David Kimani', 'david.kimani@example.com', '+254712345678', 'digitization', TRUE, FALSE),
('YT002', 'Grace Achieng', 'grace.achieng@example.com', '+254723456789', 'digitization', TRUE, FALSE)
ON CONFLICT (youth_id) DO NOTHING;

-- ============================================
-- SEED DATA: CONTRACT TEMPLATE FOR DIGITIZATION
-- ============================================
INSERT INTO contract_templates (program_type, version, content, is_active) VALUES
('digitization', '1.0', E'# YOUTH TRAINING & EMPLOYMENT CONTRACT

## Agreement between Spatial Collective and {{youth_name}}

**Youth ID:** {{youth_id}}
**Program:** {{program_type}}
**Date:** {{contract_date}}

### 1. Program Overview
This agreement confirms your participation in the Spatial Collective Youth Training Program for digitization work.

### 2. Training Commitment
- Attend all scheduled training sessions
- Complete all assigned modules and assessments
- Maintain professionalism and punctuality
- Follow all validation guidelines as per JOSM standards

### 3. Work Requirements
- Perform digitization tasks with accuracy and attention to detail
- Meet quality standards set by validators
- Submit work within agreed timelines
- Maintain confidentiality of project data

### 4. Compensation
- Training stipend: As agreed in program terms
- Performance-based incentives: Subject to quality metrics
- Payment schedule: As per program guidelines

### 5. Code of Conduct
- Respect all team members and supervisors
- Use equipment and resources responsibly
- Report any issues or concerns promptly
- Maintain data security and privacy

### 6. Duration
This agreement is effective from the date of signing until program completion or termination as per mutual agreement.

### 7. Termination
Either party may terminate this agreement with written notice. Spatial Collective reserves the right to terminate immediately in case of misconduct or violation of terms.

---

By signing below, you acknowledge that you have read, understood, and agree to all terms and conditions outlined in this contract.

**Youth Name:** {{youth_name}}
**Youth ID:** {{youth_id}}
**Date:** {{contract_date}}

**Digital Signature:** [Signature captured below]', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- CREATE VIEWS
-- ============================================
CREATE OR REPLACE VIEW youth_contract_status AS
SELECT
    yp.youth_id,
    yp.full_name,
    yp.program_type,
    yp.has_signed_contract,
    sc.signed_at,
    ct.version AS contract_version
FROM youth_participants yp
LEFT JOIN signed_contracts sc ON yp.id = sc.youth_id
LEFT JOIN contract_templates ct ON sc.template_id = ct.id;

CREATE OR REPLACE VIEW contract_statistics AS
SELECT
    program_type,
    COUNT(*) AS total_youth,
    SUM(CASE WHEN has_signed_contract THEN 1 ELSE 0 END) AS signed_contracts,
    SUM(CASE WHEN NOT has_signed_contract THEN 1 ELSE 0 END) AS unsigned_contracts
FROM youth_participants
GROUP BY program_type;

-- ============================================
-- SCHEMA CREATION COMPLETE
-- ============================================
SELECT 'PostgreSQL schema created successfully for Neon!' AS status;
