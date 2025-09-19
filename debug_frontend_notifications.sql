-- Debug frontend notification system vs database trigger targeting
-- This will help us see if there's a mismatch between who gets notifications and who sees them

-- 1. Check recent notifications and their actual recipients
SELECT 
  n.id,
  n.user_id as notification_user_id,
  n.title,
  n.message,
  n.type,
  n.created_at,
  n.metadata->>'action' as action_type,
  
  -- Profile info for the notification recipient
  p.id as profile_id,
  p.full_name as recipient_name,
  p.user_type as recipient_type,
  p.email as recipient_email,
  
  -- Check if this user is both team and agent (this would be the problem)
  CASE 
    WHEN EXISTS(SELECT 1 FROM teams t WHERE t.profile_id = p.id) THEN 'YES'
    ELSE 'NO'
  END as has_team_record,
  
  CASE 
    WHEN EXISTS(SELECT 1 FROM agents a WHERE a.profile_id = p.id) THEN 'YES'
    ELSE 'NO'
  END as has_agent_record

FROM notifications n
LEFT JOIN profiles p ON n.user_id = p.user_id
WHERE n.type = 'agent_interest'
AND n.created_at > NOW() - INTERVAL '2 hours'
ORDER BY n.created_at DESC
LIMIT 10;

-- 2. Check for users who have both team and agent records (this would cause the issue)
SELECT 
  p.user_id,
  p.full_name,
  p.user_type as profile_user_type,
  p.email,
  
  -- Team info if exists
  t.id as team_id,
  t.team_name,
  
  -- Agent info if exists  
  a.id as agent_id,
  
  '❌ PROBLEM: Same user has both team and agent records!' as issue
  
FROM profiles p
LEFT JOIN teams t ON p.id = t.profile_id
LEFT JOIN agents a ON p.id = a.profile_id
WHERE t.id IS NOT NULL AND a.id IS NOT NULL;

-- 3. Check recent agent interest records and the correct notification targets
SELECT 
  ai.id as interest_id,
  ai.created_at,
  ai.status,
  
  -- The agent who expressed interest
  agent_p.user_id as agent_user_id,
  agent_p.full_name as agent_name,
  agent_p.user_type as agent_type,
  
  -- The team who should receive notification
  team_p.user_id as team_user_id,
  team_p.full_name as team_name,
  team_p.user_type as team_type,
  
  -- Check if they're the same user (this would be the problem)
  CASE 
    WHEN agent_p.user_id = team_p.user_id THEN '❌ SAME USER - THIS IS THE PROBLEM!'
    ELSE '✅ Different users - should work correctly'
  END as user_check,
  
  -- Check if a notification was created for this interest
  CASE 
    WHEN EXISTS(
      SELECT 1 FROM notifications n 
      WHERE n.metadata->>'pitch_id' = ai.pitch_id::text 
      AND n.created_at >= ai.created_at
      AND n.type = 'agent_interest'
    ) THEN '✅ Notification exists'
    ELSE '❌ No notification found'
  END as notification_status

FROM agent_interest ai
JOIN transfer_pitches tp ON ai.pitch_id = tp.id
JOIN agents a ON ai.agent_id = a.id
JOIN profiles agent_p ON a.profile_id = agent_p.id
JOIN teams t ON tp.team_id = t.id
JOIN profiles team_p ON t.profile_id = team_p.id
WHERE ai.created_at > NOW() - INTERVAL '2 hours'
ORDER BY ai.created_at DESC
LIMIT 5;

-- 4. Check auth.users vs profiles relationship
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  p.user_id as profile_user_id,
  p.full_name,
  p.user_type,
  
  CASE 
    WHEN au.id = p.user_id THEN '✅ Match'
    ELSE '❌ Mismatch - this would cause issues'
  END as id_match

FROM auth.users au
LEFT JOIN profiles p ON au.id = p.user_id
WHERE au.created_at > NOW() - INTERVAL '1 day'
ORDER BY au.created_at DESC
LIMIT 10;

-- 5. Test query: what the frontend notification fetch should return vs what the trigger creates
-- This simulates the frontend query for a specific user_id
-- Replace 'USER_ID_HERE' with an actual user_id to test
/*
SELECT 
  'FRONTEND QUERY SIMULATION' as query_type,
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.type,
  n.is_read,
  n.created_at
FROM notifications n
WHERE n.user_id = 'USER_ID_HERE'  -- Replace with actual user_id
AND n.type = 'agent_interest'
AND n.is_read = false
ORDER BY n.created_at DESC;
*/
