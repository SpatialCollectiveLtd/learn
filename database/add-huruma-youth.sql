-- Insert Mji wa Huruma settlement youth participants
-- This script is idempotent (safe to run multiple times)

INSERT INTO youth_participants (youth_id, full_name, program_type, settlement, is_active)
VALUES 
  ('HUR728CM', 'Catherine Mararo', 'digitization', 'Mji wa Huruma', TRUE),
  ('HUR801DN', 'Dennis Njuguna', 'digitization', 'Mji wa Huruma', TRUE),
  ('HUR478JM', 'John Mbugua', 'digitization', 'Mji wa Huruma', TRUE),
  ('HUR765JN', 'John Ngigi', 'digitization', 'Mji wa Huruma', TRUE),
  ('HUR564KM', 'Lydia Mwove', 'digitization', 'Mji wa Huruma', TRUE),
  ('HUR455MM', 'Martin Mbugua', 'digitization', 'Mji wa Huruma', TRUE),
  ('HUR768SW', 'Stephen Wanjiru', 'digitization', 'Mji wa Huruma', TRUE)
ON CONFLICT (youth_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  program_type = EXCLUDED.program_type,
  settlement = EXCLUDED.settlement,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

\echo '=== Mji wa Huruma Youth Added Successfully ==='
\echo 'Verifying Huruma youth data:'
SELECT 
    youth_id, 
    full_name, 
    program_type, 
    settlement,
    is_active, 
    created_at 
FROM youth_participants 
WHERE settlement = 'Mji wa Huruma'
ORDER BY full_name;

\echo ''
\echo 'Total Huruma youth: '
SELECT COUNT(*) as huruma_youth_count
FROM youth_participants 
WHERE settlement = 'Mji wa Huruma';
