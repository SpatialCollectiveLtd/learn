-- Backfill work days for December 2025 work period
-- Settlement was active on these days (youth attendance tracked separately)
-- Actual building counts will start fresh from Jan 7, 2026

-- Work days completed by settlement (excluding Dec 12):
-- Kayole: Dec 9,10,11,13,16,17,18,19 (8 days)
-- Mji wa Huruma: Dec 11,13,16,17,18,19 (6 days)
-- Kariobangi Machakos: Dec 15,16,17,18,19 (5 days)

DO $$
DECLARE
  kayole_days DATE[] := ARRAY[
    '2025-12-09'::DATE, '2025-12-10'::DATE, '2025-12-11'::DATE,
    '2025-12-13'::DATE, '2025-12-16'::DATE, '2025-12-17'::DATE,
    '2025-12-18'::DATE, '2025-12-19'::DATE
  ];
  huruma_days DATE[] := ARRAY[
    '2025-12-11'::DATE, '2025-12-13'::DATE, '2025-12-16'::DATE,
    '2025-12-17'::DATE, '2025-12-18'::DATE, '2025-12-19'::DATE
  ];
  kariobangi_days DATE[] := ARRAY[
    '2025-12-15'::DATE, '2025-12-16'::DATE, '2025-12-17'::DATE,
    '2025-12-18'::DATE, '2025-12-19'::DATE
  ];
  youth_record RECORD;
  work_day DATE;
BEGIN
  
  -- Insert work days for Kayole youths
  RAISE NOTICE 'Inserting work days for Kayole...';
  FOR youth_record IN 
    SELECT youth_id FROM youth_participants 
    WHERE settlement = 'Kayole' AND program_type = 'digitization' AND is_active = TRUE
  LOOP
    FOREACH work_day IN ARRAY kayole_days
    LOOP
      INSERT INTO youth_work_days (youth_id, work_date, buildings_count, status, target_met)
      VALUES (youth_record.youth_id, work_day, 0, 'pending', FALSE)
      ON CONFLICT (youth_id, work_date) DO NOTHING;
    END LOOP;
  END LOOP;
  
  -- Insert work days for Mji wa Huruma youths
  RAISE NOTICE 'Inserting work days for Mji wa Huruma...';
  FOR youth_record IN 
    SELECT youth_id FROM youth_participants 
    WHERE settlement = 'Mji wa Huruma' AND program_type = 'digitization' AND is_active = TRUE
  LOOP
    FOREACH work_day IN ARRAY huruma_days
    LOOP
      INSERT INTO youth_work_days (youth_id, work_date, buildings_count, status, target_met)
      VALUES (youth_record.youth_id, work_day, 0, 'pending', FALSE)
      ON CONFLICT (youth_id, work_date) DO NOTHING;
    END LOOP;
  END LOOP;
  
  -- Insert work days for Kariobangi Machakos youths
  RAISE NOTICE 'Inserting work days for Kariobangi Machakos...';
  FOR youth_record IN 
    SELECT youth_id FROM youth_participants 
    WHERE settlement = 'Kariobangi Machakos' AND program_type = 'digitization' AND is_active = TRUE
  LOOP
    FOREACH work_day IN ARRAY kariobangi_days
    LOOP
      INSERT INTO youth_work_days (youth_id, work_date, buildings_count, status, target_met)
      VALUES (youth_record.youth_id, work_day, 0, 'pending', FALSE)
      ON CONFLICT (youth_id, work_date) DO NOTHING;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Work days backfill complete!';
  
END $$;

-- Update settlement configs to reflect resumption on Jan 7, 2026
-- Keep original start dates for historical accuracy
UPDATE settlement_work_config
SET updated_at = CURRENT_TIMESTAMP
WHERE program_type = 'digitization';

-- Verify the backfill
DO $$
DECLARE
  kayole_count INTEGER;
  huruma_count INTEGER;
  kariobangi_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT work_date) INTO kayole_count
  FROM youth_work_days ywd
  JOIN youth_participants yp ON ywd.youth_id = yp.youth_id
  WHERE yp.settlement = 'Kayole' AND yp.program_type = 'digitization';
  
  SELECT COUNT(DISTINCT work_date) INTO huruma_count
  FROM youth_work_days ywd
  JOIN youth_participants yp ON ywd.youth_id = yp.youth_id
  WHERE yp.settlement = 'Mji wa Huruma' AND yp.program_type = 'digitization';
  
  SELECT COUNT(DISTINCT work_date) INTO kariobangi_count
  FROM youth_work_days ywd
  JOIN youth_participants yp ON ywd.youth_id = yp.youth_id
  WHERE yp.settlement = 'Kariobangi Machakos' AND yp.program_type = 'digitization';
  
  RAISE NOTICE '';
  RAISE NOTICE '=== Verification ===';
  RAISE NOTICE 'Kayole: % work days (expected: 8)', kayole_count;
  RAISE NOTICE 'Mji wa Huruma: % work days (expected: 6)', huruma_count;
  RAISE NOTICE 'Kariobangi Machakos: % work days (expected: 5)', kariobangi_count;
END $$;

-- Show summary by settlement
SELECT 
  yp.settlement,
  COUNT(DISTINCT ywd.work_date) as unique_work_days,
  COUNT(DISTINCT ywd.youth_id) as youths_tracked,
  MIN(ywd.work_date) as first_work_day,
  MAX(ywd.work_date) as last_work_day
FROM youth_work_days ywd
JOIN youth_participants yp ON ywd.youth_id = yp.youth_id
WHERE yp.program_type = 'digitization'
GROUP BY yp.settlement
ORDER BY yp.settlement;
