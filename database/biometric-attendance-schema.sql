-- Biometric Attendance System Database Schema
-- Created: 2026-01-17
-- Purpose: Support mobile-first biometric attendance with WebAuthn

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: biometric_credentials
-- Stores WebAuthn public key credentials for youth participants
CREATE TABLE IF NOT EXISTS biometric_credentials (
    credential_id VARCHAR(255) PRIMARY KEY, -- Base64-encoded WebAuthn credential ID
    youth_id VARCHAR(20) NOT NULL,
    public_key TEXT NOT NULL, -- Base64-encoded public key
    counter BIGINT DEFAULT 0, -- WebAuthn signature counter
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    registered_by VARCHAR(20), -- Staff ID who registered the credential
    registration_device TEXT, -- User agent/device info
    registration_ip INET, -- IP address during registration
    FOREIGN KEY (youth_id) REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
    FOREIGN KEY (registered_by) REFERENCES staff_members(staff_id) ON DELETE SET NULL
);

-- Index for fast youth lookups
CREATE INDEX idx_biometric_credentials_youth_id ON biometric_credentials(youth_id);
CREATE INDEX idx_biometric_credentials_active ON biometric_credentials(is_active) WHERE is_active = TRUE;

-- Table: biometric_challenges
-- Stores WebAuthn challenges for registration and authentication
CREATE TABLE IF NOT EXISTS biometric_challenges (
    challenge_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    youth_id VARCHAR(20) NOT NULL,
    challenge_data TEXT NOT NULL, -- Base64-encoded challenge bytes
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('register', 'authenticate')),
    staff_id VARCHAR(20) NOT NULL, -- Staff member who generated challenge
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    used_by VARCHAR(20), -- Staff ID who used the challenge
    FOREIGN KEY (youth_id) REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff_members(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (used_by) REFERENCES staff_members(staff_id) ON DELETE SET NULL
);

-- Index for challenge lookups and cleanup
CREATE INDEX idx_biometric_challenges_youth_id ON biometric_challenges(youth_id);
CREATE INDEX idx_biometric_challenges_expires_at ON biometric_challenges(expires_at);
CREATE INDEX idx_biometric_challenges_used ON biometric_challenges(used) WHERE used = FALSE;

-- Table: biometric_audit_log
-- Comprehensive audit trail for all biometric operations
CREATE TABLE IF NOT EXISTS biometric_audit_log (
    audit_id BIGSERIAL PRIMARY KEY,
    youth_id VARCHAR(20) NOT NULL,
    staff_id VARCHAR(20) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'registration', 'attendance_verification', 'credential_revoked', etc.
    credential_id VARCHAR(255), -- Related credential ID
    session_id VARCHAR(100), -- Training/attendance session ID
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT, -- Error details if success = FALSE
    metadata JSONB, -- Additional context (IP, user agent, device info, etc.)
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (youth_id) REFERENCES youth_participants(youth_id) ON DELETE CASCADE,
    FOREIGN KEY (staff_id) REFERENCES staff_members(staff_id) ON DELETE CASCADE
);

-- Indexes for audit log queries
CREATE INDEX idx_biometric_audit_log_youth_id ON biometric_audit_log(youth_id);
CREATE INDEX idx_biometric_audit_log_staff_id ON biometric_audit_log(staff_id);
CREATE INDEX idx_biometric_audit_log_action_type ON biometric_audit_log(action_type);
CREATE INDEX idx_biometric_audit_log_created_at ON biometric_audit_log(created_at);
CREATE INDEX idx_biometric_audit_log_session_id ON biometric_audit_log(session_id) WHERE session_id IS NOT NULL;

-- Add mobile authentication columns to staff_members table
ALTER TABLE staff_members 
ADD COLUMN IF NOT EXISTS mobile_pin_hash VARCHAR(64), -- Hashed PIN for mobile auth
ADD COLUMN IF NOT EXISTS mobile_pin_salt VARCHAR(64), -- Salt for PIN hashing
ADD COLUMN IF NOT EXISTS can_mobile_attend BOOLEAN DEFAULT FALSE, -- Permission flag
ADD COLUMN IF NOT EXISTS last_mobile_login TIMESTAMP,
ADD COLUMN IF NOT EXISTS mobile_login_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pin_updated_at TIMESTAMP;

-- Add biometric verification columns to attendance_records table
ALTER TABLE attendance_records 
ADD COLUMN IF NOT EXISTS verification_method VARCHAR(20) DEFAULT 'manual' CHECK (verification_method IN ('manual', 'biometric', 'qr_code')),
ADD COLUMN IF NOT EXISTS biometric_credential_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS note TEXT;

-- Add foreign key constraint for biometric credential reference
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_attendance_biometric_credential'
    ) THEN
        ALTER TABLE attendance_records 
        ADD CONSTRAINT fk_attendance_biometric_credential 
        FOREIGN KEY (biometric_credential_id) REFERENCES biometric_credentials(credential_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add columns to existing auth_logs table (if not exists)
-- Note: auth_logs table already exists, just ensure it has all needed columns
DO $$
BEGIN
    -- Add staff_id column if not exists (likely already exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_logs' AND column_name = 'staff_id') THEN
        ALTER TABLE auth_logs ADD COLUMN staff_id VARCHAR(20);
    END IF;
    
    -- Add action column if not exists (likely already exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_logs' AND column_name = 'action') THEN
        ALTER TABLE auth_logs ADD COLUMN action VARCHAR(50) NOT NULL DEFAULT 'unknown';
    END IF;
    
    -- Add ip_address column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_logs' AND column_name = 'ip_address') THEN
        ALTER TABLE auth_logs ADD COLUMN ip_address INET;
    END IF;
    
    -- Add user_agent column if not exists  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_logs' AND column_name = 'user_agent') THEN
        ALTER TABLE auth_logs ADD COLUMN user_agent TEXT;
    END IF;
    
    -- Add success column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_logs' AND column_name = 'success') THEN
        ALTER TABLE auth_logs ADD COLUMN success BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Add error_message column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'auth_logs' AND column_name = 'error_message') THEN
        ALTER TABLE auth_logs ADD COLUMN error_message TEXT;
    END IF;
END $$;

-- Add foreign key constraint for auth_logs if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'auth_logs_staff_id_fkey'
    ) THEN
        ALTER TABLE auth_logs 
        ADD CONSTRAINT auth_logs_staff_id_fkey 
        FOREIGN KEY (staff_id) REFERENCES staff_members(staff_id) ON DELETE SET NULL;
    END IF;
END $$;

-- Indexes for auth logs
CREATE INDEX IF NOT EXISTS idx_auth_logs_staff_id ON auth_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_action ON auth_logs(action);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON auth_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_logs_ip_address ON auth_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_logs_success ON auth_logs(success) WHERE success = FALSE;

-- Create indexes on attendance_records for biometric queries
CREATE INDEX IF NOT EXISTS idx_attendance_verification_method ON attendance_records(verification_method);
CREATE INDEX IF NOT EXISTS idx_attendance_biometric_credential ON attendance_records(biometric_credential_id) WHERE biometric_credential_id IS NOT NULL;

-- Clean up expired challenges automatically (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_challenges() 
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM biometric_challenges 
    WHERE expires_at < NOW() - INTERVAL '1 day';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get youth biometric status
CREATE OR REPLACE FUNCTION get_youth_biometric_status(youth_id_param VARCHAR(20))
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'youth_id', yp.youth_id,
        'full_name', yp.full_name,
        'has_biometric', CASE WHEN bc.credential_id IS NOT NULL THEN TRUE ELSE FALSE END,
        'credentials_count', COALESCE(cred_count.count, 0),
        'last_biometric_attendance', last_attendance.attendance_date,
        'registration_date', bc.created_at,
        'registered_by', bc.registered_by
    ) INTO result
    FROM youth_participants yp
    LEFT JOIN biometric_credentials bc ON yp.youth_id = bc.youth_id AND bc.is_active = TRUE
    LEFT JOIN (
        SELECT youth_id, COUNT(*) as count
        FROM biometric_credentials 
        WHERE youth_id = youth_id_param AND is_active = TRUE
        GROUP BY youth_id
    ) cred_count ON yp.youth_id = cred_count.youth_id
    LEFT JOIN (
        SELECT youth_id, MAX(attendance_date) as attendance_date
        FROM attendance_records 
        WHERE youth_id = youth_id_param AND verification_method = 'biometric'
        GROUP BY youth_id
    ) last_attendance ON yp.youth_id = last_attendance.youth_id
    WHERE yp.youth_id = youth_id_param;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE biometric_credentials IS 'WebAuthn public key credentials for youth biometric authentication';
COMMENT ON TABLE biometric_challenges IS 'Temporary challenges for WebAuthn registration and authentication flows';
COMMENT ON TABLE biometric_audit_log IS 'Comprehensive audit trail for all biometric authentication operations';
COMMENT ON FUNCTION cleanup_expired_challenges() IS 'Removes expired biometric challenges older than 1 day';
COMMENT ON FUNCTION get_youth_biometric_status(VARCHAR) IS 'Returns comprehensive biometric status for a youth participant';

-- Grant permissions (adjust as needed for your role structure)
-- GRANT SELECT, INSERT, UPDATE ON biometric_credentials TO app_role;
-- GRANT SELECT, INSERT, UPDATE ON biometric_challenges TO app_role;
-- GRANT SELECT, INSERT ON biometric_audit_log TO app_role;
-- GRANT SELECT, UPDATE ON staff_members TO app_role;
-- GRANT SELECT, INSERT, UPDATE ON attendance_records TO app_role;
-- GRANT SELECT, INSERT ON auth_logs TO app_role;

-- Example data for testing (optional)
-- INSERT INTO staff_members (staff_id, full_name, email, role, can_mobile_attend, is_active) 
-- VALUES ('STST001T', 'Test Trainer', 'trainer@test.com', 'trainer', TRUE, TRUE)
-- ON CONFLICT (staff_id) DO NOTHING;

COMMIT;