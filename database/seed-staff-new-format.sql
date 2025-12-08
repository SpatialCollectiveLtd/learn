-- Seed Staff Members with New ID Format
-- Created: December 8, 2025
-- Format: S[Type]EA[EmployeeCode][Role]
-- Type: T=Technical, F=Field, M=Management
-- Role: SA=SuperAdmin, T=Trainer, A=Admin

-- Clear existing staff (optional - remove if you want to keep old data)
-- DELETE FROM staff_members;

-- Insert Super Admin
INSERT INTO staff_members (staff_id, full_name, email, phone_number, role, created_by, is_active) VALUES
  ('STEA8103SA', 'Technical Team', 'tech@spatialcollective.com', NULL, 'superadmin', NULL, TRUE)
ON CONFLICT (staff_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = CURRENT_TIMESTAMP;

-- Insert Admin
INSERT INTO staff_members (staff_id, full_name, email, phone_number, role, created_by, is_active) VALUES
  ('SMEA4441A', 'Alex Okumu', 'alex.okumu@spatialcollective.com', NULL, 'admin', 'STEA8103SA', TRUE)
ON CONFLICT (staff_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  created_by = EXCLUDED.created_by,
  updated_at = CURRENT_TIMESTAMP;

-- Insert Trainers
INSERT INTO staff_members (staff_id, full_name, email, phone_number, role, created_by, is_active) VALUES
  ('SFEA0119T', 'Juma Charles', 'juma.charles@spatialcollective.com', NULL, 'trainer', 'STEA8103SA', TRUE),
  ('SFEA4333T', 'Francis Wambua', 'francis.wambua@spatialcollective.com', NULL, 'trainer', 'STEA8103SA', TRUE),
  ('SFEA4808T', 'Purent Oduor', 'purent.oduor@spatialcollective.com', NULL, 'trainer', 'STEA8103SA', TRUE)
ON CONFLICT (staff_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  created_by = EXCLUDED.created_by,
  updated_at = CURRENT_TIMESTAMP;

-- Verify the data
SELECT 
  staff_id,
  full_name,
  email,
  role,
  created_by,
  is_active,
  created_at
FROM staff_members
ORDER BY 
  CASE role 
    WHEN 'superadmin' THEN 1 
    WHEN 'admin' THEN 2 
    WHEN 'trainer' THEN 3 
    ELSE 4 
  END,
  staff_id;
