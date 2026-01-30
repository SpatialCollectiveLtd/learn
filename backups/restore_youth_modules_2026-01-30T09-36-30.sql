-- RESTORATION SCRIPT
-- Use this to restore original program_type values if needed
-- Created: 2026-01-30T09:36:33.218Z

BEGIN;

-- Kelvin Mulela (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR078KM';

-- Joel Kihuria (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR083JK';

-- Sophie Gesare (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR115SO';

-- Bill Njiru (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR119BN';

-- Kelvin Kinyatta (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR158KK';

-- Samuel Mutuku (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR187SM';

-- Charity Titus (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR225CT';

-- Samuel Matheka (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR268SM';

-- Diana Kasyula (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR298DK';

-- Festus Kaluki (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR322FK';

-- Eddis Maina (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR327EM';

-- Peter Muia (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR339PM';

-- Jeremiah James (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR369JJ';

-- Josephat Mwanthi (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR399JM';

-- Denis Musau (Kariobangi Machakos)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAR405DM';

-- Regina Nzoka (Kayole Soweto)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'KAY348RN';

-- Richard Njuguna (Mji wa Huruma)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'HUR185RN';

-- Martin Mbugua (Mji wa Huruma)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'HUR455MM';

-- Charles Waithira (Mji wa Huruma)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'HUR715CW';

-- Catherine Mararo (Mji wa Huruma)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'HUR728CM';

-- Somo Duba (Mji wa Huruma)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'HUR756SD';

-- John Ngigi (Mji wa Huruma)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'HUR765JN';

-- Stephen Wanjiru (Mji wa Huruma)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'HUR768SW';

-- Beatrice Wanjiru (Mji wa Huruma)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'HUR777BW';

-- Dennis Njuguna (Mji wa Huruma)
UPDATE youth_participants SET program_type = 'digitization' WHERE youth_id = 'HUR801DN';

COMMIT;

-- Verify restoration:
SELECT program_type, COUNT(*) FROM youth_participants WHERE is_active = TRUE GROUP BY program_type;
