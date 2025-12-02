-- Spatial Collective Youth Training Platform Database Schema
-- PostgreSQL Database Schema for Youth Contracts and Staff Management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STAFF MANAGEMENT
-- ============================================================================

-- Staff Members Table
CREATE TABLE staff_members (
    staff_id VARCHAR(10) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('validator', 'admin')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ============================================================================
-- YOUTH MANAGEMENT
-- ============================================================================

-- Youth Participants Table
CREATE TABLE youth_participants (
    youth_id VARCHAR(10) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(20),
    program_type VARCHAR(50) NOT NULL CHECK (program_type IN ('digitization', 'mobile_mapping', 'household_survey', 'microtasking')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- ============================================================================
-- CONTRACT TEMPLATES
-- ============================================================================

-- Contract Templates Table
CREATE TABLE contract_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_type VARCHAR(50) NOT NULL CHECK (program_type IN ('digitization', 'mobile_mapping', 'household_survey', 'microtasking')),
    version VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    pdf_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(10) REFERENCES staff_members(staff_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(program_type, version)
);

-- ============================================================================
-- SIGNED CONTRACTS
-- ============================================================================

-- Signed Contracts Table
CREATE TABLE signed_contracts (
    contract_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    youth_id VARCHAR(10) NOT NULL REFERENCES youth_participants(youth_id),
    template_id UUID NOT NULL REFERENCES contract_templates(template_id),
    signature_data TEXT NOT NULL, -- Base64 encoded signature
    ip_address VARCHAR(45),
    user_agent TEXT,
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pdf_url VARCHAR(500),
    is_valid BOOLEAN DEFAULT TRUE,
    invalidated_at TIMESTAMP,
    invalidated_by VARCHAR(10) REFERENCES staff_members(staff_id),
    invalidation_reason TEXT
);

-- ============================================================================
-- AUTHENTICATION LOGS
-- ============================================================================

-- Authentication Logs Table
CREATE TABLE auth_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(10) NOT NULL,
    user_type VARCHAR(10) NOT NULL CHECK (user_type IN ('youth', 'staff')),
    action VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Staff indexes
CREATE INDEX idx_staff_email ON staff_members(email);
CREATE INDEX idx_staff_role ON staff_members(role);
CREATE INDEX idx_staff_active ON staff_members(is_active);

-- Youth indexes
CREATE INDEX idx_youth_email ON youth_participants(email);
CREATE INDEX idx_youth_program ON youth_participants(program_type);
CREATE INDEX idx_youth_active ON youth_participants(is_active);

-- Contract templates indexes
CREATE INDEX idx_template_program ON contract_templates(program_type);
CREATE INDEX idx_template_active ON contract_templates(is_active);

-- Signed contracts indexes
CREATE INDEX idx_signed_youth ON signed_contracts(youth_id);
CREATE INDEX idx_signed_template ON signed_contracts(template_id);
CREATE INDEX idx_signed_date ON signed_contracts(signed_at);
CREATE INDEX idx_signed_valid ON signed_contracts(is_valid);

-- Auth logs indexes
CREATE INDEX idx_auth_user ON auth_logs(user_id);
CREATE INDEX idx_auth_type ON auth_logs(user_type);
CREATE INDEX idx_auth_date ON auth_logs(created_at);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_youth_updated_at BEFORE UPDATE ON youth_participants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_updated_at BEFORE UPDATE ON contract_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA - TEST STAFF AND YOUTH IDs
-- ============================================================================

-- Insert Test Staff Members
INSERT INTO staff_members (staff_id, full_name, email, role) VALUES
('SC001', 'John Admin', 'john.admin@spatialcollective.com', 'admin'),
('SC002', 'Jane Validator', 'jane.validator@spatialcollective.com', 'validator');

-- Insert Test Youth Participants
INSERT INTO youth_participants (youth_id, full_name, email, phone_number, program_type) VALUES
('YT001', 'Alice Digitizer', 'alice@example.com', '+254700000001', 'digitization'),
('YT002', 'Bob Mapper', 'bob@example.com', '+254700000002', 'digitization');

-- Insert Contract Template for Digitization
INSERT INTO contract_templates (program_type, version, title, content, created_by) VALUES
('digitization', 'v1.0', 'Digitization Youth Contract Agreement', 
'# DIGITIZATION PROGRAM - YOUTH CONTRACT AGREEMENT

## SPATIAL COLLECTIVE LTD - YOUTH TRAINING PROGRAM

**This Agreement is made on:** [DATE]

**Between:**
- **Spatial Collective Ltd** (hereinafter referred to as "The Organization")
- **[YOUTH NAME]** - Youth ID: [YOUTH_ID] (hereinafter referred to as "The Participant")

---

## 1. PROGRAM OVERVIEW

The Participant agrees to participate in the **Digitization Training Program** organized by Spatial Collective Ltd. This program focuses on building digitization and mapping skills using JOSM (Java OpenStreetMap Editor) and related geospatial tools.

---

## 2. PARTICIPANT RESPONSIBILITIES

The Participant agrees to:

### 2.1 Training Commitment
- Complete all assigned training modules in the digitization program
- Attend all scheduled training sessions (online or in-person)
- Actively participate in hands-on exercises and practical assignments
- Achieve minimum passing scores on training assessments

### 2.2 Work Quality Standards
- Produce high-quality digitization work according to project specifications
- Follow all mapping guidelines and quality assurance procedures
- Ensure accuracy in building tracing and feature tagging
- Submit work within agreed timelines

### 2.3 Tool Usage
- Properly use JOSM and related mapping tools as instructed
- Follow OpenStreetMap community guidelines and standards
- Maintain proper data attribution and source documentation
- Report any technical issues promptly

### 2.4 Professional Conduct
- Maintain professional behavior during all training sessions
- Respect fellow participants, trainers, and program coordinators
- Protect confidential project information
- Represent Spatial Collective positively in all interactions

### 2.5 Communication
- Respond to communications from trainers and coordinators within 24 hours
- Report any challenges or difficulties that may affect performance
- Participate in feedback sessions and evaluations
- Keep contact information current

---

## 3. ORGANIZATION RESPONSIBILITIES

Spatial Collective Ltd agrees to:

### 3.1 Training Provision
- Provide comprehensive digitization training materials
- Offer qualified trainers and technical support
- Supply access to necessary software and tools
- Provide clear guidelines and documentation

### 3.2 Support Services
- Offer technical assistance during training
- Provide feedback on submitted work
- Address questions and concerns promptly
- Facilitate peer learning opportunities

### 3.3 Compensation (if applicable)
- Provide stipends or compensation as per program terms
- Process payments within agreed timelines
- Communicate clearly about payment schedules

---

## 4. DATA PROTECTION AND CONFIDENTIALITY

### 4.1 Participant agrees to:
- Maintain confidentiality of project data and client information
- Not share or distribute project materials without authorization
- Use project data only for assigned tasks
- Delete local copies of data after project completion

### 4.2 Organization agrees to:
- Protect personal information of participants
- Use participant data only for program purposes
- Comply with data protection regulations

---

## 5. INTELLECTUAL PROPERTY

- All digitization work produced is property of Spatial Collective Ltd
- Participant retains credit for contributed work
- Work may be used in portfolios with prior approval

---

## 6. PROGRAM COMPLETION

### 6.1 Successful Completion Criteria:
- Complete all training modules
- Pass all required assessments
- Meet quality standards in practical work
- Maintain good attendance record

### 6.2 Certificate:
- Participants who successfully complete the program will receive a certificate
- Certificate indicates skills acquired and proficiency level

---

## 7. TERMINATION

### 7.1 This agreement may be terminated by:
- **Participant:** With 1 week written notice
- **Organization:** For breach of agreement terms or unsatisfactory performance

### 7.2 Upon termination:
- Participant must return all materials and delete project data
- Outstanding compensation will be settled
- Access to training platforms will be revoked

---

## 8. CODE OF CONDUCT

The Participant agrees to:
- No harassment, discrimination, or unprofessional behavior
- No plagiarism or dishonest work practices
- No unauthorized use of organizational resources
- Compliance with all safety guidelines

---

## 9. DISPUTE RESOLUTION

Any disputes arising from this agreement shall be:
- First addressed through direct communication
- Escalated to program management if unresolved
- Resolved through mediation if necessary

---

## 10. GENERAL TERMS

- This agreement is governed by the laws of Kenya
- Amendments must be in writing and signed by both parties
- This agreement does not create an employment relationship
- Participant is responsible for own tax obligations (if applicable)

---

## 11. ACKNOWLEDGMENT

By signing below, the Participant acknowledges that they have:
- Read and understood all terms of this agreement
- Had opportunity to ask questions and seek clarification
- Voluntarily agreed to participate in the program
- Understood their rights and responsibilities

---

## SIGNATURES

**Participant:**
- Name: [YOUTH NAME]
- Youth ID: [YOUTH_ID]
- Signature: _________________________
- Date: _____________________________

**For Spatial Collective Ltd:**
- Name: _____________________________
- Title: _____________________________
- Signature: _________________________
- Date: _____________________________

---

**Contact Information:**
Spatial Collective Ltd
Email: info@spatialcollective.com
Phone: [Contact Number]

---

*This is a legally binding agreement. Please read carefully before signing.*
', 'SC001');

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Active Youth with Contract Status
CREATE VIEW youth_contract_status AS
SELECT 
    y.youth_id,
    y.full_name,
    y.email,
    y.program_type,
    y.is_active,
    CASE 
        WHEN sc.contract_id IS NOT NULL THEN TRUE 
        ELSE FALSE 
    END as has_signed_contract,
    sc.signed_at,
    sc.contract_id
FROM youth_participants y
LEFT JOIN signed_contracts sc ON y.youth_id = sc.youth_id AND sc.is_valid = TRUE;

-- View: Contract Signing Statistics
CREATE VIEW contract_statistics AS
SELECT 
    program_type,
    COUNT(*) as total_participants,
    SUM(CASE WHEN has_signed_contract THEN 1 ELSE 0 END) as signed_contracts,
    SUM(CASE WHEN NOT has_signed_contract THEN 1 ELSE 0 END) as unsigned_contracts
FROM youth_contract_status
GROUP BY program_type;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if youth has signed contract
CREATE OR REPLACE FUNCTION has_valid_contract(p_youth_id VARCHAR(10))
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM signed_contracts 
        WHERE youth_id = p_youth_id 
        AND is_valid = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get active contract template for program
CREATE OR REPLACE FUNCTION get_active_template(p_program_type VARCHAR(50))
RETURNS UUID AS $$
DECLARE
    v_template_id UUID;
BEGIN
    SELECT template_id INTO v_template_id
    FROM contract_templates
    WHERE program_type = p_program_type
    AND is_active = TRUE
    ORDER BY created_at DESC
    LIMIT 1;
    
    RETURN v_template_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON DATABASE spatial_collective_db IS 'Spatial Collective Youth Training Platform Database';
