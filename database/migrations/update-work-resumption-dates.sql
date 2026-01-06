-- Update settlement work configuration for resumed work period
-- Background: Work break from Dec 20, 2025 - Jan 6, 2026
-- Resuming: Jan 7, 2026
-- Dec 12 was excluded from work days

-- Work days completed before break:
-- Kayole (Dec 9 start): 8 days (Dec 9,10,11,13,16,17,18,19)
-- Mji wa Huruma (Dec 11 start): 6 days (Dec 11,13,16,17,18,19)
-- Kariobangi Machakos (Dec 15 start): 5 days (Dec 15,16,17,18,19)

-- Update to reflect resumption on Jan 7, 2026
-- Adjust start dates so remaining days calculate correctly

UPDATE settlement_work_config
SET 
  start_date = '2026-01-07',  -- Resume date
  total_work_days = 20,        -- Still 20 total
  updated_at = CURRENT_TIMESTAMP
WHERE settlement = 'Kayole' AND program_type = 'digitization';

UPDATE settlement_work_config
SET 
  start_date = '2026-01-07',  -- Resume date
  total_work_days = 20,        -- Still 20 total
  updated_at = CURRENT_TIMESTAMP
WHERE settlement = 'Mji wa Huruma' AND program_type = 'digitization';

UPDATE settlement_work_config
SET 
  start_date = '2026-01-07',  -- Resume date
  total_work_days = 20,        -- Still 20 total
  updated_at = CURRENT_TIMESTAMP
WHERE settlement = 'Kariobangi Machakos' AND program_type = 'digitization';

-- Verify updates
SELECT 
  settlement,
  program_type,
  start_date,
  total_work_days,
  daily_target,
  is_active,
  CASE 
    WHEN CURRENT_DATE >= start_date THEN 
      GREATEST(0, total_work_days - (CURRENT_DATE - start_date))
    ELSE total_work_days
  END as days_remaining
FROM settlement_work_config
WHERE program_type = 'digitization'
ORDER BY settlement;
