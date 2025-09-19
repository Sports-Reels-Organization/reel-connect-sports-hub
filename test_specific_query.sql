-- Test the exact query that's failing
-- Replace the UUID with an actual transfer pitch ID from your database

-- 1. First, let's see what transfer pitch IDs exist
SELECT 
  id,
  transfer_type,
  asking_price,
  currency,
  player_id,
  status
FROM transfer_pitches 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Test the exact query pattern that's failing
-- Replace 'ACTUAL_PITCH_ID_HERE' with a real ID from step 1
/*
SELECT 
  id,
  transfer_type,
  asking_price,
  currency,
  player_id
FROM transfer_pitches 
WHERE id = 'ACTUAL_PITCH_ID_HERE';
*/

-- 3. Check if the specific ID from the error exists
SELECT 
  id,
  transfer_type,
  asking_price,
  currency,
  player_id,
  status
FROM transfer_pitches 
WHERE id = 'daefa164-f3d2-4c03-af48-fd66754f10c9';

-- 4. Check data types to ensure compatibility
SELECT 
  column_name,
  data_type,
  character_maximum_length,
  numeric_precision,
  numeric_scale
FROM information_schema.columns 
WHERE table_name = 'transfer_pitches'
  AND column_name IN ('id', 'transfer_type', 'asking_price', 'currency', 'player_id')
ORDER BY column_name;
