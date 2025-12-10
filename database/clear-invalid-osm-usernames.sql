-- Clear invalid OSM usernames (keep only verified username: LIPUKAH)
-- This allows youth to re-enter their correct OSM username with new instructions

UPDATE youth_participants 
SET osm_username = NULL 
WHERE osm_username IS NOT NULL 
  AND osm_username NOT IN ('LIPUKAH');

-- Show affected youth
SELECT youth_id, full_name, osm_username 
FROM youth_participants 
WHERE osm_username IS NULL 
  AND youth_id IN (
    'KAYTEST001ES', 'KAY2805JK', 'KAY209BM', 'KAY348RN', 'KAY2284SM',
    'KAY2391LN', 'KAY251BK', 'KAY1395MO', 'KAY2705AO', 'KAY2714DV',
    'KAY1725LK', 'KAY2603GK', 'KAY1154SO', 'KAY1498DO'
  );
