-- Add test user KAYTEST001ES to production database
-- Run this script on your Neon PostgreSQL database

INSERT INTO youth_participants (youth_id, full_name, email, phone_number, program_type, is_active)
VALUES ('KAYTEST001ES', 'Test Youth Kayole', 'kaytest@example.com', '+254700000000', 'digitization', TRUE)
ON CONFLICT (youth_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone_number = EXCLUDED.phone_number,
  program_type = EXCLUDED.program_type,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

-- Verify the user was added
SELECT youth_id, full_name, email, program_type, is_active, created_at 
FROM youth_participants 
WHERE youth_id = 'KAYTEST001ES';
