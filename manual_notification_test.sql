-- Manual test to verify team notification delivery
-- This bypasses the trigger to test the notification system directly

-- 1. First, let's find actual team and agent user IDs from your database
SELECT 
  'TEAMS' as user_type,
  p.user_id,
  p.full_name,
  p.user_type,
  t.team_name
FROM profiles p
JOIN teams t ON p.id = t.profile_id
WHERE p.user_type = 'team'
LIMIT 5;

SELECT 
  'AGENTS' as user_type,
  p.user_id,
  p.full_name,
  p.user_type
FROM profiles p
JOIN agents a ON p.id = a.profile_id
WHERE p.user_type = 'agent'
LIMIT 5;

-- 2. Create a test notification directly to a team user
-- Replace 'TEAM_USER_ID_HERE' with an actual team user_id from step 1
/*
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  action_url,
  action_text,
  metadata,
  is_read,
  created_at
) VALUES (
  'TEAM_USER_ID_HERE',  -- Replace with actual team user_id
  '🧪 Manual Test Notification',
  'This is a manual test to verify team notifications work',
  'agent_interest',
  '/team-explore?tab=communication',
  'View Communication',
  json_build_object(
    'test', true,
    'source', 'manual_test'
  ),
  false,
  NOW()
);
*/

-- 3. Create a test notification directly to an agent user
-- Replace 'AGENT_USER_ID_HERE' with an actual agent user_id from step 1
/*
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  action_url,
  action_text,
  metadata,
  is_read,
  created_at
) VALUES (
  'AGENT_USER_ID_HERE',  -- Replace with actual agent user_id
  '🧪 Manual Test Notification for Agent',
  'This is a manual test to verify agent notifications work',
  'agent_interest',
  '/agent-explore?tab=communication',
  'View Communication',
  json_build_object(
    'test', true,
    'source', 'manual_test'
  ),
  false,
  NOW()
);
*/

-- 4. Check recent notifications to see who received what
SELECT 
  n.id,
  n.user_id,
  n.title,
  n.message,
  n.created_at,
  p.full_name as recipient_name,
  p.user_type as recipient_type,
  n.metadata->>'source' as source
FROM notifications n
LEFT JOIN profiles p ON n.user_id = p.user_id
WHERE n.created_at > NOW() - INTERVAL '1 hour'
ORDER BY n.created_at DESC
LIMIT 10;

-- 5. Check if there's a data issue: same user being both team and agent
SELECT 
  p.user_id,
  p.full_name,
  p.user_type,
  CASE 
    WHEN EXISTS(SELECT 1 FROM teams t WHERE t.profile_id = p.id) THEN 'HAS_TEAM'
    ELSE 'NO_TEAM'
  END as team_status,
  CASE 
    WHEN EXISTS(SELECT 1 FROM agents a WHERE a.profile_id = p.id) THEN 'HAS_AGENT'
    ELSE 'NO_AGENT'
  END as agent_status
FROM profiles p
WHERE p.user_type IN ('team', 'agent')
ORDER BY p.user_type, p.full_name;

-- 6. Check recent agent interest with explicit user targeting
SELECT 
  ai.id as interest_id,
  ai.created_at,
  
  -- The agent who expressed interest
  agent_profile.user_id as agent_user_id,
  agent_profile.full_name as agent_name,
  agent_profile.user_type as agent_type,
  
  -- The team who should receive notification
  team_profile.user_id as team_user_id,
  team_profile.full_name as team_name,
  team_profile.user_type as team_type,
  
  -- Verify they're different users
  CASE 
    WHEN agent_profile.user_id = team_profile.user_id THEN '❌ SAME USER ID - THIS IS THE PROBLEM!'
    ELSE '✅ Different users - should work'
  END as user_id_check
  
FROM agent_interest ai
JOIN transfer_pitches tp ON ai.pitch_id = tp.id
JOIN agents a ON ai.agent_id = a.id
JOIN profiles agent_profile ON a.profile_id = agent_profile.id
JOIN teams t ON tp.team_id = t.id
JOIN profiles team_profile ON t.profile_id = team_profile.id
ORDER BY ai.created_at DESC
LIMIT 5;
