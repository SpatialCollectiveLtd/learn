-- Youth Training Platform - MySQL Database Schema
-- This schema supports staff authentication and youth contract management

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS auth_logs;
DROP TABLE IF EXISTS signed_contracts;
DROP TABLE IF EXISTS contract_templates;
DROP TABLE IF EXISTS youth_participants;
DROP TABLE IF EXISTS staff_members;

-- Staff Members Table
CREATE TABLE staff_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id VARCHAR(10) UNIQUE NOT NULL COMMENT 'Format: SC###',
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('validator', 'admin') DEFAULT 'validator',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_staff_id (staff_id),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Youth Participants Table
CREATE TABLE youth_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    youth_id VARCHAR(10) UNIQUE NOT NULL COMMENT 'Format: YT###',
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    program_type ENUM('digitization', 'mobile_mapping', 'household_survey', 'microtasking') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    has_signed_contract BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_youth_id (youth_id),
    INDEX idx_program_type (program_type),
    INDEX idx_has_signed_contract (has_signed_contract)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contract Templates Table
CREATE TABLE contract_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_type ENUM('digitization', 'mobile_mapping', 'household_survey', 'microtasking') NOT NULL,
    version VARCHAR(10) NOT NULL DEFAULT '1.0',
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_active_template (program_type, is_active),
    INDEX idx_program_type (program_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Signed Contracts Table
CREATE TABLE signed_contracts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    youth_id INT NOT NULL,
    template_id INT NOT NULL,
    signature_data LONGTEXT NOT NULL COMMENT 'Base64 encoded signature image',
    pdf_data LONGBLOB COMMENT 'PDF document binary data',
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    INDEX idx_youth_id (youth_id),
    INDEX idx_signed_at (signed_at),
    FOREIGN KEY (youth_id) REFERENCES youth_participants(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES contract_templates(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Authentication Logs Table
CREATE TABLE auth_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_type ENUM('staff', 'youth') NOT NULL,
    user_identifier VARCHAR(10) NOT NULL COMMENT 'Staff ID or Youth ID',
    success BOOLEAN NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    failure_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_type (user_type),
    INDEX idx_user_identifier (user_identifier),
    INDEX idx_created_at (created_at),
    INDEX idx_success (success)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Test Staff Members
INSERT INTO staff_members (staff_id, full_name, email, role, is_active) VALUES
('SC001', 'John Mwangi', 'john.mwangi@spatialcollective.com', 'admin', TRUE),
('SC002', 'Sarah Wanjiku', 'sarah.wanjiku@spatialcollective.com', 'validator', TRUE);

-- Insert Test Youth Participants
INSERT INTO youth_participants (youth_id, full_name, email, phone, program_type, is_active, has_signed_contract) VALUES
('YT001', 'David Kimani', 'david.kimani@example.com', '+254712345678', 'digitization', TRUE, FALSE),
('YT002', 'Grace Achieng', 'grace.achieng@example.com', '+254723456789', 'digitization', TRUE, FALSE);

-- Insert Digitization Contract Template
INSERT INTO contract_templates (program_type, version, content, is_active) VALUES
('digitization', '1.0', '# YOUTH TRAINING & EMPLOYMENT CONTRACT

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

**Digital Signature:** [Signature captured below]', TRUE);

-- Create view for youth contract status
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

-- Create view for contract statistics
CREATE OR REPLACE VIEW contract_statistics AS
SELECT 
    program_type,
    COUNT(*) AS total_youth,
    SUM(CASE WHEN has_signed_contract THEN 1 ELSE 0 END) AS signed_contracts,
    SUM(CASE WHEN NOT has_signed_contract THEN 1 ELSE 0 END) AS unsigned_contracts
FROM youth_participants
GROUP BY program_type;

-- Grant appropriate permissions (adjust as needed for your MySQL user)
-- GRANT SELECT, INSERT, UPDATE ON youth_training.* TO 'your_user'@'%';

-- Display setup confirmation
SELECT 'Database schema created successfully!' AS status;
SELECT 'Test data inserted:' AS info;
SELECT COUNT(*) AS staff_count FROM staff_members;
SELECT COUNT(*) AS youth_count FROM youth_participants;
SELECT COUNT(*) AS template_count FROM contract_templates;
