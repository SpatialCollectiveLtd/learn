-- Approve all December 2025 work days
-- These were backfilled as 'pending' but should count as approved work days

UPDATE youth_work_days
SET status = 'approved'
WHERE work_date >= '2025-12-09'
  AND work_date <= '2025-12-19'
  AND status = 'pending';

-- Verify approval
SELECT 
  yp.settlement,
  COUNT(*) as total_days,
  SUM(CASE WHEN ywd.status = 'approved' THEN 1 ELSE 0 END) as approved_days,
  SUM(CASE WHEN ywd.status = 'pending' THEN 1 ELSE 0 END) as pending_days
FROM youth_work_days ywd
JOIN youth_participants yp ON ywd.youth_id = yp.youth_id
WHERE yp.program_type = 'digitization'
GROUP BY yp.settlement
ORDER BY yp.settlement;
