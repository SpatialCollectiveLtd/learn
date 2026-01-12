-- ============================================
-- Add Email Addresses to Youth Participants
-- Date: January 12, 2026
-- Purpose: Store @spatialcollective.co.ke email addresses for 39 youth
-- ============================================

BEGIN;

-- Add email_address column if it doesn't exist
-- Note: This is different from 'email' column (which might be personal email)
-- This is specifically for @spatialcollective.co.ke work email
ALTER TABLE youth_participants 
ADD COLUMN IF NOT EXISTS work_email VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_youth_work_email ON youth_participants(work_email);

-- Update youth with their @spatialcollective.co.ke email addresses
UPDATE youth_participants SET work_email = 'kay1498do@spatialcollective.co.ke' WHERE youth_id = 'KAY1498DO';
UPDATE youth_participants SET work_email = 'kay1154so@spatialcollective.co.ke' WHERE youth_id = 'KAY1154SO';
UPDATE youth_participants SET work_email = 'kay2579jn@spatialcollective.co.ke' WHERE youth_id = 'KAY2579JN';
UPDATE youth_participants SET work_email = 'kay129sl@spatialcollective.co.ke' WHERE youth_id = 'KAY129SL';
UPDATE youth_participants SET work_email = 'kay2603gk@spatialcollective.co.ke' WHERE youth_id = 'KAY2603GK';
UPDATE youth_participants SET work_email = 'kay1725lk@spatialcollective.co.ke' WHERE youth_id = 'KAY1725LK';
UPDATE youth_participants SET work_email = 'kar115so@spatialcollective.co.ke' WHERE youth_id = 'KAR115SO';
UPDATE youth_participants SET work_email = 'kar268sm@spatialcollective.co.ke' WHERE youth_id = 'KAR268SM';
UPDATE youth_participants SET work_email = 'kar399jm@spatialcollective.co.ke' WHERE youth_id = 'KAR399JM';
UPDATE youth_participants SET work_email = 'kar119bn@spatialcollective.co.ke' WHERE youth_id = 'KAR119BN';
UPDATE youth_participants SET work_email = 'kar078km@spatialcollective.co.ke' WHERE youth_id = 'KAR078KM';
UPDATE youth_participants SET work_email = 'kar225ct@spatialcollective.co.ke' WHERE youth_id = 'KAR225CT';
UPDATE youth_participants SET work_email = 'kar083jk@spatialcollective.co.ke' WHERE youth_id = 'KAR083JK';
UPDATE youth_participants SET work_email = 'kar327em@spatialcollective.co.ke' WHERE youth_id = 'KAR327EM';
UPDATE youth_participants SET work_email = 'kar339pm@spatialcollective.co.ke' WHERE youth_id = 'KAR339PM';
UPDATE youth_participants SET work_email = 'kar187sm@spatialcollective.co.ke' WHERE youth_id = 'KAR187SM';
UPDATE youth_participants SET work_email = 'kar322fk@spatialcollective.co.ke' WHERE youth_id = 'KAR322FK';
UPDATE youth_participants SET work_email = 'kar298dk@spatialcollective.co.ke' WHERE youth_id = 'KAR298DK';
UPDATE youth_participants SET work_email = 'kar369jj@spatialcollective.co.ke' WHERE youth_id = 'KAR369JJ';
UPDATE youth_participants SET work_email = 'kar158kk@spatialcollective.co.ke' WHERE youth_id = 'KAR158KK';
UPDATE youth_participants SET work_email = 'hur455mm@spatialcollective.co.ke' WHERE youth_id = 'HUR455MM';
UPDATE youth_participants SET work_email = 'hur801dn@spatialcollective.co.ke' WHERE youth_id = 'HUR801DN';
UPDATE youth_participants SET work_email = 'hur765jn@spatialcollective.co.ke' WHERE youth_id = 'HUR765JN';
UPDATE youth_participants SET work_email = 'hur185rn@spatialcollective.co.ke' WHERE youth_id = 'HUR185RN';
UPDATE youth_participants SET work_email = 'hur756sd@spatialcollective.co.ke' WHERE youth_id = 'HUR756SD';
UPDATE youth_participants SET work_email = 'hur768sw@spatialcollective.co.ke' WHERE youth_id = 'HUR768SW';
UPDATE youth_participants SET work_email = 'kay2714dv@spatialcollective.co.ke' WHERE youth_id = 'KAY2714DV';
UPDATE youth_participants SET work_email = 'kay2705ao@spatialcollective.co.ke' WHERE youth_id = 'KAY2705AO';
UPDATE youth_participants SET work_email = 'kay2333oo@spatialcollective.co.ke' WHERE youth_id = 'KAY2333OO';
UPDATE youth_participants SET work_email = 'kay1395mo@spatialcollective.co.ke' WHERE youth_id = 'KAY1395MO';
UPDATE youth_participants SET work_email = 'kay251bk@spatialcollective.co.ke' WHERE youth_id = 'KAY251BK';
UPDATE youth_participants SET work_email = 'kay2391ln@spatialcollective.co.ke' WHERE youth_id = 'KAY2391LN';
UPDATE youth_participants SET work_email = 'kay2284sm@spatialcollective.co.ke' WHERE youth_id = 'KAY2284SM';
UPDATE youth_participants SET work_email = 'kay209bm@spatialcollective.co.ke' WHERE youth_id = 'KAY209BM';
UPDATE youth_participants SET work_email = 'kay2805jk@spatialcollective.co.ke' WHERE youth_id = 'KAY2805JK';
UPDATE youth_participants SET work_email = 'hur728cm@spatialcollective.co.ke' WHERE youth_id = 'HUR728CM';
UPDATE youth_participants SET work_email = 'hur777bw@spatialcollective.co.ke' WHERE youth_id = 'HUR777BW';
UPDATE youth_participants SET work_email = 'hur715cw@spatialcollective.co.ke' WHERE youth_id = 'HUR715CW';
UPDATE youth_participants SET work_email = 'kar405dm@spatialcollective.co.ke' WHERE youth_id = 'KAR405DM';

COMMIT;

-- Verify updates
SELECT youth_id, full_name, work_email 
FROM youth_participants 
WHERE work_email IS NOT NULL
ORDER BY work_email;

-- Count youth with work emails
SELECT COUNT(*) as youth_with_email FROM youth_participants WHERE work_email IS NOT NULL;
