-- Insert Kariobangi Machakos settlement youth participants
-- This script is idempotent (safe to run multiple times)
-- Note: Denis Musau has no youth_id provided, so excluded from insert

INSERT INTO youth_participants (youth_id, full_name, program_type, settlement, is_active)
VALUES 
  ('KAR119BN', 'Bill Njiru', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR412CM', 'Caroline Mumina', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR225CT', 'Charity Titus', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR298DK', 'Diana Kasyula', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR386DM', 'Domitilla Mutunga', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR327EM', 'Eddis Maina', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR322FK', 'Festus Kaluki', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR224FM', 'Fredinah Mbai', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR074GA', 'George Alaka', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR369JJ', 'Jeremiah James', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR083JK', 'Joel Kihuria', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR019JM', 'Joseph Muta', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR399JM', 'Josephat Mwanthi', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR158KK', 'Kelvin Kinyatta', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR078KM', 'Kelvin Mulela', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR339PM', 'Peter Muia', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR282PM', 'Prisca Musau', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR268SM', 'Samuel Matheka', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR187SM', 'Samuel Mutuku', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR115SO', 'Sophie Gesare', 'digitization', 'Kariobangi Machakos', TRUE),
  ('KAR181SM', 'Stacey Mutheu', 'digitization', 'Kariobangi Machakos', TRUE)
ON CONFLICT (youth_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  program_type = EXCLUDED.program_type,
  settlement = EXCLUDED.settlement,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;

\echo '=== Kariobangi Machakos Youth Added Successfully ==='
\echo 'Note: Denis Musau excluded (no youth_id provided)'
\echo ''
\echo 'Verifying Kariobangi youth data:'
SELECT 
    youth_id, 
    full_name, 
    program_type, 
    settlement,
    is_active, 
    created_at 
FROM youth_participants 
WHERE settlement = 'Kariobangi Machakos'
ORDER BY full_name;

\echo ''
\echo 'Total Kariobangi youth: '
SELECT COUNT(*) as kariobangi_youth_count
FROM youth_participants 
WHERE settlement = 'Kariobangi Machakos';
